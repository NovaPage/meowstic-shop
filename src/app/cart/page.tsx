// src/app/cart/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCartStore, useCartItemsMap } from "@/stores/useCartStore";
import { buildWaLink, composeCartMessage, truncateForWhatsApp } from "@/lib/whatsapp";
import { Minus, Plus, Trash2, ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import type { CartItem } from "@/types/cart";

export default function CartPage(): React.JSX.Element {
  const itemsMap = useCartItemsMap();
  const items = React.useMemo<CartItem[]>(
    () => Object.values(itemsMap as Record<string, CartItem>),
    [itemsMap]
  );

  const removeItem = useCartStore((s) => s.removeItem);
  const setQty = useCartStore((s) => s.setQty);
  const clear = useCartStore((s) => s.clear);

  const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "";

  const waHref = React.useMemo(() => {
    if (items.length === 0) return null;
    const snapshot = { items, createdAt: new Date().toISOString() };
    const text = composeCartMessage(snapshot, {
      header: "Hola, me interesan estos productos:",
      includePrices: false,
    });
    return buildWaLink(WHATSAPP_NUMBER, truncateForWhatsApp(text));
  }, [items, WHATSAPP_NUMBER]);

  const totalCount = React.useMemo(() => items.reduce((a, it) => a + it.qty, 0), [items]);

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        {/* Only a back icon button (no text) */}
        <Button asChild variant="outline" size="icon" aria-label="Volver" title="Volver">
            <Link href="/catalog">
                <ArrowLeft className="h-5 w-5" />
            </Link>
        </Button>


        {/* Subtle label for Cart count */}
        <span className="text-sm text-muted-foreground/80">Carrito ({totalCount})</span>

        {/* Right actions: clear + send */}
        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Vaciar carrito"
            title="Vaciar carrito"
            onClick={() => {
              if (items.length === 0) return;
              clear();
              toast("Carrito vaciado.");
            }}
            disabled={items.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>

          {waHref ? (
            <Button
              asChild
              size="icon"
              aria-label="Enviar por WhatsApp"
              title="Enviar por WhatsApp"
            >
              <a href={waHref} target="_blank" rel="noopener noreferrer">
                <Send className="h-4 w-4" />
              </a>
            </Button>
          ) : (
            <Button
              size="icon"
              aria-label="Enviar por WhatsApp"
              title="Enviar por WhatsApp"
              disabled
              onClick={() => toast("Agrega productos antes de enviar.")}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Empty */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-between gap-4 p-4">
            <p className="text-sm text-muted-foreground">Tu carrito está vacío.</p>
            <Button asChild>
              <Link href="/catalog">Explorar productos</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* List */}
          <div className="space-y-3">
            {items.map((it) => (
              <Card key={String(it.id)}>
                <CardContent className="p-4">
                  {/* ===== Mobile layout (stacked) ===== */}
                  <div className="sm:hidden">
                    {/* Thumbnail */}
                    <div className="relative mb-3 h-28 w-full overflow-hidden rounded-md bg-muted">
                      {it.imageUrl ? (
                        <Image
                          src={it.imageUrl}
                          alt={it.name}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 384px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    {/* Name + price */}
                    <div className="mb-3">
                      <p className="break-words text-base font-medium leading-tight">{it.name}</p>
                      {it.price != null && it.currency ? (
                        <p className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: it.currency,
                            maximumFractionDigits: 2,
                          }).format(it.price)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sin precio</p>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Disminuir"
                          title="Disminuir"
                          onClick={() => {
                            const next = it.qty - 1;
                            setQty(it.id, next);
                            if (next === 0) toast("Producto eliminado del carrito.");
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="w-6 text-center text-sm">{it.qty}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Aumentar"
                          title="Aumentar"
                          onClick={() => setQty(it.id, it.qty + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Quitar producto"
                        title="Quitar producto"
                        className="ml-auto"
                        onClick={() => {
                          removeItem(it.id);
                          toast("Producto eliminado del carrito.");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* ===== Desktop layout (row) ===== */}
                  <div className="hidden items-center gap-3 sm:flex">
                    {/* Thumbnail */}
                    <div className="relative h-16 w-16 overflow-hidden rounded-md bg-muted">
                      {it.imageUrl ? (
                        <Image
                          src={it.imageUrl}
                          alt={it.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 grow">
                      <p className="truncate text-sm font-medium">{it.name}</p>
                      {it.price != null && it.currency ? (
                        <p className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat(undefined, {
                            style: "currency",
                            currency: it.currency,
                            maximumFractionDigits: 2,
                          }).format(it.price)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">Sin precio</p>
                      )}
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Disminuir"
                        title="Disminuir"
                        onClick={() => {
                          const next = it.qty - 1;
                          setQty(it.id, next);
                          if (next === 0) toast("Producto eliminado del carrito.");
                        }}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center text-sm">{it.qty}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Aumentar"
                        title="Aumentar"
                        onClick={() => setQty(it.id, it.qty + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Remove */}
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Quitar producto"
                      title="Quitar producto"
                      onClick={() => {
                        removeItem(it.id);
                        toast("Producto eliminado del carrito.");
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
