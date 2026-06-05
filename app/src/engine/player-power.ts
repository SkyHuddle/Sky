import type { HistoricalTeam, Player, PlayerRatings } from '@/core/types';
import {
  getTeamYearRatings,
  getTeamYearEntry,
  getCardKda,
  formatKda,
} from '@/data/merge-team-year-ratings';

export { formatKda };

/** Gol.gg KDA for this player on this team-year card. */
export function cardKda(player: Player, team: HistoricalTeam): number | null {
  return getCardKda(team.id, player.id);
}

export function hasGolCardStats(player: Player, team: HistoricalTeam): boolean {
  return getCardKda(team.id, player.id) != null;
}

export function cardRatings(player: Player, team: HistoricalTeam): PlayerRatings {
  return getTeamYearRatings(team.id, player.id) ?? player.ratings;
}

export function cardOverall(player: Player, team: HistoricalTeam): number {
  return cardRatings(player, team).overall;
}

export function golStatSource(
  player: Player,
  team: HistoricalTeam
): 'team-roster' | 'season' | null {
  return getTeamYearEntry(team.id, player.id)?.source ?? null;
}

export function playersForSimulation(
  picks: { player: Player; team: HistoricalTeam }[]
): Player[] {
  return picks.map(({ player, team }) => ({
    ...player,
    ratings: cardRatings(player, team),
  }));
}
