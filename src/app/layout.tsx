// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { Footer } from "@/components/layout/Footer";
import { NavBar } from "@/components/layout/NavBar"; // User navigation (hidden on /dashboard)
import { FloatingLogo } from "@/components/layout/FloatingLogo"; // Mobile floating brand
import { ToasterProvider } from "@/components/ui/ToasterProvider";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  title: "Meowstic Shop",
  description: "Starter ready to build.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Add bottom padding for mobile bottom-nav; remove on sm+ */}
      <body className="antialiased min-h-dvh bg-background text-foreground pb-14 sm:pb-0">
        <ThemeProvider>
          <QueryProvider>
            <NavBar />
            <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

            {/* Mobile floating logo + gradient (z-40), navbar mobile uses z-50 */}
            <FloatingLogo />

            <Footer />
            <ToasterProvider />
            <Analytics />
            <SpeedInsights />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
