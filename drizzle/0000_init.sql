CREATE TABLE "admin_audit_log" (
	"id" text PRIMARY KEY NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"reason" text NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contest_windows" (
	"id" text PRIMARY KEY NOT NULL,
	"contest_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"position" integer NOT NULL,
	"lock_at" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"pool_frozen_at" timestamp with time zone,
	"autopilot_ran_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "contests" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"kind" text NOT NULL,
	"rule_set_id" text NOT NULL,
	"rules" jsonb NOT NULL,
	"status" text DEFAULT 'upcoming' NOT NULL,
	"opens_at" timestamp with time zone NOT NULL,
	"settled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "entries" (
	"id" text PRIMARY KEY NOT NULL,
	"contest_id" text NOT NULL,
	"user_id" text NOT NULL,
	"autopilot" boolean DEFAULT true NOT NULL,
	"joined_window_position" integer NOT NULL,
	"submitted_at" timestamp with time zone NOT NULL,
	"total_points" double precision DEFAULT 0 NOT NULL,
	"captain_points" double precision DEFAULT 0 NOT NULL,
	"transfers_used" integer DEFAULT 0 NOT NULL,
	"rank" integer,
	"previous_rank" integer,
	"score_state" text DEFAULT 'provisional' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entry_window_scores" (
	"entry_id" text NOT NULL,
	"window_id" text NOT NULL,
	"points" double precision NOT NULL,
	"captain_points" double precision NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entry_window_scores_entry_id_window_id_pk" PRIMARY KEY("entry_id","window_id")
);
--> statement-breakpoint
CREATE TABLE "external_ids" (
	"provider" text NOT NULL,
	"entity_type" text NOT NULL,
	"external_id" text NOT NULL,
	"internal_id" text NOT NULL,
	CONSTRAINT "external_ids_provider_entity_type_external_id_pk" PRIMARY KEY("provider","entity_type","external_id")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_runs" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text NOT NULL,
	"summary" jsonb,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "league_entries" (
	"league_id" text NOT NULL,
	"entry_id" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_entries_league_id_entry_id_pk" PRIMARY KEY("league_id","entry_id")
);
--> statement-breakpoint
CREATE TABLE "league_members" (
	"league_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "league_members_league_id_user_id_pk" PRIMARY KEY("league_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" text PRIMARY KEY NOT NULL,
	"contest_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"privacy" text DEFAULT 'private' NOT NULL,
	"invite_code" text NOT NULL,
	"invite_expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leagues_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "maps" (
	"id" text PRIMARY KEY NOT NULL,
	"match_id" text NOT NULL,
	"number" integer NOT NULL,
	"map_name" text NOT NULL,
	"rounds_played" integer NOT NULL,
	"rounds_a" integer NOT NULL,
	"rounds_b" integer NOT NULL,
	"winner_team_id" text NOT NULL,
	"finished_at" timestamp with time zone NOT NULL,
	"stats_version" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY NOT NULL,
	"stage_id" text NOT NULL,
	"round" integer NOT NULL,
	"slot" text NOT NULL,
	"format" integer NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"original_scheduled_at" timestamp with time zone,
	"status" text NOT NULL,
	"team_a_id" text NOT NULL,
	"team_b_id" text NOT NULL,
	"winner_team_id" text,
	"payload_hash" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_map_stats" (
	"map_id" text NOT NULL,
	"player_id" text NOT NULL,
	"stats_version" integer NOT NULL,
	"team_id" text NOT NULL,
	"kills" integer NOT NULL,
	"deaths" integer NOT NULL,
	"assists" integer NOT NULL,
	"opening_kills" integer NOT NULL,
	"k3" integer NOT NULL,
	"k4" integer NOT NULL,
	"k5" integer NOT NULL,
	"c1" integer NOT NULL,
	"c2" integer NOT NULL,
	"c3" integer NOT NULL,
	"c4" integer NOT NULL,
	"c5" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_map_stats_map_id_player_id_stats_version_pk" PRIMARY KEY("map_id","player_id","stats_version")
);
--> statement-breakpoint
CREATE TABLE "player_prices" (
	"contest_id" text NOT NULL,
	"player_id" text NOT NULL,
	"price" integer NOT NULL,
	"avg_points" double precision NOT NULL,
	"maps_sampled" integer NOT NULL,
	"overridden_by" text,
	CONSTRAINT "player_prices_contest_id_player_id_pk" PRIMARY KEY("contest_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "player_team_memberships" (
	"player_id" text NOT NULL,
	"team_id" text NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_to" timestamp with time zone,
	CONSTRAINT "player_team_memberships_player_id_team_id_valid_from_pk" PRIMARY KEY("player_id","team_id","valid_from")
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"nickname" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"nationality" text NOT NULL,
	"role" text NOT NULL,
	"is_stand_in" boolean DEFAULT false NOT NULL,
	"portrait_url" text
);
--> statement-breakpoint
CREATE TABLE "provider_records" (
	"provider" text NOT NULL,
	"entity_type" text NOT NULL,
	"external_id" text NOT NULL,
	"payload_hash" text NOT NULL,
	"payload" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "provider_records_provider_entity_type_external_id_payload_hash_pk" PRIMARY KEY("provider","entity_type","external_id","payload_hash")
);
--> statement-breakpoint
CREATE TABLE "roster_selections" (
	"roster_version_id" text NOT NULL,
	"player_id" text NOT NULL,
	"slot" integer NOT NULL,
	CONSTRAINT "roster_selections_roster_version_id_player_id_pk" PRIMARY KEY("roster_version_id","player_id")
);
--> statement-breakpoint
CREATE TABLE "roster_versions" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"window_id" text NOT NULL,
	"version" integer NOT NULL,
	"captain_player_id" text,
	"source" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "score_corrections" (
	"id" text PRIMARY KEY NOT NULL,
	"map_id" text NOT NULL,
	"from_version" integer NOT NULL,
	"to_version" integer NOT NULL,
	"changes" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_events" (
	"id" text PRIMARY KEY NOT NULL,
	"rule_set_id" text NOT NULL,
	"stage_id" text NOT NULL,
	"match_id" text,
	"player_id" text NOT NULL,
	"team_id" text NOT NULL,
	"kind" text NOT NULL,
	"points" double precision NOT NULL,
	"breakdown" jsonb NOT NULL,
	"input_hash" text NOT NULL,
	"state" text NOT NULL,
	"superseded_by_id" text,
	"superseded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scoring_rule_sets" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stage_teams" (
	"stage_id" text NOT NULL,
	"team_id" text NOT NULL,
	"seed" integer NOT NULL,
	"entering" boolean NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'alive' NOT NULL,
	CONSTRAINT "stage_teams_stage_id_team_id_pk" PRIMARY KEY("stage_id","team_id")
);
--> statement-breakpoint
CREATE TABLE "stages" (
	"id" text PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"position" integer NOT NULL,
	"begin_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"wins_to_advance" integer,
	"losses_to_eliminate" integer,
	"status" text DEFAULT 'upcoming' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "standings_snapshots" (
	"contest_id" text NOT NULL,
	"batch_id" text NOT NULL,
	"entry_id" text NOT NULL,
	"rank" integer NOT NULL,
	"points" double precision NOT NULL,
	"entries_count" integer NOT NULL,
	"is_final" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "standings_snapshots_contest_id_batch_id_entry_id_pk" PRIMARY KEY("contest_id","batch_id","entry_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"name" text NOT NULL,
	"acronym" text NOT NULL,
	"color" text NOT NULL,
	"country" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" text PRIMARY KEY NOT NULL,
	"game_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text NOT NULL,
	"tier" text NOT NULL,
	"location" text NOT NULL,
	"begin_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"provider" text NOT NULL,
	"is_demo" boolean NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" text PRIMARY KEY NOT NULL,
	"entry_id" text NOT NULL,
	"window_id" text NOT NULL,
	"out_player_id" text,
	"in_player_id" text,
	"kind" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_hue" integer DEFAULT 170 NOT NULL,
	"favorite_game" text DEFAULT 'cs2' NOT NULL,
	"autopilot_default" boolean DEFAULT true NOT NULL,
	"is_bot" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "window_pool" (
	"window_id" text NOT NULL,
	"player_id" text NOT NULL,
	"team_id" text NOT NULL,
	"price" integer NOT NULL,
	CONSTRAINT "window_pool_window_id_player_id_pk" PRIMARY KEY("window_id","player_id")
);
--> statement-breakpoint
ALTER TABLE "contest_windows" ADD CONSTRAINT "contest_windows_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contest_windows" ADD CONSTRAINT "contest_windows_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contests" ADD CONSTRAINT "contests_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contests" ADD CONSTRAINT "contests_rule_set_id_scoring_rule_sets_id_fk" FOREIGN KEY ("rule_set_id") REFERENCES "public"."scoring_rule_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_window_scores" ADD CONSTRAINT "entry_window_scores_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entry_window_scores" ADD CONSTRAINT "entry_window_scores_window_id_contest_windows_id_fk" FOREIGN KEY ("window_id") REFERENCES "public"."contest_windows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_entries" ADD CONSTRAINT "league_entries_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_entries" ADD CONSTRAINT "league_entries_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "league_members" ADD CONSTRAINT "league_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leagues" ADD CONSTRAINT "leagues_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maps" ADD CONSTRAINT "maps_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maps" ADD CONSTRAINT "maps_winner_team_id_teams_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_a_id_teams_id_fk" FOREIGN KEY ("team_a_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_team_b_id_teams_id_fk" FOREIGN KEY ("team_b_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_team_id_teams_id_fk" FOREIGN KEY ("winner_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_map_stats" ADD CONSTRAINT "player_map_stats_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_map_stats" ADD CONSTRAINT "player_map_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_map_stats" ADD CONSTRAINT "player_map_stats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_prices" ADD CONSTRAINT "player_prices_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_prices" ADD CONSTRAINT "player_prices_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_team_memberships" ADD CONSTRAINT "player_team_memberships_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_team_memberships" ADD CONSTRAINT "player_team_memberships_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_selections" ADD CONSTRAINT "roster_selections_roster_version_id_roster_versions_id_fk" FOREIGN KEY ("roster_version_id") REFERENCES "public"."roster_versions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_selections" ADD CONSTRAINT "roster_selections_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_versions" ADD CONSTRAINT "roster_versions_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_versions" ADD CONSTRAINT "roster_versions_window_id_contest_windows_id_fk" FOREIGN KEY ("window_id") REFERENCES "public"."contest_windows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roster_versions" ADD CONSTRAINT "roster_versions_captain_player_id_players_id_fk" FOREIGN KEY ("captain_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "score_corrections" ADD CONSTRAINT "score_corrections_map_id_maps_id_fk" FOREIGN KEY ("map_id") REFERENCES "public"."maps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_events" ADD CONSTRAINT "scoring_events_rule_set_id_scoring_rule_sets_id_fk" FOREIGN KEY ("rule_set_id") REFERENCES "public"."scoring_rule_sets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_events" ADD CONSTRAINT "scoring_events_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_events" ADD CONSTRAINT "scoring_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_events" ADD CONSTRAINT "scoring_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_events" ADD CONSTRAINT "scoring_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scoring_rule_sets" ADD CONSTRAINT "scoring_rule_sets_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_teams" ADD CONSTRAINT "stage_teams_stage_id_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_teams" ADD CONSTRAINT "stage_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stages" ADD CONSTRAINT "stages_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings_snapshots" ADD CONSTRAINT "standings_snapshots_contest_id_contests_id_fk" FOREIGN KEY ("contest_id") REFERENCES "public"."contests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings_snapshots" ADD CONSTRAINT "standings_snapshots_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_window_id_contest_windows_id_fk" FOREIGN KEY ("window_id") REFERENCES "public"."contest_windows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_out_player_id_players_id_fk" FOREIGN KEY ("out_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_in_player_id_players_id_fk" FOREIGN KEY ("in_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "window_pool" ADD CONSTRAINT "window_pool_window_id_contest_windows_id_fk" FOREIGN KEY ("window_id") REFERENCES "public"."contest_windows"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "window_pool" ADD CONSTRAINT "window_pool_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "window_pool" ADD CONSTRAINT "window_pool_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "windows_contest_position" ON "contest_windows" USING btree ("contest_id","position");--> statement-breakpoint
CREATE UNIQUE INDEX "contests_tournament_slug" ON "contests" USING btree ("tournament_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "entries_contest_user" ON "entries" USING btree ("contest_id","user_id");--> statement-breakpoint
CREATE INDEX "entries_contest_rank" ON "entries" USING btree ("contest_id","rank");--> statement-breakpoint
CREATE UNIQUE INDEX "maps_match_number" ON "maps" USING btree ("match_id","number");--> statement-breakpoint
CREATE INDEX "matches_stage" ON "matches" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "matches_scheduled" ON "matches" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "pms_player" ON "player_map_stats" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "roster_versions_entry_window_version" ON "roster_versions" USING btree ("entry_id","window_id","version");--> statement-breakpoint
CREATE INDEX "scoring_events_stage_player" ON "scoring_events" USING btree ("stage_id","player_id");--> statement-breakpoint
CREATE INDEX "scoring_events_match" ON "scoring_events" USING btree ("match_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scoring_events_current" ON "scoring_events" USING btree ("rule_set_id","kind","stage_id",coalesce("match_id", ''),"player_id") WHERE "scoring_events"."superseded_by_id" is null;--> statement-breakpoint
CREATE INDEX "sessions_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "stages_tournament_position" ON "stages" USING btree ("tournament_id","position");--> statement-breakpoint
CREATE INDEX "transfers_entry_window" ON "transfers" USING btree ("entry_id","window_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_username_lower" ON "users" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_lower" ON "users" USING btree (lower("email"));