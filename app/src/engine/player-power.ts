import type { HistoricalTeam, Player, PlayerRatings } from '@/core/types';
import { getTeamYearRatings } from '@/data/merge-team-year-ratings';

/**
 * Card OVR prefers Gol.gg stats for that player on that team-year roster.
 * Falls back to career Gol / curated ratings when the ETL has no slice.
 */

export function careerRatings(player: Player): PlayerRatings {
  return player.ratings;
}

export function careerOverall(player: Player): number {
  return player.ratings.overall;
}

export function cardRatings(player: Player, team: HistoricalTeam): PlayerRatings {
  return getTeamYearRatings(team.id, player.id) ?? careerRatings(player);
}

export function cardOverall(player: Player, team: HistoricalTeam): number {
  return cardRatings(player, team).overall;
}

export function isTeamYearRated(player: Player, team: HistoricalTeam): boolean {
  return getTeamYearRatings(team.id, player.id) != null;
}

export function playersForSimulation(
  picks: { player: Player; team: HistoricalTeam }[]
): Player[] {
  return picks.map(({ player, team }) => ({
    ...player,
    ratings: cardRatings(player, team),
  }));
}
