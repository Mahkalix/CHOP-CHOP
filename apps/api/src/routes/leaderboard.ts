import { LeaderboardQuerySchema, LevelIdParamSchema, type LeaderboardResponse } from "@chopchop/shared";
import type { FastifyPluginAsync } from "fastify";
import type { ScoreRepository } from "../repository.js";

export const leaderboardRoutes: FastifyPluginAsync<{ repository: ScoreRepository }> = async (
  app,
  { repository },
) => {
  app.get<{ Params: { levelId: string } }>("/leaderboard/:levelId", async (request, reply) => {
    const level = LevelIdParamSchema.safeParse(request.params.levelId);
    const query = LeaderboardQuerySchema.safeParse(request.query);
    if (!level.success || !query.success) {
      return reply.code(400).send({ error: "Invalid level or query" });
    }

    const response: LeaderboardResponse = {
      levelId: level.data,
      entries: await repository.top(level.data, query.data.limit),
    };
    return response;
  });
};
