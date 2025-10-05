// src/app/catalog/page.tsx
import { headers } from "next/headers";
import CatalogClient, { type CatalogItem } from "@/components/catalog/CatalogClient";

export const metadata = {
  title: "Productos",
};

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

/** Build absolute base URL using request headers (async in Next 15). */
async function getBaseUrl(): Promise<string> {
  const h = await headers(); // <-- await is required
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;

  // Fallback for unusual cases
  return process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
}

async function fetchCatalog(): Promise<CatalogItem[]> {
  const baseUrl = await getBaseUrl(); // <-- await the async builder
  const res = await fetch(new URL("/api/catalog/products", baseUrl), {
    // Adjust freshness as needed
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { items?: CatalogItem[] };
  const items = json.items ?? [];
  // Normalize image URLs server-side
  return items.map((p) => ({ ...p, image_url: resolveImageSrc(p.image_url) }));
}

export default async function CatalogPage() {
  const items = await fetchCatalog();

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Explora nuestro catálogo público.
        </p>
      </header>

      <CatalogClient initialItems={items} />
    </main>
  );
}
