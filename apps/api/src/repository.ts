import { and, asc, desc, eq, gt, lt, or, sql } from "drizzle-orm";
import type { LeaderboardEntry, ScoreSubmission } from "@chopchop/shared";
import type { createDb } from "./db/client.js";
import { scores } from "./db/schema.js";

export interface ScoreRepository {
  /** Stores a score and returns its id and its rank (1 = best) within the level. */
  insert(submission: ScoreSubmission): Promise<{ id: string; rank: number }>;
  top(levelId: number, limit: number): Promise<LeaderboardEntry[]>;
}

export function createScoreRepository(db: ReturnType<typeof createDb>["db"]): ScoreRepository {
  return {
    async insert(s) {
      const [row] = await db
        .insert(scores)
        .values({
          levelId: s.levelId,
          playerName: s.playerName,
          score: s.score,
          durationMs: s.durationMs,
        })
        .returning({ id: scores.id, createdAt: scores.createdAt });
      if (!row) throw new Error("Insert returned no row");

      // Same ordering as `top`: score desc, then duration asc, then oldest first.
      const [ahead] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(scores)
        .where(
          and(
            eq(scores.levelId, s.levelId),
            or(
              gt(scores.score, s.score),
              and(eq(scores.score, s.score), lt(scores.durationMs, s.durationMs)),
              and(
                eq(scores.score, s.score),
                eq(scores.durationMs, s.durationMs),
                lt(scores.createdAt, row.createdAt),
              ),
            ),
          ),
        );
      return { id: row.id, rank: (ahead?.count ?? 0) + 1 };
    },

    async top(levelId, limit) {
      const rows = await db
        .select()
        .from(scores)
        .where(eq(scores.levelId, levelId))
        .orderBy(desc(scores.score), asc(scores.durationMs), asc(scores.createdAt))
        .limit(limit);
      return rows.map((r, i) => ({
        rank: i + 1,
        playerName: r.playerName,
        score: r.score,
        durationMs: r.durationMs,
        createdAt: r.createdAt.toISOString(),
      }));
    },
  };
}
