import assert from 'node:assert/strict';
import test from 'node:test';
import { BUNDLED_QUESTIONS } from '../src/data/questions';
import { isCategories, isQuestion, SLOT_DEFINITIONS } from '../src/game/catalog';
import { bankCategories, createQuestionBankClient, fetchRemoteQuestions, parseQuestionRow, QUESTION_CACHE_KEY } from '../src/game/questionBank';
import type { GameStorage } from '../src/game/storage';

const config = { url: 'https://example.supabase.co', key: 'sb_publishable_test' };

function questionRow(id: number) {
  return { id, category: 'geography', slot_key: 'geography-1', points: 1,
    question: `Which city is the answer to question ${id}?`, option_a: 'Athens', option_b: 'Paris',
    option_c: 'Madrid', option_d: 'Berlin', correct_index: 0, image_url: null };
}

function response(rows: unknown[], contentRange?: string): Response {
  return new Response(JSON.stringify(rows), { status: 200,
    headers: { 'content-type': 'application/json', ...(contentRange ? { 'content-range': contentRange } : {}) } });
}

function memoryStorage(): GameStorage {
  const values = new Map<string, string>();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: (key) => { values.delete(key); } };
}

test('the bundled starter bank has 56 valid questions covering all original slots without image dependencies', () => {
  assert.equal(BUNDLED_QUESTIONS.length, 56);
  assert.equal(new Set(BUNDLED_QUESTIONS.map((question) => question.id)).size, 56);
  assert.equal(SLOT_DEFINITIONS.length, 14);
  for (const question of BUNDLED_QUESTIONS) {
    assert.ok(question.id < 0);
    assert.ok(isQuestion({ ...question, id: String(question.id) }));
    assert.equal(question.imageUrl, undefined);
  }
  for (const slot of SLOT_DEFINITIONS) assert.equal(BUNDLED_QUESTIONS.filter((question) => question.slotKey === slot.key).length, 4);
  assert.ok(isCategories(bankCategories()));
});

test('a first launch without network or configuration can immediately play every slot', async () => {
  let requests = 0;
  const client = createQuestionBankClient({ fetch: async () => { requests += 1; throw new Error('No network'); }, random: () => 0 });
  const categories = await client.refreshCategories();
  assert.equal(categories.length, 5);
  for (const slot of SLOT_DEFINITIONS) {
    const question = await client.getQuestion(slot.key);
    assert.equal(question.slotKey, slot.key);
    assert.ok(question.id < 0);
  }
  assert.equal(requests, 0);
});

test('invalid answer indexes, mismatched slots, missing options and unsafe image URLs are rejected', () => {
  const row = questionRow(1);
  assert.ok(parseQuestionRow(row));
  assert.equal(parseQuestionRow({ ...row, correct_index: 4 }), null);
  assert.equal(parseQuestionRow({ ...row, points: 3 }), null);
  assert.equal(parseQuestionRow({ ...row, category: 'history' }), null);
  assert.equal(parseQuestionRow({ ...row, option_a: '' }), null);
  assert.equal(parseQuestionRow({ ...row, option_b: 'Athens' }), null);
  assert.equal(parseQuestionRow({ ...row, id: '1' }), null);
  assert.equal(parseQuestionRow({ ...row, id: -1 }), null);
  assert.equal(parseQuestionRow({ ...row, image_url: 'javascript:alert(1)' }), null);
  assert.equal(parseQuestionRow({ ...row, image_url: 'http://example.com/image.png' }), null);
  assert.equal(parseQuestionRow({ ...row, slot_key: 'unknown-1' }), null);
  assert.equal(parseQuestionRow(null), null);
});

test('remote pagination reads beyond 1000 rows and reports complete validated counts', async () => {
  const rows = Array.from({ length: 1205 }, (_, index) => questionRow(index + 1));
  const offsets: number[] = [];
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const offset = Number(url.searchParams.get('offset'));
    offsets.push(offset);
    assert.equal(url.searchParams.get('order'), 'id.asc');
    assert.equal((init!.headers as Record<string, string>).Prefer, 'count=exact');
    assert.equal((init!.headers as Record<string, string>).Range, `${offset}-${offset + 999}`);
    return response(rows.slice(offset, offset + 1000), `${offset}-${Math.min(offset + 999, rows.length - 1)}/${rows.length}`);
  };
  const questions = await fetchRemoteQuestions(config, fetcher, new AbortController().signal);
  assert.equal(questions.length, 1205);
  assert.deepEqual(offsets, [0, 1000]);
  assert.equal(bankCategories(questions)[0].slots[0].questionCount, 1205);
  assert.equal(bankCategories(questions)[1].questionCount, 12);
});

test('a lower server page cap without a count header does not truncate the bank', async () => {
  const rows = Array.from({ length: 5 }, (_, index) => questionRow(index + 1));
  const offsets: number[] = [];
  const fetcher: typeof fetch = async (input) => {
    const offset = Number(new URL(String(input)).searchParams.get('offset'));
    offsets.push(offset);
    return response(rows.slice(offset, offset + 2));
  };
  assert.equal((await fetchRemoteQuestions(config, fetcher, new AbortController().signal)).length, 5);
  assert.deepEqual(offsets, [0, 2, 4, 5]);
});

test('duplicate background refreshes coalesce and do not delay a playable question', async () => {
  let resolveFetch!: (response: Response) => void;
  let requests = 0;
  const storage = memoryStorage();
  const client = createQuestionBankClient({ ...config, storage, random: () => 0,
    fetch: async () => { requests += 1; return new Promise((resolve) => { resolveFetch = resolve; }); } });
  const firstRefresh = client.refreshCategories();
  const secondRefresh = client.refreshCategories();
  assert.equal(firstRefresh, secondRefresh);
  assert.ok((await client.getQuestion('geography-1')).id < 0);
  assert.equal(requests, 1);
  resolveFetch(response([questionRow(1)], '0-0/1'));
  const categories = await firstRefresh;
  assert.equal(categories[0].slots[0].questionCount, 1);
  assert.equal((await client.getQuestion('geography-1')).id, 1);
  assert.ok(storage.getItem(QUESTION_CACHE_KEY));

  const offlineClient = createQuestionBankClient({ ...config, storage, isOnline: () => false, random: () => 0,
    fetch: async () => { throw new Error('Should not request offline'); } });
  assert.equal((await offlineClient.getQuestion('geography-1')).id, 1);
  assert.ok((await offlineClient.getQuestion('history-1')).id < 0);
});

test('failed refreshes retain previous validated cached questions and back off', async () => {
  const storage = memoryStorage();
  storage.setItem(QUESTION_CACHE_KEY, JSON.stringify({ version: 1, savedAt: 1, questions: [parseQuestionRow(questionRow(77))] }));
  let requests = 0;
  const client = createQuestionBankClient({ ...config, storage, now: () => 2_000_000, random: () => 0,
    fetch: async () => { requests += 1; throw new Error('Offline'); } });
  await client.refreshCategories();
  await client.refreshCategories();
  assert.equal((await client.getQuestion('geography-1')).id, 77);
  assert.equal(requests, 1);
});

test('image-only remote slots and corrupt cache rows always fall back to answerable text clues', async () => {
  const storage = memoryStorage();
  storage.setItem(QUESTION_CACHE_KEY, JSON.stringify({ version: 1, savedAt: Date.now(), questions: [
    parseQuestionRow({ ...questionRow(7), image_url: 'https://example.com/missing.png' }),
    { ...parseQuestionRow(questionRow(8)), correctIndex: 100 },
  ] }));
  const client = createQuestionBankClient({ ...config, storage, isOnline: () => false, random: () => 0 });
  assert.equal(client.getCategories()[0].slots[0].questionCount, 4);
  const question = await client.getQuestion('geography-1');
  assert.ok(question.id < 0);
  assert.equal(question.imageUrl, undefined);
  storage.setItem(QUESTION_CACHE_KEY, '{broken');
  const corrupted = createQuestionBankClient({ storage });
  assert.ok((await corrupted.getQuestion('player-3')).id < 0);
});

test('a failed later page never replaces a good cache with a partial new bank', async () => {
  const storage = memoryStorage();
  storage.setItem(QUESTION_CACHE_KEY, JSON.stringify({ version: 1, savedAt: 1, questions: [parseQuestionRow(questionRow(88))] }));
  let requests = 0;
  const client = createQuestionBankClient({ ...config, storage, now: () => 2_000_000, random: () => 0,
    fetch: async () => {
      requests += 1;
      return requests === 1 ? response([questionRow(90)], '0-0/2') : new Response('', { status: 503 });
    } });
  await client.refreshCategories();
  assert.equal(requests, 2);
  assert.equal((await client.getQuestion('geography-1')).id, 88);
});

test('excluded questions are avoided where alternatives exist and all-seen slots remain playable', async () => {
  const client = createQuestionBankClient({ random: () => 0 });
  const first = await client.getQuestion('geography-1');
  const second = await client.getQuestion('geography-1', [first.id]);
  assert.notEqual(first.id, second.id);
  const all = BUNDLED_QUESTIONS.filter((question) => question.slotKey === 'geography-1').map((question) => question.id);
  assert.ok((await client.getQuestion('geography-1', all)).id < 0);
  await assert.rejects(() => client.getQuestion('missing-slot'));
});

test('secret keys are not used by the app and unavailable storage never blocks offline play', async () => {
  let requests = 0;
  const fetcher: typeof fetch = async () => { requests += 1; throw new Error('Must not run'); };
  const secretClient = createQuestionBankClient({ ...config, key: 'sb_secret_should_not_ship', fetch: fetcher });
  await secretClient.refreshCategories();
  const jwt = `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`;
  const privilegedClient = createQuestionBankClient({ ...config, key: jwt, fetch: fetcher });
  await privilegedClient.refreshCategories();
  assert.equal(requests, 0);
  const storage: GameStorage = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); }, removeItem() { throw new Error('Blocked'); } };
  const client = createQuestionBankClient({ storage });
  assert.ok((await client.getQuestion('history-2')).id < 0);
});
