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
 * Roll = stage power ± variance; pass if roll ≥ threshold (+ small jitter).
 */
export const STAGE_THRESHOLDS = {
  spring: 73,
  msi: 76,
  summer: 74,
  worlds: 80,
} as const;

/** Max random jitter added to each stage threshold */
export const STAGE_THRESHOLD_JITTER = 3;

export const WORLDS_FAILURE_LABELS = {
  groups: 'Lost in Worlds Groups',
  quarterfinals: 'Lost Worlds Quarterfinals',
  semifinals: 'Lost Worlds Semifinals',
  finals: 'Lost Worlds Finals',
} as const;

/** Slot machine timing */
export const SPIN_DURATION_MS = 2600;
export const SPIN_TICK_MS = 75;
