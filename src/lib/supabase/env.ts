// src/lib/supabase/env.ts
/**
 * Centralized environment accessors for Supabase.
 * - Public: safe to expose on the client (RLS applies).
 * - Server: private keys for backend only (Node/Edge).
 * Code and comments in English. UI strings must be Spanish elsewhere.
 */

export type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string; // aka "publishable" key
};

function readPublicEnv(): PublicEnv {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!supabaseUrl) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!supabaseAnonKey) {
    throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return { supabaseUrl, supabaseAnonKey };
}

// Evaluate once on module load for stable values
export const publicEnv: PublicEnv = readPublicEnv();

// Wrapped in a function to avoid accidental import in the client bundle.
export type ServerEnv = {
  serviceRoleKey: string;
  jwtSecret?: string;
};

export function getServerEnv(): ServerEnv {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const jwtSecret = process.env.SUPABASE_JWT_SECRET ?? undefined;

  if (!serviceRoleKey) throw new Error("Missing env: SUPABASE_SERVICE_ROLE_KEY");

  return { serviceRoleKey, jwtSecret };
}
