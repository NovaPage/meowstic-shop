"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LayoutGrid } from "lucide-react";

/**
 * Responsive NavBar:
 * - Desktop: top header with links
 * - Mobile: bottom fixed navigation bar
 */
export function NavBar() {
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Top Nav (desktop) */}
      <header className="hidden sm:block w-full border-b bg-background/80 backdrop-blur">
        <div className="mx-auto h-14 flex max-w-7xl items-center justify-between px-4">
          <Link href="/" className="font-semibold">
            Meowstic
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/catalog"
              className={`flex items-center gap-2 transition-colors ${
                isActive("/products")
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid size={18} />
              <span>Catalogo</span>
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      {/* Bottom Nav (mobile) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur">
        <div className="flex justify-around items-center h-14">
          <Link
            href="/catalog"
            className={`flex flex-col items-center justify-center text-xs transition-colors ${
              isActive("/catalog")
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutGrid size={22} />
            <span className="text-[10px] mt-0.5">Catalogo</span>
          </Link>

          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}
