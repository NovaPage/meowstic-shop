// src/components/catalog/FiltersTrigger.tsx
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

type FacetOption = {
  value: string;
  label?: string;
  count?: number;
};

type FiltersTriggerProps = {
  options: FacetOption[];
  selected?: string[];
  /** Querystring key used to persist selection in URL. Default: "uses" */
  paramKey?: string;
  className?: string;
};

/**
 * FiltersTrigger
 * - Desktop: Dropdown with checkbox items
 * - Mobile: Drawer (bottom) with chip-style toggles
 * - Immediate apply: toggling updates URL and refreshes RSC
 * - User-visible text in Spanish; code/comments in English
 */
export function FiltersTrigger({
  options,
  selected = [],
  paramKey = "uses",
  className,
}: FiltersTriggerProps): React.JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sort options for consistent UX
  const sorted = React.useMemo(
    () =>
      [...options].sort((a, b) =>
        (a.label ?? a.value).localeCompare(b.label ?? b.value, undefined, { sensitivity: "base" })
      ),
    [options]
  );

  /** Replace the current URL with the provided "uses" set and refresh RSC. */
  const applyToUrl = React.useCallback(
    (values: string[]) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (values.length > 0) params.set(paramKey, values.join(","));
      else params.delete(paramKey);
      // Reset pagination if present
      params.delete("page");

      const nextUrl = `${pathname}?${params.toString()}`;

      // Ensure Server Components re-fetch with new searchParams
      router.replace(nextUrl, { scroll: false });
      router.refresh();
    },
    [pathname, router, searchParams, paramKey]
  );

  /** Toggle a single value and apply immediately. */
  const toggleImmediate = (val: string, nextChecked: boolean) => {
    const set = new Set(selected);
    if (nextChecked) set.add(val);
    else set.delete(val);
    applyToUrl(Array.from(set));
  };

  /** Clear all immediately. */
  const clearImmediate = () => applyToUrl([]);

  const selectedCount = selected.length;

  // Tiny circular badge on the trigger when active
  const ActiveBadge = () =>
    selectedCount > 0 ? (
      <span
        aria-hidden
        className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground"
      >
        {selectedCount}
      </span>
    ) : null;

  return (
    <div className={cn("relative", className)}>
      {/* ===== Desktop (Dropdown) ===== */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Filtros"
            title="Filtros"
            className="hidden sm:inline-flex relative"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <ActiveBadge />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="flex items-center justify-between px-2 pt-2">
            <DropdownMenuLabel>Filtrar por uso</DropdownMenuLabel>
            {selectedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={clearImmediate}
              >
                Limpiar
              </Button>
            )}
          </div>
          <DropdownMenuSeparator />
          <div className="max-h-60 overflow-auto py-1">
            {sorted.length === 0 ? (
              <div className="px-2 py-1 text-xs text-muted-foreground">Sin opciones</div>
            ) : (
              sorted.map((opt) => {
                const label = opt.label ?? opt.value;
                const isChecked = selected.includes(opt.value);
                return (
                  <DropdownMenuCheckboxItem
                    key={opt.value}
                    checked={isChecked}
                    onCheckedChange={(v) => toggleImmediate(opt.value, Boolean(v))}
                    className="capitalize"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="truncate">{label}</span>
                      {typeof opt.count === "number" && (
                        <span className="text-xs text-muted-foreground">{opt.count}</span>
                      )}
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ===== Mobile (Drawer) ===== */}
      <Drawer>
        <DrawerTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Filtros"
            title="Filtros"
            className="relative sm:hidden"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <ActiveBadge />
          </Button>
        </DrawerTrigger>

        {/* Drawer slides from bottom (vaul). Add inner padding and iOS safe-area. */}
        <DrawerContent className="sm:hidden">
          <div className="mx-auto w-full max-w-7xl px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+16px)]">
            <DrawerHeader className="mb-2 px-0">
              <div className="flex items-center justify-between">
                <DrawerTitle>Filtrar por uso</DrawerTitle>
                {selectedCount > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={clearImmediate}
                  >
                    Limpiar
                  </Button>
                )}
              </div>
            </DrawerHeader>

            {/* Chip grid with comfortable gutters and rounded pills */}
            <div className="grid grid-cols-2 gap-3">
              {sorted.length === 0 ? (
                <div className="col-span-2 rounded-md border bg-muted/40 p-3 text-center text-xs text-muted-foreground">
                  Sin opciones disponibles
                </div>
              ) : (
                sorted.map((opt) => {
                  const label = opt.label ?? opt.value;
                  const active = selected.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggleImmediate(opt.value, !active)}
                      className={cn(
                        "flex min-w-0 items-center justify-between gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted"
                      )}
                    >
                      <span className="truncate capitalize">{label}</span>
                      {typeof opt.count === "number" && (
                        <span
                          className={cn(
                            "text-xs",
                            active ? "opacity-90" : "text-muted-foreground"
                          )}
                        >
                          {opt.count}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Toca para activar/desactivar. Los cambios se aplican al instante.
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
