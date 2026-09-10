import assert from 'node:assert/strict';
import test from 'node:test';
import type { GameState, Question } from '../src/types';
import { BUNDLED_QUESTIONS } from '../src/data/questions';
import { bankCategories } from '../src/game/questionBank';
import { createInitialState, gameReducer, type GameAction } from '../src/game/reducer';
import { createSavedGame, parseSavedGame, readSavedGame, removeSavedGame, SAVED_GAME_KEY, validateSavedGame, writeSavedGame, type GameStorage } from '../src/game/storage';

function startGame(id = 'test-match'): GameState {
  let state = gameReducer(createInitialState(bankCategories()), { type: 'START_SETUP' });
  state = gameReducer(state, { type: 'SET_TEAMS', teams: [
    { name: 'The Aces', color: '#E85D1E', score: 100 },
    { name: 'The Guards', color: '#3B4D8A', score: 100 },
  ] });
  return gameReducer(state, { type: 'START_GAME', totalSlots: 0, gameId: id });
}

function openQuestion(state: GameState, slotKey = 'geography-3'): GameState {
  const source = BUNDLED_QUESTIONS.find((entry) => entry.slotKey === slotKey)!;
  const { slotKey: _slotKey, ...question } = source;
  return gameReducer(state, { type: 'SET_QUESTION', slotKey, question: { ...question, id: String(question.id) }, gameId: state.gameId! });
}

function correctAnswer(state: GameState): GameState {
  return gameReducer(gameReducer(state, { type: 'SELECT_ANSWER', selectedIndex: state.currentQuestion!.correctIndex }), { type: 'REVEAL_ANSWER' });
}

function roundTrip(state: GameState): GameState {
  const saved = createSavedGame(state, Date.UTC(2026, 8, 10));
  const restored = parseSavedGame(JSON.stringify(saved));
  assert.ok(restored, `Snapshot must validate during ${state.phase}, revealed=${state.answerRevealed}`);
  assert.deepEqual(restored.state, state);
  return restored.state;
}

test('a new match derives its 14 slots from the board and clears old scores', () => {
  const state = startGame();
  assert.equal(state.totalSlots, 14);
  assert.deepEqual(state.teams.map((team) => team.score), [0, 0]);
  assert.equal(state.currentTeamIndex, 0);
  assert.equal(state.phase, 'playing');
  roundTrip(state);
});

test('reveal awards points exactly once and permanently locks the selected answer', () => {
  const question = openQuestion(startGame());
  const selected = gameReducer(question, { type: 'SELECT_ANSWER', selectedIndex: question.currentQuestion!.correctIndex });
  const revealed = gameReducer(selected, { type: 'REVEAL_ANSWER' });
  assert.equal(revealed.phase, 'question');
  assert.equal(revealed.teams[0].score, 3);
  assert.equal(Object.keys(revealed.answeredSlots).length, 1);
  assert.equal(revealed.currentTeamIndex, 0);
  for (const action of [
    { type: 'REVEAL_ANSWER' },
    { type: 'SELECT_ANSWER', selectedIndex: (revealed.selectedAnswerIndex! + 1) % 4 },
    { type: 'USE_DOUBLE' },
    { type: 'USE_FIFTY_FIFTY' },
  ] as GameAction[]) assert.equal(gameReducer(revealed, action), revealed);
  const continued = gameReducer(revealed, { type: 'CONTINUE_QUESTION' });
  assert.equal(continued.currentTeamIndex, 1);
  assert.equal(continued.phase, 'playing');
  assert.equal(gameReducer(continued, { type: 'CONTINUE_QUESTION' }), continued);
  assert.equal(continued.teams[0].score, 3);
  roundTrip(continued);
});

test('a wrong answer consumes the slot, awards zero and advances to the other team', () => {
  const state = openQuestion(startGame());
  const wrongIndex = (state.currentQuestion!.correctIndex + 1) % 4;
  const revealed = gameReducer(gameReducer(state, { type: 'SELECT_ANSWER', selectedIndex: wrongIndex }), { type: 'REVEAL_ANSWER' });
  assert.equal(revealed.teams[0].score, 0);
  assert.equal(revealed.answeredSlots['geography-3'].correct, false);
  assert.equal(gameReducer(revealed, { type: 'CONTINUE_QUESTION' }).currentTeamIndex, 1);
  roundTrip(revealed);
});

test('double points and fifty-fifty are exclusive, once per team, with correct rounding', () => {
  let state = gameReducer(openQuestion(startGame()), { type: 'USE_DOUBLE' });
  assert.equal(gameReducer(state, { type: 'USE_FIFTY_FIFTY' }), state);
  assert.equal(gameReducer(state, { type: 'USE_DOUBLE' }), state);
  state = correctAnswer(state);
  assert.equal(state.teams[0].score, 6);
  roundTrip(state);
  state = gameReducer(state, { type: 'CONTINUE_QUESTION' });
  state = gameReducer(openQuestion(state, 'history-3'), { type: 'USE_FIFTY_FIFTY' });
  assert.equal(state.fiftyFiftyEliminated.length, 2);
  assert.ok(!state.fiftyFiftyEliminated.includes(state.currentQuestion!.correctIndex));
  assert.equal(gameReducer(state, { type: 'USE_DOUBLE' }), state);
  state = correctAnswer(state);
  assert.equal(state.teams[1].score, 2);
  roundTrip(state);
  state = gameReducer(state, { type: 'CONTINUE_QUESTION' });
  state = openQuestion(state, 'player-3');
  assert.equal(gameReducer(state, { type: 'USE_DOUBLE' }), state);
  assert.equal(state.powerUps[1].usedDouble, false);
  state = gameReducer(state, { type: 'USE_FIFTY_FIFTY' });
  assert.equal(state.fiftyFiftyEliminated.length, 2);
  roundTrip(state);
});

test('fifty-fifty clears an eliminated selection and rejects invalid eliminations', () => {
  let state = openQuestion(startGame());
  const wrong = [0, 1, 2, 3].filter((index) => index !== state.currentQuestion!.correctIndex);
  state = gameReducer(state, { type: 'SELECT_ANSWER', selectedIndex: wrong[0] });
  assert.equal(gameReducer(state, { type: 'USE_FIFTY_FIFTY', eliminated: [wrong[0], state.currentQuestion!.correctIndex] }), state);
  assert.equal(gameReducer(state, { type: 'USE_FIFTY_FIFTY', eliminated: [wrong[0], wrong[0]] }), state);
  state = gameReducer(state, { type: 'USE_FIFTY_FIFTY', eliminated: wrong.slice(0, 2) });
  assert.equal(state.selectedAnswerIndex, null);
  assert.equal(gameReducer(state, { type: 'REVEAL_ANSWER' }), state);
  assert.equal(gameReducer(state, { type: 'SELECT_ANSWER', selectedIndex: wrong[0] }), state);
  const validSelection = gameReducer(state, { type: 'SELECT_ANSWER', selectedIndex: state.currentQuestion!.correctIndex });
  assert.equal(gameReducer(validSelection, { type: 'ANSWER_QUESTION', selectedIndex: wrong[0] }), validSelection);
  roundTrip(state);
});

test('reload preserves selection, consumed power-ups and revealed answers without double scoring', () => {
  let state = openQuestion(startGame());
  state = gameReducer(state, { type: 'USE_DOUBLE' });
  state = gameReducer(state, { type: 'SELECT_ANSWER', selectedIndex: state.currentQuestion!.correctIndex });
  state = roundTrip(state);
  assert.equal(state.answerRevealed, false);
  assert.equal(state.activeDouble, true);
  state = gameReducer(state, { type: 'REVEAL_ANSWER' });
  state = roundTrip(state);
  assert.equal(gameReducer(state, { type: 'REVEAL_ANSWER' }), state);
  const resumed = gameReducer(createInitialState(bankCategories()), { type: 'RESUME_GAME', state });
  assert.deepEqual(resumed, state);
  assert.equal(resumed.teams[0].score, 6);
  assert.equal(resumed.answerRevealed, true);
  assert.equal(createInitialState(bankCategories()).phase, 'home');
});

test('unanswered questions cannot be dismissed or rerolled and stale request results are ignored', () => {
  const state = startGame('current-match');
  const opened = openQuestion(state);
  const question = opened.currentQuestion as Question;
  assert.equal(gameReducer(state, { type: 'SET_QUESTION', question, slotKey: 'geography-3', gameId: 'previous-match' }), state);
  assert.equal(gameReducer(opened, { type: 'SET_QUESTION', question, slotKey: 'geography-3', gameId: state.gameId! }), opened);
  assert.equal(gameReducer(opened, { type: 'CLOSE_QUESTION' }), opened);
  assert.equal(gameReducer(opened, { type: 'CONTINUE_QUESTION' }), opened);
  assert.equal(gameReducer(opened, { type: 'SELECT_ANSWER', selectedIndex: 0, questionId: 'previous-question' }), opened);
  assert.equal(gameReducer(opened, { type: 'SELECT_ANSWER', selectedIndex: 4 }), opened);
  const home = gameReducer(opened, { type: 'GO_HOME' });
  assert.equal(gameReducer(home, { type: 'SET_QUESTION', question, slotKey: 'geography-3', gameId: state.gameId! }), home);
});

test('question category and points must match the selected slot and the board stays fixed midgame', () => {
  const state = startGame();
  const question = openQuestion(state).currentQuestion!;
  assert.equal(gameReducer(state, { type: 'SET_QUESTION', question, slotKey: 'history-3' }), state);
  assert.equal(gameReducer(state, { type: 'SET_QUESTION', question: { ...question, points: 1 }, slotKey: 'geography-3' }), state);
  assert.equal(gameReducer(state, { type: 'SET_CATEGORIES', categories: bankCategories() }), state);
  assert.equal(gameReducer(state, { type: 'USE_DOUBLE' }), state);
  assert.equal(gameReducer(state, { type: 'USE_FIFTY_FIFTY' }), state);
});

test('all 14 slots finish with seven turns per team and durable final results', () => {
  let state = startGame();
  const slots = state.categories.flatMap((category) => category.slots);
  const expectedScores = [0, 0];
  for (let index = 0; index < slots.length; index += 1) {
    state = openQuestion(state, slots[index].key);
    roundTrip(state);
    state = correctAnswer(state);
    expectedScores[index % 2] += slots[index].points;
    roundTrip(state);
    assert.equal(state.phase, 'question');
    state = gameReducer(state, { type: 'CONTINUE_QUESTION' });
    roundTrip(state);
  }
  assert.equal(state.phase, 'game-over');
  assert.deepEqual(state.teams.map((team) => team.score), expectedScores);
  assert.deepEqual([0, 1].map((team) => Object.values(state.answeredSlots).filter((answer) => answer.answeredByTeam === team).length), [7, 7]);
  assert.equal(gameReducer(state, { type: 'ANSWER_QUESTION', selectedIndex: 0 }), state);
  assert.ok(createSavedGame(state));
});

test('the compatibility answer action advances once and cannot award a completed slot again', () => {
  const state = openQuestion(startGame());
  const answered = gameReducer(state, { type: 'ANSWER_QUESTION', selectedIndex: state.currentQuestion!.correctIndex });
  assert.equal(answered.phase, 'playing');
  assert.equal(answered.teams[0].score, 3);
  assert.equal(gameReducer(answered, { type: 'ANSWER_QUESTION', selectedIndex: 1 }), answered);
  assert.equal(openQuestion(answered), answered);
});

test('malformed or inconsistent saved scores, phases, turns and question states are rejected', () => {
  const valid = createSavedGame(correctAnswer(gameReducer(openQuestion(startGame()), { type: 'USE_DOUBLE' })))!;
  const mutate = (change: (snapshot: any) => void) => {
    const snapshot = structuredClone(valid);
    change(snapshot);
    assert.equal(validateSavedGame(snapshot), null);
  };
  mutate((snapshot) => { snapshot.version = 2; });
  mutate((snapshot) => { snapshot.state.teams[0].score = 999; });
  mutate((snapshot) => { snapshot.state.totalSlots = 100; });
  mutate((snapshot) => { snapshot.state.currentTeamIndex = 1; });
  mutate((snapshot) => { snapshot.state.answerRevealed = false; });
  mutate((snapshot) => { snapshot.state.currentQuestion.correctIndex = 4; });
  mutate((snapshot) => { snapshot.state.selectedAnswerIndex = (snapshot.state.selectedAnswerIndex + 1) % 4; });
  mutate((snapshot) => { snapshot.state.currentQuestion.imageUrl = 'javascript:alert(1)'; });
  mutate((snapshot) => { snapshot.state.answeredSlots['geography-3'].pointsAwarded = 3; });
  mutate((snapshot) => { snapshot.state.powerUps[0].usedDouble = false; });
  mutate((snapshot) => { snapshot.state.seenQuestionIds = []; });
  mutate((snapshot) => { snapshot.state.categories[0].slots[0].key = '__proto__'; });
  assert.equal(parseSavedGame('{broken'), null);
  assert.equal(parseSavedGame(' '.repeat(256_001)), null);
  assert.equal(validateSavedGame({ version: 1, savedAt: 'invalid', state: valid.state }), null);
});

test('storage failures are contained and valid snapshots survive write/read/remove', () => {
  const values = new Map<string, string>();
  const storage: GameStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
  const snapshot = createSavedGame(openQuestion(startGame()))!;
  assert.equal(writeSavedGame(storage, snapshot), true);
  assert.deepEqual(readSavedGame(storage), snapshot);
  assert.equal(removeSavedGame(storage), true);
  assert.equal(values.has(SAVED_GAME_KEY), false);
  assert.equal(readSavedGame(storage), null);
  const blocked: GameStorage = {
    getItem() { throw new Error('Unavailable'); }, setItem() { throw new Error('Quota exceeded'); }, removeItem() { throw new Error('Unavailable'); },
  };
  assert.equal(writeSavedGame(blocked, snapshot), false);
  assert.equal(readSavedGame(blocked), null);
  assert.equal(removeSavedGame(blocked), false);
  assert.equal(writeSavedGame(null, snapshot), false);
  assert.equal(createSavedGame(createInitialState(bankCategories())), null);
});
