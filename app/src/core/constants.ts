import type { Role } from './types';

export const DRAFT_ROUNDS = 5;

export const ROLE_ORDER: Role[] = ['top', 'jungle', 'mid', 'adc', 'support'];

/** Stage reveal timing (ms) */
export const STAGE_REVEAL_DELAY = 1200;
export const STAGE_PAUSE = 400;
/** Per bracket beat inside a tournament stage */
export const RUN_BEAT_DELAY = 380;

/**
 * Minimum team power (0–100 scale) to clear each stage.
 * Your roster power is compared: roll = power ± variance; pass if roll ≥ threshold.
 */
/** Bars use effective card ratings (team-year adjusted), not peak OVR on the badge */
export const STAGE_THRESHOLDS = {
  spring: 76,
  msi: 82,
  summer: 77,
  worlds: 85,
} as const;

export const WORLDS_FAILURE_LABELS = {
  groups: 'Lost in Worlds Groups',
  quarterfinals: 'Lost Worlds Quarterfinals',
  semifinals: 'Lost Worlds Semifinals',
  finals: 'Lost Worlds Finals',
} as const;

/** Slot machine timing */
export const SPIN_DURATION_MS = 2600;
export const SPIN_TICK_MS = 75;
