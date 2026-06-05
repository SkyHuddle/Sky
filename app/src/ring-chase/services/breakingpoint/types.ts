/** BreakingPoint Supabase row shapes (subset used by Ring Chase sync). */

export interface BpPlayer {
  id: number;
  tag: string;
  first_name: string | null;
  last_name: string | null;
  country_id: number | null;
  headshot: string | null;
  current_team_id: number | null;
  position_id: number | null;
  nickname: string | null;
  retired: boolean;
}

export interface BpTeam {
  id: number;
  name: string;
  name_medium: string | null;
  name_short: string | null;
  logo_main: string | null;
}

export interface BpSeason {
  id: number;
  title_id: number;
  start_date: string;
  end_date: string;
}

export interface BpEvent {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  tier: string | null;
  type: string | null;
}

export interface BpPlayerStatRow {
  player_id: number;
  player_tag: string;
  season_id: number;
  kills: number;
  deaths: number;
  damage: number;
  bp_rating: number | null;
  hp_bp_rating: number | null;
  snd_bp_rating: number | null;
  ctl_bp_rating: number | null;
  hill_time: number | null;
  gametime_min: number | null;
  gametime_sec: number | null;
  mode_id: number | null;
}

export interface BpPosition {
  id: number;
  position: string;
  short_name: string;
}

export interface BpSyncResult {
  syncedAt: string;
  players: number;
  teams: number;
  statRows: number;
  seasonId: number;
  source: 'supabase' | 'seed';
}

export interface BpPlayerSeasonAggregate {
  playerId: number;
  tag: string;
  seasonId: number;
  maps: number;
  kd: number;
  bpRating: number;
  slayerRating: number;
  hpKd: number;
  sndKd: number;
  ctlKd: number;
  damagePer10: number;
  killsPer10: number;
}
