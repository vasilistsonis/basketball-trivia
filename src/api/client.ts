// ── Direct Supabase (PostgREST) client ──
// The shipped app talks to Supabase directly using the ANON key only.
// Safety model: RLS is enabled on `questions` with a single SELECT-only
// policy, and the anon role has no insert/update/delete grants — verified
// live via pg_policies / relrowsecurity. Never put the service_role key here.
//
// Config is baked in at build time from Vite env vars:
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY  (see .env.example)

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const REQUEST_TIMEOUT_MS = 10_000;

// ── Row / API types ──

interface QuestionRow {
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
}

export interface ApiQuestion {
  id: number;
  category: string;
  slotKey: string;
  points: number;
  question: string;
  options: string[];
  correctIndex: number;
  imageUrl?: string;
}

export interface ApiCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  questionCount: number;
  slots: { points: number; key: string; questionCount: number }[];
}

// ── Category presentation config (moved from the old Express layer) ──

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: string; description: string; color: string }
> = {
  geography: { label: 'Geography', icon: '🌍', description: 'NBA & Euroleague arenas, cities & courts', color: '#3b82f6' },
  history: { label: 'History', icon: '📜', description: 'NBA & Euroleague history & milestones', color: '#f59e0b' },
  logo: { label: 'Logo', icon: '🎨', description: 'Guess the team based on the logo', color: '#8b5cf6' },
  'guess-whos-missing': { label: "Who's Missing?", icon: '🔍', description: 'Iconic starting 5s — who is missing?', color: '#10b981' },
  'guess-the-player': { label: 'Guess the Player', icon: '🃏', description: 'Identify the player from his career CV', color: '#ef4444' },
};

const CATEGORY_ORDER = ['geography', 'history', 'logo', 'guess-whos-missing', 'guess-the-player'];

// ── Low-level fetch ──

function getConfig(): { url: string; key: string } {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before building.'
    );
  }
  return { url: SUPABASE_URL.replace(/\/$/, ''), key: SUPABASE_ANON_KEY };
}

async function supabaseGet<T>(path: string): Promise<T> {
  const { url, key } = getConfig();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`Supabase request failed (${res.status})`);
    }
    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Helpers ──

function toApiQuestion(row: QuestionRow): ApiQuestion {
  return {
    id: row.id,
    category: row.category,
    slotKey: row.slot_key,
    points: row.points,
    question: row.question,
    options: [row.option_a, row.option_b, row.option_c, row.option_d],
    correctIndex: row.correct_index,
    imageUrl: row.image_url || undefined,
  };
}

function pickRandom<T>(items: T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

// ── Public API ──

// A board slot is one (category, points) pair. The DB's slot_key column isn't
// reliable for this — some rows carry a slot_key that doesn't match their
// points — so slots are keyed and queried by category + points instead.
function toSlotKey(category: string, points: number): string {
  return `${category}:${points}`;
}

function parseSlotKey(slotKey: string): { category: string; points: number } {
  const sep = slotKey.lastIndexOf(':');
  return { category: slotKey.slice(0, sep), points: Number(slotKey.slice(sep + 1)) };
}

export async function fetchQuestion(slotKey: string, excludeIds: number[]): Promise<ApiQuestion> {
  const { category, points } = parseSlotKey(slotKey);
  const slotFilter = { select: '*', category: `eq.${category}`, points: `eq.${points}` };
  const params = new URLSearchParams(slotFilter);
  if (excludeIds.length > 0) {
    params.set('id', `not.in.(${excludeIds.join(',')})`);
  }

  let rows = await supabaseGet<QuestionRow[]>(`questions?${params.toString()}`);

  // Every question in this slot has been seen — allow repeats rather than dead-ending.
  if (rows.length === 0 && excludeIds.length > 0) {
    rows = await supabaseGet<QuestionRow[]>(`questions?${new URLSearchParams(slotFilter).toString()}`);
  }

  const row = pickRandom(rows);
  if (!row) throw new Error(`No questions found for ${slotKey}`);
  return toApiQuestion(row);
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const rows = await supabaseGet<Pick<QuestionRow, 'category' | 'points'>[]>(
    'questions?select=category,points'
  );

  // Group into per-category slot counts (ported from the old server's buildCategoryMeta)
  const slotCounts = new Map<string, { category: string; points: number; count: number }>();
  for (const row of rows) {
    const key = toSlotKey(row.category, row.points);
    const current = slotCounts.get(key) || { ...row, count: 0 };
    current.count += 1;
    slotCounts.set(key, current);
  }

  const catMap: Record<string, ApiCategory> = {};
  const sorted = [...slotCounts.values()].sort(
    (a, b) => a.category.localeCompare(b.category) || a.points - b.points
  );

  for (const slot of sorted) {
    if (!catMap[slot.category]) {
      const config = CATEGORY_CONFIG[slot.category] || {
        label: slot.category,
        icon: '❓',
        description: '',
        color: '#6b7280',
      };
      catMap[slot.category] = { id: slot.category, ...config, slots: [], questionCount: 0 };
    }
    catMap[slot.category].slots.push({ points: slot.points, key: toSlotKey(slot.category, slot.points), questionCount: slot.count });
    catMap[slot.category].questionCount += slot.count;
  }

  return CATEGORY_ORDER.filter((id) => catMap[id]).map((id) => catMap[id]);
}
