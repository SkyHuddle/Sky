import type { DraftRound, HistoricalCodTeam } from '../core/types';
import { DRAFT_ROUNDS, TIER_WEIGHTS } from '../core/constants';
import { getTeamPool, resolveTeamRoster } from '../data';
import { hashString, mulberry32 } from './rng';

export function createRunSeed(mode: 'free' | 'daily', dateKey?: string): string {
  if (mode === 'daily' && dateKey) return `ring-daily-${dateKey}`;
  return `ring-free-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function weightedPick(teams: HistoricalCodTeam[], rng: () => number): HistoricalCodTeam {
  const weights = teams.map((t) => TIER_WEIGHTS[t.tier] ?? 10);
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < teams.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return teams[i];
  }
  return teams[teams.length - 1];
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateDraftRounds(
  seed: string,
  filter?: (team: HistoricalCodTeam) => boolean
): DraftRound[] {
  const rng = mulberry32(hashString(seed));
  const pool = getTeamPool(filter);
  const rounds: DraftRound[] = [];
  const usedTeamIds = new Set<string>();

  for (let i = 0; i < DRAFT_ROUNDS; i++) {
    const available = pool.filter((t) => !usedTeamIds.has(t.id));
    if (available.length === 0) break;

    const team = weightedPick(available, rng);
    usedTeamIds.add(team.id);
    const roster = shuffle(resolveTeamRoster(team), rng).slice(0, Math.min(5, team.roster.length));

    rounds.push({ roundIndex: i, team, roster });
  }

  return rounds;
}

/** Daily mode: fixed iconic teams for deterministic global challenge */
export function getDailyTeams(dateKey: string): string[] {
  const iconic = [
    'optic-2017',
    'faze-2021',
    'empire-2020',
    'nysl-2023',
    'lat-2022',
    'optic-tx-2024',
    'col-2014',
    'envy-2016',
    'eunited-2019',
    'faze-2023',
  ];
  const rng = mulberry32(hashString(`daily-teams-${dateKey}`));
  return shuffle(iconic, rng).slice(0, DRAFT_ROUNDS);
}

export function generateDailyRounds(
  dateKey: string,
  filter?: (team: HistoricalCodTeam) => boolean
): DraftRound[] {
  const teamIds = getDailyTeams(dateKey);
  const rng = mulberry32(hashString(`ring-daily-${dateKey}`));
  const rounds: DraftRound[] = [];

  for (let i = 0; i < teamIds.length; i++) {
    const pool = getTeamPool(filter);
    const team = pool.find((t) => t.id === teamIds[i]);
    if (!team) continue;
    const roster = shuffle(resolveTeamRoster(team), rng);
    rounds.push({ roundIndex: i, team, roster });
  }

  return rounds;
}
