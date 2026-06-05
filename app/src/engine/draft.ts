import type {
  DraftRound,
  DraftTournamentPhase,
  HistoricalTeam,
  Player,
  SlotSpin,
  TeamTier,
} from '@/core/types';
import { DRAFT_PHASE_ORDER } from '@/core/types';
import { SPIN_TICK_MS } from '@/core/constants';
import { getPlayerById } from '@/data';
import { getValidTeams, resolveTeamRoster } from '@/data/teams';

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function shuffle<T>(arr: T[], rng: () => number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const PHASE_TIER_WEIGHTS: Record<
  DraftTournamentPhase,
  Record<TeamTier, number>
> = {
  spring: { weak: 38, average: 32, contender: 24, legend: 6 },
  msi: { weak: 22, average: 34, contender: 32, legend: 12 },
  summer: { weak: 35, average: 33, contender: 26, legend: 6 },
  worlds_groups: { weak: 14, average: 30, contender: 36, legend: 20 },
  worlds_playoffs: { weak: 8, average: 22, contender: 40, legend: 30 },
};

function pickWeightedTier(
  phase: DraftTournamentPhase,
  rng: () => number
): TeamTier {
  const weights = PHASE_TIER_WEIGHTS[phase];
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (const tier of ['weak', 'average', 'contender', 'legend'] as TeamTier[]) {
    roll -= weights[tier];
    if (roll <= 0) return tier;
  }
  return 'average';
}

function poolForPhase(
  phase: DraftTournamentPhase,
  usedTeamIds: Set<string>,
  filter?: (p: Player) => boolean
): HistoricalTeam[] {
  return getValidTeams('lol').filter((t) => {
    if (usedTeamIds.has(t.id)) return false;
    if (!t.phases.includes(phase)) return false;
    if (!filter) return true;
    return Object.values(t.roster).some((id) => {
      const pl = getPlayerById(id);
      return pl && filter(pl);
    });
  });
}

function rollTeamForPhase(
  phase: DraftTournamentPhase,
  rng: () => number,
  usedTeamIds: Set<string>,
  filter?: (p: Player) => boolean
): HistoricalTeam {
  const pool = poolForPhase(phase, usedTeamIds, filter);
  const targetTier = pickWeightedTier(phase, rng);
  const tierPool = pool.filter((t) => t.tier === targetTier);
  const pickFrom = tierPool.length > 0 ? tierPool : pool;
  if (pickFrom.length === 0) {
    const fallback = getValidTeams('lol').filter((t) => !usedTeamIds.has(t.id));
    return fallback[Math.floor(rng() * fallback.length)];
  }
  return pickFrom[Math.floor(rng() * pickFrom.length)];
}

/** Year reel and team-name reel spin independently, then land on the same card */
export function buildDualSpin(
  finalTeam: HistoricalTeam,
  phase: DraftTournamentPhase,
  seed: string,
  roundIndex: number,
  durationMs = 2600,
  tickMs = SPIN_TICK_MS
): SlotSpin {
  const rng = mulberry32(hashString(`${seed}-spin-${roundIndex}`));
  const ticks = Math.floor(durationMs / tickMs);
  const pool = shuffle(
    getValidTeams('lol').filter((t) => t.phases.includes(phase)),
    rng
  );
  const years = pool.map((t) => t.year);
  const names = pool.map((t) => t.name);
  const regions = pool.map((t) => t.region);

  const yearSequence: number[] = [];
  const nameSequence: string[] = [];
  const regionSequence: string[] = [];

  for (let i = 0; i < ticks - 1; i++) {
    const decoy = pool[Math.floor(rng() * pool.length)];
    yearSequence.push(years[Math.floor(rng() * years.length)] ?? decoy.year);
    nameSequence.push(names[Math.floor(rng() * names.length)] ?? decoy.name);
    regionSequence.push(regions[Math.floor(rng() * regions.length)] ?? decoy.region);
  }

  yearSequence.push(finalTeam.year);
  nameSequence.push(finalTeam.name);
  regionSequence.push(finalTeam.region);

  return { yearSequence, nameSequence, regionSequence };
}

export function generateDraftRounds(
  seed: string,
  filter?: (p: Player) => boolean
): DraftRound[] {
  const rng = mulberry32(hashString(seed));
  const usedTeamIds = new Set<string>();
  const rounds: DraftRound[] = [];

  for (let i = 0; i < DRAFT_PHASE_ORDER.length; i++) {
    const phase = DRAFT_PHASE_ORDER[i];
    const team = rollTeamForPhase(phase, rng, usedTeamIds, filter);
    usedTeamIds.add(team.id);
    const roster = resolveTeamRoster(team) ?? [];
    const spin = buildDualSpin(team, phase, seed, i);

    rounds.push({
      roundIndex: i,
      phase,
      team,
      roster,
      spin,
    });
  }

  return rounds;
}

export function rerollRound(
  seed: string,
  roundIndex: number,
  usedTeamIds: string[],
  filter?: (p: Player) => boolean
): DraftRound {
  const phase = DRAFT_PHASE_ORDER[roundIndex];
  const rng = mulberry32(hashString(`${seed}-skip-${roundIndex}-${Date.now()}`));
  const used = new Set(usedTeamIds);
  const team = rollTeamForPhase(phase, rng, used, filter);
  const roster = resolveTeamRoster(team) ?? [];
  const spin = buildDualSpin(team, phase, seed, roundIndex);
  return {
    roundIndex,
    phase,
    team,
    roster,
    spin,
  };
}

export function createRunSeed(mode: 'free' | 'daily', dateKey?: string): string {
  if (mode === 'daily' && dateKey) {
    return `daily-${dateKey}`;
  }
  return `free-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export { DRAFT_PHASE_ORDER };
