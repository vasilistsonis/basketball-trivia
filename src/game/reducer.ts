import type { AnsweredSlot, GameCategory, GameState, PowerUps, Question, Team } from '../types';
import { findSlot, isCategories, isIndex, isQuestion } from './catalog';

export type GameAction =
  | { type: 'SET_CATEGORIES'; categories: GameCategory[] }
  | { type: 'START_SETUP' }
  | { type: 'SET_TEAMS'; teams: [Team, Team] }
  | { type: 'START_GAME'; totalSlots: number; gameId?: string }
  | { type: 'SET_QUESTION'; question: Question; slotKey: string; gameId?: string }
  | { type: 'SELECT_ANSWER'; selectedIndex: number; questionId?: string }
  | { type: 'REVEAL_ANSWER'; questionId?: string }
  | { type: 'CONTINUE_QUESTION'; questionId?: string }
  | { type: 'ANSWER_QUESTION'; selectedIndex: number }
  | { type: 'CLOSE_QUESTION' }
  | { type: 'GO_HOME' }
  | { type: 'RESUME_GAME'; state: GameState }
  | { type: 'USE_DOUBLE'; questionId?: string }
  | { type: 'USE_FIFTY_FIFTY'; eliminated?: number[]; questionId?: string };

function freshPowerUps(): [PowerUps, PowerUps] {
  return [{ usedDouble: false, usedFiftyFifty: false }, { usedDouble: false, usedFiftyFifty: false }];
}

export function createInitialState(categories: GameCategory[] = []): GameState {
  return {
    phase: 'home',
    categories,
    gameId: null,
    teams: [{ name: 'Team 1', color: '#E85D1E', score: 0 }, { name: 'Team 2', color: '#3B4D8A', score: 0 }],
    currentTeamIndex: 0,
    answeredSlots: {},
    currentQuestion: null,
    currentSlotKey: null,
    totalSlots: 0,
    powerUps: freshPowerUps(),
    activeDouble: false,
    fiftyFiftyEliminated: [],
    selectedAnswerIndex: null,
    answerRevealed: false,
    seenQuestionIds: [],
  };
}

export function canSaveGame(state: GameState): boolean {
  return !!state.gameId && (state.phase === 'playing' || state.phase === 'question' || state.phase === 'game-over');
}

export function effectivePoints(state: Pick<GameState, 'currentQuestion' | 'activeDouble' | 'fiftyFiftyEliminated'>): number {
  const points = state.currentQuestion?.points ?? 0;
  return state.activeDouble ? points * 2 : state.fiftyFiftyEliminated.length ? Math.ceil(points / 2) : points;
}

export function pickFiftyFiftyEliminations(correctIndex: number, random: () => number = Math.random): number[] {
  const wrong = [0, 1, 2, 3].filter((index) => index !== correctIndex);
  for (let index = wrong.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [wrong[index], wrong[swap]] = [wrong[swap], wrong[index]];
  }
  return wrong.slice(0, 2);
}

function activeQuestion(state: GameState, questionId?: string): boolean {
  return state.phase === 'question' && !!state.currentQuestion && !!state.currentSlotKey
    && (questionId === undefined || state.currentQuestion.id === questionId);
}

function canAnswer(state: GameState, questionId?: string): boolean {
  return activeQuestion(state, questionId) && !state.answerRevealed && !state.answeredSlots[state.currentSlotKey!];
}

function resetQuestion(state: GameState): GameState {
  return { ...state, currentQuestion: null, currentSlotKey: null, activeDouble: false,
    fiftyFiftyEliminated: [], selectedAnswerIndex: null, answerRevealed: false };
}

function normalizeTeam(team: Team, index: number): Team {
  return {
    name: typeof team.name === 'string' ? team.name.trim().slice(0, 30) || `Team ${index + 1}` : `Team ${index + 1}`,
    color: typeof team.color === 'string' && /^#[\da-f]{6}$/i.test(team.color) ? team.color : index === 0 ? '#E85D1E' : '#3B4D8A',
    score: 0,
  };
}

/** All transitions are pure. Randomness and persistence live in the provider. */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_CATEGORIES':
      // Freeze the board for the whole match, even if a bank refresh finishes midgame.
      return (state.phase === 'home' || state.phase === 'team-setup') && isCategories(action.categories)
        ? { ...state, categories: action.categories } : state;

    case 'START_SETUP':
      return state.phase === 'home' || state.phase === 'game-over'
        ? { ...createInitialState(state.categories), phase: 'team-setup', teams: state.teams.map(normalizeTeam) as [Team, Team] }
        : state;

    case 'SET_TEAMS':
      return state.phase === 'team-setup' && Array.isArray(action.teams) && action.teams.length === 2
        ? { ...state, teams: action.teams.map(normalizeTeam) as [Team, Team] } : state;

    case 'START_GAME': {
      const totalSlots = state.categories.reduce((sum, category) => sum + category.slots.length, 0);
      // The provider assigns a unique ID before reducing this public action.
      if (state.phase !== 'team-setup' || !totalSlots || !action.gameId) return state;
      return { ...createInitialState(state.categories), phase: 'playing', gameId: action.gameId,
        totalSlots, teams: state.teams.map(normalizeTeam) as [Team, Team] };
    }

    case 'SET_QUESTION': {
      const slot = findSlot(action.slotKey);
      if (state.phase !== 'playing' || state.currentQuestion || state.answeredSlots[action.slotKey]
        || (action.gameId !== undefined && state.gameId !== action.gameId)
        || !slot || !isQuestion(action.question)
        || action.question.category !== slot.category || action.question.points !== slot.points
        || !state.categories.some((category) => category.slots.some((item) => item.key === action.slotKey))) return state;
      return { ...resetQuestion(state), phase: 'question', currentQuestion: action.question, currentSlotKey: action.slotKey,
        seenQuestionIds: [...new Set([...state.seenQuestionIds, action.question.id])] };
    }

    case 'SELECT_ANSWER':
      return canAnswer(state, action.questionId) && isIndex(action.selectedIndex) && !state.fiftyFiftyEliminated.includes(action.selectedIndex)
        ? { ...state, selectedAnswerIndex: action.selectedIndex } : state;

    case 'USE_DOUBLE': {
      const powerUp = state.powerUps[state.currentTeamIndex];
      if (!canAnswer(state, action.questionId) || powerUp.usedDouble || state.activeDouble || state.fiftyFiftyEliminated.length) return state;
      const powerUps: [PowerUps, PowerUps] = [...state.powerUps];
      powerUps[state.currentTeamIndex] = { ...powerUp, usedDouble: true };
      return { ...state, powerUps, activeDouble: true };
    }

    case 'USE_FIFTY_FIFTY': {
      const powerUp = state.powerUps[state.currentTeamIndex];
      if (!canAnswer(state, action.questionId) || powerUp.usedFiftyFifty || state.activeDouble || state.fiftyFiftyEliminated.length) return state;
      // Context supplies random choices. A deterministic fallback also makes direct
      // reducer use predictable, including replaying a stored sequence of actions.
      const eliminated = action.eliminated ?? [0, 1, 2, 3].filter((index) => index !== state.currentQuestion!.correctIndex).slice(0, 2);
      if (eliminated.length !== 2 || new Set(eliminated).size !== 2
        || eliminated.some((index) => !isIndex(index) || index === state.currentQuestion!.correctIndex)) return state;
      const powerUps: [PowerUps, PowerUps] = [...state.powerUps];
      powerUps[state.currentTeamIndex] = { ...powerUp, usedFiftyFifty: true };
      return { ...state, powerUps, fiftyFiftyEliminated: [...eliminated],
        selectedAnswerIndex: state.selectedAnswerIndex !== null && eliminated.includes(state.selectedAnswerIndex) ? null : state.selectedAnswerIndex };
    }

    case 'REVEAL_ANSWER': {
      if (!canAnswer(state, action.questionId) || !isIndex(state.selectedAnswerIndex)
        || state.fiftyFiftyEliminated.includes(state.selectedAnswerIndex)) return state;
      const question = state.currentQuestion!;
      const correct = state.selectedAnswerIndex === question.correctIndex;
      const pointsAwarded = correct ? effectivePoints(state) : 0;
      const teams: [Team, Team] = [...state.teams];
      teams[state.currentTeamIndex] = { ...teams[state.currentTeamIndex], score: teams[state.currentTeamIndex].score + pointsAwarded };
      const answered: AnsweredSlot = {
        slotKey: state.currentSlotKey!, answeredByTeam: state.currentTeamIndex, correct,
        questionId: question.id, selectedIndex: state.selectedAnswerIndex, correctIndex: question.correctIndex,
        pointsAwarded, powerUp: state.activeDouble ? 'double' : state.fiftyFiftyEliminated.length ? 'fifty-fifty' : null,
      };
      // Scoring and locking the answer happen in one durable state transition.
      return { ...state, teams, answerRevealed: true, answeredSlots: { ...state.answeredSlots, [answered.slotKey]: answered } };
    }

    case 'CONTINUE_QUESTION':
    case 'CLOSE_QUESTION':
      if (!activeQuestion(state, 'questionId' in action ? action.questionId : undefined) || !state.answerRevealed) return state;
      return { ...resetQuestion(state),
        phase: Object.keys(state.answeredSlots).length === state.totalSlots ? 'game-over' : 'playing',
        currentTeamIndex: state.currentTeamIndex === 0 ? 1 : 0 };

    case 'ANSWER_QUESTION': {
      // Compatibility for callers that formerly confirmed and advanced at once.
      if (!activeQuestion(state) || !isIndex(action.selectedIndex)
        || state.fiftyFiftyEliminated.includes(action.selectedIndex)
        || (state.answerRevealed && action.selectedIndex !== state.selectedAnswerIndex)) return state;
      const selected = state.answerRevealed ? state : gameReducer(state, { type: 'SELECT_ANSWER', selectedIndex: action.selectedIndex });
      const revealed = gameReducer(selected, { type: 'REVEAL_ANSWER' });
      return gameReducer(revealed, { type: 'CONTINUE_QUESTION' });
    }

    case 'RESUME_GAME':
      return state.phase === 'home' && canSaveGame(action.state) ? action.state : state;

    case 'GO_HOME':
      return { ...createInitialState(state.categories), teams: state.teams.map(normalizeTeam) as [Team, Team] };

    default:
      return state;
  }
}
