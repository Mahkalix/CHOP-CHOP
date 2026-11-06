/**
 * Rules of the kitchen: ingredients and their states, how they are prepared, the recipes and when
 * they become available. The values come from `documentation/docs/gameplay.md` and `score.md`
 * and are the prototype's proposals: change them here, and nowhere else.
 */

export const ITEM_KINDS = ["tomato", "meat", "plate"] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

/** What goes on a plate: every item except the plate itself. */
export type IngredientKind = Exclude<ItemKind, "plate">;

/** States of each ingredient, in the order it goes through them. */
export const INGREDIENT_STATES = {
  tomato: ["raw", "chopped"],
  meat: ["raw", "cooked", "burnt"],
} as const satisfies Record<IngredientKind, readonly string[]>;

/** An ingredient in a given state, e.g. `{ kind: "meat", state: "cooked" }`. */
export type Ingredient = {
  [K in IngredientKind]: { readonly kind: K; readonly state: (typeof INGREDIENT_STATES)[K][number] };
}[IngredientKind];
export type IngredientState = Ingredient["state"];

export type PreparationAction = "chop" | "cook" | "burn";

/** One step that changes the state of an ingredient. */
export interface Preparation {
  readonly ingredient: IngredientKind;
  readonly action: PreparationAction;
  readonly from: IngredientState;
  readonly to: IngredientState;
  /**
   * Chop: time spent in front of the board. Cook: time on the grill.
   * Burn: time left to take the cooked meat off the grill before it burns.
   */
  readonly seconds: number;
}

export const PREPARATIONS: readonly Preparation[] = [
  { ingredient: "tomato", action: "chop", from: "raw", to: "chopped", seconds: 3 },
  { ingredient: "meat", action: "cook", from: "raw", to: "cooked", seconds: 8 },
  { ingredient: "meat", action: "burn", from: "cooked", to: "burnt", seconds: 6 },
];

/** The next step for an ingredient, or null when its state is final (burnt meat stays burnt). */
export function preparationFor(ingredient: Ingredient): Preparation | null {
  return PREPARATIONS.find((p) => p.ingredient === ingredient.kind && p.from === ingredient.state) ?? null;
}

export type RecipeId = "prepared-tomato" | "grilled-meat" | "mixed-plate";

export interface Recipe {
  readonly id: RecipeId;
  readonly name: string;
  /** Exact content of the plate. */
  readonly ingredients: readonly Ingredient[];
}

export const RECIPES: readonly Recipe[] = [
  { id: "prepared-tomato", name: "Tomate préparée", ingredients: [{ kind: "tomato", state: "chopped" }] },
  { id: "grilled-meat", name: "Viande grillée", ingredients: [{ kind: "meat", state: "cooked" }] },
  {
    id: "mixed-plate",
    name: "Assiette mixte",
    ingredients: [
      { kind: "tomato", state: "chopped" },
      { kind: "meat", state: "cooked" },
    ],
  },
];

const keyOf = (ingredient: Ingredient) => `${ingredient.kind}:${ingredient.state}`;
const sortedKeys = (list: readonly Ingredient[]) => list.map(keyOf).sort().join(",");

/**
 * The recipe made by the content of a plate, or null. The order does not matter, but an extra
 * ingredient or an ingredient in the wrong state makes the plate invalid.
 */
export function matchRecipe(contents: readonly Ingredient[]): RecipeId | null {
  const wanted = sortedKeys(contents);
  return RECIPES.find((recipe) => sortedKeys(recipe.ingredients) === wanted)?.id ?? null;
}

/** From `fromSecond` of the game on, only these recipes can be ordered. */
export interface Phase {
  readonly fromSecond: number;
  readonly recipes: readonly RecipeId[];
}

export const PHASES: readonly Phase[] = [
  { fromSecond: 0, recipes: ["prepared-tomato", "grilled-meat"] },
  { fromSecond: 60, recipes: ["prepared-tomato", "grilled-meat", "mixed-plate"] },
  { fromSecond: 120, recipes: ["prepared-tomato", "grilled-meat", "mixed-plate"] },
];

/** Recipes that can be ordered once `elapsedSeconds` of the game have passed. */
export function availableRecipes(elapsedSeconds: number): readonly RecipeId[] {
  const elapsed = Math.max(elapsedSeconds, 0);
  return PHASES.filter((phase) => phase.fromSecond <= elapsed).at(-1)?.recipes ?? [];
}

/** GET /recipes: the same constants the game imports, for clients that prefer to fetch them. */
export interface RecipesResponse {
  ingredients: typeof INGREDIENT_STATES;
  preparations: readonly Preparation[];
  recipes: readonly Recipe[];
  phases: readonly Phase[];
}
