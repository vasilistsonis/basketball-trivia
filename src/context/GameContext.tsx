import React, { createContext, useContext, useReducer, useCallback, useRef, ReactNode } from 'react';
import { GameState, Team, User, AnsweredSlot, Question } from '../types';
import { fetchQuestion, fetchCategories, ApiCategory } from '../api/client';

// ── Initial state ──

const initialTeams: [Team, Team] = [
  { name: 'Team 1', color: '#e74c3c', score: 0 },
  { name: 'Team 2', color: '#3498db', score: 0 },
];

const initialState: GameState = {
  phase: 'login',
  user: null,
  teams: initialTeams,
  currentTeamIndex: 0,
  answeredSlots: {},
  currentQuestion: null,
  currentSlotKey: null,
  totalSlots: 12, // default, updated when categories load
};

// ── Actions ──

type Action =
  | { type: 'LOGIN'; user: User }
  | { type: 'LOGOUT' }
  | { type: 'START_SETUP' }
  | { type: 'SET_TEAMS'; teams: [Team, Team] }
  | { type: 'START_GAME'; totalSlots: number }
  | { type: 'SET_QUESTION'; question: Question; slotKey: string }
  | { type: 'ANSWER_QUESTION'; selectedIndex: number }
  | { type: 'CLOSE_QUESTION' }
  | { type: 'RESET_GAME' };

// ── Reducer ──

function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, phase: 'lobby', user: action.user };

    case 'LOGOUT':
      return { ...initialState };

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
      };

    case 'SET_QUESTION':
      return {
        ...state,
        phase: 'question',
        currentQuestion: action.question,
        currentSlotKey: action.slotKey,
      };

    case 'ANSWER_QUESTION': {
      if (!state.currentQuestion || !state.currentSlotKey) return state;

      const correct = action.selectedIndex === state.currentQuestion.correctIndex;
      const points = correct ? state.currentQuestion.points : 0;

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
      };
    }

    case 'CLOSE_QUESTION':
      return { ...state, phase: 'playing', currentQuestion: null, currentSlotKey: null };

    case 'RESET_GAME':
      return { ...initialState, user: state.user, phase: 'lobby' };

    default:
      return state;
  }
}

// ── Context ──

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  categories: ApiCategory[];
  loadCategories: () => Promise<void>;
  selectSlot: (slotKey: string) => Promise<void>;
  loading: boolean;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [categories, setCategories] = React.useState<ApiCategory[]>([]);
  const [loading, setLoading] = React.useState(false);

  // Track seen question IDs per game session to avoid repetition
  const seenIdsRef = useRef<number[]>([]);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, []);

  // Fetch a question from the API, excluding already-seen IDs
  const selectSlot = useCallback(async (slotKey: string) => {
    setLoading(true);
    try {
      const apiQ = await fetchQuestion(slotKey, seenIdsRef.current);
      const question: Question = {
        id: String(apiQ.id),
        category: apiQ.category as any,
        points: apiQ.points as 1 | 2 | 3,
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

  // Reset seen IDs when game resets
  React.useEffect(() => {
    if (state.phase === 'playing' && Object.keys(state.answeredSlots).length === 0) {
      seenIdsRef.current = [];
    }
  }, [state.phase, state.answeredSlots]);

  return (
    <GameContext.Provider value={{ state, dispatch, categories, loadCategories, selectSlot, loading }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
