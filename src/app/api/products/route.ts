// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRouteHandlerClient } from "@/lib/supabase/server";
import { DbService } from "@/lib/supabase/db-service";
import { StorageService } from "@/lib/supabase/storage-service";
import { productModel, type Product } from "@/types/product";

const TABLE = "products" as const;
const BUCKET = "products" as const;

// ---------- logging helpers (server only) ----------
function rid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}
function logBase(level: "debug" | "info" | "warn" | "error", requestId: string, msg: string, extra?: unknown) {
  const payload = extra ? { requestId, msg, extra } : { requestId, msg };
  console[level](`[products:${level}]`, payload);
}
const logDebug = (id: string, m: string, e?: unknown) => logBase("debug", id, m, e);
const logInfo  = (id: string, m: string, e?: unknown) => logBase("info",  id, m, e);
const logWarn  = (id: string, m: string, e?: unknown) => logBase("warn",  id, m, e);
const logError = (id: string, m: string, e?: unknown) => logBase("error", id, m, e);

// ---------- JSON helper (do not leak server details) ----------
function json<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}
function coerceBoolean(input: string | null | undefined, fallback: boolean) {
  if (typeof input !== "string") return fallback;
  return input === "true";
}

/**
 * GET /api/products
 */
export async function GET(req: NextRequest) {
  const requestId = rid();
  logInfo(requestId, "GET /api/products called");

  const supabase = await getRouteHandlerClient();
  const { data: userRes, error: authErr } = await supabase.auth.getUser();

  if (authErr) {
    logWarn(requestId, "auth.getUser failed", { authErr });
  }
  if (!userRes?.user) {
    logInfo(requestId, "Unauthorized request");
    return json({ error: "Unauthorized", requestId }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");
  const orderByParam = (searchParams.get("orderBy") ?? "created_at") as "created_at" | "name";
  const ascending = coerceBoolean(searchParams.get("ascending"), orderByParam === "name");

  logDebug(requestId, "Query params parsed", { q, limit, offset, orderByParam, ascending });

  try {
    if (q.length > 0) {
      const orExpr = `name.ilike.%${q}%,description.ilike.%${q}%,uses.ilike.%${q}%`;
      logDebug(requestId, "Running filtered SELECT", { orExpr });

      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .or(orExpr)
        .order(orderByParam, { ascending })
        .range(offset, Math.max(offset, offset + limit - 1));

      if (error) {
        logError(requestId, "SELECT with filter failed", { error });
        return json({ error: "Internal error", requestId }, { status: 500 });
      }

      const items = (data ?? []).map((row) => productModel(row as Partial<Product>));
      logInfo(requestId, "GET filtered success", { count: items.length });
      return json({ items, count: items.length, requestId });
    }

    logDebug(requestId, "Running unfiltered list");
    const db = new DbService<
      Product,
      Omit<Product, "id" | "created_at">,
      Partial<Omit<Product, "id">>
    >(supabase, TABLE, "id");

    const res = await db.list({ limit, offset, orderBy: { column: orderByParam, ascending } });

    if (res.error || !res.data) {
      logError(requestId, "DB list failed", { dbError: res.error });
      return json({ error: "Internal error", requestId }, { status: 500 });
    }

    const items = res.data.map(productModel);
    logInfo(requestId, "GET success", { count: items.length });
    return json({ items, count: items.length, requestId });
  } catch (e) {
    logError(requestId, "Unhandled GET error", e);
    return json({ error: "Internal error", requestId }, { status: 500 });
  }
}

/**
 * POST /api/products
 * Acepta:
 *  - application/json: { name, image_url?, description?, uses? }
 *  - multipart/form-data: fields { name, description?, uses? } + file "image"
 *    -> Sube la imagen al bucket "products" y persiste la URL pública resultante.
 */
export async function POST(req: NextRequest) {
  const requestId = rid();
  logInfo(requestId, "POST /api/products called");

  const supabase = await getRouteHandlerClient();
  const { data: userRes, error: authErr } = await supabase.auth.getUser();

  if (authErr) {
    logWarn(requestId, "auth.getUser failed", { authErr });
  }
  if (!userRes?.user) {
    logInfo(requestId, "Unauthorized request");
    return json({ error: "Unauthorized", requestId }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  logDebug(requestId, "Content-Type received", { contentType });

  let incoming: Partial<Product> = {};
  let uploadedImageUrl: string | undefined;

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const name = String(form.get("name") ?? "").trim();
      const description = form.get("description");
      const uses = form.get("uses");
      const file = form.get("image");

      logDebug(requestId, "FormData parsed", {
        hasName: !!name,
        hasDescription: typeof description === "string",
        hasUses: typeof uses === "string",
        hasFile: file instanceof File,
        fileInfo: file instanceof File ? { name: file.name, size: file.size, type: file.type } : null,
      });

      if (!name) {
        logWarn(requestId, "Missing name field");
        return json({ error: "Invalid data", requestId }, { status: 400 });
      }

      if (file instanceof File) {
        const storage = new StorageService(supabase);
        const ext = file.name?.split(".").pop() || "bin";
        const key = `products/${crypto.randomUUID()}.${ext}`;
        const fileObj: File = file;

        logDebug(requestId, "Uploading file to storage", { bucket: BUCKET, key, size: fileObj.size });

        const upRes = await storage.upload(BUCKET, fileObj, { path: key, contentType: fileObj.type, upsert: false });
        if (upRes.error) {
          logError(requestId, "Storage upload failed", { error: upRes.error, key });
          return json({ error: "Upload failed", requestId }, { status: 400 });
        }

        const pub = storage.getPublicUrl(BUCKET, key);
        uploadedImageUrl = pub.data?.publicUrl ?? undefined;
        logInfo(requestId, "File uploaded", { key, public: !!uploadedImageUrl });
      }

      incoming = {
        name,
        description: typeof description === "string" ? description : undefined,
        uses: typeof uses === "string" ? uses : undefined,
        image_url: uploadedImageUrl,
      };
    } else {
      const payload = await req.json().catch((e) => {
        logWarn(requestId, "Invalid JSON body", { e });
        return null;
      });
      if (!payload || typeof payload !== "object") {
        return json({ error: "Invalid JSON body", requestId }, { status: 400 });
      }
      incoming = payload as Partial<Product>;
      logDebug(requestId, "JSON body parsed", { hasName: typeof incoming.name === "string" });
    }

    const normalized = productModel({
      ...incoming,
      id: 0,
      created_at: new Date().toISOString(),
    });

    const toInsert: Omit<Product, "id" | "created_at"> = {
      name: normalized.name,
      image_url: normalized.image_url,
      description: normalized.description,
      uses: normalized.uses,
    };

    logDebug(requestId, "Creating DB row", { table: TABLE, hasImage: !!toInsert.image_url });

    const db = new DbService<
      Product,
      Omit<Product, "id" | "created_at">,
      Partial<Omit<Product, "id">>
    >(supabase, TABLE, "id");

    const res = await db.create(toInsert);
    if (res.error || !res.data) {
      logError(requestId, "DB create failed", { dbError: res.error });
      return json({ error: "Could not create product", requestId }, { status: 400 });
    }

    const item = productModel(res.data);
    logInfo(requestId, "Product created", { id: item.id });
    return json({ item, requestId }, { status: 201 });
  } catch (e) {
    logError(requestId, "Unhandled POST error", e);
    return json({ error: "Internal error", requestId }, { status: 500 });
  }
}
