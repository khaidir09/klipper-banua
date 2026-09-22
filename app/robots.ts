import type { MetadataRoute } from "next";
import { appUrl } from "@/lib/app-url";
import { MARKETING_PATHS, PRIVATE_PREFIXES } from "@/lib/marketing/routes";

/**
 * Replaces the old blanket `public/robots.txt` (`Disallow: /`). Only the public
 * marketing site may be indexed; every session-bound area stays out
 * (FR-M15-05). Crawlers apply the longest matching rule, so the explicit
 * `Disallow` entries win over the `Allow: /` above them.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [...MARKETING_PATHS],
        disallow: [...PRIVATE_PREFIXES],
      },
    ],
    sitemap: appUrl("/sitemap.xml").toString(),
  };
}
