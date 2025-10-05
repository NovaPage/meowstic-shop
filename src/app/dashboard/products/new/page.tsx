// src/app/products/new/page.tsx
import * as React from "react";
import { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import ProductCreateForm from "@/components/dashboard/ProductForm";

export const metadata: Metadata = {
  title: "Crear producto",
};

export default async function NewProductPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-semibold">Crear producto</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Completa la información del producto y sube una imagen. La imagen se subirá
        automáticamente al almacenamiento.
      </p>

      <Card>
        <CardContent className="p-6">
          {/* Client form */}
          <ProductCreateForm />
        </CardContent>
      </Card>
    </div>
  );
}
