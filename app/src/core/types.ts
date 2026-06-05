/** Extensible esport identifier for multi-title support later */
export type EsportId = 'lol' | 'valorant' | 'cs2' | 'dota2';

export type Role = 'top' | 'jungle' | 'mid' | 'adc' | 'support';

export const ROLES: Role[] = ['top', 'jungle', 'mid', 'adc', 'support'];

export const ROLE_LABELS: Record<Role, string> = {
  top: 'TOP',
  jungle: 'JUNGLE',
  mid: 'MID',
  adc: 'ADC',
  support: 'SUPPORT',
};

export interface PlayerRatings {
  overall: number;
  peak: number;
  international: number;
  clutch: number;
  consistency: number;
  leadership: number;
  synergy: number;
}

export interface Player {
  id: string;
  esport: EsportId;
  name: string;
  role: Role;
  region: string;
  organization: string;
  peakTeam: string;
  peakYear: number;
  achievements: string;
  worldTitles: number;
  msiTitles: number;
  domesticTitles: number;
  debutYear: number;
  ratings: PlayerRatings;
  /** Accent color for avatar (hex) */
  accent: string;
}

/** Historical lineup — one card per draft round (82-0 style) */
export interface HistoricalTeam {
  id: string;
  esport: EsportId;
  name: string;
  year: number;
  region: string;
  tagline: string;
  accent: string;
  roster: Record<Role, string>;
}

export interface DraftRound {
  team: HistoricalTeam;
  /** Full starting five, ordered by role */
  roster: Player[];
}

export type StageId = 'spring' | 'msi' | 'summer' | 'worlds';

export const STAGES: StageId[] = ['spring', 'msi', 'summer', 'worlds'];

export const STAGE_LABELS: Record<StageId, string> = {
  spring: 'Spring Split',
  msi: 'MSI',
  summer: 'Summer Split',
  worlds: 'Worlds',
};

export type WorldsFailureDetail =
  | 'groups'
  | 'quarterfinals'
  | 'semifinals'
  | 'finals';

export interface StageOutcome {
  stage: StageId;
  passed: boolean;
  detail?: WorldsFailureDetail;
  roll: number;
  threshold: number;
}

export interface SimulationResult {
  stages: StageOutcome[];
  goldenRoad: boolean;
  failureStage: StageId | null;
  failureMessage: string;
  rosterScore: number;
  titleCounts: { domestic: number; msi: number; worlds: number };
}

export type GameMode = 'free' | 'daily';

export type GamePhase = 'home' | 'draft' | 'ready' | 'simulation' | 'result';

export interface DraftPick {
  role: Role;
  player: Player;
  team: HistoricalTeam;
}

export interface DailyConstraint {
  id: string;
  title: string;
  description: string;
  filter: (player: Player) => boolean;
}

export interface PlayerStats {
  goldenRoads: number;
  attempts: number;
  winStreak: number;
  bestRosterScore: number;
  dailyCompletions: number;
  lastPlayedDate: string | null;
}

export interface DailyRunResult {
  date: string;
  score: number;
  goldenRoad: boolean;
  percentile: number | null;
}
