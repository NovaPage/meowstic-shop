// src/components/layout/FloatingLogo.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

/**
 * Floating brand button (mobile):
 * - Positioned bottom-left (not centered)
 * - Circular "FAB" with favicon inside
 * - Blurred/translucent background, subtle border + shadow
 * - Sits above the mobile navbar height; uses safe-area padding on iOS
 * - Does not block the navbar (navbar should keep z-50; this uses z-40)
 */
export function FloatingLogo(): React.JSX.Element {
  return (
    <>
      {/* Bottom gradient overlay (visual polish). Doesn't intercept taps. */}
      <div
        className="fixed inset-x-0 bottom-0 z-30 sm:hidden pointer-events-none"
        aria-hidden
      >
        <div className="h-24 bg-gradient-to-t from-background/95 via-background/60 to-transparent" />
      </div>

      {/* Circular FAB with favicon, bottom-left */}
      <div
        className="fixed z-40 sm:hidden"
        style={{
          // Place just above the bottom nav (h-14 ≈ 3.5rem) + safe-area
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 4rem)",
          left: "1rem",
        }}
      >
        <Link
          href="/"
          aria-label="Ir al inicio"
          className={[
            // Size & shape
            "h-12 w-12 rounded-full",
            // Visuals: border + translucent bg + blur + shadow
            "border bg-background/80 shadow-md backdrop-blur-md supports-[backdrop-filter]:bg-background/60",
            // Center content
            "inline-flex items-center justify-center",
            // Interaction
            "transition-transform active:scale-95",
          ].join(" ")}
        >
          {/* Favicon inside the FAB */}
          <Image
            src="/favicon.ico"
            alt="Meowstic"
            width={24}
            height={24}
            className="h-6 w-6"
            priority={false}
          />
        </Link>
      </div>
    </>
  );
}
