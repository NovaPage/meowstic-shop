// src/stores/useCartStore.ts
import { create } from "zustand";
import { CartItem, CartItemInput, CartItemSchema, CartSnapshot } from "@/types/cart";

/**
 * Convert any id to a stable string key.
 */
const keyOf = (id: string | number): string => String(id);

/**
 * Transform a user-provided input into a safe CartItem.
 * - Fills defaults (qty=1).
 * - Validates shape with zod.
 * Throws on invalid input to keep the store consistent.
 */
function toCartItem(input: CartItemInput): CartItem {
  const candidate: CartItem = {
    ...input,
    qty: input.qty ?? 1,
  };
  const parsed = CartItemSchema.safeParse(candidate);
  if (!parsed.success) {
    // You can replace this with a centralized logger if desired.
    throw new Error(`Invalid CartItem: ${parsed.error.message}`);
  }
  return parsed.data;
}

type CartState = {
  items: Record<string, CartItem>;
};

type CartActions = {
  addItem: (input: CartItemInput) => void;
  removeItem: (id: string | number) => void;
  setQty: (id: string | number, qty: number) => void;
  clear: () => void;
  /**
   * Read-only materialized snapshot (for composing messages, exporting, etc.).
   * It is generated on demand, not stored.
   */
  getSnapshot: () => CartSnapshot;
};

type CartStore = CartState & CartActions;

/**
 * Global cart store.
 * This module is UI-agnostic and can be imported from any client component.
 * Do not add React or Next-specific code here.
 */
export const useCartStore = create<CartStore>((set, get) => ({
  items: {},

  addItem: (input) =>
    set((state) => {
      const item = toCartItem(input);
      const k = keyOf(item.id);
      const existing = state.items[k];

      if (existing) {
        // Merge by increasing quantity; keep last known metadata/image/price if provided.
        const nextQty = existing.qty + (item.qty ?? 1);
        return {
          items: {
            ...state.items,
            [k]: { ...existing, ...item, qty: nextQty },
          },
        };
      }
      return { items: { ...state.items, [k]: item } };
    }),

  removeItem: (id) =>
    set((state) => {
      const k = keyOf(id);
      if (!(k in state.items)) return state;
      const copy = { ...state.items };
      delete copy[k];
      return { items: copy };
    }),

  setQty: (id, qty) =>
    set((state) => {
      const k = keyOf(id);
      const existing = state.items[k];
      if (!existing) return state;

      const nextQty = Math.max(0, Math.floor(qty));
      if (nextQty === 0) {
        const copy = { ...state.items };
        delete copy[k];
        return { items: copy };
      }
      return {
        items: {
          ...state.items,
          [k]: { ...existing, qty: nextQty },
        },
      };
    }),

  clear: () => set({ items: {} }),

  getSnapshot: () => {
    const items = Object.values(get().items);
    const snapshot: CartSnapshot = {
      items,
      createdAt: new Date().toISOString(),
    };
    return snapshot;
  },
}));

/**
 * Stable selectors/hooks.
 * NOTE (Zustand v5): no equality function param; if you need equality, pass options object.
 * Returning the map keeps identity stable across renders; derive arrays in components.
 */
export const useCartItemsMap = () => useCartStore((s) => s.items);

/**
 * Convenience array selector.
 * NOTE: This returns a new array per render; prefer `useCartItemsMap` in new code.
 */
export const useCartItems = () => useCartStore((s) => Object.values(s.items));

export const useCartTotalItems = () =>
  useCartStore((s) => Object.values(s.items).reduce((acc, it) => acc + it.qty, 0));
