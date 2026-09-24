/**
 * Clip URL normalisation (FR-M18-02). Two links to the same video must give
 * the same string so the unique index on `contents.posted_url_normalized`
 * catches a second claim. Mirrors `public.normalize_clip_url()` step for
 * step; guards-check.sql compares both on the same input.
 *
 * Rules: lower case, no fragment, `https`, no `www.`/`m.`, no trailing slash,
 * no tracking parameters; the parameters that identify the video (YouTube
 * `v`, for example) stay, sorted.
 */

/** Query keys that only say who shared a link, never which video it is. */
export const CLIP_URL_TRACKING_PARAMS: readonly string[] = [
  "_r",
  "_t",
  "checksum",
  "enter_from",
  "fbclid",
  "feature",
  "gclid",
  "igsh",
  "igshid",
  "is_copy_url",
  "is_from_webapp",
  "mibextid",
  "pp",
  "rdid",
  "ref",
  "refsrc",
  "sender_device",
  "sender_web_id",
  "share_app_id",
  "share_id",
  "share_item_id",
  "share_link_id",
  "si",
  "social_sharing",
  "t",
  "timestamp",
  "tt_from",
  "u_code",
  "ug_btm",
  "user_id",
  "web_id",
];

function isTrackingParam(param: string): boolean {
  const key = param.split("=")[0] ?? "";
  return key.startsWith("utm_") || CLIP_URL_TRACKING_PARAMS.includes(key);
}

/** Byte-order comparison, like `collate "C"` in the database. */
function compareCodeUnits(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function normalizeClipUrl(url: string | null | undefined): string | null {
  if (url == null || url.trim() === "") return null;

  const value = url.trim().toLowerCase().split("#")[0]!;
  const queryAt = value.indexOf("?");
  let base = queryAt >= 0 ? value.slice(0, queryAt) : value;
  const query = queryAt >= 0 ? value.slice(queryAt + 1) : "";

  base = base
    .replace(/^http:\/\//, "https://")
    .replace(/^https:\/\/(www\.|m\.)/, "https://")
    .replace(/\/+$/, "");

  const kept = query
    .split("&")
    .filter((param) => param !== "" && !isTrackingParam(param))
    .sort(compareCodeUnits);

  return kept.length ? `${base}?${kept.join("&")}` : base;
}
