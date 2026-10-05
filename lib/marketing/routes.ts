/**
 * The public marketing site (PRD M15). Every path here is reachable without a
 * session and is the only part of the app search engines may index.
 *
 * `/kampanye` (FR-M15-09, PRD 1.6) is the one page that reads the database,
 * through the anon view `public_campaign_catalog` and without a session.
 *
 * Keep this list as the single source of truth: the session proxy, `robots.ts`
 * and `sitemap.ts` all read it, so a page added in one place cannot be
 * forgotten in the others.
 */
export const MARKETING_PATHS = ["/", "/kreator", "/kampanye", "/privasi", "/syarat"] as const;

export type MarketingPath = (typeof MARKETING_PATHS)[number];

/**
 * Kliper registration (PRD M16, v4.0). Public and indexed like the marketing
 * pages, but it lives in the `(auth)` group: it talks to Supabase Auth and
 * sends a signed-in visitor home, so the proxy must still see the session.
 */
export const SIGNUP_PATH = "/daftar";

/** Everything `robots.ts` allows and `sitemap.ts` lists (FR-M15-05). */
export const INDEXED_PATHS = [...MARKETING_PATHS, SIGNUP_PATH] as const;

/**
 * Generated files that crawlers and link previews fetch without a session.
 * Left out of the public list they are redirected to `/login`, which makes
 * the site unindexable and breaks the share card.
 */
export const MARKETING_FILES = ["/robots.txt", "/sitemap.xml", "/opengraph-image"] as const;

/**
 * Areas that must never be indexed nor named by a public page (FR-M15-08):
 * the internal app, both portals, the token report link, the tracking
 * redirect, the API routes and the auth screens.
 */
export const PRIVATE_PREFIXES = [
  "/dashboard",
  "/clients",
  "/creators",
  "/campaigns",
  "/settings",
  "/activity",
  "/portal",
  "/klien",
  "/print",
  "/laporan",
  "/r/",
  "/api/",
  "/auth/",
  "/login",
  "/lupa-sandi",
  "/atur-sandi",
  "/keluar",
] as const;

export function isMarketingPath(pathname: string): boolean {
  return (
    (MARKETING_PATHS as readonly string[]).includes(pathname) ||
    (MARKETING_FILES as readonly string[]).includes(pathname)
  );
}

/** True when a path belongs to an area that requires a session. */
export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some(
    (prefix) =>
      pathname === prefix || pathname.startsWith(prefix.endsWith("/") ? prefix : `${prefix}/`),
  );
}
