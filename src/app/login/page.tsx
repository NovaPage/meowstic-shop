// src/app/login/page.tsx
import { redirect } from "next/navigation";
import { getServerComponentClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import LoginForm from "@/components/auth/login/LoginForm";
import { JSX } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Server entry for the login page.
 * - Redirects to /dashboard if session exists.
 * - Renders client LoginForm otherwise.
 */
export default async function LoginPage(): Promise<JSX.Element> {
  const supabase: SupabaseClient<Database> = await getServerComponentClient();
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4">
      <LoginForm />
    </div>
  );
}
