// src/app/dashboard/layout.tsx
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getRouteHandlerClient } from "@/lib/supabase/server";
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
  const supabase = await getRouteHandlerClient();
  const { data: userRes } = await supabase.auth.getUser();

  if (!userRes?.user) {
    // Preserve return path if you like:
    redirect("/login?next=/dashboard");
  }

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Client NavBar with ThemeToggle */}
      <NavBar />

      {/* Page body */}
      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        {children}
      </div>
    </div>
  );
}
