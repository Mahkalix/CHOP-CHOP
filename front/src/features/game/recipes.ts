import { RECIPES, matchRecipe } from '@chopchop/shared';
import type { Ingredient, Plate } from './interactions';

export type { RecipeId } from '@chopchop/shared';
/** Labels adapt the shared catalog for the HUD; recipe identities/compositions stay shared. */
export const recipes = RECIPES.map(recipe => ({ ...recipe, label: recipe.name }));

export function identifyRecipe(ingredients: readonly Ingredient[]) {
  const id = matchRecipe(ingredients);
  return recipes.find(recipe => recipe.id === id) ?? null;
}

export function addIngredient(plate: Plate, ingredient: Ingredient): Plate | null {
  const ingredients = [...plate.ingredients, ingredient];
  const compatible = recipes.some(recipe => ingredients.length <= recipe.ingredients.length
    && ingredients.every(item => recipe.ingredients.some(required => item.kind === required.kind && item.state === required.state))
    && new Set(ingredients.map(item => item.kind)).size === ingredients.length);
  return compatible ? { ...plate, ingredients } : null;
}
