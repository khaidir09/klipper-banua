import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";
import { INDEXED_PATHS } from "@/lib/marketing/routes";

/**
 * Only the public pages and the klipper registration (FR-M15-05). Nothing behind a session is listed, and
 * the token report link (FR-M9-05) must never appear here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Build time: the public pages are static, so this is when they last changed.
  const lastModified = new Date();

  return INDEXED_PATHS.map((path) => ({
    url: appUrl(path).toString(),
    lastModified,
    changeFrequency: path === "/" ? "monthly" : "yearly",
    priority: path === "/" ? 1 : path === "/daftar" ? 0.8 : 0.6,
  }));
}
