import type { PlayerRatings } from '@/core/types';
import teamYearBundle from './generated/team-year-ratings.json';

export interface TeamYearRatingsEntry {
  teamId: string;
  playerId: string;
  season: string;
  stats: {
    kda: number;
    killParticipation: number;
    damagePct: number;
    goldPct: number;
    winRate: number;
    games: number;
  };
  ratings: PlayerRatings;
}

interface TeamYearRatingsBundle {
  source: string;
  generatedAt: string;
  entryCount: number;
  entries: Record<string, TeamYearRatingsEntry>;
}

const bundle = teamYearBundle as TeamYearRatingsBundle;

export function hasTeamYearRatings(): boolean {
  return bundle.entryCount > 0;
}

export function getTeamYearMeta(): {
  source: string;
  generatedAt: string;
  count: number;
} | null {
  if (!hasTeamYearRatings()) return null;
  return {
    source: bundle.source,
    generatedAt: bundle.generatedAt,
    count: bundle.entryCount,
  };
}

export function getTeamYearEntry(
  teamId: string,
  playerId: string
): TeamYearRatingsEntry | null {
  return bundle.entries[`${teamId}:${playerId}`] ?? null;
}

export function getTeamYearRatings(
  teamId: string,
  playerId: string
): PlayerRatings | null {
  return getTeamYearEntry(teamId, playerId)?.ratings ?? null;
}
