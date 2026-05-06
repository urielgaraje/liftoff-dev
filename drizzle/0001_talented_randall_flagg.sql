CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"stage_index" integer NOT NULL,
	"value" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "current_stage_index" integer DEFAULT -1 NOT NULL;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "stage_started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "rooms" ADD COLUMN "stage_init" jsonb;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_room_id_rooms_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."rooms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scores" ADD CONSTRAINT "scores_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "scores_player_stage_uniq" ON "scores" USING btree ("player_id","stage_index");