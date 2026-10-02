import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify, { type FastifyError } from "fastify";
import { authGuard, type Authenticate } from "./auth.js";
import type { Repository } from "./repository.js";
import { gameRoutes } from "./routes/games.js";
import { leaderboardRoutes } from "./routes/leaderboard.js";
import { meRoutes } from "./routes/me.js";

export interface AppOptions {
  repository: Repository;
  authenticate: Authenticate;
  corsOrigin?: string | string[] | boolean;
  /** Set to true behind a reverse proxy (Render, Fly, ...) so rate limiting sees the client IP. */
  trustProxy?: boolean;
  /** Clock, injectable for tests. The server alone measures game durations. */
  now?: () => Date;
  logger?: boolean;
}

export async function buildApp({
  repository,
  authenticate,
  corsOrigin = true,
  trustProxy = false,
  now = () => new Date(),
  logger = false,
}: AppOptions) {
  const app = Fastify({ logger, trustProxy });

  app.decorateRequest("userId", "");
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const status = error.statusCode ?? 500;
    if (status >= 500) {
      request.log.error(error);
      return reply.code(500).send({ error: "Internal error" }); // never leak DB details
    }
    return reply.code(status).send({ error: error.message });
  });

  await app.register(cors, { origin: corsOrigin, methods: ["GET", "POST", "PUT", "OPTIONS"] });
  await app.register(rateLimit, { max: 60, timeWindow: "1 minute" });

  const deps = { repository, requireAuth: authGuard(authenticate), now };
  app.get("/health", { config: { rateLimit: false } }, async () => ({ status: "ok" }));
  await app.register(meRoutes, deps);
  await app.register(gameRoutes, deps);
  await app.register(leaderboardRoutes, deps);

  return app;
}
