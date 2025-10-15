// src/components/layout/NavBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ShoppingCart, Search } from "lucide-react";
import { useCartTotalItems } from "@/stores/useCartStore";
import { ThemeToggleUser } from "@/components/layout/ThemeToggleUser";

/**
 * User NavBar (desktop sticky with soft shadow, mobile bottom bar):
 * - Order (L→R): Theme, Search, Cart, Catalog
 * - Hidden automatically on /dashboard/**
 * Visible text is Spanish; code and comments are in English.
 */
export function NavBar() {
  const pathname = usePathname();

  // Hide on dashboard routes (admin has its own layout/navigation)
  if (pathname?.startsWith("/dashboard")) return null;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const total = useCartTotalItems();
  const isActive = (path: string) => pathname === path;

  const linkBase = "flex items-center gap-2 transition-colors text-sm";
  const linkMuted = "text-muted-foreground hover:text-foreground";
  const linkActive = "text-foreground font-medium";

  return (
    <>
      {/* Desktop header (sticky + soft shadow) */}
      <header
        className="sticky top-0 z-40 hidden w-full border-b bg-background/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:block"
        role="banner"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          {/* Brand */}
          <Link href="/" className="font-semibold" aria-label="Ir al inicio">
            Meowstic
          </Link>

          {/* Actions: Theme → Search → Cart → Catalog */}
          <nav className="flex items-center gap-5" aria-label="Navegación principal">
            <ThemeToggleUser />

            <Link
              href="/catalog"
              className={`${linkBase} ${pathname?.startsWith("/catalog") ? linkActive : linkMuted}`}
              aria-label="Buscar productos"
              aria-current={pathname?.startsWith("/catalog") ? "page" : undefined}
              title="Buscar"
            >
              <Search size={18} />
              <span>Buscar</span>
            </Link>

            <Link
              href="/cart"
              className={`${linkBase} ${isActive("/cart") ? linkActive : linkMuted} relative`}
              aria-label="Ver carrito"
              aria-current={isActive("/cart") ? "page" : undefined}
              title="Carrito"
            >
              <span className="relative inline-flex">
                <ShoppingCart size={18} />
                {total > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-2 -top-2 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground"
                  >
                    {total}
                  </span>
                )}
              </span>
              <span>Carrito</span>
            </Link>

            <Link
              href="/catalog"
              className={`${linkBase} ${isActive("/catalog") ? linkActive : linkMuted}`}
              aria-label="Ir al catálogo"
              aria-current={isActive("/catalog") ? "page" : undefined}
              title="Catálogo"
            >
              <LayoutGrid size={18} />
              <span>Catálogo</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Mobile bottom nav (fixed) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:hidden"
        aria-label="Navegación inferior"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-around px-2">
          <div className="flex flex-col items-center justify-center text-xs">
            <ThemeToggleUser />
            <span className="mt-0.5 text-[10px]">Tema</span>
          </div>

          <Link
            href="/catalog"
            className={`flex flex-col items-center justify-center text-xs ${
              pathname?.startsWith("/catalog")
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Buscar productos"
            aria-current={pathname?.startsWith("/catalog") ? "page" : undefined}
            title="Buscar"
          >
            <Search size={22} />
            <span className="mt-0.5 text-[10px]">Buscar</span>
          </Link>

          <Link
            href="/cart"
            className={`relative flex flex-col items-center justify-center text-xs ${
              isActive("/cart") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Ver carrito"
            aria-current={isActive("/cart") ? "page" : undefined}
            title="Carrito"
          >
            <span className="relative inline-flex">
              <ShoppingCart size={22} />
              {total > 0 && (
                <span
                  aria-hidden
                  className="absolute -right-2 -top-1 inline-flex min-h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground"
                >
                  {total}
                </span>
              )}
            </span>
            <span className="mt-0.5 text-[10px]">Carrito</span>
          </Link>

          <Link
            href="/catalog"
            className={`flex flex-col items-center justify-center text-xs ${
              isActive("/catalog") ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Ir al catálogo"
            aria-current={isActive("/catalog") ? "page" : undefined}
            title="Catálogo"
          >
            <LayoutGrid size={22} />
            <span className="mt-0.5 text-[10px]">Catálogo</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
