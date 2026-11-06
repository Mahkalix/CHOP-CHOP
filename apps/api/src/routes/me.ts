import { ProfileInputSchema } from "@chopchop/shared";
import type { FastifyPluginAsync } from "fastify";
import type { RouteDeps } from "../deps.js";

export const meRoutes: FastifyPluginAsync<RouteDeps> = async (app, { repository, requireAuth }) => {
  app.get("/me", { preHandler: requireAuth }, async (request, reply) => {
    const profile = await repository.getProfile(request.userId);
    if (!profile) return reply.code(404).send({ error: "Profile not created yet" });
    return profile;
  });

  app.put("/me", { preHandler: requireAuth }, async (request, reply) => {
    const parsed = ProfileInputSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid payload",
        issues: parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      });
    }
    const result = await repository.saveProfile(request.userId, parsed.data.pseudo);
    if (result === "pseudo_taken") return reply.code(409).send({ error: "Pseudo already taken" });
    return { id: request.userId, pseudo: parsed.data.pseudo };
  });
};
