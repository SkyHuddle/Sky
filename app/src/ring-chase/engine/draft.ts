import type { DraftRound, HistoricalCodTeam, SlotSpin } from '../core/types';
import { DRAFT_ROUNDS, TIER_WEIGHTS, SPIN_DURATION_MS, SPIN_TICK_MS } from '../core/constants';
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

/** Year + team reels spin independently, then land on the final card */
export function buildDualSpin(
  finalTeam: HistoricalCodTeam,
  seed: string,
  roundIndex: number,
  durationMs = SPIN_DURATION_MS,
  tickMs = SPIN_TICK_MS
): SlotSpin {
  const rng = mulberry32(hashString(`${seed}-spin-${roundIndex}`));
  const ticks = Math.floor(durationMs / tickMs);
  const pool = shuffle(getTeamPool(), rng);
  const years = pool.map((t) => t.season);
  const names = pool.map((t) => t.teamName);
  const regions = pool.map((t) => t.region);

  const yearSequence: number[] = [];
  const nameSequence: string[] = [];
  const regionSequence: string[] = [];
  const accentSequence: string[] = [];

  for (let i = 0; i < ticks - 1; i++) {
    const decoy = pool[Math.floor(rng() * pool.length)];
    yearSequence.push(years[Math.floor(rng() * years.length)] ?? decoy.season);
    nameSequence.push(names[Math.floor(rng() * names.length)] ?? decoy.teamName);
    regionSequence.push(regions[Math.floor(rng() * regions.length)] ?? decoy.region);
    accentSequence.push(decoy.accent);
  }

  yearSequence.push(finalTeam.season);
  nameSequence.push(finalTeam.teamName);
  regionSequence.push(finalTeam.region);
  accentSequence.push(finalTeam.accent);

  return { yearSequence, nameSequence, regionSequence, accentSequence };
}

function buildRound(
  roundIndex: number,
  team: HistoricalCodTeam,
  seed: string,
  rng: () => number
): DraftRound {
  const roster = shuffle(resolveTeamRoster(team), rng);
  return {
    roundIndex,
    team,
    roster,
    spin: buildDualSpin(team, seed, roundIndex),
  };
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
    rounds.push(buildRound(i, team, seed, rng));
  }

  return rounds;
}

export function rerollRound(
  seed: string,
  roundIndex: number,
  usedTeamIds: string[],
  filter?: (team: HistoricalCodTeam) => boolean
): DraftRound {
  const rng = mulberry32(hashString(`${seed}-respin-${roundIndex}-${Date.now()}`));
  const used = new Set(usedTeamIds);
  const pool = getTeamPool(filter).filter((t) => !used.has(t.id));
  const team = pool.length > 0 ? weightedPick(pool, rng) : weightedPick(getTeamPool(), rng);
  return buildRound(roundIndex, team, seed, rng);
}

/** Daily mode: mixed dynasties + trap cards */
export function getDailyTeams(dateKey: string): string[] {
  const dynasties = [
    'optic-2017',
    'faze-2021',
    'empire-2020',
    'envy-2016',
    'nysl-2023',
    'lat-2022',
    'optic-tx-2024',
    'col-2014',
    'faze-2023',
    'lg-2016',
  ];
  const trapCards = [
    'legion-2023',
    'guerrillas-2020',
    'paris-2021',
    'miami-2024',
    'cloud9-2017',
    'mutineers-2020',
    'ravens-2021',
    'rokkr-2022',
    'surge-2021',
    'florida-2022',
    'boston-2022',
    'london-2024',
  ];
  const rng = mulberry32(hashString(`daily-teams-${dateKey}`));
  const traps = shuffle(trapCards, rng).slice(0, 2);
  const icons = shuffle(dynasties, rng).slice(0, DRAFT_ROUNDS - traps.length);
  return shuffle([...icons, ...traps], rng);
}

export function generateDailyRounds(
  dateKey: string,
  filter?: (team: HistoricalCodTeam) => boolean
): DraftRound[] {
  const seed = `ring-daily-${dateKey}`;
  const rng = mulberry32(hashString(seed));
  const rounds: DraftRound[] = [];
  const pool = getTeamPool(filter);

  for (let i = 0; i < DRAFT_ROUNDS; i++) {
    const teamIds = getDailyTeams(dateKey);
    const team = pool.find((t) => t.id === teamIds[i]);
    if (!team) continue;
    rounds.push(buildRound(i, team, seed, rng));
  }

  return rounds;
}
