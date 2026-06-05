import type { PlayerRatings, Role } from '../../src/core/types';

export interface GolPlayerStats {
  golId: number;
  name: string;
  recordWins: number;
  recordLosses: number;
  games: number;
  winRate: number;
  kda: number;
  csPerMin: number;
  goldPerMin: number;
  goldPct: number;
  killParticipation: number;
  damagePerMin: number;
  damagePct: number;
  csdAt15: number;
  fetchedAt: string;
}

export interface GolRatingsEntry {
  playerId: string;
  golId: number;
  ratings: PlayerRatings;
  stats: Pick<
    GolPlayerStats,
    'winRate' | 'kda' | 'games' | 'goldPerMin' | 'killParticipation' | 'damagePerMin'
  >;
}

export interface GolRatingsBundle {
  source: 'gol.gg';
  generatedAt: string;
  playerCount: number;
  entries: Record<string, GolRatingsEntry>;
}

export interface AppPlayerRef {
  id: string;
  name: string;
  role: Role;
}

export interface GolIdMap {
  updatedAt: string;
  ids: Record<string, number>;
  unresolved: string[];
}

export interface GolTeamYearStats {
  kda: number;
  killParticipation: number;
  damagePct: number;
  goldPct: number;
  winRate: number;
  games: number;
}

export interface TeamYearRatingsEntry {
  teamId: string;
  playerId: string;
  golTeamId: number;
  golPlayerId: number;
  season: string;
  source: 'team-roster' | 'season';
  accomplishment?: string;
  stats: GolTeamYearStats;
  ratings: PlayerRatings;
}

export interface TeamYearRatingsBundle {
  source: 'gol.gg-team-year';
  generatedAt: string;
  entryCount: number;
  entries: Record<string, TeamYearRatingsEntry>;
}
