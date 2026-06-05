/** BreakingPoint.gg backend — public Supabase PostgREST (anon key ships in their frontend bundle). */
export const BP_SUPABASE_URL =
  import.meta.env.VITE_BP_SUPABASE_URL ?? 'https://dfpiiufxcciujugzjvgx.supabase.co';

export const BP_SUPABASE_ANON_KEY =
  import.meta.env.VITE_BP_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcGlpdWZ4Y2NpdWp1Z3pqdmd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ2ODk0MDMsImV4cCI6MjA2MDI2NTQwM30.36VuOTvrxtmR3nb-u3nnVYWzMBn9YP1bQFvUYF5T1OE';

export const BP_REST_BASE = `${BP_SUPABASE_URL}/rest/v1`;

/** Tables exposed via PostgREST (verified against live API). */
export const BP_TABLES = {
  players: 'players',
  teams: 'teams',
  seasons: 'seasons',
  events: 'events',
  matches: 'matches',
  playerStats: 'player_stats',
  playerTeamHistory: 'player_team_history',
  teamEventView: 'team_event_view',
  games: 'games',
  titles: 'titles',
  modes: 'modes',
  maps: 'maps',
  countries: 'countries',
  positions: 'positions',
} as const;
