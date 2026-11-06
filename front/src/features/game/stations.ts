import type { Station } from './interactions';

type KitchenStation = Station & { readonly texture: string; readonly label: string; readonly x: number; readonly y: number };
const allItems = ['tomato', 'meat', 'plate'] as const;

/** Unique ids keep individual worktops and their contents distinct. */
export const stations: readonly KitchenStation[] = [
  { id: 'tomatoes', kind: 'source', item: 'tomato', texture: 'tomato', label: 'TOMATES', x: 240, y: 300 },
  { id: 'chopping', kind: 'surface', accepts: ['tomato'], texture: 'worktop', label: 'DÉCOUPER', x: 384, y: 300 },
  { id: 'meat', kind: 'source', item: 'meat', texture: 'meat', label: 'VIANDE CRUE', x: 528, y: 300 },
  { id: 'grill', kind: 'surface', accepts: ['meat'], texture: 'grill', label: 'CUIRE', x: 672, y: 300 },
  { id: 'plates', kind: 'source', item: 'plate', texture: 'plates', label: 'ASSIETTES', x: 960, y: 300 },
  { id: 'assembly', kind: 'surface', accepts: ['plate'], texture: 'worktop', label: 'ASSEMBLER', x: 960, y: 612 },
  { id: 'delivery', kind: 'delivery', texture: 'delivery', label: 'SERVIR', x: 1294, y: 478 },
  { id: 'trash', kind: 'trash', texture: 'trash', label: 'POUBELLE', x: 96, y: 612 },
  { id: 'counter-left', kind: 'surface', accepts: allItems, texture: 'worktop', label: '', x: 384, y: 612 },
  { id: 'counter-right', kind: 'surface', accepts: allItems, texture: 'worktop', label: '', x: 672, y: 612 },
];

/** Distance from the player's feet to a counter edge; never interact through another counter. */
export function closestStation(x: number, y: number, reach = 72): KitchenStation | null {
  let closest: KitchenStation | null = null;
  let distance = reach;
  for (const station of stations) {
    const dx = Math.max(station.x - x, 0, x - (station.x + 144));
    const dy = Math.max(station.y - y, 0, y - (station.y + 144));
    const current = Math.hypot(dx, dy);
    if (current < distance) { closest = station; distance = current; }
  }
  return closest;
}
