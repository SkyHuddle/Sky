import type { Player, PlayerRatings } from '@/core/types';
import golBundle from './generated/gol-ratings.json';

export type PlayerDataSource = 'curated' | 'gol';

export interface GolRatingsBundle {
  source: string;
  generatedAt: string;
  playerCount: number;
  entries: Record<
    string,
    {
      playerId: string;
      golId: number;
      ratings: PlayerRatings;
    }
  >;
}

const bundle = golBundle as GolRatingsBundle;

export function hasGolRatings(): boolean {
  return bundle.playerCount > 0;
}

export function getGolDataMeta(): { source: string; generatedAt: string; count: number } | null {
  if (!hasGolRatings()) return null;
  return {
    source: bundle.source,
    generatedAt: bundle.generatedAt,
    count: bundle.playerCount,
  };
}

export function applyGolRatings(player: Player): Player {
  const entry = bundle.entries[player.id];
  if (!entry) return player;
  return {
    ...player,
    ratings: { ...entry.ratings },
  };
}

export function mergePlayersWithGol(players: Player[]): Player[] {
  if (!hasGolRatings()) return players;
  return players.map(applyGolRatings);
}

export function getPlayerDataSource(playerId: string): PlayerDataSource {
  return bundle.entries[playerId] ? 'gol' : 'curated';
}
