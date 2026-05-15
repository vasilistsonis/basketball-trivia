const API_BASE = '/api';

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

export async function fetchQuestion(slotKey: string, excludeIds: number[]): Promise<ApiQuestion> {
  const exclude = excludeIds.length > 0 ? `?exclude=${excludeIds.join(',')}` : '';
  const res = await fetch(`${API_BASE}/questions/${slotKey}${exclude}`);
  if (!res.ok) throw new Error(`Failed to fetch question for ${slotKey}`);
  return res.json();
}

export async function fetchQuizQuestions(
  count: number = 10,
  difficulty: string = 'mixed'
): Promise<ApiQuestion[]> {
  const res = await fetch(`${API_BASE}/quiz?count=${count}&difficulty=${difficulty}`);
  if (!res.ok) throw new Error('Failed to fetch quiz questions');
  return res.json();
}

export async function fetchCategories(): Promise<ApiCategory[]> {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function fetchStats(): Promise<{ total: number; byCategory: { category: string; count: number }[] }> {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
