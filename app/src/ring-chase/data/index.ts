import { resolveRoster } from './players';
import { getValidTeams } from './teams';
import type { CodPlayer, HistoricalCodTeam } from '../core/types';

export { COD_PLAYERS, getPlayerById, getAllPlayers, resolveRoster } from './players';
export { COD_TEAMS, getAllTeams, getTeamById, getValidTeams } from './teams';

export function resolveTeamRoster(team: HistoricalCodTeam): CodPlayer[] {
  return resolveRoster(team.roster);
}

export function getTeamPool(filter?: (team: HistoricalCodTeam) => boolean): HistoricalCodTeam[] {
  return getValidTeams(filter).filter((t) => resolveTeamRoster(t).length >= 4);
}
