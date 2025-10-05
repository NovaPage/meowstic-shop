// src/lib/supabase/storage-service.ts
import type { SupabaseClient } from "@supabase/supabase-js";

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

export type StorageFileObject = {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown> | null;
};

export type UploadBody = File | Blob | ArrayBuffer | Uint8Array;

/**
 * Normalize various inputs to what supabase-js upload() accepts:
 * - File/Blob: return as-is
 * - Uint8Array: return ArrayBuffer (not Blob) to avoid TS issues with BlobPart
 * - ArrayBuffer: return as-is
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toUploadBody(input: UploadBody, _contentType?: string): File | Blob | ArrayBuffer {
  if (typeof File !== "undefined" && input instanceof File) return input;
  if (typeof Blob !== "undefined" && input instanceof Blob) return input;

  if (input instanceof Uint8Array) {
    // Use the underlying ArrayBuffer. Cast to ArrayBuffer to avoid ArrayBufferLike complaints.
    const buf = input.buffer as ArrayBuffer;
    // Optionally slice to detach/ensure the correct view range:
    return buf.byteLength === input.byteLength && input.byteOffset === 0
      ? buf
      : buf.slice(input.byteOffset, input.byteOffset + input.byteLength);
  }

  // Already an ArrayBuffer
  return input as ArrayBuffer;
}

export class StorageService {
  private client: SupabaseClient;

  constructor(client: SupabaseClient) {
    this.client = client;
  }

  /** Upload a file. If `path` is omitted, a random one is generated. */
  async upload(
    bucket: string,
    file: UploadBody,
    opts?: {
      path?: string; // e.g. "products/eco-bottle.jpg"
      contentType?: string;
      upsert?: boolean;
      cacheControl?: string; // e.g. "3600"
    }
  ): Promise<Result<{ path: string }>> {
    try {
      const path = opts?.path ?? cryptoRandomId("asset");
      const body = toUploadBody(file, opts?.contentType);

      // Do not include bucket in the path argument
      const { error } = await this.client.storage.from(bucket).upload(path, body, {
        contentType: opts?.contentType,
        upsert: opts?.upsert ?? false,
        cacheControl: opts?.cacheControl,
      });

      if (error) return fail(error);
      return ok({ path });
    } catch (e) {
      return fail(e);
    }
  }

  /** Public URL (bucket must be public or policy must allow it) */
  getPublicUrl(bucket: string, path: string): Result<{ publicUrl: string }> {
    try {
      const { data } = this.client.storage.from(bucket).getPublicUrl(path);
      return ok({ publicUrl: data.publicUrl });
    } catch (e) {
      return fail(e);
    }
  }

  /** Signed URL with expiration (seconds) */
  async createSignedUrl(bucket: string, path: string, expiresInSeconds: number): Promise<Result<{ signedUrl: string }>> {
    try {
      const { data, error } = await this.client.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
      if (error) return fail(error);
      return ok({ signedUrl: data.signedUrl });
    } catch (e) {
      return fail(e);
    }
  }

  /** Download: Blob in browser (ArrayBuffer/stream server-side depending on runtime) */
  async download(bucket: string, path: string): Promise<Result<Blob>> {
    try {
      const { data, error } = await this.client.storage.from(bucket).download(path);
      if (error) return fail(error);
      return ok(data as Blob);
    } catch (e) {
      return fail(e);
    }
  }

  /** List files under a prefix */
  async list(
    bucket: string,
    prefix: string = "",
    opts?: {
      limit?: number;
      offset?: number;
      search?: string;
      sortBy?: { column: "name" | "updated_at" | "created_at"; order?: "asc" | "desc" };
    }
  ): Promise<Result<StorageFileObject[]>> {
    try {
      const { data, error } = await this.client.storage.from(bucket).list(prefix, {
        limit: opts?.limit,
        offset: opts?.offset,
        search: opts?.search,
        sortBy: opts?.sortBy,
      });
      if (error) return fail(error);
      return ok((data ?? []) as unknown as StorageFileObject[]);
    } catch (e) {
      return fail(e);
    }
  }

  /** Remove multiple paths */
  async remove(bucket: string, paths: string[]): Promise<Result<{ removed: string[] }>> {
    try {
      const { data, error } = await this.client.storage.from(bucket).remove(paths);
      if (error) return fail(error);
      const removed = (Array.isArray(data) ? data : []).map((x) => String((x as { path?: unknown }).path ?? ""));
      return ok({ removed });
    } catch (e) {
      return fail(e);
    }
  }

  /** Move a file */
  async move(bucket: string, fromPath: string, toPath: string): Promise<Result<{ from: string; to: string }>> {
    try {
      const { error } = await this.client.storage.from(bucket).move(fromPath, toPath);
      if (error) return fail(error);
      return ok({ from: fromPath, to: toPath });
    } catch (e) {
      return fail(e);
    }
  }

  /** Copy a file */
  async copy(bucket: string, fromPath: string, toPath: string): Promise<Result<{ from: string; to: string }>> {
    try {
      const { error } = await this.client.storage.from(bucket).copy(fromPath, toPath);
      if (error) return fail(error);
      return ok({ from: fromPath, to: toPath });
    } catch (e) {
      return fail(e);
    }
  }
}

/** Random id (works in server/client) */
export function cryptoRandomId(prefix = "id"): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${id}`;
}
