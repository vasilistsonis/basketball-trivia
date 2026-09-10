import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { GameState, SavedGame } from '../types';
import { fetchCategories, fetchQuestion, getCachedCategories } from '../api/client';
import { canSaveGame, createInitialState, gameReducer, pickFiftyFiftyEliminations, type GameAction } from '../game/reducer';
import { createSavedGame, getBrowserStorage, readSavedGame, removeSavedGame, STORAGE_WARNING, validateSavedGame, writeSavedGame } from '../game/storage';

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  loadCategories: () => Promise<void>;
  selectSlot: (slotKey: string) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  savedGame: SavedGame | null;
  resumeGame: () => void;
  discardSavedGame: () => void;
  storageWarning: string | null;
}

const GameContext = createContext<GameContextValue | undefined>(undefined);

function newGameId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID() : `match-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const storageRef = useRef(getBrowserStorage());
  // Saved matches are offered on the home screen, never resumed automatically.
  const [state, setState] = useState(() => createInitialState(getCachedCategories()));
  const [savedGame, setSavedGame] = useState(() => readSavedGame(storageRef.current));
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stateRef = useRef(state);
  const savedGameRef = useRef(savedGame);
  const mountedRef = useRef(true);
  const questionRequestRef = useRef(0);
  const questionPendingRef = useRef(false);
  const categoryRequestRef = useRef<Promise<void> | null>(null);

  const persist = useCallback((nextState: GameState) => {
    const snapshot = createSavedGame(nextState);
    if (!snapshot) return;
    savedGameRef.current = snapshot;
    setSavedGame(snapshot);
    setStorageWarning(writeSavedGame(storageRef.current, snapshot) ? null : STORAGE_WARNING);
  }, []);

  const dispatch = useCallback((incoming: GameAction) => {
    const current = stateRef.current;
    let action = incoming;
    if (action.type === 'START_GAME') action = { ...action, gameId: newGameId() };
    if (action.type === 'USE_FIFTY_FIFTY' && current.currentQuestion && !action.eliminated) {
      action = { ...action, eliminated: pickFiftyFiftyEliminations(current.currentQuestion.correctIndex) };
    }
    if (action.type === 'RESUME_GAME') {
      const checked = validateSavedGame({ version: 1, savedAt: new Date().toISOString(), state: action.state });
      if (!checked) return;
      action = { ...action, state: checked.state };
    }
    const next = gameReducer(current, action);
    if (next === current) return;
    if (['GO_HOME', 'START_SETUP', 'START_GAME', 'RESUME_GAME'].includes(action.type)) {
      // Invalidate in-flight callbacks immediately, before React's next render.
      questionRequestRef.current += 1;
      questionPendingRef.current = false;
      setLoading(false);
      setError(null);
    }
    if (canSaveGame(current) && !canSaveGame(next)) persist(current);
    // Save the reveal and award together before the UI can show the correct
    // answer. Backgrounding, reloading, and duplicate taps cannot award twice.
    if (canSaveGame(next)) persist(next);
    stateRef.current = next;
    setState(next);
  }, [persist]);

  const clearError = useCallback(() => setError(null), []);

  const loadCategories = useCallback((): Promise<void> => {
    if (categoryRequestRef.current) return categoryRequestRef.current;
    // The playable cached/bundled board is already present. Network refreshes
    // must never disable Start Game or block a question from opening.
    const request = (async () => {
      try {
        const categories = await fetchCategories();
        if (mountedRef.current) dispatch({ type: 'SET_CATEGORIES', categories });
      } finally {
        categoryRequestRef.current = null;
      }
    })();
    categoryRequestRef.current = request;
    return request;
  }, [dispatch]);

  const selectSlot = useCallback(async (slotKey: string) => {
    const before = stateRef.current;
    if (questionPendingRef.current || before.phase !== 'playing' || !before.gameId || before.answeredSlots[slotKey]
      || !before.categories.some((category) => category.slots.some((slot) => slot.key === slotKey))) return;
    questionPendingRef.current = true;
    const requestId = ++questionRequestRef.current;
    const gameId = before.gameId;
    setLoading(true);
    setError(null);
    try {
      const entry = await fetchQuestion(slotKey, before.seenQuestionIds.map(Number).filter(Number.isSafeInteger));
      if (!mountedRef.current || requestId !== questionRequestRef.current || stateRef.current.gameId !== gameId) return;
      const { slotKey: _slotKey, ...question } = entry;
      dispatch({ type: 'SET_QUESTION', gameId, slotKey, question: { ...question, id: String(question.id) } });
    } catch {
      if (mountedRef.current && requestId === questionRequestRef.current) {
        setError('That question could not be opened. Tap the slot to try again.');
      }
    } finally {
      if (mountedRef.current && requestId === questionRequestRef.current) {
        questionPendingRef.current = false;
        setLoading(false);
      }
    }
  }, [dispatch]);

  const resumeGame = useCallback(() => {
    const snapshot = savedGameRef.current;
    if (snapshot && stateRef.current.phase === 'home') dispatch({ type: 'RESUME_GAME', state: snapshot.state });
  }, [dispatch]);

  const discardSavedGame = useCallback(() => {
    if (stateRef.current.phase !== 'home') return;
    if (storageRef.current && !removeSavedGame(storageRef.current)) {
      setStorageWarning('Your device could not clear this saved match. Please try again.');
      return;
    }
    savedGameRef.current = null;
    setSavedGame(null);
    setStorageWarning(null);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const saveOnBackground = () => persist(stateRef.current);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') saveOnBackground();
      else void loadCategories();
    };
    const onOnline = () => { void loadCategories(); };
    window.addEventListener('pagehide', saveOnBackground);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mountedRef.current = false;
      questionRequestRef.current += 1;
      questionPendingRef.current = false;
      window.removeEventListener('pagehide', saveOnBackground);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [loadCategories, persist]);

  return (
    <GameContext.Provider value={{ state, dispatch, loadCategories, selectSlot, loading, error, clearError,
      savedGame, resumeGame, discardSavedGame, storageWarning }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
}
