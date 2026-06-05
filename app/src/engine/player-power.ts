import type { HistoricalTeam, Player, PlayerRatings } from '@/core/types';

/**
 * Team + year on a draft card are flavor (which legendary roster you spun).
 * OVR is the pro's career strength (Gol.gg when ETL has run) — not a guess at
 * how they played on that specific team that year.
 */

export function careerRatings(player: Player): PlayerRatings {
  return player.ratings;
}

export function careerOverall(player: Player): number {
  return player.ratings.overall;
}

export function playersForSimulation(
  picks: { player: Player; team: HistoricalTeam }[]
): Player[] {
  return picks.map(({ player }) => ({
    ...player,
    ratings: careerRatings(player),
  }));
}
