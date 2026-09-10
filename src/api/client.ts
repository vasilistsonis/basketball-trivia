import type { GameCategory, QuestionBankEntry } from '../types';
import { createQuestionBankClient } from '../game/questionBank';
import { getBrowserStorage } from '../game/storage';

export type ApiQuestion = QuestionBankEntry;
export type ApiCategory = GameCategory;

// Only the public Supabase URL and anonymous/publishable key belong in the app.
// Missing configuration simply uses the bundled bank. Database writes remain in
// server tooling; this client only issues read requests against `questions`.
const client = createQuestionBankClient({
  url: import.meta.env.VITE_SUPABASE_URL,
  key: import.meta.env.VITE_SUPABASE_ANON_KEY,
  storage: getBrowserStorage(),
  isOnline: () => typeof navigator === 'undefined' || navigator.onLine,
});

/** Synchronous, validated content makes the first launch playable offline. */
export const getCachedCategories = client.getCategories;
/** Refresh all pages in the background while keeping the current bank usable. */
export const fetchCategories = client.refreshCategories;
/** Returns immediately from cached or bundled content and schedules a refresh. */
export const fetchQuestion = client.getQuestion;
