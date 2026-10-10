CREATE TABLE "live_maps" (
	"match_id" text PRIMARY KEY NOT NULL,
	"number" integer NOT NULL,
	"map_name" text NOT NULL,
	"rounds_a" integer NOT NULL,
	"rounds_b" integer NOT NULL,
	"stats" jsonb NOT NULL,
	"provider_updated_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contest_windows" ADD COLUMN "transfers_allowed" integer;--> statement-breakpoint
ALTER TABLE "contest_windows" ADD COLUMN "max_per_team" integer;--> statement-breakpoint
ALTER TABLE "live_maps" ADD CONSTRAINT "live_maps_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;