export const LEVEL_IDS = [1, 2, 3, 4, 5] as const;
export type LevelId = (typeof LEVEL_IDS)[number];

/**
 * Plausibility bound used by the API to reject obviously forged scores.
 * Placeholder values: tune them once the game design of each level is fixed.
 */
export interface LevelLimits {
  maxScore: number;
}

export const LEVEL_LIMITS: Record<LevelId, LevelLimits> = {
  1: { maxScore: 500 },
  2: { maxScore: 800 },
  3: { maxScore: 1_000 },
  4: { maxScore: 1_200 },
  5: { maxScore: 1_500 },
};

/**
 * A game ends when the timer of its rules version runs out, so the server-measured duration must be
 * close to `duree_partie_secondes`. The late margin leaves room for network lag and pauses.
 */
export const GAME_DURATION_TOLERANCE_MS = { early: 5_000, late: 60_000 } as const;
