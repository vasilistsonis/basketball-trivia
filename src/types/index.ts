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
  answeredByTeam: number; // 0 or 1
  correct: boolean;
}

/** Per-team one-time-use power-ups (one of each per game) */
export interface PowerUps {
  usedDouble: boolean;
  usedFiftyFifty: boolean;
}

export interface GameState {
  phase: GamePhase;
  categories: (CategoryMeta & { slots: ApiCategorySlot[] })[];
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
}
