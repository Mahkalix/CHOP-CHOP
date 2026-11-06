import { describe, expect, it } from 'vitest';
import { createInventory, interact, type Inventory, type Station } from '../src/features/game/interactions';
import { closestStation, stations } from '../src/features/game/stations';

const tomatoes: Station = { id: 'tomatoes', kind: 'source', item: 'tomato' };
const plates: Station = { id: 'plates', kind: 'source', item: 'plate' };
const counter: Station = { id: 'counter', kind: 'surface', accepts: ['tomato', 'meat', 'plate'] };
const chopping: Station = { id: 'chopping', kind: 'surface', accepts: ['tomato'] };
const trash: Station = { id: 'trash', kind: 'trash' };

it('carries only one object, transfers the same object to a surface, then retrieves it', () => {
  let inventory = interact(createInventory(), tomatoes).inventory;
  const tomato = inventory.carried;
  expect(interact(inventory, plates).inventory).toBe(inventory);
  inventory = interact(inventory, counter).inventory;
  expect(inventory.carried).toBeNull();
  expect(inventory.surfaces.counter).toBe(tomato);
  inventory = interact(inventory, counter).inventory;
  expect(inventory.carried).toBe(tomato);
  expect(inventory.surfaces.counter).toBeNull();
});

it('refuses an occupied surface without swapping, losing or duplicating either object', () => {
  let inventory = interact(createInventory(), tomatoes).inventory;
  inventory = interact(inventory, counter).inventory;
  inventory = interact(inventory, plates).inventory;
  const result = interact(inventory, counter);
  expect(result.inventory).toBe(inventory);
  expect(result.inventory.carried?.kind).toBe('plate');
  expect(result.inventory.surfaces.counter?.kind).toBe('tomato');
  expect(result.message).toContain('occupé');
});

it('refuses incompatible objects and empty stations', () => {
  const empty = createInventory();
  expect(interact(empty, counter).inventory).toBe(empty);
  const holdingPlate = interact(empty, plates).inventory;
  expect(interact(holdingPlate, chopping).inventory).toBe(holdingPlate);
});

it('discards only the carried object and leaves objects on surfaces untouched', () => {
  let inventory = interact(createInventory(), tomatoes).inventory;
  inventory = interact(inventory, counter).inventory;
  const placed = inventory.surfaces.counter;
  inventory = interact(inventory, plates).inventory;
  inventory = interact(inventory, trash).inventory;
  expect(inventory.carried).toBeNull();
  expect(inventory.surfaces.counter).toBe(placed);
  expect(inventory.discarded).toBe(1);
  expect(interact(inventory, trash).inventory).toBe(inventory);
});

it('keeps an item when delivery is unavailable rather than pretending to serve a recipe', () => {
  const inventory = interact(createInventory(), tomatoes).inventory;
  expect(interact(inventory, { id: 'delivery', kind: 'delivery' }).inventory).toBe(inventory);
});

it('preserves item conservation and unique identity through a long sequence of interactions', () => {
  let inventory: Inventory = createInventory();
  let random = 42;
  for (let index = 0; index < 2000; index++) {
    random = (Math.imul(random, 1664525) + 1013904223) >>> 0;
    inventory = interact(inventory, stations[random % stations.length]!).inventory;
    const items = [inventory.carried, ...Object.values(inventory.surfaces)].filter(item => item !== null);
    expect(new Set(items.map(item => item.id)).size).toBe(items.length);
    expect(items.length + inventory.discarded).toBe(inventory.nextItemId - 1);
  }
});

describe('station reach', () => {
  it('assigns separate identities to each counter', () => {
    expect(new Set(stations.map(station => station.id)).size).toBe(stations.length);
  });
  it('finds a reachable tomato source from the front and nothing at a distance', () => {
    expect(closestStation(300, 470)?.id).toBe('tomatoes');
    expect(closestStation(800, 800)).toBeNull();
    expect(closestStation(300, 470, 20)).toBeNull();
  });
  it('selects the closest neighbouring counter', () => {
    expect(closestStation(400, 650)?.id).toBe('counter-right');
    expect(closestStation(300, 650)?.id).toBe('counter-left');
  });
});
