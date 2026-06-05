import type { RosterSlot, StageId } from './types';

export const DRAFT_ROUNDS = 4;

export const SLOT_ORDER: RosterSlot[] = ['mainAR', 'flex', 'smg', 'smg2'];

/** Stage reveal timing (ms) */
export const STAGE_PAUSE = 350;
export const RUN_BEAT_DELAY = 380;

/** Slot machine timing */
export const SPIN_DURATION_MS = 2600;
export const SPIN_TICK_MS = 75;

/** Logistic midpoints for per-stage pass probability */
export const STAGE_PASS_MIDPOINTS: Record<StageId, number> = {
  major1: 79,
  major2: 81,
  major3: 80,
  major4: 82,
  champs: 84,
};

export const STAGE_PASS_STEEPNESS: Record<StageId, number> = {
  major1: 0.13,
  major2: 0.14,
  major3: 0.13,
  major4: 0.14,
  champs: 0.15,
};

export const STAGE_PASS_MIN = 0.06;
export const STAGE_PASS_MAX = 0.82;
export const MIN_RING_CHANCE = 0.005;

export const STAGE_FAILURE_LABELS: Record<StageId, string> = {
  major1: 'Major I',
  major2: 'Major II',
  major3: 'Major III',
  major4: 'Major IV',
  champs: 'Champs',
};

/** Tier weights for random team selection — dynasties and trap cards spin at equal rates per tier. */
export const TIER_WEIGHTS: Record<string, number> = {
  legendary: 22,
  elite: 22,
  strong: 22,
  solid: 22,
  underdog: 22,
};
