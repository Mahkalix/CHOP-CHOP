export const LEVEL_IDS = [1, 2, 3, 4, 5] as const;
export type LevelId = (typeof LEVEL_IDS)[number];

/**
 * Plausibility bounds used by the API to reject obviously forged scores.
 * Placeholder values: tune them once the game design of each level is fixed.
 */
export interface LevelLimits {
  maxScore: number;
  minDurationMs: number;
  maxDurationMs: number;
}

export const LEVEL_LIMITS: Record<LevelId, LevelLimits> = {
  1: { maxScore: 500, minDurationMs: 20_000, maxDurationMs: 600_000 },
  2: { maxScore: 800, minDurationMs: 20_000, maxDurationMs: 600_000 },
  3: { maxScore: 1_000, minDurationMs: 20_000, maxDurationMs: 600_000 },
  4: { maxScore: 1_200, minDurationMs: 20_000, maxDurationMs: 600_000 },
  5: { maxScore: 1_500, minDurationMs: 20_000, maxDurationMs: 600_000 },
};
