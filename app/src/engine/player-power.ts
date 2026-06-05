import type { HistoricalTeam, Player, PlayerRatings } from '@/core/types';
import {
  getTeamYearRatings,
  getTeamYearEntry,
  getCardKda,
  formatKda,
} from '@/data/merge-team-year-ratings';

export { formatKda };

export type CardStatConfidence = 'exact' | 'estimated';

export interface CardStatBreakdown {
  kda: number;
  killParticipation: number;
  damagePct: number;
  goldPct: number;
  winRate: number;
  games: number;
  confidence: CardStatConfidence;
}

export function cardKda(player: Player, team: HistoricalTeam): number | null {
  return getCardKda(team.id, player.id);
}

export function hasCardStats(player: Player, team: HistoricalTeam): boolean {
  return getCardKda(team.id, player.id) != null;
}

/** @deprecated use hasCardStats */
export const hasGolCardStats = hasCardStats;

export function cardStatConfidence(
  player: Player,
  team: HistoricalTeam
): CardStatConfidence | null {
  const entry = getTeamYearEntry(team.id, player.id);
  if (!entry) return null;
  return entry.source === 'team-roster' ? 'exact' : 'estimated';
}

/** @deprecated use cardStatConfidence */
export function golStatSource(
  player: Player,
  team: HistoricalTeam
): 'team-roster' | 'season' | null {
  const c = cardStatConfidence(player, team);
  if (c === 'exact') return 'team-roster';
  if (c === 'estimated') return 'season';
  return null;
}

export function cardStatBreakdown(
  player: Player,
  team: HistoricalTeam
): CardStatBreakdown | null {
  const entry = getTeamYearEntry(team.id, player.id);
  if (!entry) return null;
  return {
    ...entry.stats,
    confidence: entry.source === 'team-roster' ? 'exact' : 'estimated',
  };
}

export function cardRatings(player: Player, team: HistoricalTeam): PlayerRatings {
  return getTeamYearRatings(team.id, player.id) ?? player.ratings;
}

export function cardOverall(player: Player, team: HistoricalTeam): number {
  return cardRatings(player, team).overall;
}

export function teamRosterAvgOvr(team: HistoricalTeam, players: Player[]): number {
  const ids = Object.values(team.roster);
  const rosterPlayers = ids
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => p != null);
  if (rosterPlayers.length === 0) return 0;
  return (
    rosterPlayers.reduce((s, p) => s + cardOverall(p, team), 0) / rosterPlayers.length
  );
}

export function playersForSimulation(
  picks: { player: Player; team: HistoricalTeam }[]
): Player[] {
  return picks.map(({ player, team }) => ({
    ...player,
    ratings: cardRatings(player, team),
  }));
}
