import { BP_REST_BASE, BP_SUPABASE_ANON_KEY, BP_TABLES } from './constants';
import type {
  BpEvent,
  BpPlayer,
  BpPlayerStatRow,
  BpPosition,
  BpSeason,
  BpTeam,
} from './types';

export interface BpQueryOptions {
  select?: string;
  filters?: Record<string, string>;
  order?: string;
  limit?: number;
  offset?: number;
}

/**
 * BreakingPoint data client — talks to their Supabase PostgREST API.
 * BP does not expose api.breakingpoint.gg; the site/mobile app use this backend.
 * Only this module should know endpoint/table shapes.
 */
export class BreakingPointClient {
  private baseUrl: string;
  private anonKey: string;

  constructor(baseUrl = BP_REST_BASE, anonKey = BP_SUPABASE_ANON_KEY) {
    this.baseUrl = baseUrl;
    this.anonKey = anonKey;
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    return {
      apikey: this.anonKey,
      Authorization: `Bearer ${this.anonKey}`,
      Accept: 'application/json',
      ...extra,
    };
  }

  private buildUrl(table: string, options: BpQueryOptions = {}): string {
    const params = new URLSearchParams();
    if (options.select) params.set('select', options.select);
    if (options.order) params.set('order', options.order);
    if (options.limit != null) params.set('limit', String(options.limit));
    if (options.offset != null) params.set('offset', String(options.offset));
    for (const [key, value] of Object.entries(options.filters ?? {})) {
      params.set(key, value);
    }
    const qs = params.toString();
    return `${this.baseUrl}/${table}${qs ? `?${qs}` : ''}`;
  }

  async query<T>(table: string, options: BpQueryOptions = {}): Promise<T[]> {
    const res = await fetch(this.buildUrl(table, options), {
      headers: this.headers(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`BreakingPoint ${table} ${res.status}: ${body.slice(0, 200)}`);
    }
    return res.json() as Promise<T[]>;
  }

  async getPlayers(options?: Omit<BpQueryOptions, 'select'>): Promise<BpPlayer[]> {
    return this.query<BpPlayer>(BP_TABLES.players, {
      select: 'id,tag,first_name,last_name,country_id,headshot,current_team_id,position_id,nickname,retired',
      ...options,
    });
  }

  async getPlayerByTag(tag: string): Promise<BpPlayer | null> {
    const rows = await this.getPlayers({
      filters: { tag: `eq.${tag}` },
      limit: 1,
    });
    return rows[0] ?? null;
  }

  async getTeams(options?: BpQueryOptions): Promise<BpTeam[]> {
    return this.query<BpTeam>(BP_TABLES.teams, {
      select: 'id,name,name_medium,name_short,logo_main',
      ...options,
    });
  }

  async getSeasons(options?: BpQueryOptions): Promise<BpSeason[]> {
    return this.query<BpSeason>(BP_TABLES.seasons, {
      select: 'id,title_id,start_date,end_date',
      order: 'id.desc',
      ...options,
    });
  }

  async getEvents(options?: BpQueryOptions): Promise<BpEvent[]> {
    return this.query<BpEvent>(BP_TABLES.events, {
      select: 'id,name,start_date,end_date,tier,type',
      ...options,
    });
  }

  async getPlayerStatsForSeason(seasonId: number, limit = 1000, offset = 0): Promise<BpPlayerStatRow[]> {
    return this.query<BpPlayerStatRow>(BP_TABLES.playerStats, {
      select:
        'player_id,player_tag,season_id,kills,deaths,damage,bp_rating,hp_bp_rating,snd_bp_rating,ctl_bp_rating,hill_time,gametime_min,gametime_sec,mode_id',
      filters: { season_id: `eq.${seasonId}` },
      limit,
      offset,
    });
  }

  async getPositions(): Promise<BpPosition[]> {
    return this.query<BpPosition>(BP_TABLES.positions, {
      select: 'id,position,short_name',
    });
  }

  /** Health check — confirms Supabase REST is reachable. */
  async ping(): Promise<{ ok: boolean; playerCount?: number }> {
    try {
      const res = await fetch(`${this.baseUrl}/${BP_TABLES.players}?select=id&limit=1`, {
        headers: this.headers({ Prefer: 'count=exact' }),
      });
      const range = res.headers.get('content-range');
      const total = range?.split('/')[1];
      return { ok: res.ok, playerCount: total ? Number(total) : undefined };
    } catch {
      return { ok: false };
    }
  }
}

export const breakingpointClient = new BreakingPointClient();
