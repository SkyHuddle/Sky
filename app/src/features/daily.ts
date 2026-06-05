import type { DailyConstraint, Player } from '@/core/types';

export const DAILY_CONSTRAINTS: DailyConstraint[] = [
  {
    id: 'korean-only',
    title: 'Korean Legends',
    description: 'Only LCK region players',
    filter: (p) => p.region === 'LCK',
  },
  {
    id: 'no-world-champs',
    title: 'Unproven',
    description: 'No World Champions allowed',
    filter: (p) => p.worldTitles === 0,
  },
  {
    id: 'one-per-org',
    title: 'Rival Alliances',
    description: 'One player per organization (enforced on draft)',
    filter: () => true,
  },
  {
    id: '2018-plus',
    title: 'Modern Era',
    description: 'Players who debuted 2018 or later',
    filter: (p) => p.debutYear >= 2018,
  },
  {
    id: 'lpl-only',
    title: 'LPL Superteam',
    description: 'Only LPL region players',
    filter: (p) => p.region === 'LPL',
  },
  {
    id: 'international',
    title: 'World Stage',
    description: 'Must have MSI or Worlds title experience',
    filter: (p) => p.worldTitles > 0 || p.msiTitles > 0,
  },
  {
    id: 'veterans',
    title: 'Veteran Core',
    description: 'Debuted before 2018',
    filter: (p) => p.debutYear < 2018,
  },
];

export function getDailyConstraint(date: Date = new Date()): DailyConstraint {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return DAILY_CONSTRAINTS[dayOfYear % DAILY_CONSTRAINTS.length];
}

export function getDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

/** Deterministic percentile from score (daily leaderboard mock until backend) */
export function estimatePercentile(score: number, goldenRoad: boolean): number {
  if (goldenRoad) return Math.min(99, Math.round((88 + score / 12) * 10) / 10);
  const base = Math.max(8, Math.min(88, score - 12 + (score % 7)));
  return Math.round(base * 10) / 10;
}

export function orgConstraintViolated(
  picks: Player[],
  candidate: Player
): boolean {
  return picks.some((p) => p.organization === candidate.organization);
}

export function isOnePerOrgDay(constraintId: string): boolean {
  return constraintId === 'one-per-org';
}
