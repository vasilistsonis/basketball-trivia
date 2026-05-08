import express from 'express';
import cors from 'cors';
import { initDb, getDb } from './db.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

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

  const db = await getDb();

  let query: string;
  let params: any[];

  if (excludeIds.length > 0) {
    const placeholders = excludeIds.map(() => '?').join(',');
    query = `SELECT * FROM questions WHERE slot_key = ? AND id NOT IN (${placeholders}) ORDER BY RANDOM() LIMIT 1`;
    params = [slotKey, ...excludeIds];
  } else {
    query = `SELECT * FROM questions WHERE slot_key = ? ORDER BY RANDOM() LIMIT 1`;
    params = [slotKey];
  }

  const stmt = db.prepare(query);
  stmt.bind(params);

  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    res.json(formatQuestion(row));
    return;
  }
  stmt.free();

  // If all questions seen, reset and pick any
  const fallbackStmt = db.prepare(`SELECT * FROM questions WHERE slot_key = ? ORDER BY RANDOM() LIMIT 1`);
  fallbackStmt.bind([slotKey]);

  if (fallbackStmt.step()) {
    const row = fallbackStmt.getAsObject();
    fallbackStmt.free();
    res.json(formatQuestion(row));
    return;
  }
  fallbackStmt.free();

  res.status(404).json({ error: 'No questions found for this slot' });
});

// ── GET /api/categories ──
app.get('/api/categories', async (_req, res) => {
  const db = await getDb();

  const rows: any[] = [];
  const stmt = db.prepare(
    `SELECT category, slot_key, points, COUNT(*) as question_count 
     FROM questions GROUP BY slot_key ORDER BY category, points`
  );

  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();

  const categories = buildCategoryMeta(rows);
  res.json(categories);
});

// ── GET /api/stats ──
app.get('/api/stats', async (_req, res) => {
  const db = await getDb();

  const totalStmt = db.prepare(`SELECT COUNT(*) as total FROM questions`);
  totalStmt.step();
  const totalRow = totalStmt.getAsObject() as any;
  totalStmt.free();

  const catStmt = db.prepare(`SELECT category, COUNT(*) as count FROM questions GROUP BY category`);
  const byCategory: any[] = [];
  while (catStmt.step()) {
    byCategory.push(catStmt.getAsObject());
  }
  catStmt.free();

  res.json({ total: totalRow.total, byCategory });
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

  const catConfig: Record<string, { label: string; icon: string; description: string }> = {
    geography: { label: 'Geography', icon: '🌍', description: 'NBA & Euroleague arenas, cities & courts' },
    history: { label: 'History', icon: '📜', description: 'NBA & Euroleague history & milestones' },
    logo: { label: 'Logo', icon: '🎨', description: 'Guess the team based on the logo' },
    'guess-whos-missing': { label: "Who's Missing?", icon: '🔍', description: 'Iconic starting 5s — who is missing?' },
    'guess-the-player': { label: 'Guess the Player', icon: '🃏', description: 'Identify the player from his career CV' },
  };

  for (const row of rows) {
    if (!catMap[row.category]) {
      const config = catConfig[row.category] || { label: row.category, icon: '❓', description: '' };
      catMap[row.category] = { id: row.category, ...config, slots: [] };
    }
    catMap[row.category].slots.push({
      points: row.points,
      key: row.slot_key,
      questionCount: row.question_count,
    });
  }

  // Return in fixed order
  const order = ['geography', 'history', 'logo', 'guess-whos-missing', 'guess-the-player'];
  return order.filter((id) => catMap[id]).map((id) => catMap[id]);
}

// Start server after DB is ready
async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`🏀 Basketball Trivia API running on http://localhost:${PORT}`);
  });
}

start();
