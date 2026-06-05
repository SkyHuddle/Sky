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

/** Five draft rounds mirror the Golden Road tournament path */
export type DraftTournamentPhase =
  | 'spring'
  | 'msi'
  | 'summer'
  | 'worlds_groups'
  | 'worlds_playoffs';

export const DRAFT_PHASE_ORDER: DraftTournamentPhase[] = [
  'spring',
  'msi',
  'summer',
  'worlds_groups',
  'worlds_playoffs',
];

export const DRAFT_PHASE_LABELS: Record<DraftTournamentPhase, string> = {
  spring: 'Spring Split',
  msi: 'MSI',
  summer: 'Summer Split',
  worlds_groups: 'Worlds — Groups',
  worlds_playoffs: 'Worlds — Knockout',
};

export type TeamTier = 'legend' | 'contender' | 'average' | 'weak';

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
  tier: TeamTier;
  /** Which draft rounds can roll this team */
  phases: DraftTournamentPhase[];
  roster: Record<Role, string>;
}

/** Dual-reel slot spin — year and team name roll independently, land together */
export interface SlotSpin {
  yearSequence: number[];
  nameSequence: string[];
  regionSequence: string[];
}

export interface DraftRound {
  roundIndex: number;
  phase: DraftTournamentPhase;
  team: HistoricalTeam;
  roster: Player[];
  spin: SlotSpin;
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

/** One beat inside a tournament (e.g. "MSI Groups", "Worlds Semifinal") */
export interface TournamentRunStep {
  label: string;
  passed: boolean;
}

export interface StageOutcome {
  stage: StageId;
  passed: boolean;
  detail?: WorldsFailureDetail;
  roll: number;
  threshold: number;
  /** Bracket progression shown during simulation */
  run: TournamentRunStep[];
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

export type DraftSubphase = 'spin' | 'pick';

export interface DraftPick {
  /** Slot on your Golden Road roster */
  role: Role;
  /** Role they played on the rolled team card */
  naturalRole: Role;
  player: Player;
  team: HistoricalTeam;
  phase: DraftTournamentPhase;
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
  skipsUsed: number;
}

export interface DailyRunResult {
  date: string;
  score: number;
  goldenRoad: boolean;
  percentile: number | null;
}
