// src/app/dashboard/page.tsx
import ProductsTable from "@/components/products/ProductsTable";
import { headers } from "next/headers";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { productModel, type Product } from "@/types/product";

/**
 * Construye una URL base robusta para el fetch del API en SSR.
 * Usa x-forwarded-* cuando corre detrás de proxy (Vercel, etc).
 */
async function getBaseUrl(): Promise<string> {
  const h = await headers(); // Next 15: async
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "";
}

async function getProducts(): Promise<Product[]> {
  const h = await headers();
  const cookie = h.get("cookie") ?? ""; // <-- reenviamos la cookie
  const baseUrl = await getBaseUrl();

  const res = await fetch(`${baseUrl}/api/products`, {
    method: "GET",
    cache: "no-store",
    // En Server Components, credentials no reenvía cookies automáticamente.
    // Pásalas explícitamente:
    headers: { cookie },
  });

  if (!res.ok) {
    return [];
  }

  const json = (await res.json()) as { items?: unknown[] };
  const rows = Array.isArray(json.items) ? json.items : [];
  return rows.map((row) => productModel(row as Partial<Product>));
}

export default async function DashboardPage() {
  const products = await getProducts();

  return (
    <main
      className="
        mx-auto max-w-7xl px-4 py-6 space-y-6
        // Reserve space for the mobile bottom nav (h-14 = 3.5rem) + safe area
        pb-[calc(env(safe-area-inset-bottom)+3.5rem)]
        sm:pb-6
      "
    >
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Productos</h1>

        {/* CTA crear producto (desktop/tablet) */}
        <Button asChild>
          <Link href="/dashboard/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Link>
        </Button>
      </div>

      {/* Lista / tabla responsive */}
      <ProductsTable data={products} rowHrefBase="/dashboard/products" />

      {/* Floating Action Button (mobile only) */}
      <div
        className="
          md:hidden fixed right-6 z-60
          // Place FAB above the bottom nav (3.5rem) + some gap + safe area
          bottom-[calc(env(safe-area-inset-bottom)+4.5rem)]
        "
      >
        <Button
          size="icon"
          asChild
          className="h-12 w-12 rounded-full shadow-lg"
          aria-label="Crear producto"
        >
          <Link href="/dashboard/products/new">
            <Plus className="h-5 w-5" />
          </Link>
        </Button>
      </div>
    </main>
  );
}
