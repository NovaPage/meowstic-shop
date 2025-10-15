// src/app/api/catalog/facets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getRouteHandlerClient } from "@/lib/supabase/server";

const TABLE = "products" as const;

type Row = { uses: string | null };

type FacetOption = {
  value: string; // normalized (lowercase) value for URLs
  label: string; // display label (original casing)
  count: number; // how many products include this "use"
};

function json<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

// Optional route revalidation hint (changes infrequently)
export const revalidate = 60 * 60; // 1 hour

/**
 * Facets endpoint (public)
 * - Returns distinct "uses" facet options with counts.
 * - Robust to CSV-like strings (supports ",", ";" and "|" separators).
 * - RLS must allow anon SELECT on products. No auth here.
 *
 * Response:
 * {
 *   options: Array<{ value, label, count }>,
 *   totalDistinct: number
 * }
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const supabase = await getRouteHandlerClient();

  try {
    // Only fetch the column we need
    const { data, error } = await supabase
      .from(TABLE)
      .select("uses")
      .not("uses", "is", null);

    if (error) {
      return json({ error: "Internal error" }, { status: 500 });
    }

    const counts = new Map<string, number>();
    const labelByKey = new Map<string, string>();

    (data as Row[] | null)?.forEach((row) => {
      const raw = row.uses?.trim();
      if (!raw) return;

      // Split multiple values in a single string: "ojos, labios" | "ojos;labios" | "ojos|labios"
      const parts = raw
        .split(/[,;|]/)
        .map((s) => s.trim())
        .filter(Boolean);

      for (const part of parts) {
        const key = part.toLowerCase(); // normalized key for URLs
        labelByKey.set(key, part); // remember display label (original casing)
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    });

    const options: FacetOption[] = Array.from(counts.entries())
      .map(([key, count]) => ({
        value: key,
        label: labelByKey.get(key) ?? key,
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));

    return new NextResponse(
      JSON.stringify({
        options,
        totalDistinct: options.length,
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json; charset=utf-8",
          // Edge/proxy caching with SWR
          "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch {
    return json({ error: "Internal error" }, { status: 500 });
  }
}
