import type { Role } from './types';

export const DRAFT_ROUNDS = 5;

export const ROLE_ORDER: Role[] = ['top', 'jungle', 'mid', 'adc', 'support'];

/** Stage reveal timing (ms) */
export const STAGE_REVEAL_DELAY = 1200;
export const STAGE_PAUSE = 400;
/** Per bracket beat inside a tournament stage */
export const RUN_BEAT_DELAY = 380;

/**
 * Logistic curve midpoints for per-stage pass probability (higher power → higher %).
 * Each stage is an independent roll — no hard OVR floor required to advance.
 */
export const STAGE_PASS_MIDPOINTS = {
  spring: 75,
  msi: 77,
  summer: 75,
  worlds: 78,
} as const;

/** How quickly pass % rises as roster stage power exceeds the midpoint */
export const STAGE_PASS_STEEPNESS = {
  spring: 0.12,
  msi: 0.14,
  summer: 0.12,
  worlds: 0.15,
} as const;

/** Every roster keeps a real shot at each stage (upsets happen) */
export const STAGE_PASS_MIN = 0.1;

/** Even elite rosters can stumble */
export const STAGE_PASS_MAX = 0.92;

/** Floor shown/calculated for full-roster Golden Road odds */
export const MIN_GOLDEN_ROAD_CHANCE = 0.01;

export const WORLDS_FAILURE_LABELS = {
  groups: 'Lost in Worlds Groups',
  quarterfinals: 'Lost Worlds Quarterfinals',
  semifinals: 'Lost Worlds Semifinals',
  finals: 'Lost Worlds Finals',
} as const;

/** Slot machine timing */
export const SPIN_DURATION_MS = 2600;
export const SPIN_TICK_MS = 75;
