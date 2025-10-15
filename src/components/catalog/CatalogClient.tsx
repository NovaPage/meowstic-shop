// src/components/catalog/CatalogClient.tsx
"use client";

import * as React from "react";
import NextImage from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MessageCircle, Plus, X } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { FiltersTrigger } from "@/components/catalog/FiltersTrigger";

export type CatalogItem = {
  id: number;
  name: string;
  image_url: string | null;
  description: string | null;
  uses: string | null;
  created_at: string;
};

type FacetOption = {
  value: string;
  label?: string;
  count?: number;
};

type Props = {
  initialItems: CatalogItem[];
};

/** Parse and normalize comma-separated "uses" param to lowercase unique values. */
function parseUsesParam(input?: string | null): string[] {
  if (!input) return [];
  const parts = input
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Array.from(new Set(parts));
}

export default function CatalogClient({ initialItems }: Props): React.JSX.Element {
  // Client-only text query (server already filtered by `uses`)
  const [query, setQuery] = React.useState<string>("");

  // URL helpers to reflect active "uses" (chips) and allow clearing
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedUses = React.useMemo(
    () => parseUsesParam(searchParams?.get("uses")),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams?.toString()]
  );

  // Fetch facet options (uses) and render the trigger next to the search input
  const { data: usesOptions = [] } = useQuery<FacetOption[]>({
    queryKey: ["catalog", "facets"],
    queryFn: async () => {
      const res = await fetch("/api/catalog/facets", { cache: "no-store" });
      if (!res.ok) return [];
      const json = (await res.json()) as { options?: FacetOption[] };
      return json.options ?? [];
    },
    staleTime: 60 * 60 * 1000, // 1h
  });

  // Public WhatsApp number (E.164), e.g., "573001112233"
  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "";

  // Cart action (UI-agnostic store)
  const addItem = useCartStore((s) => s.addItem);

  // Lightweight “added” banner state (non-intrusive, themable, no portal)
  const [banner, setBanner] = React.useState<{ open: boolean; name: string } | null>(null);
  const hideRef = React.useRef<number | null>(null);

  const showAddedBanner = React.useCallback((name: string) => {
    setBanner({ open: true, name });
    if (hideRef.current) window.clearTimeout(hideRef.current);
    hideRef.current = window.setTimeout(
      () => setBanner((b) => (b ? { ...b, open: false } : b)),
      2500
    );
  }, []);

  React.useEffect(() => {
    return () => {
      if (hideRef.current) window.clearTimeout(hideRef.current);
    };
  }, []);

  // ✅ Make list reactive to prop changes (do NOT stash initialItems in state)
  const filtered = React.useMemo(() => {
    const base = initialItems;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((it) => {
      const haystack = `${it.name ?? ""} ${it.description ?? ""} ${it.uses ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [initialItems, query]);

  // URL mutators for chips
  const pushWithUses = (nextUses: string[]) => {
    const params = new URLSearchParams(searchParams?.toString());
    if (nextUses.length > 0) params.set("uses", nextUses.join(","));
    else params.delete("uses");
    // Optional: keep q as-is; reset pagination if exists
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    // No need to refresh here because the FiltersTrigger does refresh on toggle;
    // but harmless if you prefer: router.refresh();
  };

  const handleClearAllUses = () => pushWithUses([]);
  const handleRemoveUse = (u: string) => pushWithUses(selectedUses.filter((x) => x !== u));

  return (
    <section className="space-y-4">
      {/* Search + Filter inline (parallel, compact) */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar productos…"
          aria-label="Buscar productos"
          className="min-w-0 flex-1"
        />

        {/* Drawer/Dropdown trigger aligned with the input */}
        <FiltersTrigger
          options={usesOptions}
          selected={selectedUses}
          className="shrink-0"
        />
      </div>

      {/* Active "uses" chips (reflected from URL; server-side filter already applied) */}
      {selectedUses.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedUses.map((u) => (
            <Badge
              key={u}
              variant="secondary"
              className="capitalize gap-1 pl-2 pr-1"
              title={`Quitar "${u}"`}
            >
              <span className="max-w-[10rem] truncate">{u}</span>
              <button
                type="button"
                aria-label={`Quitar filtro ${u}`}
                className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-muted"
                onClick={() => handleRemoveUse(u)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleClearAllUses}
            title="Limpiar filtros"
          >
            Limpiar
          </Button>
        </div>
      )}

      {/* Responsive grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No se encontraron productos.</p>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            "grid-cols-1",
            "sm:grid-cols-2",
            "lg:grid-cols-3",
            "xl:grid-cols-4"
          )}
        >
          {filtered.map((p) => {
            const waText = `Hola, me interesa ${p.name}`;
            const waHref = WHATSAPP_NUMBER
              ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`
              : `https://wa.me/?text=${encodeURIComponent(waText)}`;

            return (
              <Card key={p.id} className="flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] w-full bg-muted">
                  {p.image_url ? (
                    <NextImage
                      src={p.image_url}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      priority={false}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      Sin imagen
                    </div>
                  )}
                </div>

                <CardContent className="flex h-full flex-col gap-2 p-4">
                  <h2 className="line-clamp-1 text-base font-medium">{p.name}</h2>

                  {p.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {p.description}
                    </p>
                  ) : null}

                  {p.uses ? (
                    <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                      <span className="font-medium">Usos:</span> {p.uses}
                    </p>
                  ) : null}

                  {/* Actions row: "Ver detalles" left; "+" and WhatsApp right */}
                  <div className="mt-auto flex items-center gap-2 pt-2">
                    <Button
                      asChild
                      className="mr-auto"
                      aria-label={`Ver detalles de ${p.name}`}
                      title="Ver detalles"
                    >
                      {/* Consider switching to a public detail route when available */}
                      <Link href={`/dashboard/products/${p.id}`} prefetch={false}>
                        Ver detalles
                      </Link>
                    </Button>

                    {/* Plus button (adds current product WITHOUT leaving the catalog) */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Agregar ${p.name} al carrito`}
                      title="Agregar al carrito"
                      onClick={() => {
                        addItem({
                          id: p.id,
                          name: p.name,
                          imageUrl: p.image_url ?? undefined,
                          metadata: { source: "catalog" },
                        });
                        showAddedBanner(p.name);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>

                    {/* WhatsApp icon (per-product quick contact) */}
                    <Button
                      asChild
                      variant="outline"
                      size="icon"
                      aria-label={`Contactar por WhatsApp sobre ${p.name}`}
                      title="Contactar por WhatsApp"
                    >
                      <a href={waHref} target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Non-intrusive “added to cart” pill (does not overlap the mobile nav) */}
      {banner?.open && (
        <div
          className="fixed inset-x-0 z-40 flex justify-center"
          style={{ bottom: "5.5rem" }} // ~h-14 bottom nav + spacing
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-3 rounded-full border bg-background/95 px-4 py-2 text-foreground shadow-md backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <span className="text-sm">
              Añadido: <span className="font-medium">{banner.name}</span>
            </span>
            <Link
              href="/cart"
              className="text-xs underline underline-offset-4 hover:no-underline"
              aria-label="Ver carrito"
              title="Ver carrito"
            >
              Ver carrito
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
