import type { RosterSlot, StageId } from './types';

export const DRAFT_ROUNDS = 4;

export const SLOT_ORDER: RosterSlot[] = ['mainAR', 'flex', 'smg', 'smg2'];

/** Stage reveal timing (ms) */
export const STAGE_REVEAL_DELAY = 1100;
export const STAGE_PAUSE = 350;

/** Slot machine timing */
export const SPIN_DURATION_MS = 2600;
export const SPIN_TICK_MS = 75;

/** Logistic midpoints for per-stage pass probability */
export const STAGE_PASS_MIDPOINTS: Record<StageId, number> = {
  major1: 74,
  major2: 76,
  major3: 75,
  major4: 77,
  champs: 79,
};

export const STAGE_PASS_STEEPNESS: Record<StageId, number> = {
  major1: 0.11,
  major2: 0.12,
  major3: 0.11,
  major4: 0.13,
  champs: 0.14,
};

export const STAGE_PASS_MIN = 0.08;
export const STAGE_PASS_MAX = 0.9;
export const MIN_RING_CHANCE = 0.005;

export const STAGE_FAILURE_LABELS: Record<StageId, string> = {
  major1: 'Major I',
  major2: 'Major II',
  major3: 'Major III',
  major4: 'Major IV',
  champs: 'Champs',
};

/** Tier weights for random team selection */
export const TIER_WEIGHTS: Record<string, number> = {
  legendary: 28,
  elite: 24,
  strong: 22,
  solid: 16,
  underdog: 10,
};
