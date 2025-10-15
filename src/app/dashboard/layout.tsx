// src/app/dashboard/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getServerComponentClient } from "@/lib/supabase/server"; // ⬅️ usar el client de RSC (solo lectura)
import { NavBar } from "@/components/dashboard/NavBar";

type DashboardLayoutProps = {
  children: ReactNode;
};

export const metadata = {
  title: "Dashboard",
};

/**
 * Server-protected layout for /dashboard.
 * Redirects to /login when there is no authenticated user.
 */
export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  // ✅ este cliente NO intenta escribir cookies en RSC
  const supabase = await getServerComponentClient();
  const { data: userRes } = await supabase.auth.getUser();

  if (!userRes?.user) {
    redirect("/login?next=/dashboard");
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <NavBar />
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </div>
    </div>
  );
}
