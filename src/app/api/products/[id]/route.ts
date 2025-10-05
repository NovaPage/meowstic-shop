// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRouteHandlerClient } from "@/lib/supabase/server";
import { DbService } from "@/lib/supabase/db-service";
import { productModel, type Product } from "@/types/product";

const TABLE = "products" as const;
// Use the same bucket as your POST /api/products endpoint
const IMAGE_BUCKET = "products" as const;

function json<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

/** Parse and validate numeric id from async params. */
async function getNumericIdFromParams(ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const numeric = Number(id);
  if (!Number.isFinite(numeric)) {
    return { error: NextResponse.json({ error: "Invalid id" }, { status: 400 }) as NextResponse, id: null };
  }
  return { error: null as NextResponse | null, id: numeric };
}

/** Ensure authenticated user and return Supabase client. */
async function requireUser() {
  const supabase = await getRouteHandlerClient();
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes?.user) {
    return { error: json({ error: "Unauthorized" }, { status: 401 }) as NextResponse, supabase: null };
  }
  return { error: null as NextResponse | null, supabase };
}

/**
 * Upload image file to Supabase Storage and return a public URL,
 * so it matches the shape stored by POST /api/products.
 */
async function uploadImageToStorage(
  supabase: Awaited<ReturnType<typeof getRouteHandlerClient>>,
  id: number,
  file: File
): Promise<{ publicUrl: string } | { error: string }> {
  try {
    const originalName = typeof file.name === "string" ? file.name : "";
    const ext = (originalName.split(".").pop() || "bin").toLowerCase();
    const objectPath = `products/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: upErr } = await supabase.storage.from(IMAGE_BUCKET).upload(objectPath, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: file.type || "application/octet-stream",
    });
    if (upErr) return { error: upErr.message };

    const pub = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(objectPath);
    const publicUrl = pub.data?.publicUrl;
    if (!publicUrl) return { error: "Unable to resolve public URL" };

    return { publicUrl };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg };
  }
}

/**
 * GET /api/products/:id
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const parsed = await getNumericIdFromParams(ctx);
  if (parsed.error) return parsed.error;
  const id = parsed.id!;

  const db = new DbService<
    Product,
    Omit<Product, "id" | "created_at">,
    Partial<Omit<Product, "id">>
  >(supabase, TABLE, "id");

  const res = await db.getById(id);
  if (res.error) {
    return json(
      { error: res.error.message, details: res.error.details ?? null },
      { status: 404 }
    );
  }
  if (!res.data) {
    return json({ error: "Not found" }, { status: 404 });
  }

  return json({ item: productModel(res.data) });
}

/**
 * PATCH /api/products/:id
 * Accepts:
 * - application/json: { name?, image_url?, description?, uses? }
 * - multipart/form-data: fields name/description/uses + image (File)
 */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const parsed = await getNumericIdFromParams(ctx);
  if (parsed.error) return parsed.error;
  const id = parsed.id!;

  const contentType = req.headers.get("content-type") || "";

  const db = new DbService<
    Product,
    Omit<Product, "id" | "created_at">,
    Partial<Omit<Product, "id">>
  >(supabase, TABLE, "id");

  // ---------- JSON PATCH (no file upload) ----------
  if (contentType.includes("application/json")) {
    let patch: Partial<Product> = {};
    try {
      patch = (await req.json()) as Partial<Product>;
    } catch {
      return json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const toUpdate: Partial<Omit<Product, "id">> = {};
    if (typeof patch.name === "string") toUpdate.name = patch.name.trim();
    if (typeof patch.image_url !== "undefined") toUpdate.image_url = patch.image_url ?? null;
    if (typeof patch.description !== "undefined") toUpdate.description = patch.description ?? null;
    if (typeof patch.uses !== "undefined") toUpdate.uses = patch.uses ?? null;

    if (Object.keys(toUpdate).length === 0) {
      const current = await db.getById(id);
      if (current.data) return json({ item: productModel(current.data) });
      return json({ error: "No changes" }, { status: 400 });
    }

    const res = await db.updateById(id, toUpdate);
    if (res.error || !res.data) {
      return json(
        { error: res.error?.message ?? "Unknown error", details: res.error?.details ?? null },
        { status: 400 }
      );
    }
    return json({ item: productModel(res.data) });
  }

  // ---------- multipart/form-data PATCH (text + file) ----------
  if (contentType.includes("multipart/form-data")) {
    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return json({ error: "Invalid multipart body" }, { status: 400 });
    }

    const name = (form.get("name") ?? "") as string;
    const description = (form.get("description") ?? "") as string;
    const uses = (form.get("uses") ?? "") as string;
    const image = form.get("image");

    const toUpdate: Partial<Omit<Product, "id">> = {};
    if (typeof name === "string" && name.length) toUpdate.name = name.trim();
    if (typeof description === "string") toUpdate.description = description.trim() || null;
    if (typeof uses === "string") toUpdate.uses = uses.trim() || null;

    if (image instanceof File && image.size > 0) {
      const uploaded = await uploadImageToStorage(supabase, id, image);
      if ("error" in uploaded) {
        return json({ error: "Image upload failed", details: uploaded.error }, { status: 400 });
      }
      // Store full public URL to be consistent with POST /api/products
      toUpdate.image_url = uploaded.publicUrl;
    }

    if (Object.keys(toUpdate).length === 0) {
      const current = await db.getById(id);
      if (current.data) return json({ item: productModel(current.data) });
      return json({ error: "No changes" }, { status: 400 });
    }

    const res = await db.updateById(id, toUpdate);
    if (res.error || !res.data) {
      return json(
        { error: res.error?.message ?? "Unknown error", details: res.error?.details ?? null },
        { status: 400 }
      );
    }

    return json({ item: productModel(res.data) });
  }

  // ---------- Unsupported content type ----------
  return json({ error: "Unsupported Content-Type" }, { status: 415 });
}

/**
 * DELETE /api/products/:id
 */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const supabase = auth.supabase!;

  const parsed = await getNumericIdFromParams(ctx);
  if (parsed.error) return parsed.error;
  const id = parsed.id!;

  const db = new DbService<
    Product,
    Omit<Product, "id" | "created_at">,
    Partial<Omit<Product, "id">>
  >(supabase, TABLE, "id");

  const res = await db.deleteById(id);
  if (res.error || !res.data) {
    return json(
      { error: res.error?.message ?? "Unknown error", details: res.error?.details ?? null },
      { status: 400 }
    );
  }

  return json({ ok: true, id });
}
