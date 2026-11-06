import { addIngredient, identifyRecipe } from './recipes';

/** Local inventory types used by kitchen interactions and preparation. */
export type ItemKind = 'tomato' | 'meat' | 'plate';
export type Ingredient =
  | { readonly id: number; readonly kind: 'tomato'; readonly state: 'whole' | 'chopped'; readonly cutMs: number }
  | { readonly id: number; readonly kind: 'meat'; readonly state: 'raw' | 'cooked' | 'burned'; readonly cookMs: number };
export type Plate = { readonly id: number; readonly kind: 'plate'; readonly ingredients: readonly Ingredient[] };
export type Item = Ingredient | Plate;
export type Station =
  | { readonly id: string; readonly kind: 'source'; readonly item: ItemKind }
  | { readonly id: string; readonly kind: 'surface'; readonly accepts: readonly ItemKind[]; readonly preparation?: 'chop' | 'cook'; readonly assembly?: boolean }
  | { readonly id: string; readonly kind: 'trash' }
  | { readonly id: string; readonly kind: 'delivery' };
export type Inventory = {
  readonly carried: Item | null;
  readonly surfaces: Readonly<Record<string, Item | null>>;
  readonly nextItemId: number;
  readonly discarded: number;
};
export type InteractionResult = { readonly inventory: Inventory; readonly message: string };

export function describeItem(item: Item): string {
  if (item.kind === 'tomato') return item.state === 'chopped' ? 'Tomate découpée' : 'Tomate';
  if (item.kind === 'meat') return { raw: 'Viande crue', cooked: 'Viande cuite', burned: 'Viande brûlée' }[item.state];
  return item.ingredients.length ? identifyRecipe(item.ingredients)?.label ?? 'Assiette non conforme' : 'Assiette';
}

function createItem(id: number, kind: ItemKind): Item {
  if (kind === 'tomato') return { id, kind, state: 'whole', cutMs: 0 };
  if (kind === 'meat') return { id, kind, state: 'raw', cookMs: 0 };
  return { id, kind, ingredients: [] };
}

export function createInventory(): Inventory {
  return { carried: null, surfaces: {}, nextItemId: 1, discarded: 0 };
}

/** An interaction either transfers one existing item or leaves the inventory unchanged. */
export function interact(inventory: Inventory, station: Station): InteractionResult {
  const unchanged = (message: string) => ({ inventory, message });
  const carried = inventory.carried;
  if (station.kind === 'source') {
    if (carried) return unchanged('Pose ton objet avant d’en prendre un autre.');
    const item = createItem(inventory.nextItemId, station.item);
    return {
      inventory: { ...inventory, carried: item, nextItemId: inventory.nextItemId + 1 },
      message: `${describeItem(item)} récupérée.`,
    };
  }
  if (station.kind === 'trash') {
    if (!carried) return unchanged('Tu n’as rien à jeter.');
    return { inventory: { ...inventory, carried: null, discarded: inventory.discarded + (carried.kind === 'plate' ? 1 + carried.ingredients.length : 1) }, message: 'Objet jeté.' };
  }
  if (station.kind === 'delivery') return unchanged('La livraison nécessite une recette et une commande active.');
  const placed = inventory.surfaces[station.id] ?? null;
  if (carried) {
    if (station.assembly && placed?.kind === 'plate' && carried.kind !== 'plate') {
      const plate = addIngredient(placed, carried);
      if (!plate) return unchanged('Ajoute uniquement un ingrédient préparé compatible, sans doublon.');
      return {
        inventory: { ...inventory, carried: null, surfaces: { ...inventory.surfaces, [station.id]: plate } },
        message: `${describeItem(carried)} ajoutée à l’assiette.`,
      };
    }
    if (placed) return unchanged('Ce poste est occupé. Choisis un emplacement libre.');
    if (!station.accepts.includes(carried.kind)) return unchanged('Cet objet ne peut pas être posé sur ce poste.');
    return {
      inventory: { ...inventory, carried: null, surfaces: { ...inventory.surfaces, [station.id]: carried } },
      message: `${describeItem(carried)} posée.`,
    };
  }
  if (!placed) return unchanged('Ce poste est vide.');
  return {
    inventory: { ...inventory, carried: placed, surfaces: { ...inventory.surfaces, [station.id]: null } },
    message: `${describeItem(placed)} récupérée.`,
  };
}
