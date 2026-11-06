import { PREPARATIONS, type PreparationAction } from '@chopchop/shared';
import { type Inventory, type Item, type Station } from './interactions';
import { stations } from './stations';

/** Shared prototype rules from #14: keep a single source for timing values. */
function durationMs(action: PreparationAction) {
  const preparation = PREPARATIONS.find(step => step.action === action);
  if (!preparation) throw new Error(`Missing preparation rule: ${action}`);
  return preparation.seconds * 1000;
}
export const preparationTimings = { chopMs: durationMs('chop'), cookMs: durationMs('cook'), burnAfterCookMs: durationMs('burn') };
export type PreparationProgress = { label: string; percent: number };

/** Progress belongs to the object, so taking it away pauses rather than duplicates or resets it. */
function advanceItem(item: Item, station: Station, deltaMs: number, cutting: boolean): Item {
  if (station.kind !== 'surface') return item;
  if (station.preparation === 'chop' && item.kind === 'tomato' && item.state === 'raw' && cutting) {
    const cutMs = Math.min(preparationTimings.chopMs, item.cutMs + deltaMs);
    return { ...item, cutMs, state: cutMs >= preparationTimings.chopMs ? 'chopped' : 'raw' };
  }
  if (station.preparation === 'cook' && item.kind === 'meat' && item.state !== 'burnt') {
    const burnMs = preparationTimings.cookMs + preparationTimings.burnAfterCookMs;
    const cookMs = Math.min(burnMs, item.cookMs + deltaMs);
    return { ...item, cookMs, state: cookMs >= burnMs ? 'burnt' : cookMs >= preparationTimings.cookMs ? 'cooked' : 'raw' };
  }
  return item;
}

export function advancePreparation(inventory: Inventory, deltaMs: number, cuttingStationId: string | null) {
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return { inventory, messages: [] as string[] };
  let surfaces: Record<string, Item | null> | null = null;
  const messages: string[] = [];
  for (const station of stations) {
    const item = inventory.surfaces[station.id];
    if (!item) continue;
    const cutting = !inventory.carried && cuttingStationId === station.id;
    const next = advanceItem(item, station, deltaMs, cutting);
    if (next === item) continue;
    surfaces ??= { ...inventory.surfaces };
    surfaces[station.id] = next;
    if (item.kind === 'tomato' && next.kind === 'tomato' && item.state !== next.state) messages.push('Tomate découpée.');
    if (item.kind === 'meat' && next.kind === 'meat' && item.state !== next.state) {
      messages.push(next.state === 'burnt' ? 'Viande brûlée : direction poubelle.' : 'Viande cuite : récupère-la avant qu’elle ne brûle.');
    }
  }
  return { inventory: surfaces ? { ...inventory, surfaces } : inventory, messages };
}

export function getPreparationProgress(item: Item | null | undefined, station: Station): PreparationProgress | null {
  if (!item || station.kind !== 'surface') return null;
  if (station.preparation === 'chop' && item.kind === 'tomato') {
    return { label: item.state === 'chopped' ? 'Tomate découpée' : 'Découpe · maintenir C, mains libres', percent: Math.min(100, item.cutMs / preparationTimings.chopMs * 100) };
  }
  if (station.preparation === 'cook' && item.kind === 'meat') {
    if (item.state === 'burnt') return { label: 'Viande brûlée', percent: 100 };
    if (item.state === 'cooked') return { label: 'Viande cuite · avant brûlure', percent: Math.max(0, (1 - (item.cookMs - preparationTimings.cookMs) / preparationTimings.burnAfterCookMs) * 100) };
    return { label: 'Cuisson', percent: Math.min(100, item.cookMs / preparationTimings.cookMs * 100) };
  }
  return null;
}
