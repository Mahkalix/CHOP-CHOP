import type { Ingredient, Plate } from './interactions';

export type RecipeId = 'tomato' | 'meat' | 'mixed';
type Requirement = { kind: 'tomato'; state: 'chopped' } | { kind: 'meat'; state: 'cooked' };
/** Compositions already shown in the prototype rules; final level allocation belongs to #14. */
export const recipes: readonly { id: RecipeId; label: string; ingredients: readonly Requirement[] }[] = [
  { id: 'tomato', label: 'Assiette de tomate', ingredients: [{ kind: 'tomato', state: 'chopped' }] },
  { id: 'meat', label: 'Viande grillée', ingredients: [{ kind: 'meat', state: 'cooked' }] },
  { id: 'mixed', label: 'Assiette mixte', ingredients: [{ kind: 'tomato', state: 'chopped' }, { kind: 'meat', state: 'cooked' }] },
];

export function identifyRecipe(ingredients: readonly Ingredient[]) {
  return recipes.find(recipe => recipe.ingredients.length === ingredients.length
    && recipe.ingredients.every(required => ingredients.filter(item => item.kind === required.kind && item.state === required.state).length === 1)) ?? null;
}

export function addIngredient(plate: Plate, ingredient: Ingredient): Plate | null {
  const ingredients = [...plate.ingredients, ingredient];
  const compatible = recipes.some(recipe => ingredients.length <= recipe.ingredients.length
    && ingredients.every(item => recipe.ingredients.some(required => item.kind === required.kind && item.state === required.state))
    && new Set(ingredients.map(item => item.kind)).size === ingredients.length);
  return compatible ? { ...plate, ingredients } : null;
}
