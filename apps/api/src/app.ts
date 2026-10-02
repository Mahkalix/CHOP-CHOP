import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyError } from "fastify";
import type { ScoreRepository } from "./repository.js";
import { leaderboardRoutes } from "./routes/leaderboard.js";
import { scoreRoutes } from "./routes/scores.js";

export interface AppOptions {
  repository: ScoreRepository;
  corsOrigin?: string | string[] | boolean;
  /** Set to true behind a reverse proxy (Render, Fly, ...) so rate limiting sees the client IP. */
  trustProxy?: boolean;
  logger?: boolean;
}

export async function buildApp({
  repository,
  corsOrigin = true,
  trustProxy = false,
  logger = false,
}: AppOptions) {
  const app = Fastify({ logger, trustProxy });

  app.setErrorHandler((error: FastifyError, request, reply) => {
    const status = error.statusCode ?? 500;
    if (status >= 500) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal error" }); // never leak DB details
    }
    return reply.code(status).send({ error: error.message });
  });

  await app.register(cors, { origin: corsOrigin });
  await app.register(rateLimit, { max: 60, timeWindow: "1 minute" });

  app.get("/health", { config: { rateLimit: false } }, async () => ({ status: "ok" }));
  await app.register(scoreRoutes, { repository });
  await app.register(leaderboardRoutes, { repository });

  return app;
}
