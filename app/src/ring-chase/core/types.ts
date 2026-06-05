/** Ring Chase — Call of Duty esports roster game */

export type CodRole = 'mainAR' | 'flex' | 'smg';

/** Lineup slot on a historical team card (four-man roster) */
export type RosterSlot = 'mainAR' | 'flex' | 'smg' | 'smg2';

export type StageId = 'major1' | 'major2' | 'major3' | 'major4' | 'champs';

export const STAGES: StageId[] = ['major1', 'major2', 'major3', 'major4', 'champs'];

export const STAGE_LABELS: Record<StageId, string> = {
  major1: 'Major I',
  major2: 'Major II',
  major3: 'Major III',
  major4: 'Major IV',
  champs: 'Champs',
};

/** Draft round mirrors the undefeated run — one pick per leg of the chase */
export const DRAFT_ROUND_LABELS: Record<number, string> = {
  0: 'Major I',
  1: 'Major II',
  2: 'Major III',
  3: 'Major IV',
};

export interface TournamentRunStep {
  label: string;
  passed: boolean;
}

export type MajorOutcome =
  | 'won'
  | 'runner_up'
  | 'top3'
  | 'top4'
  | 'top6'
  | 'top8'
  | 'eliminated';

export type ChampsOutcome =
  | 'champion'
  | 'grand_final'
  | 'top3'
  | 'top4'
  | 'top6'
  | 'top8'
  | 'missed';

export type StageOutcomeLabel = MajorOutcome | ChampsOutcome;

export const MAJOR_OUTCOME_LABELS: Record<MajorOutcome, string> = {
  won: 'Won',
  runner_up: 'Runner-Up',
  top3: 'Top 3',
  top4: 'Top 4',
  top6: 'Top 6',
  top8: 'Top 8',
  eliminated: 'Eliminated',
};

export const CHAMPS_OUTCOME_LABELS: Record<ChampsOutcome, string> = {
  champion: 'Champion',
  grand_final: 'Lost Grand Final',
  top3: 'Top 3',
  top4: 'Top 4',
  top6: 'Top 6',
  top8: 'Top 8',
  missed: 'Missed Champs',
};

export type GamePhase = 'home' | 'draft' | 'ready' | 'simulation' | 'result';
export type GameMode = 'free' | 'daily';
export type DraftSubphase = 'spin' | 'pick';

export interface SlotSpin {
  yearSequence: number[];
  nameSequence: string[];
  regionSequence: string[];
  /** Team accent per tick — decoys while spinning, final team on last frame */
  accentSequence: string[];
}

export interface PlayerRatings {
  overall: number;
  slaying: number;
  objective: number;
  snd: number;
  respawn: number;
  clutch: number;
  lan: number;
  consistency: number;
  leadership: number;
  pace: number;
  roleFit: number;
  championshipFactor: number;
  peakForm: number;
}

export interface CodPlayer {
  id: string;
  gamertag: string;
  realName?: string;
  primaryRole: CodRole;
  secondaryRole: CodRole;
  country: string;
  organization: string;
  rings: number;
  majorWins: number;
  mvpAwards: number;
  notableAchievement: string;
  badge?: string;
  ratings: PlayerRatings;
  accent: string;
}

export type TeamTier = 'legendary' | 'elite' | 'strong' | 'solid' | 'underdog';

export interface HistoricalCodTeam {
  id: string;
  teamName: string;
  season: number;
  gameTitle: string;
  eventContext: string;
  region: string;
  roster: Record<RosterSlot, string>;
  teamRating: number;
  placement: string;
  majorWins: number;
  champsPlacement: string;
  isChampsWinner: boolean;
  isIconicRoster: boolean;
  era: 'pre-cdl' | 'cdl';
  accent: string;
  tier: TeamTier;
}

export interface DraftRound {
  roundIndex: number;
  team: HistoricalCodTeam;
  roster: CodPlayer[];
  spin: SlotSpin;
}

export interface DraftPick {
  roundIndex: number;
  /** Slot on your Ring Chase roster */
  role: RosterSlot;
  /** Slot they played on the rolled team card */
  naturalRole: RosterSlot;
  player: CodPlayer;
  team: HistoricalCodTeam;
}

export interface StageOutcome {
  stage: StageId;
  outcome: StageOutcomeLabel;
  passed: boolean;
  passChance: number;
  power: number;
  /** Bracket beats revealed during simulation */
  run: TournamentRunStep[];
}

export interface ChemistryReport {
  score: number;
  modifiers: string[];
  issues: string[];
}

export interface SeasonSummary {
  record: string;
  regularSeasonWins: number;
  regularSeasonLosses: number;
  bracketWins: number;
  bracketLosses: number;
  majorWins: number;
  majorsLine: string;
  champsLine: string;
  ringLine: string;
  headline: string;
  tagline: string;
  narrative: string;
}

export interface SimulationResult {
  stages: StageOutcome[];
  ringWon: boolean;
  perfectSeason: boolean;
  majorWins: number;
  champsOutcome: ChampsOutcome;
  failureStage: StageId | null;
  failureMessage: string;
  rosterScore: number;
  ringOdds: number;
  chemistry: ChemistryReport;
  mvp: CodPlayer;
  weakLink: CodPlayer | null;
  seasonSummary: SeasonSummary;
  historicalComparison: HistoricalComparison;
  explanation: string;
  footer: string;
}

export interface DailyConstraint {
  id: string;
  title: string;
  description: string;
  filter?: (ctx: DailyFilterContext) => boolean;
  pickFilter?: (player: CodPlayer, picks: DraftPick[]) => boolean;
}

export interface DailyFilterContext {
  team: HistoricalCodTeam;
  roster: CodPlayer[];
}

export interface PlayerStats {
  ringsWon: number;
  perfectSeasons: number;
  winStreak: number;
  bestRosterScore: number;
  attempts: number;
  dailyCompletions: number;
}

export interface DailyRunResult {
  date: string;
  score: number;
  ringWon: boolean;
  perfectSeason: boolean;
  majorWins: number;
  record: string;
  headline: string;
  percentile: number | null;
}

export interface HistoricalComparison {
  yourHeadline: string;
  facts: {
    teamLabel: string;
    playerTag: string;
    placement: string;
    majors: number;
    champs: string;
    ringThatYear: boolean;
  }[];
  anchorLine: string;
  contrastLine: string;
}

export const ROLE_LABELS: Record<CodRole, string> = {
  mainAR: 'MAIN AR',
  flex: 'FLEX',
  smg: 'SMG',
};

export const SLOT_LABELS: Record<RosterSlot, string> = {
  mainAR: 'MAIN AR',
  flex: 'FLEX',
  smg: 'SMG',
  smg2: 'SMG 2',
};
