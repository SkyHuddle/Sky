import { resolveRoster } from './players';
import { rosterPlayerIds } from './roster-slots';
import { getValidTeams } from './teams';
import type { CodPlayer, HistoricalCodTeam, RosterSlot } from '../core/types';

export { COD_PLAYERS, getPlayerById, getAllPlayers, resolveRoster } from './players';
export { COD_TEAMS, getAllTeams, getTeamById, getValidTeams } from './teams';
export { assignRosterSlots, rosterPlayerIds } from './roster-slots';

export function resolveTeamRoster(team: HistoricalCodTeam): CodPlayer[] {
  return resolveRoster(rosterPlayerIds(team.roster));
}

export function getTeamRosterPlayer(
  team: HistoricalCodTeam,
  slot: RosterSlot
): CodPlayer | undefined {
  const id = team.roster[slot];
  return resolveRoster([id])[0];
}

export function getTeamPool(filter?: (team: HistoricalCodTeam) => boolean): HistoricalCodTeam[] {
  return getValidTeams(filter).filter((t) => resolveTeamRoster(t).length >= 4);
}
