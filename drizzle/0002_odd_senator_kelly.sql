ALTER TABLE "rooms" ADD COLUMN "stage_duration_ms" integer DEFAULT 30000 NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "max_players" integer DEFAULT 50 NOT NULL;