// src/components/catalog/CatalogClient.tsx
"use client";

import * as React from "react";
import NextImage from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type CatalogItem = {
  id: number;
  name: string;
  image_url: string | null;
  description: string | null;
  uses: string | null;
  created_at: string;
};

type Props = {
  initialItems: CatalogItem[];
};

export default function CatalogClient({ initialItems }: Props): React.JSX.Element {
  const [query, setQuery] = React.useState<string>("");
  const [items] = React.useState<CatalogItem[]>(initialItems);
  const [filtered, setFiltered] = React.useState<CatalogItem[]>(initialItems);

  React.useEffect(() => {
    if (!query.trim()) {
      setFiltered(items);
      return;
    }
    const q = query.toLowerCase();
    setFiltered(
      items.filter((it) => {
        const haystack = `${it.name ?? ""} ${it.description ?? ""} ${it.uses ?? ""}`.toLowerCase();
        return haystack.includes(q);
      })
    );
  }, [items, query]);

  return (
    <section className="space-y-4">
      {/* Local search (client-side) */}
      <div className="flex items-center gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          className="max-w-sm"
        />
      </div>

      {/* Responsive grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No products found.</p>
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
          {filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <div className="relative w-full aspect-[4/3] bg-muted">
                {p.image_url ? (
                  <NextImage
                    src={p.image_url}
                    alt={p.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <h2 className="line-clamp-1 text-base font-medium">{p.name}</h2>

                {p.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {p.description}
                  </p>
                ) : null}

                {p.uses ? (
                  <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                    <span className="font-medium">Uses:</span> {p.uses}
                  </p>
                ) : null}

                {/* Optional: link detail (change path if you have a public detail route) */}
                <div className="mt-3">
                  <Link
                    href={`/dashboard/products/${p.id}`}
                    className="text-sm underline underline-offset-4"
                  >
                    View details
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
