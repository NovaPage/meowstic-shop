// src/app/api/catalog/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRouteHandlerClient } from "@/lib/supabase/server";
import { productModel, type Product } from "@/types/product";

const TABLE = "products" as const;

type OrderBy = "created_at" | "name";

function json<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

function coerceBoolean(input: string | null | undefined, fallback: boolean): boolean {
  if (typeof input !== "string") return fallback;
  return input === "true";
}

/**
 * Public catalog list (RLS must allow anon SELECT).
 * Query params:
 *   q?           -> text search in name/description/uses
 *   limit?       -> default 50
 *   offset?      -> default 0
 *   orderBy?     -> "created_at" | "name" (default "created_at")
 *   ascending?   -> default true when orderBy=name, false otherwise
 */
export async function GET(req: NextRequest) {
  const supabase = await getRouteHandlerClient();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Number(searchParams.get("limit") ?? "50");
  const offset = Number(searchParams.get("offset") ?? "0");
  const orderByParam = (searchParams.get("orderBy") ?? "created_at") as OrderBy;
  const ascending = coerceBoolean(
    searchParams.get("ascending"),
    orderByParam === "name"
  );

  try {
    if (q.length > 0) {
      const orExpr = `name.ilike.%${q}%,description.ilike.%${q}%,uses.ilike.%${q}%`;
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .or(orExpr)
        .order(orderByParam, { ascending })
        .range(offset, Math.max(offset, offset + limit - 1));

      if (error) return json({ error: "Internal error" }, { status: 500 });

      const items = (data ?? []).map((row) => productModel(row as Partial<Product>));
      return json({ items, count: items.length });
    }

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order(orderByParam, { ascending })
      .range(offset, Math.max(offset, offset + limit - 1));

    if (error) return json({ error: "Internal error" }, { status: 500 });

    const items = (data ?? []).map((row) => productModel(row as Partial<Product>));
    return json({ items, count: items.length });
  } catch {
    return json({ error: "Internal error" }, { status: 500 });
  }
}
