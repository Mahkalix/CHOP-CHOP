import {
  LimitQuerySchema,
  ProfileInputSchema,
  PseudoSchema,
  type BestScoresResponse,
  type PlayerGamesResponse,
  type PseudoAvailabilityResponse,
} from "@chopchop/shared";
import type { FastifyPluginAsync, FastifyReply } from "fastify";
import type { z } from "zod";
import type { RouteDeps } from "../deps.js";

const readLimit = { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } };

const invalid = (reply: FastifyReply, error: z.ZodError) =>
  reply.code(400).send({
    error: "Invalid payload",
    issues: error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
  });

export const meRoutes: FastifyPluginAsync<RouteDeps> = async (app, { repository, requireAuth }) => {
  app.get("/me", { preHandler: requireAuth }, async (request, reply) => {
    const profile = await repository.getProfile(request.userId);
    if (!profile) return reply.code(404).send({ error: "Profile not created yet" });
    return profile;
  });

  // The pseudo is chosen once and never changes: past scores keep the same name on the leaderboards.
  app.put("/me", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = ProfileInputSchema.safeParse(request.body);
    if (!parsed.success) return invalid(reply, parsed.error);

    const result = await repository.saveProfile(request.userId, parsed.data.pseudo);
    if (result === "pseudo_taken") return reply.code(409).send({ error: "Pseudo already taken" });
    if (result === "already_set") {
      // Sending the same pseudo again is a harmless retry (lost response), not a change.
      const current = await repository.getProfile(request.userId);
      if (current?.pseudo !== parsed.data.pseudo) {
        return reply.code(409).send({ error: "Pseudo already chosen" });
      }
    }
    return { id: request.userId, pseudo: parsed.data.pseudo };
  });

  app.get("/me/games", { ...readLimit, preHandler: requireAuth }, async (request, reply) => {
    const query = LimitQuerySchema.safeParse(request.query);
    if (!query.success) return invalid(reply, query.error);

    const response: PlayerGamesResponse = {
      games: await repository.playerGames(request.userId, query.data.limit),
    };
    return response;
  });

  app.get("/me/best", { ...readLimit, preHandler: requireAuth }, async (request) => {
    const response: BestScoresResponse = { scores: await repository.bestScores(request.userId) };
    return response;
  });

  app.get<{ Params: { pseudo: string } }>(
    "/pseudos/:pseudo/available",
    { ...readLimit, preHandler: requireAuth },
    async (request, reply) => {
      const pseudo = PseudoSchema.safeParse(request.params.pseudo);
      if (!pseudo.success) return invalid(reply, pseudo.error);

      const response: PseudoAvailabilityResponse = {
        pseudo: pseudo.data,
        available: await repository.isPseudoAvailable(pseudo.data),
      };
      return response;
    },
  );
};
