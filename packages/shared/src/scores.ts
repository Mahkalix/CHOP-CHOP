import { z } from "zod";
import { LEVEL_IDS } from "./levels.js";

export const LEADERBOARD_DEFAULT_LIMIT = 10;
export const LEADERBOARD_MAX_LIMIT = 50;

export const LevelIdSchema = z
  .number()
  .int()
  .refine((n): n is (typeof LEVEL_IDS)[number] => (LEVEL_IDS as readonly number[]).includes(n), {
    message: "Unknown level",
  });

/** Level id as it appears in a URL (always a string). */
export const LevelIdParamSchema = z.string().regex(/^\d+$/).transform(Number).pipe(LevelIdSchema);

export const PlayerNameSchema = z
  .string()
  .trim()
  .min(2)
  .max(16)
  .regex(/^[\p{L}\p{M}\p{N} _-]+$/u, "Only letters, digits, spaces, '_' and '-' are allowed");

export const ScoreSubmissionSchema = z.object({
  levelId: LevelIdSchema,
  playerName: PlayerNameSchema,
  score: z.number().int().min(0),
  durationMs: z.number().int().positive(),
});
export type ScoreSubmission = z.infer<typeof ScoreSubmissionSchema>;

export const LeaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(LEADERBOARD_MAX_LIMIT).default(LEADERBOARD_DEFAULT_LIMIT),
});

export interface LeaderboardEntry {
  rank: number;
  playerName: string;
  score: number;
  durationMs: number;
  createdAt: string;
}

export interface LeaderboardResponse {
  levelId: number;
  entries: LeaderboardEntry[];
}

export interface SubmitScoreResponse {
  id: string;
  rank: number;
}
