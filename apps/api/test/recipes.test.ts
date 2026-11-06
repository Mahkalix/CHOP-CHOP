import { INGREDIENT_STATES, PHASES, PREPARATIONS, RECIPES } from "@chopchop/shared";
import { describe, expect, it } from "vitest";
import { buildApp } from "../src/app.js";
import type { Repository } from "../src/repository.js";

describe("GET /recipes", () => {
  // The route is public and never touches the database.
  const build = () => buildApp({ repository: {} as Repository, authenticate: async () => null });

  it("serves the kitchen rules without any token", async () => {
    const app = await build();
    const res = await app.inject({ method: "GET", url: "/recipes" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({
      ingredients: INGREDIENT_STATES,
      preparations: PREPARATIONS,
      recipes: RECIPES,
      phases: PHASES,
    });
  });
});
