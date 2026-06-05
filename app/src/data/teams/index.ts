import type { EsportId, HistoricalTeam, Player, Role } from '@/core/types';
import { ROLES } from '@/core/types';
import { LOL_TEAMS_RAW } from './lol';
import { LOL_WEAK_TEAMS } from './lol-weak';
import { withTeamMeta } from './meta';
import { getPlayerById } from '@/data';

const LOL_TEAMS: HistoricalTeam[] = [
  ...LOL_TEAMS_RAW.map(withTeamMeta),
  ...LOL_WEAK_TEAMS,
];

const REGISTRY: Record<EsportId, HistoricalTeam[]> = {
  lol: LOL_TEAMS,
  valorant: [],
  cs2: [],
  dota2: [],
};

export function getTeams(esport: EsportId = 'lol'): HistoricalTeam[] {
  return REGISTRY[esport];
}

export function resolveTeamRoster(team: HistoricalTeam): Player[] | null {
  const roster: Player[] = [];
  for (const role of ROLES) {
    const player = getPlayerById(team.roster[role]);
    if (!player) return null;
    roster.push(player);
  }
  return roster;
}

export function getValidTeams(esport: EsportId = 'lol'): HistoricalTeam[] {
  return getTeams(esport).filter((t) => resolveTeamRoster(t) !== null);
}

export function getTeamById(id: string, esport: EsportId = 'lol'): HistoricalTeam | undefined {
  return getTeams(esport).find((t) => t.id === id);
}

/** Player on this team card for the given role slot */
export function getTeamRolePlayer(team: HistoricalTeam, role: Role): Player | undefined {
  return getPlayerById(team.roster[role]);
}
