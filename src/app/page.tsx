// src/app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingBag, LogIn } from "lucide-react";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center px-4 bg-gradient-to-b from-background to-muted/20">
      <section className="space-y-6 max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight">
          Bienvenido a <span className="text-primary">Meowstic Shop 🐾</span>
        </h1>

        <p className="text-muted-foreground text-lg">
          Tu tienda mágica donde cada producto tiene su propio encanto.
          <br />
          Explora el catálogo o inicia sesión para gestionar tus productos.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/catalog">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Ver Catálogo
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/login">
              <LogIn className="mr-2 h-5 w-5" />
              Iniciar Sesión
            </Link>
          </Button>
        </div>
      </section>

      {/* CHANGED: normal flow + margin to avoid mobile-bottom-nav overlap */}
      <footer className="mt-10 mb-16 sm:mb-0 text-sm text-muted-foreground text-center">
        © {new Date().getFullYear()} Meowstic Shop — Donde la magia y la tecnología se encuentran ✨
      </footer>
    </main>
  );
}
