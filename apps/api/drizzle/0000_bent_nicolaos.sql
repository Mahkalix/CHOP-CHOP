CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level_id" smallint NOT NULL,
	"player_name" varchar(16) NOT NULL,
	"score" integer NOT NULL,
	"duration_ms" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "scores_level_score_idx" ON "scores" USING btree ("level_id","score" DESC NULLS LAST);