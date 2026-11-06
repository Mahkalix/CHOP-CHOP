import {
  FinishGameSchema,
  GAME_DURATION_TOLERANCE_MS,
  LEVEL_LIMITS,
  StartGameSchema,
  type FinishGameResponse,
  type StartGameResponse,
} from "@chopchop/shared";
import type { FastifyPluginAsync, FastifyReply } from "fastify";
import { z } from "zod";
import type { RouteDeps } from "../deps.js";

const GameIdParamsSchema = z.object({ id: z.string().uuid() });
const writeLimit = { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } };

const invalid = (reply: FastifyReply, error: z.ZodError) =>
  reply.code(400).send({
    error: "Invalid payload",
    issues: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  });

export const gameRoutes: FastifyPluginAsync<RouteDeps> = async (app, { repository, requireAuth, now }) => {
  app.post("/games", { ...writeLimit, preHandler: requireAuth }, async (request, reply) => {
    const body = StartGameSchema.safeParse(request.body);
    if (!body.success) return invalid(reply, body.error);

    if (!(await repository.getProfile(request.userId))) {
      return reply.code(403).send({ error: "Create a profile first (PUT /me)" });
    }
    const game = await repository.startGame(request.userId, body.data.levelId, now());
    const response: StartGameResponse = {
      gameId: game.id,
      levelId: game.levelId,
      startedAt: game.startedAt.toISOString(),
    };
    return reply.code(201).send(response);
  });

  app.post("/games/:id/finish", { ...writeLimit, preHandler: requireAuth }, async (request, reply) => {
    const params = GameIdParamsSchema.safeParse(request.params);
    const body = FinishGameSchema.safeParse(request.body);
    if (!params.success) return reply.code(404).send({ error: "Game not found" });
    if (!body.success) return invalid(reply, body.error);

    const game = await repository.getGame(params.data.id);
    if (!game || game.userId !== request.userId) return reply.code(404).send({ error: "Game not found" });
    if (game.status !== "en_cours") return reply.code(409).send({ error: "Game already ended" });

    // The duration is measured here: the client cannot claim a faster run.
    const finishedAt = now();
    const durationMs = finishedAt.getTime() - game.startedAt.getTime();
    const limits = LEVEL_LIMITS[game.levelId as keyof typeof LEVEL_LIMITS];
    const plausible =
      body.data.score <= limits.maxScore &&
      durationMs >= game.ruleDurationMs - GAME_DURATION_TOLERANCE_MS.early &&
      durationMs <= game.ruleDurationMs + GAME_DURATION_TOLERANCE_MS.late;
    if (!plausible) {
      // Closing the game stops a client from probing the bounds with repeated attempts.
      await repository.abandonGame(game.id, request.userId, finishedAt);
      return reply.code(422).send({ error: "Implausible score" });
    }

    const result = await repository.finishGame({
      gameId: game.id,
      userId: request.userId,
      score: body.data.score,
      bestCombo: body.data.bestCombo,
      finishedAt,
    });
    if (!result) return reply.code(409).send({ error: "Game already ended" });

    const response: FinishGameResponse = { ...result, score: body.data.score };
    return response;
  });

  app.post("/games/:id/abandon", { ...writeLimit, preHandler: requireAuth }, async (request, reply) => {
    const params = GameIdParamsSchema.safeParse(request.params);
    if (!params.success) return reply.code(404).send({ error: "Game not found" });

    const game = await repository.getGame(params.data.id);
    if (!game || game.userId !== request.userId) return reply.code(404).send({ error: "Game not found" });
    if (game.status !== "en_cours") return reply.code(409).send({ error: "Game already ended" });

    await repository.abandonGame(game.id, request.userId, now());
    return reply.code(204).send();
  });
};
