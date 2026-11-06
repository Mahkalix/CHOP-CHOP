import type { Inventory, Plate } from './interactions';
import { identifyRecipe, type RecipeId } from './recipes';

/** Times use the kitchen simulation clock, in milliseconds. */
export type ActiveOrder = { id: string; recipeId: RecipeId; createdAt: number; expiresAt: number };
export type DeliveryEvent = { order: ActiveOrder; plate: Plate; deliveredAt: number };

export function attemptDelivery(inventory: Inventory, orders: readonly ActiveOrder[], now: number) {
  const refused = (message: string) => ({ inventory, orders, event: null as DeliveryEvent | null, message });
  const plate = inventory.carried;
  if (plate?.kind !== 'plate') return refused('Présente une assiette garnie pour servir.');
  const recipe = identifyRecipe(plate.ingredients);
  if (!recipe) return refused('Cette assiette ne correspond pas à une recette.');
  const active = orders.filter(order => Number.isFinite(now) && Number.isFinite(order.createdAt) && Number.isFinite(order.expiresAt)
    && order.createdAt <= now && now < order.expiresAt);
  if (!active.length) return refused('Aucune commande active : ton assiette est conservée.');
  const order = active.filter(value => value.recipeId === recipe.id).sort((a, b) => a.expiresAt - b.expiresAt)[0];
  if (!order) return refused('Ce plat ne correspond à aucune commande active.');
  return {
    inventory: { ...inventory, carried: null },
    orders: orders.filter(value => value.id !== order.id),
    event: { order, plate, deliveredAt: now } satisfies DeliveryEvent,
    message: `${recipe.label} servie !`,
  };
}
