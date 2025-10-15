// src/components/dashboard/ProductsList.tsx
"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductsTable from "@/components/products/ProductsTable";
import { Input } from "@/components/ui/input";
import { productModel, type Product } from "@/types/product";

export default function ProductsList({
  initial,
  rowHrefBase,
}: {
  initial: Product[];
  rowHrefBase?: string;
}) {
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<Product[]>(initial);
  const sp = useSearchParams();
  const router = useRouter();

  const onClientSearch = async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      const res = await fetch(`/api/products?${params.toString()}`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = await res.json();
      const items = Array.isArray(json.items) ? json.items : [];
      setData(items.map((r: unknown) => productModel(r as Partial<Product>)));

      // Actualiza URL sin recargar
      const newParams = new URLSearchParams(sp);
      if (q) newParams.set("q", q);
      else newParams.delete("q");
      router.replace(`?${newParams.toString()}`, { scroll: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="max-w-sm">
        <Input
          placeholder="Buscando Productos…"
          defaultValue={sp.get("q") ?? ""}
          onChange={(e) => onClientSearch(e.target.value)}
        />
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground">Loading…</p>
      )}

      <ProductsTable data={data} rowHrefBase={rowHrefBase} />
    </div>
  );
}
