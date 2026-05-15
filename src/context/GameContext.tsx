import React, { createContext, useContext, useReducer, useCallback, useRef, ReactNode } from 'react';
import { GameState, Team, AnsweredSlot, Question, PowerUps, CategoryMeta, ApiCategorySlot } from '../types';
import { fetchQuestion, fetchCategories, ApiCategory } from '../api/client';

// ── Initial state ──

const initialPowerUps: PowerUps = { usedDouble: false, usedFiftyFifty: false };

const initialTeams: [Team, Team] = [
  { name: 'Team 1', color: '#f97316', score: 0 },
  { name: 'Team 2', color: '#3b82f6', score: 0 },
];

const initialState: GameState = {
  phase: 'home',
  categories: [],
  teams: initialTeams,
  currentTeamIndex: 0,
  answeredSlots: {},
  currentQuestion: null,
  currentSlotKey: null,
  totalSlots: 0,
  powerUps: [{ ...initialPowerUps }, { ...initialPowerUps }],
  activeDouble: false,
  fiftyFiftyEliminated: [],
};

// ── Actions ──

type Action =
  | { type: 'SET_CATEGORIES'; categories: (CategoryMeta & { slots: ApiCategorySlot[] })[] }
  | { type: 'START_SETUP' }
  | { type: 'SET_TEAMS'; teams: [Team, Team] }
  | { type: 'START_GAME'; totalSlots: number }
  | { type: 'SET_QUESTION'; question: Question; slotKey: string }
  | { type: 'ANSWER_QUESTION'; selectedIndex: number }
  | { type: 'CLOSE_QUESTION' }
  | { type: 'GO_HOME' }
  | { type: 'USE_DOUBLE' }
  | { type: 'USE_FIFTY_FIFTY' };

// ── Helpers ──

/** Pick two random wrong-answer indices to eliminate */
function pickFiftyFiftyEliminations(correctIndex: number, totalOptions: number): number[] {
  const wrongIndices = Array.from({ length: totalOptions }, (_, i) => i).filter(
    (i) => i !== correctIndex
  );
  // Shuffle and pick 2
  for (let i = wrongIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [wrongIndices[i], wrongIndices[j]] = [wrongIndices[j], wrongIndices[i]];
  }
  return wrongIndices.slice(0, 2);
}

// ── Reducer ──

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_CATEGORIES':
      return { ...state, categories: action.categories };

    case 'START_SETUP':
      return { ...state, phase: 'team-setup' };

    case 'SET_TEAMS':
      return { ...state, teams: action.teams };

    case 'START_GAME':
      return {
        ...state,
        phase: 'playing',
        currentTeamIndex: 0,
        answeredSlots: {},
        currentQuestion: null,
        currentSlotKey: null,
        totalSlots: action.totalSlots,
        teams: [
          { ...state.teams[0], score: 0 },
          { ...state.teams[1], score: 0 },
        ],
        powerUps: [{ ...initialPowerUps }, { ...initialPowerUps }],
        activeDouble: false,
        fiftyFiftyEliminated: [],
      };

    case 'SET_QUESTION':
      return {
        ...state,
        phase: 'question',
        currentQuestion: action.question,
        currentSlotKey: action.slotKey,
        activeDouble: false,
        fiftyFiftyEliminated: [],
      };

    case 'USE_DOUBLE': {
      // Can only use if not already used and no other power-up active on this question
      const pu = state.powerUps[state.currentTeamIndex];
      if (pu.usedDouble || state.activeDouble || state.fiftyFiftyEliminated.length > 0) return state;
      const newPowerUps: [PowerUps, PowerUps] = [...state.powerUps] as [PowerUps, PowerUps];
      newPowerUps[state.currentTeamIndex] = { ...pu, usedDouble: true };
      return { ...state, powerUps: newPowerUps, activeDouble: true };
    }

    case 'USE_FIFTY_FIFTY': {
      const pu = state.powerUps[state.currentTeamIndex];
      if (pu.usedFiftyFifty || state.fiftyFiftyEliminated.length > 0 || state.activeDouble) return state;
      if (!state.currentQuestion) return state;
      const eliminated = pickFiftyFiftyEliminations(
        state.currentQuestion.correctIndex,
        state.currentQuestion.options.length
      );
      const newPowerUps: [PowerUps, PowerUps] = [...state.powerUps] as [PowerUps, PowerUps];
      newPowerUps[state.currentTeamIndex] = { ...pu, usedFiftyFifty: true };
      return { ...state, powerUps: newPowerUps, fiftyFiftyEliminated: eliminated };
    }

    case 'ANSWER_QUESTION': {
      if (!state.currentQuestion || !state.currentSlotKey) return state;

      const correct = action.selectedIndex === state.currentQuestion.correctIndex;
      let basePoints = state.currentQuestion.points;

      // Apply power-up modifiers
      if (state.activeDouble) {
        basePoints = basePoints * 2;
      } else if (state.fiftyFiftyEliminated.length > 0) {
        basePoints = Math.ceil(basePoints * 0.5);
      }

      const points = correct ? basePoints : 0;

      const newTeams: [Team, Team] = [...state.teams] as [Team, Team];
      newTeams[state.currentTeamIndex] = {
        ...newTeams[state.currentTeamIndex],
        score: newTeams[state.currentTeamIndex].score + points,
      };

      const answered: AnsweredSlot = {
        slotKey: state.currentSlotKey,
        answeredByTeam: state.currentTeamIndex,
        correct,
      };

      const newAnsweredSlots = {
        ...state.answeredSlots,
        [state.currentSlotKey]: answered,
      };

      const allAnswered = Object.keys(newAnsweredSlots).length >= state.totalSlots;

      return {
        ...state,
        teams: newTeams,
        answeredSlots: newAnsweredSlots,
        phase: allAnswered ? 'game-over' : 'playing',
        currentQuestion: null,
        currentSlotKey: null,
        currentTeamIndex: state.currentTeamIndex === 0 ? 1 : 0,
        activeDouble: false,
        fiftyFiftyEliminated: [],
      };
    }

    case 'CLOSE_QUESTION':
      return {
        ...state,
        phase: 'playing',
        currentQuestion: null,
        currentSlotKey: null,
        activeDouble: false,
        fiftyFiftyEliminated: [],
      };

    case 'GO_HOME':
      return { ...initialState, categories: state.categories };

    default:
      return state;
  }
}

// ── Context ──

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  loadCategories: () => Promise<void>;
  selectSlot: (slotKey: string) => Promise<void>;
  loading: boolean;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [loading, setLoading] = React.useState(false);
  const seenIdsRef = useRef<number[]>([]);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories();
      const mapped = cats.map((c: ApiCategory) => ({
        id: c.id as any,
        label: c.label,
        description: c.description,
        icon: c.icon,
        color: c.color || '#6b7280',
        questionCount: c.questionCount || c.slots.reduce((s, sl) => s + sl.questionCount, 0),
        slots: c.slots,
      }));
      dispatch({ type: 'SET_CATEGORIES', categories: mapped });
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  const selectSlot = useCallback(async (slotKey: string) => {
    setLoading(true);
    try {
      const apiQ = await fetchQuestion(slotKey, seenIdsRef.current);
      const question: Question = {
        id: String(apiQ.id),
        category: apiQ.category as any,
        points: apiQ.points,
        question: apiQ.question,
        options: apiQ.options,
        correctIndex: apiQ.correctIndex,
        imageUrl: apiQ.imageUrl,
      };
      seenIdsRef.current.push(apiQ.id);
      dispatch({ type: 'SET_QUESTION', question, slotKey });
    } catch (err) {
      console.error('Failed to fetch question:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset seen IDs when a new game starts
  React.useEffect(() => {
    if (state.phase === 'playing' && Object.keys(state.answeredSlots).length === 0) {
      seenIdsRef.current = [];
    }
  }, [state.phase, state.answeredSlots]);

  return (
    <GameContext.Provider value={{ state, dispatch, loadCategories, selectSlot, loading }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
