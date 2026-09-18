import { publicEnv } from "@/lib/env";

/**
 * Absolute URL on the public app origin (NEXT_PUBLIC_APP_URL).
 *
 * Redirects must not be built from `request.url`: behind the reverse proxy the
 * standalone server sees its own bind address (http://0.0.0.0:3000), which
 * the browser cannot reach.
 */
export function appUrl(path: string): URL {
  return new URL(path, publicEnv.NEXT_PUBLIC_APP_URL);
}
