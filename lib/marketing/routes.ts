/**
 * The public marketing site (PRD M15). Every path here is reachable without a
 * session and is the only part of the app search engines may index.
 *
 * Keep this list as the single source of truth: the session proxy, `robots.ts`
 * and `sitemap.ts` all read it, so a page added in one place cannot be
 * forgotten in the others.
 */
export const MARKETING_PATHS = ["/", "/kreator", "/privasi", "/syarat"] as const;

export type MarketingPath = (typeof MARKETING_PATHS)[number];

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
