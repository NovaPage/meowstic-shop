// src/components/responsive/ResponsiveOverlay.tsx
"use client";

import * as React from "react";
import type { JSX } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogOverlay,
  DialogPortal,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"; // para título/desc ocultos

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
  DrawerOverlay,
  DrawerPortal,
} from "@/components/ui/drawer";

import { Button } from "@/components/ui/button";

type DrawerSide = "top" | "right" | "bottom" | "left";

export type ResponsiveOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: React.ReactNode;
  title?: string;
  description?: string;
  children: React.ReactNode;
  side?: DrawerSide; // dirección del Drawer en mobile
  className?: string;
  contentClassName?: string;
  desktopMaxWidthClassName?: string; // ej: "sm:max-w-md"
  closeAriaLabel?: string;
  desktopBreakpointPx?: number; // default 1024 = lg
};

function useIsDesktop(breakpointPx: number = 1024): boolean {
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    setIsDesktop(mql.matches);

    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      const matches = "matches" in e ? e.matches : mql.matches;
      setIsDesktop(matches);
    };

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", handler as (ev: MediaQueryListEvent) => void);
      return () => mql.removeEventListener("change", handler as (ev: MediaQueryListEvent) => void);
    }

    if ("onchange" in mql) {
      const mm = mql as MediaQueryList & {
        onchange: ((this: MediaQueryList, ev: MediaQueryListEvent) => void) | null;
      };
      mm.onchange = (ev) => handler(ev);
      return () => { mm.onchange = null; };
    }
  }, [breakpointPx]);

  return isDesktop;
}

function CloseSquare({
  ariaLabel,
  onClick,
  className,
}: {
  ariaLabel: string;
  onClick: () => void;
  className?: string;
}): JSX.Element {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="default"
      size="icon"
      aria-label={ariaLabel}
      className={cn(
        "absolute right-3 top-3 z-[70]",
        "h-9 w-9 rounded-xl bg-primary text-primary-foreground",
        "hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        className
      )}
    >
      <X className="h-4 w-4" />
    </Button>
  );
}

export default function ResponsiveOverlay({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  side = "bottom",
  className,
  contentClassName,
  desktopMaxWidthClassName = "sm:max-w-md",
  closeAriaLabel = "Cerrar",
  desktopBreakpointPx = 1024,
}: ResponsiveOverlayProps): JSX.Element {
  const isDesktop = useIsDesktop(desktopBreakpointPx);

  // Si el overlay se abre, soltamos foco del fondo para evitar aria-hidden + focus
  React.useEffect(() => {
    if (!open || typeof document === "undefined") return;
    const el = document.activeElement as HTMLElement | null;
    if (el && !el.closest("[role='dialog']")) el.blur();
  }, [open]);

  const headerTitle = (title ?? "").trim();
  const hasTitle = headerTitle.length > 0;
  const headerDescription = (description ?? "").trim();
  const hasDescription = headerDescription.length > 0;

  const scrollAreaClasses =
    "overflow-y-auto max-h-[min(80vh,calc(100dvh-10rem))] p-4";

  return (
    <div className={cn("relative", className)}>
      {trigger ?? null}

      {isDesktop ? (
        // -------- DESKTOP: Dialog de shadcn (Radix) --------
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogPortal>
            <DialogOverlay />
            <DialogContent
              className={cn(
                "p-0 gap-0 outline-none",
                "rounded-lg",
                desktopMaxWidthClassName,
                contentClassName
              )}
              // No manipulamos aria-describedby manualmente; garantizamos Title/Description
            >
              <DialogHeader className="px-4 pt-4 pb-2">
                {hasTitle ? (
                  <DialogTitle className="pr-12">{headerTitle}</DialogTitle>
                ) : (
                  <VisuallyHidden>
                    <DialogTitle>Modal</DialogTitle>
                  </VisuallyHidden>
                )}
                {hasDescription ? (
                  <DialogDescription>{headerDescription}</DialogDescription>
                ) : (
                  <VisuallyHidden>
                    <DialogDescription>Content</DialogDescription>
                  </VisuallyHidden>
                )}
              </DialogHeader>

              <div className={scrollAreaClasses}>{children}</div>

              <DialogClose asChild>
                <CloseSquare ariaLabel={closeAriaLabel} onClick={() => onOpenChange(false)} />
              </DialogClose>
            </DialogContent>
          </DialogPortal>
        </Dialog>
      ) : (
        // -------- MOBILE: Drawer de shadcn (sin Dialog en este branch) --------
        <Drawer open={open} onOpenChange={onOpenChange} direction={side}>
          <DrawerPortal>
            <DrawerOverlay />
            <DrawerContent
              className={cn(
                // el archivo de drawer ya posiciona según direction (top/bottom/left/right)
                "p-0 gap-0 outline-none",
                contentClassName
              )}
            >
              <DrawerHeader className="px-4 pt-4 pb-2">
                {hasTitle ? (
                  <DrawerTitle className="pr-12">{headerTitle}</DrawerTitle>
                ) : (
                  <VisuallyHidden>
                    <DrawerTitle>Sheet</DrawerTitle>
                  </VisuallyHidden>
                )}
                {hasDescription ? (
                  <DrawerDescription>{headerDescription}</DrawerDescription>
                ) : (
                  <VisuallyHidden>
                    <DrawerDescription>Content</DrawerDescription>
                  </VisuallyHidden>
                )}
              </DrawerHeader>

              <div className={scrollAreaClasses}>{children}</div>

              <DrawerClose asChild>
                <CloseSquare ariaLabel={closeAriaLabel} onClick={() => onOpenChange(false)} />
              </DrawerClose>
            </DrawerContent>
          </DrawerPortal>
        </Drawer>
      )}
    </div>
  );
}
