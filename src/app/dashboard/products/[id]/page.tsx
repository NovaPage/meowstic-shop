// src/app/products/[id]/page.tsx
import * as React from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import ProductForm from "@/components/dashboard/ProductForm";
import { productModel, type Product } from "@/types/product";

type PageProps = {
  params: { id: string };
};

async function getBaseUrl(): Promise<string> {
  const h = await headers(); // Next 15: async
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "";
}

async function getProduct(id: number): Promise<Product | null> {
  const h = await headers();
  const cookie = h.get("cookie") ?? ""; // reenviamos cookies al API
  const baseUrl = await getBaseUrl();

  const res = await fetch(`${baseUrl}/api/products/${id}`, {
    method: "GET",
    cache: "no-store",
    headers: { cookie },
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { item?: unknown };
  const item = json.item ? productModel(json.item as Partial<Product>) : null;
  return item;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const idNum = Number(params.id);
  const title = Number.isFinite(idNum) ? `Producto #${idNum}` : "Producto";
  return { title };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const product = await getProduct(id);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Producto</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Visualiza la información del producto. Puedes editar o eliminar desde aquí.
      </p>

      <Card>
        <CardContent className="p-6">
          <ProductForm mode="view" product={product} productId={id} />
        </CardContent>
      </Card>
    </div>
  );
}
