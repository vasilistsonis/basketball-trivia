import type { GameCategory, QuestionBankEntry } from '../types';
import { BUNDLED_QUESTIONS } from '../data/questions';
import { categoriesFromCounts, findSlot, isImageUrl, isQuestion, isRecord } from './catalog';
import type { GameStorage } from './storage';

export const QUESTION_CACHE_KEY = 'hoops-trivia:questions:v1';
const PAGE_SIZE = 1000;
const MAX_REMOTE_QUESTIONS = 20_000;
const REFRESH_INTERVAL_MS = 15 * 60_000;
const RETRY_INTERVAL_MS = 60_000;
const REQUEST_TIMEOUT_MS = 8000;

interface QuestionBankOptions {
  url?: string;
  key?: string;
  storage?: GameStorage | null;
  fetch?: typeof fetch;
  now?: () => number;
  random?: () => number;
  isOnline?: () => boolean;
}

/** Validate every field before remote or cached content reaches the game. */
export function parseBankQuestion(value: unknown): QuestionBankEntry | null {
  if (!isRecord(value) || !Number.isSafeInteger(value.id) || (value.id as number) <= 0
    || typeof value.slotKey !== 'string') return null;
  const slot = findSlot(value.slotKey);
  const question = { id: String(value.id), category: value.category, points: value.points, question: value.question,
    options: value.options, correctIndex: value.correctIndex,
    ...(value.imageUrl ? { imageUrl: value.imageUrl } : {}) };
  if (!slot || slot.category !== value.category || slot.points !== value.points || !isQuestion(question)) return null;
  return { ...question, id: value.id as number, slotKey: value.slotKey };
}

export function parseQuestionRow(value: unknown): QuestionBankEntry | null {
  if (!isRecord(value) || (value.image_url !== null && value.image_url !== undefined && value.image_url !== '' && !isImageUrl(value.image_url))) return null;
  return parseBankQuestion({ id: value.id, category: value.category, slotKey: value.slot_key, points: value.points,
    question: value.question, options: [value.option_a, value.option_b, value.option_c, value.option_d],
    correctIndex: value.correct_index, imageUrl: value.image_url || undefined });
}

function publicConfig(url: string | undefined, key: string | undefined): { url: string; key: string } | null {
  if (!url || !key || key.startsWith('sb_secret_')) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return null;
    if (key.split('.').length === 3) {
      const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      if (payload.role !== 'anon') return null;
    }
    return { url: parsed.origin, key };
  } catch {
    return null;
  }
}

export function bankCategories(remote: readonly QuestionBankEntry[] = []): GameCategory[] {
  const bundledCounts = new Map<string, number>();
  const remoteCounts = new Map<string, number>();
  for (const question of BUNDLED_QUESTIONS) bundledCounts.set(question.slotKey, (bundledCounts.get(question.slotKey) ?? 0) + 1);
  for (const question of remote) {
    if (!question.imageUrl) remoteCounts.set(question.slotKey, (remoteCounts.get(question.slotKey) ?? 0) + 1);
  }
  // A missing, empty, or image-only remote slot always retains its bundled bank.
  return categoriesFromCounts(new Map([...bundledCounts, ...remoteCounts]));
}

function readCache(storage: GameStorage | null | undefined): { questions: QuestionBankEntry[]; savedAt: number } | null {
  try {
    const raw = storage?.getItem(QUESTION_CACHE_KEY);
    if (!raw || raw.length > 8_000_000) return null;
    const cache: unknown = JSON.parse(raw);
    if (!isRecord(cache) || cache.version !== 1 || !Number.isFinite(cache.savedAt)
      || !Array.isArray(cache.questions) || cache.questions.length > MAX_REMOTE_QUESTIONS) return null;
    const unique = new Map<number, QuestionBankEntry>();
    for (const entry of cache.questions) {
      const question = parseBankQuestion(entry);
      if (question) unique.set(question.id, question);
    }
    return unique.size ? { questions: [...unique.values()], savedAt: cache.savedAt as number } : null;
  } catch {
    return null;
  }
}

/** Requests explicit pages; PostgREST's default row cap must never truncate the bank. */
export async function fetchRemoteQuestions(config: { url: string; key: string }, fetcher: typeof fetch, signal: AbortSignal): Promise<QuestionBankEntry[]> {
  const questions = new Map<number, QuestionBankEntry>();
  let offset = 0;
  let previousPage = '';
  while (offset < MAX_REMOTE_QUESTIONS) {
    const params = new URLSearchParams({
      select: 'id,category,slot_key,points,question,option_a,option_b,option_c,option_d,correct_index,image_url',
      order: 'id.asc', limit: String(PAGE_SIZE), offset: String(offset),
    });
    const response = await fetcher(`${config.url}/rest/v1/questions?${params}`, {
      headers: { apikey: config.key, Authorization: `Bearer ${config.key}`, Prefer: 'count=exact',
        'Range-Unit': 'items', Range: `${offset}-${offset + PAGE_SIZE - 1}` },
      signal,
    });
    if (response.status === 416 && offset > 0) break;
    if (!response.ok) throw new Error(`Question bank request failed (${response.status})`);
    const rows: unknown = await response.json();
    if (!Array.isArray(rows) || rows.length > PAGE_SIZE) throw new Error('Invalid question bank response');
    if (!rows.length) break;
    const fingerprint = JSON.stringify([rows[0], rows[rows.length - 1]]);
    if (fingerprint === previousPage) throw new Error('Question bank pagination did not advance');
    previousPage = fingerprint;
    for (const row of rows) {
      const question = parseQuestionRow(row);
      if (question) questions.set(question.id, question);
    }
    offset += rows.length;
    const range = response.headers.get('content-range');
    const totalText = range?.split('/')[1];
    const total = totalText && /^\d+$/.test(totalText) ? Number(totalText) : null;
    if (total !== null && total > MAX_REMOTE_QUESTIONS) throw new Error('Question bank exceeds the offline cache limit');
    if (total !== null && offset >= total) return [...questions.values()];
    // Without Content-Range, continue until an empty page. A server may enforce a
    // lower page cap than requested, so a short page alone is not the end.
  }
  if (offset >= MAX_REMOTE_QUESTIONS) throw new Error('Question bank exceeds the offline cache limit');
  return [...questions.values()];
}

export function createQuestionBankClient(options: QuestionBankOptions = {}) {
  const config = publicConfig(options.url, options.key);
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const cache = readCache(options.storage);
  let remoteQuestions = cache?.questions ?? [];
  let nextRefreshAt = cache ? Math.min(cache.savedAt, now()) + REFRESH_INTERVAL_MS : 0;
  let refreshPromise: Promise<GameCategory[]> | null = null;

  const getCategories = () => bankCategories(remoteQuestions);

  function refreshCategories(): Promise<GameCategory[]> {
    if (refreshPromise) return refreshPromise;
    if (!config || now() < nextRefreshAt || options.isOnline?.() === false) return Promise.resolve(getCategories());
    nextRefreshAt = now() + RETRY_INTERVAL_MS;
    refreshPromise = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const questions = await fetchRemoteQuestions(config, options.fetch ?? fetch, controller.signal);
        if (questions.length) {
          remoteQuestions = questions;
          nextRefreshAt = now() + REFRESH_INTERVAL_MS;
          try {
            options.storage?.setItem(QUESTION_CACHE_KEY, JSON.stringify({ version: 1, savedAt: now(), questions }));
          } catch {
            // A full or unavailable cache must not interrupt a playable match.
          }
        }
      } catch {
        // The bundled bank and any previous cache stay available after failure.
      } finally {
        clearTimeout(timeout);
        refreshPromise = null;
      }
      return getCategories();
    })();
    return refreshPromise;
  }

  async function getQuestion(slotKey: string, excludeIds: number[] = []): Promise<QuestionBankEntry> {
    if (!findSlot(slotKey)) throw new Error('This question slot is not available');
    void refreshCategories();
    // Until image files are cached with the bank, only self-contained clues are
    // eligible. A failed image request must never leave an unanswerable question.
    const cached = remoteQuestions.filter((question) => question.slotKey === slotKey && !question.imageUrl);
    const bundled = BUNDLED_QUESTIONS.filter((question) => question.slotKey === slotKey);
    const excluded = new Set(excludeIds);
    const unseenCached = cached.filter((question) => !excluded.has(question.id));
    const unseenBundled = bundled.filter((question) => !excluded.has(question.id));
    const candidates = unseenCached.length ? unseenCached : unseenBundled.length ? unseenBundled : cached.length ? cached : bundled;
    const question = candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
    if (!question) throw new Error('This question slot is not available');
    return { ...question, options: [...question.options] };
  }

  return { getCategories, refreshCategories, getQuestion };
}
