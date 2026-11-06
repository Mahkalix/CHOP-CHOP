import { expect, it } from 'vitest';
import { createInventory, describeItem, interact, type Inventory } from '../src/features/game/interactions';
import { advancePreparation, getPreparationProgress, preparationTimings } from '../src/features/game/preparation';
import { stations } from '../src/features/game/stations';

const station = (id: string) => stations.find(value => value.id === id)!;
function place(source: string, destination: string): Inventory {
  const held = interact(createInventory(), station(source)).inventory;
  return interact(held, station(destination)).inventory;
}

it('requires the tomato, chopping station, free hands and sustained cutting time', () => {
  const initial = place('tomatoes', 'chopping');
  expect(advancePreparation(initial, 4000, null).inventory).toBe(initial);
  expect(advancePreparation(initial, 4000, 'grill').inventory).toBe(initial);
  const occupiedHands = interact(initial, station('plates')).inventory;
  expect(advancePreparation(occupiedHands, 4000, 'chopping').inventory).toBe(occupiedHands);
  const halfway = advancePreparation(initial, 1500, 'chopping').inventory;
  expect(halfway.surfaces.chopping).toMatchObject({ state: 'whole', cutMs: 1500 });
  const finished = advancePreparation(halfway, 1500, 'chopping');
  expect(finished.inventory.surfaces.chopping).toMatchObject({ id: initial.surfaces.chopping!.id, state: 'chopped', cutMs: 3000 });
  expect(finished.messages).toEqual(['Tomate découpée.']);
  expect(describeItem(finished.inventory.surfaces.chopping!)).toBe('Tomate découpée');
  expect(advancePreparation(finished.inventory, 1000, 'chopping')).toEqual({ inventory: finished.inventory, messages: [] });
});

it('pauses and resumes cutting when releasing C, moving away or taking the tomato', () => {
  let inventory = advancePreparation(place('tomatoes', 'chopping'), 1000, 'chopping').inventory;
  expect(advancePreparation(inventory, 8000, null).inventory).toBe(inventory);
  inventory = interact(inventory, station('chopping')).inventory;
  const carried = inventory.carried;
  expect(advancePreparation(inventory, 8000, 'chopping').inventory.carried).toBe(carried);
  inventory = interact(inventory, station('chopping')).inventory;
  inventory = advancePreparation(inventory, 2000, 'chopping').inventory;
  expect(inventory.surfaces.chopping).toMatchObject({ id: carried!.id, state: 'chopped' });
});

it('cooks autonomously, warns at completion, then burns after the extra interval', () => {
  const initial = place('meat', 'grill');
  const raw = advancePreparation(initial, 7999, null).inventory;
  expect(raw.surfaces.grill).toMatchObject({ state: 'raw' });
  const cooked = advancePreparation(raw, 1, null);
  expect(cooked.inventory.surfaces.grill).toMatchObject({ id: initial.surfaces.grill!.id, state: 'cooked', cookMs: 8000 });
  expect(cooked.messages[0]).toContain('Viande cuite');
  expect(advancePreparation(cooked.inventory, 5999, null).inventory.surfaces.grill).toMatchObject({ state: 'cooked' });
  const burned = advancePreparation(cooked.inventory, 6000, null);
  expect(burned.inventory.surfaces.grill).toMatchObject({ state: 'burned', cookMs: 14000 });
  expect(burned.messages[0]).toContain('Viande brûlée');
  expect(describeItem(burned.inventory.surfaces.grill!)).toBe('Viande brûlée');
  expect(advancePreparation(burned.inventory, 1000, null).inventory).toBe(burned.inventory);
});

it('stops heating when meat is carried or on an ordinary worktop, preserving its progress', () => {
  let inventory = advancePreparation(place('meat', 'grill'), 8000, null).inventory;
  inventory = interact(inventory, station('grill')).inventory;
  const meat = inventory.carried;
  expect(advancePreparation(inventory, 60000, null).inventory).toBe(inventory);
  inventory = interact(inventory, station('counter-left')).inventory;
  expect(advancePreparation(inventory, 60000, null).inventory.surfaces['counter-left']).toBe(meat);
  inventory = interact(inventory, station('counter-left')).inventory;
  inventory = interact(inventory, station('grill')).inventory;
  expect(advancePreparation(inventory, 6000, null).inventory.surfaces.grill).toMatchObject({ id: meat!.id, state: 'burned' });
});

it('does not transform the wrong ingredient or anything on an ordinary surface', () => {
  const tomato = interact(createInventory(), station('tomatoes')).inventory.carried!;
  const initial: Inventory = { ...createInventory(), surfaces: { grill: tomato, 'counter-left': tomato }, nextItemId: 2 };
  expect(advancePreparation(initial, 20000, 'grill').inventory).toBe(initial);
});

it('is independent of frame partitioning and emits only the final reached cooking state after a large step', () => {
  const initial = place('meat', 'grill');
  const single = advancePreparation(initial, 14000, null);
  let split = initial;
  for (let index = 0; index < 140; index++) split = advancePreparation(split, 100, null).inventory;
  expect(split).toEqual(single.inventory);
  expect(single.messages).toEqual(['Viande brûlée : direction poubelle.']);
});

it.each([0, -1, NaN, Infinity])('ignores invalid elapsed time %s', delta => {
  const inventory = place('meat', 'grill');
  expect(advancePreparation(inventory, delta, null)).toEqual({ inventory, messages: [] });
});

it('exposes bounded progress and recognisable prepared objects for assembly', () => {
  let inventory = place('tomatoes', 'chopping');
  inventory = advancePreparation(inventory, preparationTimings.chopMs / 2, 'chopping').inventory;
  expect(getPreparationProgress(inventory.surfaces.chopping, station('chopping'))?.percent).toBe(50);
  inventory = advancePreparation(inventory, 10000, 'chopping').inventory;
  const retrieved = interact(inventory, station('chopping')).inventory;
  expect(retrieved.carried).toMatchObject({ kind: 'tomato', state: 'chopped' });
  expect(getPreparationProgress(inventory.surfaces.chopping, station('chopping'))?.percent).toBe(100);
  expect(getPreparationProgress(inventory.surfaces.chopping, station('grill'))).toBeNull();
  const meat = advancePreparation(place('meat', 'grill'), 11000, null).inventory.surfaces.grill;
  expect(getPreparationProgress(meat, station('grill'))?.percent).toBe(50);
});

it('never mutates the input or changes item identity, counts or unrelated contents', () => {
  const initial = place('tomatoes', 'chopping');
  Object.freeze(initial.surfaces.chopping);
  Object.freeze(initial.surfaces);
  Object.freeze(initial);
  const result = advancePreparation(initial, 3000, 'chopping').inventory;
  expect(initial.surfaces.chopping).toMatchObject({ state: 'whole', cutMs: 0 });
  expect(result.surfaces.chopping!.id).toBe(initial.surfaces.chopping!.id);
  expect(result.nextItemId).toBe(initial.nextItemId);
  expect(result.discarded).toBe(initial.discarded);
  expect(result.carried).toBe(initial.carried);
});
