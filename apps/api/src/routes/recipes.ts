import { INGREDIENT_STATES, PHASES, PREPARATIONS, RECIPES, type RecipesResponse } from "@chopchop/shared";
import type { FastifyPluginAsync } from "fastify";

/** Public: the kitchen rules never depend on the player, and no database is involved. */
export const recipesRoutes: FastifyPluginAsync = async (app) => {
  app.get("/recipes", async () => {
    const response: RecipesResponse = {
      ingredients: INGREDIENT_STATES,
      preparations: PREPARATIONS,
      recipes: RECIPES,
      phases: PHASES,
    };
    return response;
  });
};
