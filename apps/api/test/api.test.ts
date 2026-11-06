import { beforeEach, describe, expect, it } from "vitest";
import type { LeaderboardEntry } from "@chopchop/shared";
import { buildApp } from "../src/app.js";
import type { Game, GameStatus, Repository } from "../src/repository.js";

interface GameRow extends Game {
  score: number | null;
  finishedAt: Date | null;
}

function memoryRepository(): Repository & { pseudos: Map<string, string> } {
  const pseudos = new Map<string, string>();
  const games = new Map<string, GameRow>();
  const duration = (g: GameRow) => g.finishedAt!.getTime() - g.startedAt.getTime();
  const ranked = (levelId: number) =>
    [...games.values()]
      .filter((g) => g.levelId === levelId && g.status === "terminee")
      .sort(
        (a, b) =>
          b.score! - a.score! ||
          duration(a) - duration(b) ||
          a.finishedAt!.getTime() - b.finishedAt!.getTime(),
      );
  const isTaken = (pseudo: string) => [...pseudos.values()].some((p) => p.toLowerCase() === pseudo.toLowerCase());
  let seq = 0;

  return {
    pseudos,
    async getProfile(userId) {
      const pseudo = pseudos.get(userId);
      return pseudo ? { id: userId, pseudo } : null;
    },
    async saveProfile(userId, pseudo) {
      if (pseudos.has(userId)) return "already_set";
      if (isTaken(pseudo)) return "pseudo_taken";
      pseudos.set(userId, pseudo);
      return "saved";
    },
    async isPseudoAvailable(pseudo) {
      return !isTaken(pseudo);
    },
    async playerGames(userId, limit) {
      return [...games.values()]
        .filter((g) => g.userId === userId && g.status === "terminee")
        .sort((a, b) => b.finishedAt!.getTime() - a.finishedAt!.getTime())
        .slice(0, limit)
        .map((g) => ({
          gameId: g.id,
          levelId: g.levelId,
          score: g.score!,
          durationMs: duration(g),
          finishedAt: g.finishedAt!.toISOString(),
        }));
    },
    async bestScores(userId) {
      const best = new Map<number, number>();
      for (const g of games.values()) {
        if (g.userId === userId && g.status === "terminee") {
          best.set(g.levelId, Math.max(best.get(g.levelId) ?? 0, g.score!));
        }
      }
      return [...best].sort(([a], [b]) => a - b).map(([levelId, score]) => ({ levelId, score }));
    },
    async startGame(userId, levelId, startedAt) {
      for (const g of games.values()) {
        if (g.userId === userId && g.status === "en_cours") Object.assign(g, { status: "abandonnee", finishedAt: startedAt });
      }
      const id = `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`;
      const game: GameRow = {
        id, userId, levelId, status: "en_cours", startedAt, ruleDurationMs: 180_000, score: null, finishedAt: null,
      };
      games.set(id, game);
      return game;
    },
    async getGame(id) {
      return games.get(id) ?? null;
    },
    async finishGame({ gameId, userId, score, finishedAt }) {
      const g = games.get(gameId);
      if (!g || g.userId !== userId || g.status !== "en_cours") return null;
      Object.assign(g, { status: "terminee" as GameStatus, score, finishedAt });
      return { rank: ranked(g.levelId).indexOf(g) + 1, durationMs: duration(g) };
    },
    async abandonGame(gameId, userId, at) {
      const g = games.get(gameId);
      if (!g || g.userId !== userId || g.status !== "en_cours") return false;
      Object.assign(g, { status: "abandonnee" as GameStatus, finishedAt: at });
      return true;
    },
    async top(levelId, limit): Promise<LeaderboardEntry[]> {
      return ranked(levelId)
        .slice(0, limit)
        .map((g, i) => ({
          rank: i + 1,
          pseudo: pseudos.get(g.userId)!,
          score: g.score!,
          durationMs: duration(g),
          finishedAt: g.finishedAt!.toISOString(),
        }));
    },
  };
}

const clock = { now: new Date("2026-10-02T12:00:00Z") };
const advance = (ms: number) => void (clock.now = new Date(clock.now.getTime() + ms));

const tokens: Record<string, string> = { "t-alice": "user-alice", "t-bob": "user-bob", "t-carol": "user-carol" };
const auth = (who: string) => ({ authorization: `Bearer t-${who}` });

describe("API", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  const call = (method: "GET" | "POST" | "PUT", url: string, who?: string, payload?: object) =>
    app.inject({ method, url, headers: who ? auth(who) : {}, payload });

  const setPseudo = (who: string, pseudo: string) => call("PUT", "/me", who, { pseudo });

  /** Starts a game, lets `elapsedMs` pass, then finishes it. */
  const play = async (who: string, score: number, elapsedMs = 180_000, levelId = 1) => {
    const start = await call("POST", "/games", who, { levelId });
    const { gameId } = start.json();
    advance(elapsedMs);
    return { gameId, res: await call("POST", `/games/${gameId}/finish`, who, { score }) };
  };

  beforeEach(async () => {
    clock.now = new Date("2026-10-02T12:00:00Z");
    app = await buildApp({
      repository: memoryRepository(),
      authenticate: async (token) => tokens[token] ?? null,
      now: () => clock.now,
    });
    await setPseudo("alice", "Alice");
    await setPseudo("bob", "Bob");
    await setPseudo("carol", "Carol");
  });

  describe("authentication", () => {
    it.each([
      ["GET", "/me"],
      ["PUT", "/me"],
      ["POST", "/games"],
      ["POST", "/games/00000000-0000-4000-8000-000000000001/finish"],
      ["POST", "/games/00000000-0000-4000-8000-000000000001/abandon"],
      ["GET", "/me/games"],
      ["GET", "/me/best"],
      ["GET", "/pseudos/Alice/available"],
    ] as const)("%s %s requires a valid token", async (method, url) => {
      expect((await call(method, url)).statusCode).toBe(401);
      const bad = await app.inject({ method, url, headers: { authorization: "Bearer nope" } });
      expect(bad.statusCode).toBe(401);
    });

    it("keeps the leaderboard and /health public", async () => {
      expect((await call("GET", "/leaderboard/1")).statusCode).toBe(200);
      expect((await call("GET", "/health")).statusCode).toBe(200);
    });

    it("does not rate limit /health", async () => {
      for (let i = 0; i < 80; i++) expect((await call("GET", "/health")).statusCode).toBe(200);
    });
  });

  describe("profile", () => {
    it("returns the profile once created", async () => {
      expect((await call("GET", "/me", "alice")).json()).toEqual({ id: "user-alice", pseudo: "Alice" });
    });

    it("returns 404 when no profile exists yet", async () => {
      tokens["t-newbie"] = "user-newbie";
      expect((await call("GET", "/me", "newbie")).statusCode).toBe(404);
    });

    it("creates the profile of a new player and trims the pseudo", async () => {
      tokens["t-newbie"] = "user-newbie";
      const res = await setPseudo("newbie", "  Ana  ");
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ id: "user-newbie", pseudo: "Ana" });
    });

    it("rejects a pseudo already taken, whatever its case", async () => {
      tokens["t-newbie"] = "user-newbie";
      const res = await setPseudo("newbie", "alice");
      expect(res.statusCode).toBe(409);
      expect(res.json()).toEqual({ error: "Pseudo already taken" });
    });

    it("accepts the same pseudo sent again, so a retry after a lost response succeeds", async () => {
      const res = await setPseudo("alice", "Alice");
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ id: "user-alice", pseudo: "Alice" });
    });

    it("never changes a pseudo once chosen", async () => {
      const res = await setPseudo("alice", "Alicia");
      expect(res.statusCode).toBe(409);
      expect(res.json()).toEqual({ error: "Pseudo already chosen" });
      expect((await call("GET", "/me", "alice")).json().pseudo).toBe("Alice");
    });

    it.each(["A", "<script>", "x".repeat(17), ""])("rejects invalid pseudo %j", async (pseudo) => {
      tokens["t-newbie"] = "user-newbie";
      expect((await setPseudo("newbie", pseudo)).statusCode).toBe(400);
    });
  });

  describe("pseudo availability", () => {
    const check = (pseudo: string) => call("GET", `/pseudos/${encodeURIComponent(pseudo)}/available`, "alice");

    it("tells that a free pseudo is available", async () => {
      expect((await check("Gordon")).json()).toEqual({ pseudo: "Gordon", available: true });
    });

    it("tells that a taken pseudo is not, whatever its case", async () => {
      expect((await check("bOb")).json()).toEqual({ pseudo: "bOb", available: false });
    });

    it.each(["A", "<script>", "x".repeat(17)])("rejects invalid pseudo %j with 400", async (pseudo) => {
      expect((await check(pseudo)).statusCode).toBe(400);
    });
  });

  describe("player history", () => {
    it("lists own finished games, newest first, without abandoned or open ones", async () => {
      await play("alice", 100, 180_000, 1);
      await play("bob", 999, 180_000, 1);
      await play("alice", 250, 181_000, 2);
      const abandoned = (await call("POST", "/games", "alice", { levelId: 3 })).json().gameId;
      await call("POST", `/games/${abandoned}/abandon`, "alice");
      await call("POST", "/games", "alice", { levelId: 4 }); // still in progress

      const { games } = (await call("GET", "/me/games", "alice")).json();
      expect(games.map((g: { levelId: number; score: number }) => [g.levelId, g.score])).toEqual([
        [2, 250],
        [1, 100],
      ]);
      expect(games[0]).toMatchObject({ durationMs: 181_000 });
      expect(games[0].gameId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it("respects the limit and validates it", async () => {
      await play("alice", 100);
      await play("alice", 200);
      expect((await call("GET", "/me/games?limit=1", "alice")).json().games).toHaveLength(1);
      expect((await call("GET", "/me/games?limit=1000", "alice")).statusCode).toBe(400);
    });

    it("returns an empty list for a player who never played", async () => {
      expect((await call("GET", "/me/games", "bob")).json()).toEqual({ games: [] });
    });
  });

  describe("best scores", () => {
    it("returns the best score of the player on each level they played", async () => {
      await play("alice", 100, 180_000, 1);
      await play("alice", 300, 180_000, 1);
      await play("alice", 200, 180_000, 3);
      await play("bob", 500, 180_000, 2);
      expect((await call("GET", "/me/best", "alice")).json()).toEqual({
        scores: [
          { levelId: 1, score: 300 },
          { levelId: 3, score: 200 },
        ],
      });
    });

    it("returns an empty list for a player who never played", async () => {
      expect((await call("GET", "/me/best", "carol")).json()).toEqual({ scores: [] });
    });
  });

  describe("starting a game", () => {
    it("starts a game and returns its server-side id", async () => {
      const res = await call("POST", "/games", "alice", { levelId: 2 });
      expect(res.statusCode).toBe(201);
      expect(res.json()).toMatchObject({ levelId: 2, startedAt: clock.now.toISOString() });
      expect(res.json().gameId).toMatch(/^[0-9a-f-]{36}$/);
    });

    it("requires a profile", async () => {
      tokens["t-newbie"] = "user-newbie";
      expect((await call("POST", "/games", "newbie", { levelId: 1 })).statusCode).toBe(403);
    });

    it.each([{ levelId: 9 }, { levelId: "1" }, { levelId: true }, {}])("rejects %j with 400", async (body) => {
      expect((await call("POST", "/games", "alice", body)).statusCode).toBe(400);
    });
  });

  describe("finishing a game", () => {
    it("ranks a finished game and measures the duration itself", async () => {
      const { res } = await play("alice", 300, 181_500);
      expect(res.statusCode).toBe(200);
      expect(res.json()).toEqual({ rank: 1, score: 300, durationMs: 181_500 });
    });

    it("ignores any duration sent by the client", async () => {
      const { gameId } = (await call("POST", "/games", "alice", { levelId: 1 })).json();
      advance(180_000);
      const res = await call("POST", `/games/${gameId}/finish`, "alice", { score: 100, durationMs: 1 });
      expect(res.json().durationMs).toBe(180_000);
    });

    it("cannot finish the same game twice", async () => {
      const { gameId } = await play("alice", 100);
      expect((await call("POST", `/games/${gameId}/finish`, "alice", { score: 999 })).statusCode).toBe(409);
    });

    it("hides other players' games behind a 404", async () => {
      const { gameId } = (await call("POST", "/games", "alice", { levelId: 1 })).json();
      advance(180_000);
      expect((await call("POST", `/games/${gameId}/finish`, "bob", { score: 100 })).statusCode).toBe(404);
    });

    it("returns 404 for a malformed game id", async () => {
      expect((await call("POST", "/games/not-a-uuid/finish", "alice", { score: 1 })).statusCode).toBe(404);
    });

    it("rejects an impossibly fast run and closes the game", async () => {
      const { gameId, res } = await play("alice", 100, 1_000);
      expect(res.statusCode).toBe(422);
      expect((await call("POST", `/games/${gameId}/finish`, "alice", { score: 100 })).statusCode).toBe(409);
      expect((await call("GET", "/leaderboard/1")).json().entries).toEqual([]);
    });

    it("rejects a run far longer than the rules duration", async () => {
      expect((await play("alice", 100, 300_000)).res.statusCode).toBe(422);
    });

    it("accepts a run slightly off the rules duration (lag, pause)", async () => {
      expect((await play("alice", 100, 176_000)).res.statusCode).toBe(200);
      expect((await play("bob", 100, 230_000)).res.statusCode).toBe(200);
    });

    it("rejects a score above the level maximum", async () => {
      expect((await play("alice", 99_999)).res.statusCode).toBe(422);
    });

    it.each([{ score: -1 }, { score: "10" }, {}])("rejects body %j with 400", async (body) => {
      const { gameId } = (await call("POST", "/games", "alice", { levelId: 1 })).json();
      advance(180_000);
      expect((await call("POST", `/games/${gameId}/finish`, "alice", body)).statusCode).toBe(400);
    });
  });

  describe("abandoning a game", () => {
    it("abandons a game in progress, which never reaches the leaderboard", async () => {
      const { gameId } = (await call("POST", "/games", "alice", { levelId: 1 })).json();
      expect((await call("POST", `/games/${gameId}/abandon`, "alice")).statusCode).toBe(204);
      advance(180_000);
      expect((await call("POST", `/games/${gameId}/finish`, "alice", { score: 100 })).statusCode).toBe(409);
      expect((await call("GET", "/leaderboard/1")).json().entries).toEqual([]);
    });

    it("abandons the previous game when a new one starts: one open game per player", async () => {
      const first = (await call("POST", "/games", "alice", { levelId: 1 })).json().gameId;
      await call("POST", "/games", "alice", { levelId: 1 });
      advance(180_000);
      expect((await call("POST", `/games/${first}/finish`, "alice", { score: 100 })).statusCode).toBe(409);
    });
  });

  describe("leaderboard", () => {
    it("sorts by score, then by duration", async () => {
      await play("alice", 200, 180_000);
      await play("bob", 300, 185_000);
      await play("carol", 300, 178_000);
      const { entries } = (await call("GET", "/leaderboard/1")).json();
      expect(entries.map((e: LeaderboardEntry) => [e.rank, e.pseudo])).toEqual([
        [1, "Carol"],
        [2, "Bob"],
        [3, "Alice"],
      ]);
    });

    it("returns a rank consistent with the leaderboard on a tie", async () => {
      await play("bob", 300, 185_000);
      expect((await play("carol", 300, 178_000)).res.json().rank).toBe(1);
    });

    it("only lists finished games of the requested level", async () => {
      await play("alice", 100, 180_000, 1);
      await play("bob", 100, 180_000, 2);
      await call("POST", "/games", "carol", { levelId: 1 }); // still in progress
      const { entries } = (await call("GET", "/leaderboard/1")).json();
      expect(entries.map((e: LeaderboardEntry) => e.pseudo)).toEqual(["Alice"]);
    });

    it("respects the limit and validates params", async () => {
      await play("alice", 100);
      await play("bob", 200);
      expect((await call("GET", "/leaderboard/1?limit=1")).json().entries).toHaveLength(1);
      expect((await call("GET", "/leaderboard/42")).statusCode).toBe(400);
      expect((await call("GET", "/leaderboard/1?limit=1000")).statusCode).toBe(400);
    });
  });

  it("hides internal errors behind a generic 500", async () => {
    const failing = await buildApp({
      repository: {
        ...memoryRepository(),
        getProfile: async () => {
          throw new Error("password authentication failed for user postgres");
        },
      },
      authenticate: async (token) => tokens[token] ?? null,
    });
    const res = await failing.inject({ method: "GET", url: "/me", headers: auth("alice") });
    expect(res.statusCode).toBe(500);
    expect(res.json()).toEqual({ error: "Internal error" });
  });
});
