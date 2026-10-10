/**
 * Raw "demo provider" payload shapes. Deliberately shaped like a typical third-party esports API
 * (snake_case, provider ids, nested games) and NOT like our normalised model, so the adapter layer
 * is exercised exactly as it would be for PandaScore or GRID.
 */

export interface DemoApiTeam {
  id: string;
  name: string;
  acronym: string;
  color: string;
  location: string;
}

export interface DemoApiPlayer {
  id: string;
  name: string; // nickname
  first_name: string;
  last_name: string;
  nationality: string;
  role: string;
  current_team_id: string;
  is_stand_in: boolean;
}

export interface DemoApiPlayerGameStats {
  player_id: string;
  team_id: string;
  kills: number;
  deaths: number;
  assists: number;
  first_kills: number;
  multikills: { "3k": number; "4k": number; "5k": number };
  clutches_won: { "1v1": number; "1v2": number; "1v3": number; "1v4": number; "1v5": number };
}

export interface DemoApiGame {
  id: string;
  position: number;
  map: string;
  rounds: Record<string, number>; // team_id -> rounds won
  winner_id: string;
  finished_at: string;
  stats_version: number;
  players: DemoApiPlayerGameStats[];
}

export type DemoApiMatchStatus = "not_started" | "running" | "finished" | "postponed" | "canceled" | "forfeit";

export interface DemoApiMatch {
  id: string;
  stage_id: string;
  round: number;
  /** For playoffs: "quarterfinal" | "semifinal" | "final"; for Swiss: "swiss". */
  bracket_slot: string;
  number_of_games: 1 | 3 | 5;
  scheduled_at: string;
  original_scheduled_at: string | null;
  status: DemoApiMatchStatus;
  opponents: [string, string];
  winner_id: string | null;
  games: DemoApiGame[];
}

export interface DemoApiStage {
  id: string;
  name: string;
  short_name: string;
  kind: "swiss" | "single_elimination";
  position: number;
  begin_at: string;
  end_at: string;
  team_ids: string[];
  entering_team_ids: string[];
  wins_to_advance: number | null;
  losses_to_eliminate: number | null;
}

export interface DemoApiTournament {
  id: string;
  slug: string;
  name: string;
  short_name: string;
  tier: "major" | "tier1" | "other";
  game: "cs2";
  location: string;
  begin_at: string;
  end_at: string;
  stages: DemoApiStage[];
  matches: DemoApiMatch[];
  teams: DemoApiTeam[];
  players: DemoApiPlayer[];
}
