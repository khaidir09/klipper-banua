import type { NextConfig } from "next";

/**
 * Baseline security headers for every response. HSTS is added by Caddy in
 * production (it terminates HTTPS); a full script CSP is left out because the
 * App Router relies on inline scripts. `frame-ancestors` still blocks
 * clickjacking and `form-action`/`base-uri` limit injected markup.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    serverActions: {
      // Audience proof screenshots (max 5 MB) travel through a Server Action;
      // the default 1 MB limit would reject real phone screenshots. Larger
      // campaign material is uploaded straight to Supabase Storage instead.
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Client report links (FR-M9-05): the token is in the URL, so it must
        // not leak through the Referer header, and the page stays unindexed.
        // A later entry overrides the same key from the one above.
        source: "/laporan/:path*",
        headers: [
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Cache-Control", value: "private, no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
