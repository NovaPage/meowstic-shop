"use client";

import * as React from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import NextImage from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

type Mode = "create" | "view" | "edit";

const schema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  description: z
    .string()
    .max(1000, "La descripción es demasiado larga")
    .optional()
    .or(z.literal("")),
  uses: z
    .string()
    .max(500, "El campo usos es demasiado largo")
    .optional()
    .or(z.literal("")),
  image: z.instanceof(File).optional(),
});

type FormValues = {
  name: string;
  description: string;
  uses: string;
  image?: File;
  image_url?: string | null;
};

type Props = {
  mode?: Mode;
  product?: Product | null;
  productId?: number;
  enableMultipartPatch?: boolean;
  onSaved?(p: Product): void;
  onDeleted?(id: number): void;
};

type Preview = { url: string } | null;

/** Compare form values against the original product to decide if there are changes. */
function computeHasChanges(v: FormValues, o: Product | null, imageChanged: boolean): boolean {
  if (!o) {
    // In create mode, consider "has changes" only if at least name has content or an image was chosen
    const hasText = v.name.trim().length > 0 || (v.description ?? "").trim().length > 0 || (v.uses ?? "").trim().length > 0;
    return hasText || imageChanged;
  }
  const nameChanged = v.name.trim() !== (o.name ?? "");
  const descChanged = (v.description ?? "").trim() !== (o.description ?? "");
  const usesChanged = (v.uses ?? "").trim() !== (o.uses ?? "");
  return nameChanged || descChanged || usesChanged || imageChanged;
}

/** Normalize relative storage paths to a public URL. */
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

export default function ProductForm({
  mode = "create",
  product,
  productId,
  enableMultipartPatch = true,
  onSaved,
  onDeleted,
}: Props): React.JSX.Element {
  const router = useRouter();

  // ---------- UI/State ----------
  const [uiMode, setUiMode] = React.useState<Mode>(mode);
  const [loading, setLoading] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "success" | "error">("idle");
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const [original, setOriginal] = React.useState<Product | null>(product ?? null);
  const [values, setValues] = React.useState<FormValues>(() => ({
    name: product?.name ?? "",
    description: product?.description ?? "",
    uses: product?.uses ?? "",
    image_url: product?.image_url ?? null,
  }));

  const [preview, setPreview] = React.useState<Preview>(null);
  const [imageChanged, setImageChanged] = React.useState(false);

  // ---------- Effects ----------
  // Lazy load product by id when needed
  React.useEffect(() => {
    let active = true;
    async function load() {
      if (!product && typeof productId === "number") {
        try {
          setLoading(true);
          const res = await fetch(`/api/products/${productId}`, { cache: "no-store" });
          if (!res.ok) throw new Error(await res.text());
          const json = (await res.json()) as { item?: Product };
          const item = json.item;
          if (active && item) {
            setOriginal(item);
            setValues({
              name: item.name,
              description: item.description ?? "",
              uses: item.uses ?? "",
              image_url: item.image_url ?? null,
            });
          }
        } catch {
          // silent
        } finally {
          if (active) setLoading(false);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [product, productId]);

  // Revoke previous preview URL to avoid memory leaks
  React.useEffect(() => {
    return () => {
      if (preview?.url) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview?.url]);

  // ---------- Handlers ----------
  function handleChange<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Revoke previous preview first
    if (preview?.url) {
      URL.revokeObjectURL(preview.url);
    }
    if (!file) {
      setValues((p) => ({ ...p, image: undefined }));
      setPreview(null);
      setImageChanged(false);
      return;
    }
    setValues((p) => ({ ...p, image: file }));
    setPreview({ url: URL.createObjectURL(file) });
    setImageChanged(true);
  }

  function resetToOriginal() {
    if (!original) return;
    // Revoke preview if any
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setValues({
      name: original.name,
      description: original.description ?? "",
      uses: original.uses ?? "",
      image_url: original.image_url ?? null,
      image: undefined,
    });
    setPreview(null);
    setImageChanged(false);
    setStatus("idle");
    setMessage("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Validate current values
    const parsed = schema.safeParse({
      name: values.name,
      description: values.description,
      uses: values.uses,
      image: values.image,
    });
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setStatus("error");
      setMessage(first?.message ?? "Revisa los campos.");
      return;
    }

    try {
      setSubmitting(true);
      setStatus("idle");
      setMessage("");

      // CREATE
      if (uiMode === "create") {
        const form = new FormData();
        form.append("name", values.name.trim());
        form.append("description", values.description?.trim() ?? "");
        form.append("uses", values.uses?.trim() ?? "");
        if (values.image) form.append("image", values.image);

        const res = await fetch("/api/products", { method: "POST", body: form });
        if (!res.ok) throw new Error(await res.text());

        const json = (await res.json()) as { item?: Product };
        const item = json.item!;
        setStatus("success");
        setMessage("Producto creado correctamente.");
        onSaved?.(item);
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // EDIT
      if (!original) throw new Error("Producto no cargado.");

      // Prepare JSON patch for text fields
      const patchJson: Partial<Product> = {};
      if (values.name.trim() !== (original.name ?? "")) patchJson.name = values.name.trim();
      if ((values.description ?? "").trim() !== (original.description ?? "")) {
        patchJson.description = (values.description ?? "").trim();
      }
      if ((values.uses ?? "").trim() !== (original.uses ?? "")) {
        patchJson.uses = (values.uses ?? "").trim();
      }

      // If image not changed -> JSON PATCH only
      if (!imageChanged || !values.image) {
        if (Object.keys(patchJson).length === 0) {
          // Keep edit mode; do not flip to "view"
          setStatus("idle");
          setMessage("No hay cambios detectados.");
          return;
        }
        const res = await fetch(`/api/products/${original.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchJson),
        });
        if (!res.ok) throw new Error(await res.text());

        const json = (await res.json()) as { item?: Product };
        const item = json.item!;
        setOriginal(item);
        setStatus("success");
        setMessage("Producto actualizado.");
        setUiMode("view");
        onSaved?.(item);
        router.refresh();
        return;
      }

      // Image changed -> multipart PATCH
      if (enableMultipartPatch) {
        const form = new FormData();
        form.append("name", values.name.trim());
        form.append("description", values.description?.trim() ?? "");
        form.append("uses", values.uses?.trim() ?? "");
        form.append("image", values.image);

        const res = await fetch(`/api/products/${original.id}`, { method: "PATCH", body: form });
        if (!res.ok) throw new Error(await res.text());

        const json = (await res.json()) as { item?: Product };
        const item = json.item!;
        setOriginal(item);
        setValues((v) => ({ ...v, image: undefined, image_url: item.image_url ?? null }));
        if (preview?.url) URL.revokeObjectURL(preview.url);
        setPreview(null);
        setImageChanged(false);
        setStatus("success");
        setMessage("Producto actualizado.");
        setUiMode("view");
        onSaved?.(item);
        router.refresh();
        return;
      } else {
        throw new Error("El servidor no admite actualizar imagen con PATCH.");
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("No se pudo guardar el producto. Inténtalo nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!original) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/products/${original.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      onDeleted?.(original.id);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      console.error(e);
      setStatus("error");
      setMessage("No se pudo eliminar el producto.");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  // ---------- Derived ----------
  const currentImage = preview?.url ?? (values.image_url ? resolveImageSrc(values.image_url) : null);
  const hasChanges = computeHasChanges(values, original, imageChanged);

  // Allow editing while loading only if there is no original yet (avoid flicker).
  const fieldsDisabled = uiMode === "view" || submitting || (loading && !original);

  // ---------- Render ----------
  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {/* Name */}
      <div className="grid gap-2">
        <Label htmlFor="name">Nombre</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Ej. Botella ecológica 500ml"
          required
          disabled={fieldsDisabled}
        />
      </div>

      {/* Description */}
      <div className="grid gap-2">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={values.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Describe el producto…"
          className="min-h-24"
          disabled={fieldsDisabled}
        />
      </div>

      {/* Uses */}
      <div className="grid gap-2">
        <Label htmlFor="uses">Usos</Label>
        <Input
          id="uses"
          value={values.uses}
          onChange={(e) => handleChange("uses", e.target.value)}
          placeholder="Ej. Hidratación, deporte, viajes"
          disabled={fieldsDisabled}
        />
      </div>

      {/* Image */}
      <div className="grid gap-2">
        <Label htmlFor="image">Imagen del producto</Label>
        <Input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={fieldsDisabled}
        />
        <p className="text-xs text-muted-foreground">
          La imagen se subirá en el servidor al enviar el formulario.
        </p>

        <Card className="mt-2">
          <CardContent className="p-2">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border bg-muted">
              {currentImage ? (
                <NextImage
                  src={currentImage}
                  alt="Imagen"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 640px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Sin imagen
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message */}
      {message ? (
        <div
          className={cn(
            "rounded-md border px-3 py-2 text-sm",
            status === "error" && "border-destructive/40 text-destructive",
            status === "success" && "border-green-500/40 text-green-600 dark:text-green-400"
          )}
        >
          {message}
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {uiMode === "view" ? (
          <>
            <Button
              type="button"
              onClick={() => {
                setUiMode("edit");
                setStatus("idle");
                setMessage("");
              }}
              className="w-full sm:w-auto"
              disabled={loading && !original}
            >
              Editar
            </Button>

            {/* Delete with confirmation */}
            <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  className="w-full sm:w-auto"
                  disabled={!original || submitting}
                >
                  Eliminar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará el producto de forma permanente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete}>
                    Sí, eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => history.back()}
            >
              Cerrar
            </Button>
          </>
        ) : (
          <>
            <Button
              type="submit"
              disabled={submitting || !hasChanges}
              className="w-full sm:w-auto"
            >
              {submitting ? "Guardando…" : uiMode === "create" ? "Guardar producto" : "Guardar cambios"}
            </Button>

            {uiMode === "edit" ? (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  resetToOriginal();
                  setUiMode("view");
                }}
                disabled={submitting}
              >
                Cancelar
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => history.back()}
                disabled={submitting}
              >
                Cancelar
              </Button>
            )}
          </>
        )}
      </div>
    </form>
  );
}
