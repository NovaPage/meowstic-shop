"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type Product = {
  id: number;
  name: string;
  image_url?: string | null;
  description?: string | null;
  uses?: string | null;
};

type ProductsTableProps = {
  data: Product[];
  className?: string;
  placeholderSearch?: string;
  /** Base path to build each row href. E.g. "/products" => "/products/123" */
  rowHrefBase?: string;
};

export default function ProductsTable({
  data,
  className,
  placeholderSearch = "Buscar productos…",
  rowHrefBase = "/dashboard/products",
}: ProductsTableProps) {
  const [query, setQuery] = React.useState<string>("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((p) => {
      const inName = p.name?.toLowerCase().includes(q);
      const inDesc = p.description?.toLowerCase().includes(q);
      const inUses = p.uses?.toLowerCase().includes(q);
      return inName || inDesc || inUses;
    });
  }, [data, query]);

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Buscador */}
      <div className="flex items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholderSearch}
          className="w-full"
        />
      </div>

      {/* Estado vacío */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No se encontraron productos.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Móvil: tarjetas apiladas */}
          <ul className="grid gap-3 md:hidden">
            {filtered.map((p) => {
              const href = `${rowHrefBase}/${p.id}`;
              return (
                <li key={p.id}>
                  <Card className="transition-colors">
                    <CardContent className="flex items-center gap-4 p-4">
                      <ProductThumb name={p.name} imageUrl={p.image_url ?? undefined} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          <Link href={href} className="hover:underline">
                            {p.name}
                          </Link>
                        </p>
                        {p.description ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {p.description}
                          </p>
                        ) : null}
                      </div>

                      {/* Botón Ver -> página de detalle */}
                      <Button asChild variant="outline" size="sm">
                        <Link href={href}>Ver</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>

          {/* Desktop: tabla */}
          <div className="hidden md:block overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Descripción</th>
                  <th className="px-4 py-3 text-left">Usos</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const href = `${rowHrefBase}/${p.id}`;
                  return (
                    <tr key={p.id} className="border-t">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductThumb
                            name={p.name}
                            imageUrl={p.image_url ?? undefined}
                            size={40}
                          />
                          <div className="min-w-0">
                            <Link href={href} className="truncate font-medium hover:underline">
                              {p.name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="line-clamp-2 text-muted-foreground">
                          {p.description ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <p className="line-clamp-2 text-muted-foreground">
                          {p.uses ?? "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <Button asChild variant="outline" size="sm">
                          <Link href={href}>Ver</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ProductThumb({
  name,
  imageUrl,
  size = 48,
}: {
  name: string;
  imageUrl?: string;
  size?: number;
}) {
  const src = imageUrl ? resolveImageSrc(imageUrl) : null;

  if (src) {
    return (
      <div
        className="relative shrink-0 rounded-md bg-muted"
        style={{ width: size, height: size }}
      >
        <Image
          src={src}
          alt={name}
          fill
          className="rounded-md object-cover"
          sizes={`${size}px`}
        />
      </div>
    );
  }

  const initials = getInitials(name);
  return (
    <Avatar className="rounded-md" style={{ width: size, height: size }}>
      <AvatarImage src={undefined} alt={name} />
      <AvatarFallback className="rounded-md">{initials}</AvatarFallback>
    </Avatar>
  );
}

/**
 * Normaliza una URL válida para next/image:
 * - http(s) absolutas → se devuelven tal cual.
 * - Empieza con "/" → asset local en /public.
 * - Ruta relativa de storage → se convierte a pública con la env URL.
 * - Si falta env, fallback a "/" para evitar URL inválida.
 */
function resolveImageSrc(raw: string): string {
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

function getInitials(text: string): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}
