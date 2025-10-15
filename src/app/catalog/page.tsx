// src/app/catalog/page.tsx
import { getServerComponentClient } from "@/lib/supabase/server";
import CatalogClient, { type CatalogItem } from "@/components/catalog/CatalogClient";
import type { Product } from "@/types/product";

export const metadata = {
  title: "Productos",
};

// Ensure the page re-renders on URL changes (e.g., filters)
export const dynamic = "force-dynamic";

function resolveImageSrc(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (base) {
    const clean = trimmed.replace(/^\/+/, "");
    return `${base}/storage/v1/object/public/${clean}`;
  }
  return `/${trimmed.replace(/^\/+/, "")}`;
}

function parseUsesParam(input?: string | null): string[] {
  if (!input) return [];
  const parts = input
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

async function fetchCatalogFiltered(q: string, uses: string[]): Promise<CatalogItem[]> {
  const supabase = await getServerComponentClient();

  let query = supabase.from("products").select("*");

  if (q.length > 0) {
    const orExpr = `name.ilike.%${q}%,description.ilike.%${q}%,uses.ilike.%${q}%`;
    query = query.or(orExpr);
  }

  if (uses.length > 0) {
    // Match ANY selected use (OR over ilike)
    const usesExpr = uses.map((u) => `uses.ilike.%${u}%`).join(",");
    query = query.or(usesExpr);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;
  if (error) return [];

  return (data ?? []).map((row: Product) => ({
    id: row.id,
    name: row.name,
    image_url: resolveImageSrc(row.image_url),
    description: row.description,
    uses: row.uses,
    created_at: row.created_at,
  })) as CatalogItem[];
}

// IMPORTANT: searchParams is now a Promise in Next 15
export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string; uses?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const q = (sp.q ?? "").trim();
  const selectedUses = parseUsesParam(sp.uses);

  const items = await fetchCatalogFiltered(q, selectedUses);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <p className="mt-1 text-sm text-muted-foreground">Explora nuestro catálogo público.</p>
      </header>

      <CatalogClient initialItems={items} />
    </main>
  );
}
