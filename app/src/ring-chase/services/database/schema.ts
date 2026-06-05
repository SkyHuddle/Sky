/**
 * Normalized database table shapes for future Postgres/Supabase integration.
 * V1 gameplay reads from seeded TypeScript data; these types define the target schema.
 */

export interface DbPlayer {
  id: string;
  gamertag: string;
  real_name: string | null;
  primary_role: string;
  secondary_role: string;
  country: string;
  active_status: 'active' | 'retired' | 'inactive';
  headshot_url: string | null;
  current_team: string | null;
  peak_team: string | null;
  peak_year: number | null;
  career_start_year: number | null;
  career_end_year: number | null;
  rings: number;
  major_wins: number;
  mvp_awards: number;
  notable_achievements: string | null;
}

export interface DbHistoricalTeam {
  id: string;
  team_name: string;
  season: number;
  game_title: string;
  event_context: string;
  roster_players: string[];
  team_rating: number;
  placement: string;
  major_wins: number;
  champs_placement: string;
  is_champs_winner: boolean;
  is_iconic_roster: boolean;
  era: string;
}

export interface DbPlayerRating {
  player_id: string;
  season_id: string | null;
  overall: number;
  slaying: number;
  objective: number;
  snd: number;
  respawn: number;
  clutch: number;
  lan: number;
  consistency: number;
  leadership: number;
  pace: number;
  role_fit: number;
  championship_factor: number;
  peak_form: number;
  source: 'breakingpoint' | 'manual' | 'computed';
}

export interface DbDailyChallenge {
  id: string;
  date: string;
  constraint_id: string;
  team_ids: string[];
  sim_seed: string;
}

export interface DbGameResult {
  id: string;
  mode: 'free' | 'daily';
  picks: string[];
  ring_won: boolean;
  perfect_season: boolean;
  roster_score: number;
  created_at: string;
}

export interface DbShareCard {
  id: string;
  game_result_id: string;
  image_url: string | null;
  share_text: string;
  created_at: string;
}
