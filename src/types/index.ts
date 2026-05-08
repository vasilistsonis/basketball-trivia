// ── Game types ──

export interface User {
  username: string;
}

export interface Team {
  name: string;
  color: string;
  score: number;
}

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
  slots: DifficultySlot[];
}

export interface DifficultySlot {
  points: 1 | 2 | 3;
  /** Unique key within category, e.g. "geography-1" */
  key: string;
}

export interface Question {
  id: string;
  category: CategoryId;
  points: 1 | 2 | 3;
  question: string;
  /** For logo / missing player questions extra media hints */
  imageUrl?: string;
  options: string[];
  correctIndex: number;
}

export type GamePhase =
  | 'login'
  | 'lobby'
  | 'team-setup'
  | 'playing'
  | 'question'
  | 'game-over';

export interface AnsweredSlot {
  slotKey: string;
  answeredByTeam: number; // 0 or 1
  correct: boolean;
}

export interface GameState {
  phase: GamePhase;
  user: User | null;
  teams: [Team, Team];
  currentTeamIndex: 0 | 1;
  answeredSlots: Record<string, AnsweredSlot>;
  currentQuestion: Question | null;
  currentSlotKey: string | null;
  totalSlots: number;
}
