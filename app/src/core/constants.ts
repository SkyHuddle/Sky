import type { Role } from './types';

export const DRAFT_ROUNDS = 5;

export const ROLE_ORDER: Role[] = ['top', 'jungle', 'mid', 'adc', 'support'];

/** Stage reveal timing (ms) */
export const STAGE_REVEAL_DELAY = 1400;
export const STAGE_PAUSE = 600;

/** Simulation difficulty — raised for harder Golden Road */
export const STAGE_THRESHOLDS = {
  spring: 78,
  msi: 84,
  summer: 80,
  worlds: 88,
} as const;

/** Off-role assignment penalty applied in simulation */
export const OFF_ROLE_PENALTY = 4.5;

export const WORLDS_FAILURE_LABELS = {
  groups: 'Lost in Worlds Groups',
  quarterfinals: 'Lost Worlds Quarterfinals',
  semifinals: 'Lost Worlds Semifinals',
  finals: 'Lost Worlds Finals',
} as const;

/** Slot machine timing */
export const SPIN_DURATION_MS = 2400;
export const SPIN_TICK_MS = 70;
