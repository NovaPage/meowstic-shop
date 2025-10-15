// src/components/layout/ThemeToggleUser.tsx
"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Minimal, borderless theme toggle for the user navbar/footer.
 * - No outline/border, subtle hover.
 * - Accessible (Spanish label).
 * - Does NOT affect the dashboard toggle.
 */
export function ThemeToggleUser({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label="Cambiar tema"
      title="Cambiar tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-full",
        "border-0 shadow-none bg-transparent",
        "text-muted-foreground hover:text-foreground",
        "hover:bg-muted/60 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
        className
      )}
    >
      {/* Sun/Moon crossfade */}
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-transform duration-200 dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-transform duration-200 dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Cambiar tema</span>
    </button>
  );
}
