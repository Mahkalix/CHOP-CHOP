import { index, integer, pgTable, smallint, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const scores = pgTable(
  "scores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    levelId: smallint("level_id").notNull(),
    playerName: varchar("player_name", { length: 16 }).notNull(),
    score: integer("score").notNull(),
    durationMs: integer("duration_ms").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("scores_level_score_idx").on(t.levelId, t.score.desc())],
  // RLS with no policy: the table is closed to Supabase's public roles. The API connects with
  // the owner role, which bypasses RLS.
).enableRLS();
