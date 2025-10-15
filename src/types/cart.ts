// src/types/cart.ts
import { z } from "zod";

/**
 * Contract for a single item in the cart.
 * Keep it minimal and product-agnostic; attach extra data in `metadata`.
 */
export const CartItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1).transform((s) => s.trim()),
  qty: z.number().int().min(1).default(1),
  imageUrl: z.string().url().optional().nullable(),
  price: z.number().nonnegative().optional(),
  currency: z.string().min(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CartItem = z.infer<typeof CartItemSchema>;

/**
 * Input shape for adding/updating items.
 * `qty` is optional when adding (defaults to 1).
 */
export type CartItemInput = Omit<CartItem, "qty"> & { qty?: number };

/**
 * Snapshot of the cart to be shared/exported (e.g., WhatsApp message).
 */
export const CartSnapshotSchema = z.object({
  items: z.array(CartItemSchema),
  createdAt: z.string(), // ISO string
});

export type CartSnapshot = z.infer<typeof CartSnapshotSchema>;
