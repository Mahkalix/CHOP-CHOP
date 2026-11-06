import { expect, it } from 'vitest';
import { attemptDelivery, type ActiveOrder } from '../src/features/game/delivery';
import { createInventory, describeItem, interact, type Ingredient, type Inventory, type Item, type Plate } from '../src/features/game/interactions';
import { addIngredient, identifyRecipe } from '../src/features/game/recipes';
import { stations } from '../src/features/game/stations';

const tomato: Ingredient = { id: 2, kind: 'tomato', state: 'chopped', cutMs: 3000 };
const meat: Ingredient = { id: 3, kind: 'meat', state: 'cooked', cookMs: 8000 };
const empty: Plate = { id: 1, kind: 'plate', ingredients: [] };
const order: ActiveOrder = { id: 'order-1', recipeId: 'tomato', createdAt: 100, expiresAt: 1000 };
const station = (id: string) => stations.find(value => value.id === id)!;
const withPlate = (plate: Plate): Inventory => ({ ...createInventory(), carried: plate, nextItemId: 4 });
const nested = (items: readonly (Item | null)[]) => items.flatMap(item => !item ? [] : item.kind === 'plate' ? [item, ...item.ingredients] : [item]);

it('assembles every proposed recipe exactly, in either order for the mixed plate', () => {
  expect(identifyRecipe([tomato])?.id).toBe('tomato');
  expect(identifyRecipe([meat])?.id).toBe('meat');
  expect(identifyRecipe([tomato, meat])?.id).toBe('mixed');
  expect(identifyRecipe([meat, tomato])?.id).toBe('mixed');
  expect(addIngredient(addIngredient(empty, meat)!, tomato)).toEqual({ ...empty, ingredients: [meat, tomato] });
  expect(describeItem(addIngredient(empty, tomato)!)).toBe('Assiette de tomate');
});

it('refuses raw, burned, duplicate or extra ingredients without modifying the plate', () => {
  const plate = addIngredient(empty, tomato)!;
  expect(addIngredient(plate, tomato)).toBeNull();
  expect(addIngredient(plate, { ...meat, state: 'raw' })).toBeNull();
  expect(addIngredient(plate, { ...meat, state: 'burned' })).toBeNull();
  expect(addIngredient(empty, { ...tomato, state: 'whole', cutMs: 0 })).toBeNull();
  expect(identifyRecipe([tomato, tomato])).toBeNull();
  expect(identifyRecipe([])).toBeNull();
  expect(empty.ingredients).toEqual([]);
  expect(plate.ingredients).toEqual([tomato]);
});

it.each(['assembly', 'counter-left', 'counter-right'])('transfers the ingredient into a plate on %s, preserving all identities', id => {
  const initial: Inventory = { ...createInventory(), carried: tomato, surfaces: { [id]: empty }, nextItemId: 3 };
  const result = interact(initial, station(id)).inventory;
  expect(result.carried).toBeNull();
  expect(result.surfaces[id]).toEqual({ ...empty, ingredients: [tomato] });
  expect(nested([result.carried, ...Object.values(result.surfaces)]).map(item => item.id)).toEqual([1, 2]);
  expect(initial.carried).toBe(tomato);
  expect(initial.surfaces[id]).toBe(empty);
});

it('retrieves a filled plate intact and discards the plate and its contents together', () => {
  let inventory: Inventory = { ...createInventory(), surfaces: { assembly: addIngredient(empty, tomato) }, nextItemId: 3 };
  inventory = interact(inventory, station('assembly')).inventory;
  expect(inventory.carried).toMatchObject({ id: 1, ingredients: [tomato] });
  inventory = interact(inventory, station('trash')).inventory;
  expect(inventory.carried).toBeNull();
  expect(inventory.discarded).toBe(2);
});

it('serves an exact recipe to one active matching order and retains the delivery payload for scoring', () => {
  const plate = addIngredient(empty, tomato)!;
  const initial = withPlate(plate);
  const other: ActiveOrder = { ...order, id: 'meat-order', recipeId: 'meat' };
  const result = attemptDelivery(initial, [other, order], 500);
  expect(result.inventory.carried).toBeNull();
  expect(result.inventory.nextItemId).toBe(initial.nextItemId);
  expect(result.orders).toEqual([other]);
  expect(result.event).toEqual({ order, plate, deliveredAt: 500 });
  expect(initial.carried).toBe(plate);
  const repeated = attemptDelivery(result.inventory, result.orders, 501);
  expect(repeated.event).toBeNull();
  expect(repeated.orders).toBe(result.orders);
});

it('uses the earliest expiry when two active orders ask for the same recipe', () => {
  const earlier = { ...order, id: 'earlier', expiresAt: 800 };
  const orders = [order, earlier];
  const result = attemptDelivery(withPlate(addIngredient(empty, tomato)!), orders, 500);
  expect(result.event?.order.id).toBe('earlier');
  expect(result.orders).toEqual([order]);
  expect(orders).toEqual([order, earlier]);
});

it.each([99, 1000, 2000, NaN, Infinity])('does not serve before activation, after expiry, or at invalid time %s', now => {
  const inventory = withPlate(addIngredient(empty, tomato)!);
  const orders = [order];
  const result = attemptDelivery(inventory, orders, now);
  expect(result.event).toBeNull();
  expect(result.inventory).toBe(inventory);
  expect(result.orders).toBe(orders);
});

it('preserves an empty, incorrect or unmatched plate and all active orders on refusal', () => {
  for (const plate of [empty, { ...empty, ingredients: [tomato, tomato] }, addIngredient(empty, meat)!]) {
    const inventory = withPlate(plate);
    const orders = [order];
    const result = attemptDelivery(inventory, orders, 500);
    expect(result.event).toBeNull();
    expect(result.inventory).toBe(inventory);
    expect(result.orders).toBe(orders);
  }
  const inventory = withPlate(addIngredient(empty, tomato)!);
  expect(attemptDelivery(inventory, [], 500).inventory).toBe(inventory);
});

it('conserves every spawned identity through the full mixed-recipe chain and delivery', async () => {
  const { advancePreparation } = await import('../src/features/game/preparation');
  let inventory = createInventory();
  const use = (id: string) => { inventory = interact(inventory, station(id)).inventory; };
  use('plates'); use('assembly');
  use('tomatoes'); use('chopping');
  inventory = advancePreparation(inventory, 3000, 'chopping').inventory;
  use('chopping'); use('assembly');
  use('meat'); use('grill');
  inventory = advancePreparation(inventory, 8000, null).inventory;
  use('grill'); use('assembly'); use('assembly');
  expect(inventory.carried).toMatchObject({ kind: 'plate', ingredients: [{ state: 'chopped' }, { state: 'cooked' }] });
  const result = attemptDelivery(inventory, [{ ...order, recipeId: 'mixed' }], 500);
  expect(result.event).not.toBeNull();
  const allItems = nested([result.inventory.carried, ...Object.values(result.inventory.surfaces), result.event!.plate]);
  expect(allItems.length + result.inventory.discarded).toBe(inventory.nextItemId - 1);
  expect(new Set(allItems.map(item => item.id)).size).toBe(allItems.length);
});
