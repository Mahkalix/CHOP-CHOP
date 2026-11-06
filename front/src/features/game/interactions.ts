/** Local kitchen inventory. Recipe preparation and assembly are separate features. */
export type ItemKind = 'tomato' | 'meat' | 'plate';
export type Item = { readonly id: number; readonly kind: ItemKind };
export type Station =
  | { readonly id: string; readonly kind: 'source'; readonly item: ItemKind }
  | { readonly id: string; readonly kind: 'surface'; readonly accepts: readonly ItemKind[] }
  | { readonly id: string; readonly kind: 'trash' }
  | { readonly id: string; readonly kind: 'delivery' };
export type Inventory = {
  readonly carried: Item | null;
  readonly surfaces: Readonly<Record<string, Item | null>>;
  readonly nextItemId: number;
  readonly discarded: number;
};
export type InteractionResult = { readonly inventory: Inventory; readonly message: string };

export const itemLabels: Record<ItemKind, string> = {
  tomato: 'Tomate', meat: 'Viande crue', plate: 'Assiette',
};

export function createInventory(): Inventory {
  return { carried: null, surfaces: {}, nextItemId: 1, discarded: 0 };
}

/** An interaction either transfers one existing item or leaves the inventory unchanged. */
export function interact(inventory: Inventory, station: Station): InteractionResult {
  const unchanged = (message: string) => ({ inventory, message });
  const carried = inventory.carried;
  if (station.kind === 'source') {
    if (carried) return unchanged('Pose ton objet avant d’en prendre un autre.');
    const item: Item = { id: inventory.nextItemId, kind: station.item };
    return {
      inventory: { ...inventory, carried: item, nextItemId: inventory.nextItemId + 1 },
      message: `${itemLabels[item.kind]} récupérée.`,
    };
  }
  if (station.kind === 'trash') {
    if (!carried) return unchanged('Tu n’as rien à jeter.');
    return { inventory: { ...inventory, carried: null, discarded: inventory.discarded + 1 }, message: 'Objet jeté.' };
  }
  if (station.kind === 'delivery') return unchanged('La livraison sera disponible avec les recettes et les commandes.');
  const placed = inventory.surfaces[station.id] ?? null;
  if (carried) {
    if (placed) return unchanged('Ce poste est occupé. Choisis un emplacement libre.');
    if (!station.accepts.includes(carried.kind)) return unchanged('Cet objet ne peut pas être posé sur ce poste.');
    return {
      inventory: { ...inventory, carried: null, surfaces: { ...inventory.surfaces, [station.id]: carried } },
      message: `${itemLabels[carried.kind]} posée.`,
    };
  }
  if (!placed) return unchanged('Ce poste est vide.');
  return {
    inventory: { ...inventory, carried: placed, surfaces: { ...inventory.surfaces, [station.id]: null } },
    message: `${itemLabels[placed.kind]} récupérée.`,
  };
}
