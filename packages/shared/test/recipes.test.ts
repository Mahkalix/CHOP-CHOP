import { describe, expect, it } from "vitest";
import {
  INGREDIENT_STATES,
  ITEM_KINDS,
  PHASES,
  PREPARATIONS,
  RECIPES,
  availableRecipes,
  matchRecipe,
  preparationFor,
  type Ingredient,
} from "../src/recipes.js";

const tomato = (state: "raw" | "chopped"): Ingredient => ({ kind: "tomato", state });
const meat = (state: "raw" | "cooked" | "burnt"): Ingredient => ({ kind: "meat", state });

describe("item kinds and ingredient states", () => {
  it("keeps the kinds used by the kitchen in the front", () => {
    expect(ITEM_KINDS).toEqual(["tomato", "meat", "plate"]);
  });

  it("gives each ingredient its states, from raw to the last one", () => {
    expect(INGREDIENT_STATES).toEqual({
      tomato: ["raw", "chopped"],
      meat: ["raw", "cooked", "burnt"],
    });
  });
});

describe("preparations", () => {
  it("chops a raw tomato in 3 seconds", () => {
    expect(preparationFor(tomato("raw"))).toEqual({
      ingredient: "tomato", action: "chop", from: "raw", to: "chopped", seconds: 3,
    });
  });

  it("cooks raw meat in 8 seconds", () => {
    expect(preparationFor(meat("raw"))).toEqual({
      ingredient: "meat", action: "cook", from: "raw", to: "cooked", seconds: 8,
    });
  });

  it("burns cooked meat 6 seconds after the end of cooking", () => {
    expect(preparationFor(meat("cooked"))).toEqual({
      ingredient: "meat", action: "burn", from: "cooked", to: "burnt", seconds: 6,
    });
  });

  it.each([tomato("chopped"), meat("burnt")])("has nothing more to do on %j: burnt is irreversible", (ingredient) => {
    expect(preparationFor(ingredient)).toBeNull();
  });

  it("only ever moves an ingredient forward, never back to an earlier state", () => {
    for (const p of PREPARATIONS) {
      const states: readonly string[] = INGREDIENT_STATES[p.ingredient];
      expect(states.indexOf(p.to)).toBeGreaterThan(states.indexOf(p.from));
    }
  });
});

describe("recipes", () => {
  it("lists the three recipes with a French name", () => {
    expect(RECIPES.map((r) => [r.id, r.name])).toEqual([
      ["prepared-tomato", "Tomate préparée"],
      ["grilled-meat", "Viande grillée"],
      ["mixed-plate", "Assiette mixte"],
    ]);
  });

  it.each([
    ["a chopped tomato", [tomato("chopped")], "prepared-tomato"],
    ["a cooked meat", [meat("cooked")], "grilled-meat"],
    ["a chopped tomato and a cooked meat", [tomato("chopped"), meat("cooked")], "mixed-plate"],
    ["a cooked meat and a chopped tomato, in any order", [meat("cooked"), tomato("chopped")], "mixed-plate"],
  ])("recognises %s", (_label, contents, expected) => {
    expect(matchRecipe(contents)).toBe(expected);
  });

  it.each([
    ["an empty plate", []],
    ["a raw tomato", [tomato("raw")]],
    ["raw meat", [meat("raw")]],
    ["burnt meat", [meat("burnt")]],
    ["a chopped tomato with burnt meat", [tomato("chopped"), meat("burnt")]],
    ["a chopped tomato with raw meat", [tomato("chopped"), meat("raw")]],
    ["an extra ingredient", [tomato("chopped"), tomato("chopped"), meat("cooked")]],
    ["the same ingredient twice", [meat("cooked"), meat("cooked")]],
  ])("rejects %s", (_label, contents) => {
    expect(matchRecipe(contents)).toBeNull();
  });
});

describe("available recipes", () => {
  const first = ["prepared-tomato", "grilled-meat"];
  const all = ["prepared-tomato", "grilled-meat", "mixed-plate"];

  it("starts with the two simple recipes", () => {
    expect(availableRecipes(0)).toEqual(first);
    expect(availableRecipes(59.9)).toEqual(first);
  });

  it("adds the mixed plate after 60 seconds", () => {
    expect(availableRecipes(60)).toEqual(all);
    expect(availableRecipes(119)).toEqual(all);
  });

  it("keeps all three recipes until the end of the 180 seconds and beyond", () => {
    expect(availableRecipes(120)).toEqual(all);
    expect(availableRecipes(180)).toEqual(all);
    expect(availableRecipes(500)).toEqual(all);
  });

  it("treats a negative time as the start of the game", () => {
    expect(availableRecipes(-5)).toEqual(first);
  });

  it("only offers recipes that exist", () => {
    const ids = RECIPES.map((r) => r.id);
    for (const phase of PHASES) for (const id of phase.recipes) expect(ids).toContain(id);
  });
});
