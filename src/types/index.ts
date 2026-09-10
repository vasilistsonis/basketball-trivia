// ── Game types ──

export type CategoryId =
  | 'geography'
  | 'history'
  | 'logo'
  | 'guess-whos-missing'
  | 'guess-the-player';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  description: string;
  icon: string;
  color: string;
  questionCount: number;
}

export interface ApiCategorySlot {
  points: number;
  key: string;
  questionCount: number;
}

export type GameCategory = CategoryMeta & { slots: ApiCategorySlot[] };

export interface Question {
  id: string;
  category: CategoryId;
  points: number;
  question: string;
  imageUrl?: string;
  options: string[];
  correctIndex: number;
}

export interface Team {
  name: string;
  color: string;
  score: number;
}

export type GamePhase =
  | 'home'
  | 'team-setup'
  | 'playing'
  | 'question'
  | 'game-over';

export interface AnsweredSlot {
  slotKey: string;
  answeredByTeam: 0 | 1;
  correct: boolean;
  questionId: string;
  selectedIndex: number;
  correctIndex: number;
  pointsAwarded: number;
  powerUp: 'double' | 'fifty-fifty' | null;
}

/** Per-team one-time-use power-ups (one of each per game) */
export interface PowerUps {
  usedDouble: boolean;
  usedFiftyFifty: boolean;
}

export interface GameState {
  phase: GamePhase;
  categories: GameCategory[];
  /** Identifies this match so a late request cannot open a question in a new match. */
  gameId: string | null;
  teams: [Team, Team];
  currentTeamIndex: 0 | 1;
  answeredSlots: Record<string, AnsweredSlot>;
  currentQuestion: Question | null;
  currentSlotKey: string | null;
  totalSlots: number;
  /** Power-up usage tracking per team */
  powerUps: [PowerUps, PowerUps];
  /** Whether the 2× multiplier is active for the current question */
  activeDouble: boolean;
  /** Indices of options eliminated by 50/50 for the current question */
  fiftyFiftyEliminated: number[];
  /** Selection and reveal are saved with the match, before rendering the answer. */
  selectedAnswerIndex: number | null;
  answerRevealed: boolean;
  seenQuestionIds: string[];
}

/** Negative IDs belong to the bundled bank; positive IDs come from Supabase. */
export interface QuestionBankEntry extends Omit<Question, 'id'> {
  id: number;
  slotKey: string;
}

export interface SavedGame {
  version: 1;
  savedAt: string;
  state: GameState;
}
