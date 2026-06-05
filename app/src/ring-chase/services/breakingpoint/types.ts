/** BreakingPoint.gg API response shapes — normalized for sync pipeline */

export interface BpPlayer {
  id: number;
  gamertag: string;
  real_name?: string;
  country?: string;
  headshot_url?: string;
  current_team?: string;
}

export interface BpPlayerStats {
  player_id: number;
  season_id: number;
  kd?: number;
  bp_rating?: number;
  slayer_rating?: number;
  damage_per_10?: number;
  kills_per_10?: number;
  snd_kills_per_round?: number;
  hp_kd?: number;
  ctl_kd?: number;
  snd_kd?: number;
}

export interface BpTeam {
  id: number;
  name: string;
  abbreviation: string;
  logo_url?: string;
}

export interface BpEvent {
  id: number;
  name: string;
  season_id: number;
  placement?: number;
}

export interface BpSyncResult {
  syncedAt: string;
  players: number;
  teams: number;
  events: number;
  source: 'api' | 'cache' | 'seed';
}
