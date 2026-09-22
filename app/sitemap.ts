import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";
import { MARKETING_PATHS } from "@/lib/marketing/routes";

/**
 * Only the public pages (FR-M15-05). Nothing behind a session is listed, and
 * the token report link (FR-M9-05) must never appear here.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Build time: the public pages are static, so this is when they last changed.
  const lastModified = new Date();

  return MARKETING_PATHS.map((path) => ({
    url: appUrl(path).toString(),
    lastModified,
    changeFrequency: path === "/" ? "monthly" : "yearly",
    priority: path === "/" ? 1 : 0.6,
  }));
}
