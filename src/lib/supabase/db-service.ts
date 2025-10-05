// src/lib/supabase/db-service.ts
import type { SupabaseClient } from "@supabase/supabase-js";

/** Resultado estándar sin throws */
export type Result<T> = {
  data: T | null;
  error: { message: string; details?: unknown } | null;
};

function ok<T>(data: T): Result<T> {
  return { data, error: null };
}
function fail<T = never>(e: unknown): Result<T> {
  const message =
    typeof e === "object" && e !== null && "message" in e
      ? String((e as { message?: unknown }).message)
      : "Unknown error";
  return { data: null, error: { message, details: e } };
}

type Primitive = string | number | boolean | null;

/** Filtros básicos para list() */
export type ListOptions<TRecord extends Record<string, unknown>> = {
  select?: string; // "*" o columnas
  limit?: number;
  offset?: number;
  orderBy?: { column: keyof TRecord & string; ascending?: boolean; nullsFirst?: boolean };
  equals?: Partial<Record<keyof TRecord & string, Primitive>>; // col = valor
  filters?: Array<{
    column: keyof TRecord & string;
    op: "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "is" | "in";
    value: unknown;
  }>;
};

/**
 * Repositorio genérico (CRUD) por tabla.
 * - No usa `any`
 * - No lanza excepciones (siempre {data,error})
 * - Tipado genérico por registro/insert/update, pero sin pasar genéricos a `.from()`
 */
export class DbService<
  TRecord extends Record<string, unknown>,
  TInsert extends Record<string, unknown> = TRecord,
  TUpdate extends Partial<TRecord> = Partial<TRecord>
> {
  private client: SupabaseClient;
  private table: string;
  private pk: keyof TRecord & string;

  constructor(client: SupabaseClient, table: string, primaryKey: keyof TRecord & string = "id" as keyof TRecord & string) {
    this.client = client;
    this.table = table;
    this.pk = primaryKey;
  }

  /** CREATE (uno) */
  async create(record: TInsert): Promise<Result<TRecord>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .insert(record)
        .select("*")
        .single();

      if (error) return fail(error);
      return ok(data as unknown as TRecord);
    } catch (e) {
      return fail(e);
    }
  }

  /** CREATE (muchos) */
  async createMany(records: TInsert[]): Promise<Result<TRecord[]>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .insert(records)
        .select("*");

      if (error) return fail(error);
      return ok((data ?? []) as unknown as TRecord[]);
    } catch (e) {
      return fail(e);
    }
  }

  /** READ (por id) */
  async getById(id: string | number, select: string = "*"): Promise<Result<TRecord>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .select(select)
        // Cast de tipos para contentar el builder de supabase-js sin usar `any`
        .eq(this.pk as string, id as unknown as never)
        .single();

      if (error) return fail(error);
      return ok(data as unknown as TRecord);
    } catch (e) {
      return fail(e);
    }
  }

  /** LIST con filtros/paginación/orden */
  async list(options: ListOptions<TRecord> = {}): Promise<Result<TRecord[]>> {
    try {
      const { select = "*", limit, offset, orderBy, equals, filters } = options;

      let query = this.client.from(this.table).select(select);

      // equals => col = valor
      if (equals) {
        for (const [col, val] of Object.entries(equals)) {
          query = query.eq(col, val as unknown as never);
        }
      }

      // filtros avanzados
      if (filters && filters.length) {
        for (const f of filters) {
          const c = f.column as string;
          switch (f.op) {
            case "neq":
              query = query.neq(c, f.value as unknown as never);
              break;
            case "gt":
              query = query.gt(c, f.value as unknown as never);
              break;
            case "gte":
              query = query.gte(c, f.value as unknown as never);
              break;
            case "lt":
              query = query.lt(c, f.value as unknown as never);
              break;
            case "lte":
              query = query.lte(c, f.value as unknown as never);
              break;
            case "like":
              query = query.like(c, String(f.value));
              break;
            case "ilike":
              query = query.ilike(c, String(f.value));
              break;
            case "is":
              // null / true / false / string
              query = query.is(c, f.value as unknown as never);
              break;
            case "in": {
              const arr = Array.isArray(f.value) ? f.value : String(f.value).split(",");
              query = query.in(c, arr as unknown as never);
              break;
            }
            default:
              break;
          }
        }
      }

      if (orderBy?.column) {
        query = query.order(orderBy.column, {
          ascending: orderBy.ascending ?? true,
          nullsFirst: orderBy.nullsFirst ?? true,
        });
      }

      if (typeof limit === "number") query = query.limit(limit);
      if (typeof offset === "number") {
        const to = (limit ?? 100) - 1 + offset;
        query = query.range(offset, to);
      }

      const { data, error } = await query;
      if (error) return fail(error);
      return ok((data ?? []) as unknown as TRecord[]);
    } catch (e) {
      return fail(e);
    }
  }

  /** UPDATE por id (parcial) */
  async updateById(id: string | number, patch: TUpdate): Promise<Result<TRecord>> {
    try {
      const { data, error } = await this.client
        .from(this.table)
        .update(patch)
        .eq(this.pk as string, id as unknown as never)
        .select("*")
        .single();

      if (error) return fail(error);
      return ok(data as unknown as TRecord);
    } catch (e) {
      return fail(e);
    }
  }

  /** DELETE por id */
  async deleteById(id: string | number): Promise<Result<{ id: string | number }>> {
    try {
      const { error } = await this.client.from(this.table).delete().eq(this.pk as string, id as unknown as never);
      if (error) return fail(error);
      return ok({ id });
    } catch (e) {
      return fail(e);
    }
  }
}
