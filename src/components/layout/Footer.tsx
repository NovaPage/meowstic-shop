// src/components/layout/Footer.tsx
import Image from "next/image";
import Link from "next/link";

/** Desktop-only footer (mobile uses FloatingLogo) */
export function Footer() {
  return (
    <footer className="hidden sm:block w-full border-t mt-10">
      <div className="mx-auto max-w-7xl px-4 py-6 flex items-center justify-center">
        <Link href="/" aria-label="Ir al inicio" className="inline-flex items-center">
          <Image
            src="/logowhite.png"
            alt="Meowstic"
            width={120}
            height={32}
            className="block dark:hidden h-8 w-auto"
            priority={false}
          />
          <Image
            src="/logoblack.png"
            alt="Meowstic"
            width={120}
            height={32}
            className="hidden dark:block h-8 w-auto"
            priority={false}
          />
        </Link>
      </div>
    </footer>
  );
}
