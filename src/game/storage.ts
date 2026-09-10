import type { AnsweredSlot, GameState, PowerUps, SavedGame, Team } from '../types';
import { findSlot, isCategories, isIndex, isNonEmptyString, isQuestion, isRecord } from './catalog';
import { canSaveGame, createInitialState } from './reducer';

export interface GameStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const SAVED_GAME_KEY = 'hoops-trivia:match:v1';
export const STORAGE_WARNING = 'Your device could not save this match. Keep the app open to finish playing.';

export function getBrowserStorage(): GameStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    return null;
  }
}

function isTeam(value: unknown): value is Team {
  return isRecord(value) && isNonEmptyString(value.name, 30)
    && typeof value.color === 'string' && /^#[\da-f]{6}$/i.test(value.color)
    && Number.isSafeInteger(value.score) && (value.score as number) >= 0 && (value.score as number) <= 100;
}

function isPowerUps(value: unknown): value is PowerUps {
  return isRecord(value) && typeof value.usedDouble === 'boolean' && typeof value.usedFiftyFifty === 'boolean';
}

/** Reject invalid snapshots as a whole instead of guessing at scores or turns. */
export function validateSavedGame(value: unknown): SavedGame | null {
  if (!isRecord(value) || value.version !== 1 || typeof value.savedAt !== 'string'
    || !Number.isFinite(Date.parse(value.savedAt)) || !isRecord(value.state)) return null;
  const state = value.state;
  if (!['playing', 'question', 'game-over'].includes(state.phase as string)
    || !isNonEmptyString(state.gameId, 100) || !isCategories(state.categories)
    || !Array.isArray(state.teams) || state.teams.length !== 2 || !state.teams.every(isTeam)
    || !Array.isArray(state.powerUps) || state.powerUps.length !== 2 || !state.powerUps.every(isPowerUps)
    || (state.currentTeamIndex !== 0 && state.currentTeamIndex !== 1)
    || !isRecord(state.answeredSlots) || typeof state.answerRevealed !== 'boolean' || typeof state.activeDouble !== 'boolean'
    || !Array.isArray(state.fiftyFiftyEliminated) || !state.fiftyFiftyEliminated.every(isIndex)
    || ![0, 2].includes(state.fiftyFiftyEliminated.length)
    || new Set(state.fiftyFiftyEliminated).size !== state.fiftyFiftyEliminated.length
    || (state.activeDouble && state.fiftyFiftyEliminated.length > 0)
    || (state.selectedAnswerIndex !== null && !isIndex(state.selectedAnswerIndex))
    || !Array.isArray(state.seenQuestionIds) || !state.seenQuestionIds.every((id) => isNonEmptyString(id, 100))
    || new Set(state.seenQuestionIds).size !== state.seenQuestionIds.length) return null;

  const totalSlots = state.categories.reduce((sum, category) => sum + category.slots.length, 0);
  const answers = Object.entries(state.answeredSlots);
  if (state.totalSlots !== totalSlots || answers.length > totalSlots || state.seenQuestionIds.length > totalSlots) return null;

  const scores = [0, 0];
  const usedDouble = [0, 0];
  const usedFifty = [0, 0];
  const answeredSlots: Record<string, AnsweredSlot> = {};
  for (let index = 0; index < answers.length; index += 1) {
    const [key, answer] = answers[index];
    const slot = findSlot(key);
    if (!slot || !isRecord(answer) || answer.slotKey !== key || answer.answeredByTeam !== index % 2
      || typeof answer.correct !== 'boolean' || !isNonEmptyString(answer.questionId, 100)
      || !state.seenQuestionIds.includes(answer.questionId) || !isIndex(answer.selectedIndex) || !isIndex(answer.correctIndex)
      || answer.correct !== (answer.selectedIndex === answer.correctIndex)
      || (answer.powerUp !== null && answer.powerUp !== 'double' && answer.powerUp !== 'fifty-fifty')) return null;
    const expectedPoints = !answer.correct ? 0 : answer.powerUp === 'double' ? slot.points * 2
      : answer.powerUp === 'fifty-fifty' ? Math.ceil(slot.points / 2) : slot.points;
    if (answer.pointsAwarded !== expectedPoints) return null;
    const team = answer.answeredByTeam as 0 | 1;
    scores[team] += expectedPoints;
    if (answer.powerUp === 'double') usedDouble[team] += 1;
    if (answer.powerUp === 'fifty-fifty') usedFifty[team] += 1;
    answeredSlots[key] = { slotKey: key, answeredByTeam: team, correct: answer.correct, questionId: answer.questionId,
      selectedIndex: answer.selectedIndex, correctIndex: answer.correctIndex, pointsAwarded: expectedPoints, powerUp: answer.powerUp };
  }
  if (scores.some((score, index) => score !== (state.teams as Team[])[index].score)) return null;

  const expectedTurn = (answers.length - (state.answerRevealed ? 1 : 0)) % 2;
  if (state.currentTeamIndex !== expectedTurn) return null;

  if (state.phase === 'question') {
    if (!isQuestion(state.currentQuestion) || typeof state.currentSlotKey !== 'string') return null;
    const slot = findSlot(state.currentSlotKey);
    const question = state.currentQuestion;
    if (!slot || question.category !== slot.category || question.points !== slot.points
      || !state.seenQuestionIds.includes(question.id)
      || state.fiftyFiftyEliminated.includes(question.correctIndex)
      || (state.selectedAnswerIndex !== null && state.fiftyFiftyEliminated.includes(state.selectedAnswerIndex))) return null;
    const answer = answeredSlots[state.currentSlotKey];
    if (state.answerRevealed) {
      if (!answer || answer.questionId !== question.id || answer.selectedIndex !== state.selectedAnswerIndex
        || answer.correctIndex !== question.correctIndex || answer.answeredByTeam !== state.currentTeamIndex
        || answer.powerUp !== (state.activeDouble ? 'double' : state.fiftyFiftyEliminated.length ? 'fifty-fifty' : null)) return null;
    } else {
      if (answer || answers.length === totalSlots) return null;
      if (state.activeDouble) usedDouble[state.currentTeamIndex] += 1;
      if (state.fiftyFiftyEliminated.length) usedFifty[state.currentTeamIndex] += 1;
    }
  } else if (state.currentQuestion !== null || state.currentSlotKey !== null || state.answerRevealed
    || state.selectedAnswerIndex !== null || state.activeDouble || state.fiftyFiftyEliminated.length
    || (state.phase === 'game-over' ? answers.length !== totalSlots : answers.length >= totalSlots)) return null;

  const expectedSeenCount = answers.length + (state.phase === 'question' && !state.answerRevealed ? 1 : 0);
  if (state.seenQuestionIds.length !== expectedSeenCount || new Set(Object.values(answeredSlots).map((answer) => answer.questionId)).size !== answers.length
    || state.powerUps.some((powerUp, index) => usedDouble[index] > 1 || usedFifty[index] > 1
      || powerUp.usedDouble !== (usedDouble[index] === 1) || powerUp.usedFiftyFifty !== (usedFifty[index] === 1))) return null;

  // Reconstruct only our schema's fields, never arbitrary properties from storage.
  const restored: GameState = {
    ...createInitialState(state.categories), phase: state.phase as GameState['phase'], gameId: state.gameId,
    teams: state.teams.map((team) => ({ name: team.name, color: team.color, score: team.score })) as [Team, Team],
    currentTeamIndex: state.currentTeamIndex, answeredSlots,
    currentQuestion: state.currentQuestion === null ? null : { ...(state.currentQuestion as GameState['currentQuestion'])! },
    currentSlotKey: state.currentSlotKey as string | null, totalSlots,
    powerUps: state.powerUps.map((powerUp) => ({ ...powerUp })) as [PowerUps, PowerUps],
    activeDouble: state.activeDouble, fiftyFiftyEliminated: [...state.fiftyFiftyEliminated],
    selectedAnswerIndex: state.selectedAnswerIndex, answerRevealed: state.answerRevealed,
    seenQuestionIds: [...state.seenQuestionIds] as string[],
  };
  return { version: 1, savedAt: value.savedAt, state: restored };
}

export function parseSavedGame(raw: string | null): SavedGame | null {
  if (!raw || raw.length > 256_000) return null;
  try {
    return validateSavedGame(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function readSavedGame(storage: GameStorage | null): SavedGame | null {
  try {
    return parseSavedGame(storage?.getItem(SAVED_GAME_KEY) ?? null);
  } catch {
    return null;
  }
}

export function createSavedGame(state: GameState, now = Date.now()): SavedGame | null {
  return canSaveGame(state) ? { version: 1, savedAt: new Date(now).toISOString(), state } : null;
}

export function writeSavedGame(storage: GameStorage | null, savedGame: SavedGame): boolean {
  if (!storage) return false;
  try {
    storage.setItem(SAVED_GAME_KEY, JSON.stringify(savedGame));
    return true;
  } catch {
    return false;
  }
}

export function removeSavedGame(storage: GameStorage | null): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(SAVED_GAME_KEY);
    return true;
  } catch {
    return false;
  }
}
