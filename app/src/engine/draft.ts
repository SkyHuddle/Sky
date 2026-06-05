import type { DraftRound, HistoricalTeam, Player, Role } from '@/core/types';
import { ROLE_ORDER } from '@/core/constants';
import { getValidTeams, resolveTeamRoster } from '@/data/teams';

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str: string): number {
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

function teamPassesFilter(
  team: HistoricalTeam,
  role: Role,
  filter?: (p: Player) => boolean,
  usedPlayerIds: string[] = []
): boolean {
  const roster = resolveTeamRoster(team);
  if (!roster) return false;

  const rolePlayer = roster.find((p) => p.id === team.roster[role]);
  if (!rolePlayer || usedPlayerIds.includes(rolePlayer.id)) return false;
  if (filter && !filter(rolePlayer)) return false;

  return true;
}

/** Build all 5 draft rounds up front — same teams for a given seed (daily parity) */
export function generateDraftRounds(
  seed: string,
  filter?: (p: Player) => boolean,
  usedPlayerIds: string[] = []
): DraftRound[] {
  const rng = mulberry32(hashString(seed));
  const available = shuffle(getValidTeams('lol'), rng);
  const rounds: DraftRound[] = [];
  const usedTeamIds = new Set<string>();
  const pickedPlayerIds = new Set(usedPlayerIds);

  for (let i = 0; i < ROLE_ORDER.length; i++) {
    const role = ROLE_ORDER[i];
    let team =
      available.find(
        (t) =>
          !usedTeamIds.has(t.id) &&
          teamPassesFilter(t, role, filter, [...pickedPlayerIds])
      ) ?? null;

    if (!team) {
      team =
        available.find(
          (t) =>
            !usedTeamIds.has(t.id) &&
            teamPassesFilter(t, role, undefined, [...pickedPlayerIds])
        ) ?? null;
    }

    if (!team) {
      team = available.find((t) => !usedTeamIds.has(t.id)) ?? available[i % available.length];
    }

    const roster = resolveTeamRoster(team);
    if (!roster) continue;

    usedTeamIds.add(team.id);
    const rolePlayerId = team.roster[role];
    pickedPlayerIds.add(rolePlayerId);

    rounds.push({ team, roster });
  }

  return rounds;
}

export function createRunSeed(mode: 'free' | 'daily', dateKey?: string): string {
  if (mode === 'daily' && dateKey) {
    return `daily-${dateKey}`;
  }
  return `free-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export { ROLE_ORDER };
