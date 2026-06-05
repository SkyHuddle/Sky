import type { BpEvent, BpPlayer, BpPlayerStats, BpTeam } from './types';

const BP_API_BASE = import.meta.env.VITE_BREAKINGPOINT_API_URL ?? 'https://api.breakingpoint.gg';

export interface BreakingPointClientConfig {
  apiKey?: string;
  baseUrl?: string;
}

/**
 * Modular BreakingPoint API client.
 * Only this module should know BreakingPoint endpoint shapes.
 */
export class BreakingPointClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: BreakingPointClientConfig = {}) {
    this.baseUrl = config.baseUrl ?? BP_API_BASE;
    this.apiKey = config.apiKey ?? import.meta.env.VITE_BREAKINGPOINT_API_KEY;
  }

  private async fetch<T>(path: string): Promise<T> {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (this.apiKey) headers.Authorization = `Bearer ${this.apiKey}`;

    const res = await fetch(`${this.baseUrl}${path}`, { headers });
    if (!res.ok) throw new Error(`BreakingPoint API ${res.status}: ${path}`);
    return res.json() as Promise<T>;
  }

  async getPlayers(): Promise<BpPlayer[]> {
    return this.fetch<BpPlayer[]>('/players');
  }

  async getPlayerStats(seasonId?: number): Promise<BpPlayerStats[]> {
    const q = seasonId ? `?season_id=${seasonId}` : '';
    return this.fetch<BpPlayerStats[]>(`/player-stats${q}`);
  }

  async getTeams(): Promise<BpTeam[]> {
    return this.fetch<BpTeam[]>('/teams');
  }

  async getEvents(seasonId?: number): Promise<BpEvent[]> {
    const q = seasonId ? `?season_id=${seasonId}` : '';
    return this.fetch<BpEvent[]>(`/events${q}`);
  }
}

export const breakingpointClient = new BreakingPointClient();
