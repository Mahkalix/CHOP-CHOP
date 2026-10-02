import { LEVEL_LIMITS, ScoreSubmissionSchema, type SubmitScoreResponse } from "@chopchop/shared";
import type { FastifyPluginAsync } from "fastify";
import type { ScoreRepository } from "../repository.js";

export const scoreRoutes: FastifyPluginAsync<{ repository: ScoreRepository }> = async (app, { repository }) => {
  app.post("/scores", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (request, reply) => {
    const parsed = ScoreSubmissionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid payload",
        issues: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
    }

    const submission = parsed.data;
    const limits = LEVEL_LIMITS[submission.levelId];
    const plausible =
      submission.score <= limits.maxScore &&
      submission.durationMs >= limits.minDurationMs &&
      submission.durationMs <= limits.maxDurationMs;
    if (!plausible) {
      return reply.code(422).send({ error: "Implausible score" });
    }

    const result: SubmitScoreResponse = await repository.insert(submission);
    return reply.code(201).send(result);
  });
};
