// next.config.ts
import type { NextConfig } from "next";

// Derive the Supabase hostname from your ENV at build time.
// Make sure NEXT_PUBLIC_SUPABASE_URL is set (e.g. https://abcd1234.supabase.co)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_HOST = (() => {
  try {
    return SUPABASE_URL ? new URL(SUPABASE_URL).hostname : undefined;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  images: {
    // Use remotePatterns so we can restrict path to public storage objects
    remotePatterns: [
      ...(SUPABASE_HOST
        ? [
            {
              protocol: "https",
              hostname: SUPABASE_HOST,
              // Public bucket files are served from this path
              pathname: "/storage/v1/object/public/**",
            } as const,
          ]
        : []),
    ],
  },
};

export default nextConfig;
