import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export interface QuestionRecord {
  id: number;
  category: string;
  slot_key: string;
  points: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_index: number;
  image_url: string | null;
  created_at?: string;
}

export interface QuestionInput {
  category: string;
  slot_key: string;
  points: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_index: number;
  image_url?: string | null;
}

function loadEnvFile() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.join(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) continue;

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile();

function getEnv(name: string) {
  return process.env[name];
}

function getSupabaseKey(requireServiceRole = false) {
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = getEnv('SUPABASE_ANON_KEY');

  if (requireServiceRole) {
    if (!serviceRoleKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Add it to your local .env file.');
    }
    return serviceRoleKey;
  }

  const key = serviceRoleKey || anonKey;
  if (!key) {
    throw new Error('Missing SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY. Add Supabase credentials to your local .env file.');
  }
  return key;
}

function getRestUrl(path: string) {
  const supabaseUrl = getEnv('SUPABASE_URL');

  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL. Add it to your local .env file.');
  }

  return `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${path}`;
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}, requireServiceRole = false): Promise<T> {
  const key = getSupabaseKey(requireServiceRole);
  const res = await fetch(getRestUrl(path), {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase request failed (${res.status}): ${body}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

function encodeFilterValue(value: string) {
  return encodeURIComponent(value).replace(/%2C/g, ',');
}

function sample<T>(items: T[], count: number) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

export async function initDb() {
  await getQuestionCount();
}

export async function getQuestionCount() {
  const rows = await supabaseRequest<{ id: number }[]>('questions?select=id');
  return rows.length;
}

export async function getRandomQuestionBySlot(slotKey: string, excludeIds: number[]) {
  const query = new URLSearchParams({
    select: '*',
    slot_key: `eq.${slotKey}`,
  });

  if (excludeIds.length > 0) {
    query.set('id', `not.in.(${excludeIds.join(',')})`);
  }

  let rows = await supabaseRequest<QuestionRecord[]>(`questions?${query.toString()}`);

  if (rows.length === 0 && excludeIds.length > 0) {
    rows = await supabaseRequest<QuestionRecord[]>(`questions?select=*&slot_key=eq.${encodeFilterValue(slotKey)}`);
  }

  return sample(rows, 1)[0] || null;
}

export async function getQuizQuestions(count: number, difficulty: string) {
  const query = new URLSearchParams({ select: '*' });

  if (difficulty === 'easy') query.set('points', 'eq.1');
  if (difficulty === 'medium') query.set('points', 'eq.2');
  if (difficulty === 'hard') query.set('points', 'eq.3');

  const rows = await supabaseRequest<QuestionRecord[]>(`questions?${query.toString()}`);
  return sample(rows, count);
}

export async function getCategorySlotCounts() {
  const rows = await supabaseRequest<Pick<QuestionRecord, 'category' | 'slot_key' | 'points'>[]>('questions?select=category,slot_key,points');
  const counts = new Map<string, { category: string; slot_key: string; points: number; question_count: number }>();

  for (const row of rows) {
    const key = `${row.category}:${row.slot_key}:${row.points}`;
    const current = counts.get(key) || { ...row, question_count: 0 };
    current.question_count += 1;
    counts.set(key, current);
  }

  return [...counts.values()].sort((a, b) => a.category.localeCompare(b.category) || a.points - b.points);
}

export async function getStatsByCategory() {
  const rows = await supabaseRequest<Pick<QuestionRecord, 'category'>[]>('questions?select=category');
  const counts = new Map<string, number>();

  for (const row of rows) {
    counts.set(row.category, (counts.get(row.category) || 0) + 1);
  }

  return [...counts.entries()].map(([category, count]) => ({ category, count }));
}

export async function replaceQuestions(questions: QuestionInput[]) {
  await supabaseRequest('questions?id=not.is.null', { method: 'DELETE' }, true);
  await supabaseRequest(
    'questions',
    {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(questions),
    },
    true
  );
}
