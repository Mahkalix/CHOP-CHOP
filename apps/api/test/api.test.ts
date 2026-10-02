import { beforeEach, describe, expect, it } from "vitest";
import type { LeaderboardEntry, ScoreSubmission } from "@chopchop/shared";
import { buildApp } from "../src/app.js";
import type { ScoreRepository } from "../src/repository.js";

function memoryRepository(): ScoreRepository {
  const rows: (ScoreSubmission & { id: string; createdAt: string })[] = [];
  const sorted = (levelId: number) =>
    rows
      .filter((r) => r.levelId === levelId)
      .sort((a, b) => b.score - a.score || a.durationMs - b.durationMs);
  return {
    async insert(s) {
      const id = String(rows.length + 1);
      rows.push({ ...s, id, createdAt: new Date().toISOString() });
      const ahead = sorted(s.levelId).filter(
        (r) => r.id !== id && (r.score > s.score || (r.score === s.score && r.durationMs <= s.durationMs)),
      );
      return { id, rank: ahead.length + 1 };
    },
    async top(levelId, limit): Promise<LeaderboardEntry[]> {
      return sorted(levelId)
        .slice(0, limit)
        .map((r, i) => ({ rank: i + 1, playerName: r.playerName, score: r.score, durationMs: r.durationMs, createdAt: r.createdAt }));
    },
  };
}

const valid = { levelId: 1, playerName: "Gordon", score: 300, durationMs: 90_000 };

describe("API", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  beforeEach(async () => {
    app = await buildApp({ repository: memoryRepository() });
  });

  it("accepts a valid score and returns its rank", async () => {
    const res = await app.inject({ method: "POST", url: "/scores", payload: valid });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ rank: 1 });
  });

  it("trims the player name", async () => {
    await app.inject({ method: "POST", url: "/scores", payload: { ...valid, playerName: "  Ana  " } });
    const res = await app.inject({ method: "GET", url: "/leaderboard/1" });
    expect(res.json().entries[0].playerName).toBe("Ana");
  });

  it.each([
    ["too short name", { playerName: "A" }],
    ["forbidden characters", { playerName: "<script>" }],
    ["unknown level", { levelId: 9 }],
    ["negative score", { score: -1 }],
    ["level id sent as a string", { levelId: "1" }],
    ["level id sent as a boolean", { levelId: true }],
  ])("rejects %s with 400", async (_label, override) => {
    const res = await app.inject({ method: "POST", url: "/scores", payload: { ...valid, ...override } });
    expect(res.statusCode).toBe(400);
  });

  it.each([
    ["score above the level maximum", { score: 99_999 }],
    ["impossibly short run", { durationMs: 1_000 }],
  ])("rejects %s with 422", async (_label, override) => {
    const res = await app.inject({ method: "POST", url: "/scores", payload: { ...valid, ...override } });
    expect(res.statusCode).toBe(422);
  });

  it("returns the leaderboard sorted by score then duration", async () => {
    for (const [playerName, score, durationMs] of [["B", 200, 60_000], ["A", 300, 80_000], ["C", 300, 70_000]] as const) {
      await app.inject({ method: "POST", url: "/scores", payload: { ...valid, playerName: playerName + playerName, score, durationMs } });
    }
    const res = await app.inject({ method: "GET", url: "/leaderboard/1?limit=2" });
    expect(res.json().entries.map((e: LeaderboardEntry) => e.playerName)).toEqual(["CC", "AA"]);
  });

  it("ranks a tie on score by duration, consistently with the leaderboard", async () => {
    await app.inject({ method: "POST", url: "/scores", payload: { ...valid, playerName: "Slow", durationMs: 80_000 } });
    const res = await app.inject({ method: "POST", url: "/scores", payload: { ...valid, playerName: "Fast", durationMs: 70_000 } });
    expect(res.json().rank).toBe(1);
    const board = await app.inject({ method: "GET", url: "/leaderboard/1" });
    expect(board.json().entries[0].playerName).toBe("Fast");
  });

  it("hides internal errors behind a generic 500", async () => {
    const failing = await buildApp({
      repository: {
        insert: async () => { throw new Error("password authentication failed for user postgres"); },
        top: async () => [],
      },
    });
    const res = await failing.inject({ method: "POST", url: "/scores", payload: valid });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: "Internal error" });
  });

  it("does not rate limit /health", async () => {
    for (let i = 0; i < 80; i++) {
      expect((await app.inject({ method: "GET", url: "/health" })).statusCode).toBe(200);
    }
  });

  it("validates leaderboard params", async () => {
    expect((await app.inject({ method: "GET", url: "/leaderboard/42" })).statusCode).toBe(400);
    expect((await app.inject({ method: "GET", url: "/leaderboard/1?limit=1000" })).statusCode).toBe(400);
  });
});
