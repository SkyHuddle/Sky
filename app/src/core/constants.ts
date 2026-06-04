import type { Role } from './types';

export const DRAFT_POOL_SIZE = 3;

export const ROLE_ORDER: Role[] = ['top', 'jungle', 'mid', 'adc', 'support'];

/** Stage reveal timing (ms) */
export const STAGE_REVEAL_DELAY = 1400;
export const STAGE_PAUSE = 600;
export const FINAL_REVEAL_DELAY = 800;

/** Simulation difficulty — higher = harder Golden Road */
export const STAGE_THRESHOLDS = {
  spring: 72,
  msi: 78,
  summer: 74,
  worlds: 82,
} as const;

export const WORLDS_FAILURE_LABELS = {
  groups: 'Lost in Worlds Groups',
  quarterfinals: 'Lost Worlds Quarterfinals',
  semifinals: 'Lost Worlds Semifinals',
  finals: 'Lost Worlds Finals',
} as const;
