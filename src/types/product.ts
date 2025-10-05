// src/types/product.ts

/**
 * Plain Product model used across the app.
 * Keep fields 1:1 with your DB table columns (good practice).
 */
export type Product = {
  id: number;
  name: string;
  image_url: string | null;
  description: string | null;
  uses: string | null;
  created_at: string; // ISO string
};

/**
 * Create a fully-formed Product object from partial input.
 * This guarantees the app always works with a complete object.
 */
export function productModel(input: Partial<Product>): Product {
  return {
    id: typeof input.id === "number" ? input.id : 0,
    name: input.name ?? "",
    image_url: input.image_url ?? null,
    description: input.description ?? null,
    uses: input.uses ?? null,
    created_at: input.created_at ?? new Date().toISOString(),
  };
}
