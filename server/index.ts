import express from 'express';
import cors from 'cors';
import {
  getCategorySlotCounts,
  getQuestionCount,
  getQuizQuestions,
  getRandomQuestionBySlot,
  getStatsByCategory,
  initDb,
} from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ── GET /api/health ──
app.get('/api/health', async (_req, res) => {
  try {
    const questionCount = await getQuestionCount();
    res.json({
      ok: true,
      database: {
        provider: 'supabase',
        connected: true,
        questionCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      database: {
        provider: 'supabase',
        connected: false,
      },
      error: error instanceof Error ? error.message : 'Unknown database error',
    });
  }
});

// ── GET /api/questions/:slotKey ──
// Returns a random question for the given slot, excluding already-seen IDs
// Query param: ?exclude=1,2,3
app.get('/api/questions/:slotKey', async (req, res) => {
  const { slotKey } = req.params;
  const excludeParam = (req.query.exclude as string) || '';
  const excludeIds = excludeParam
    .split(',')
    .map((s) => parseInt(s, 10))
    .filter((n) => !isNaN(n));

  try {
    const row = await getRandomQuestionBySlot(slotKey, excludeIds);
    if (!row) {
      res.status(404).json({ error: 'No questions found for this slot' });
      return;
    }

    res.json(formatQuestion(row));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch question' });
  }
});

// ── GET /api/quiz ──
// Returns a batch of random questions from ALL categories
// Query params: ?count=10&difficulty=mixed
app.get('/api/quiz', async (req, res) => {
  const count = Math.min(parseInt(req.query.count as string) || 10, 30);
  const difficulty = (req.query.difficulty as string) || 'mixed';

  try {
    const questions = await getQuizQuestions(count, difficulty);

    if (questions.length === 0) {
      res.status(404).json({ error: 'No questions found' });
      return;
    }

    res.json(questions.map(formatQuestion));
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch quiz questions' });
  }
});

// ── GET /api/categories ──
app.get('/api/categories', async (_req, res) => {
  try {
    const rows = await getCategorySlotCounts();
    const categories = buildCategoryMeta(rows);
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch categories' });
  }
});

// ── GET /api/stats ──
app.get('/api/stats', async (_req, res) => {
  try {
    const total = await getQuestionCount();
    const byCategory = await getStatsByCategory();
    res.json({ total, byCategory });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch stats' });
  }
});

function formatQuestion(row: any) {
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

function buildCategoryMeta(rows: any[]) {
  const catMap: Record<string, any> = {};

  const catConfig: Record<string, { label: string; icon: string; description: string; color: string }> = {
    geography: { label: 'Geography', icon: '🌍', description: 'NBA & Euroleague arenas, cities & courts', color: '#3b82f6' },
    history: { label: 'History', icon: '📜', description: 'NBA & Euroleague history & milestones', color: '#f59e0b' },
    logo: { label: 'Logo', icon: '🎨', description: 'Guess the team based on the logo', color: '#8b5cf6' },
    'guess-whos-missing': { label: "Who's Missing?", icon: '🔍', description: 'Iconic starting 5s — who is missing?', color: '#10b981' },
    'guess-the-player': { label: 'Guess the Player', icon: '🃏', description: 'Identify the player from his career CV', color: '#ef4444' },
  };

  for (const row of rows) {
    if (!catMap[row.category]) {
      const config = catConfig[row.category] || { label: row.category, icon: '❓', description: '', color: '#6b7280' };
      catMap[row.category] = { id: row.category, ...config, slots: [], questionCount: 0 };
    }
    catMap[row.category].slots.push({
      points: row.points,
      key: row.slot_key,
      questionCount: row.question_count,
    });
    catMap[row.category].questionCount += row.question_count;
  }

  // Return in fixed order
  const order = ['geography', 'history', 'logo', 'guess-whos-missing', 'guess-the-player'];
  return order.filter((id) => catMap[id]).map((id) => catMap[id]);
}

// Start server after DB is ready
async function start() {
  await initDb();
  const questionCount = await getQuestionCount();
  app.listen(PORT, () => {
    console.log(`🏀 Basketball Trivia API running on http://localhost:${PORT}`);
    console.log(`Supabase database connected with ${questionCount} questions`);
  });
}

start().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
