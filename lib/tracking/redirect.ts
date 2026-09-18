/**
 * Pure helpers for the public `/r/[slug]` redirect (FR-M5-05).
 *
 * The destination is always the campaign's `landing_url` from the database.
 * Nothing from the incoming request URL is ever copied into it, which is what
 * prevents an open redirect.
 */

export type RedirectTarget = {
  landingUrl: string | null;
  campaignCode: string;
  referralCode: string;
  trackingSlug: string;
};

/**
 * Adds the tracking parameters to the stored landing URL. Existing query
 * parameters on the landing URL are kept; ours overwrite same-named ones.
 * Returns null when the stored URL is missing or not http(s).
 */
export function buildRedirectUrl(target: RedirectTarget): string | null {
  if (!target.landingUrl) return null;

  let url: URL;
  try {
    url = new URL(target.landingUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  url.searchParams.set("utm_source", target.trackingSlug);
  url.searchParams.set("utm_medium", "kreator");
  url.searchParams.set("utm_campaign", target.campaignCode);
  url.searchParams.set("ref", target.referralCode);
  return url.toString();
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|facebookcatalog|whatsapp|telegram|slack|discord|twitter|linkedin|embedly|skype|curl|wget|python-requests|python-urllib|go-http-client|okhttp|java\/|axios|node-fetch|headless|lighthouse|pingdom|uptime|monitor/i;

/**
 * Simple user-agent heuristic (FR-M5-05). Link previews in WhatsApp and other
 * chat apps count as bots so the non-bot click total reflects real visits.
 */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim().length < 10) return true;
  return BOT_PATTERN.test(userAgent);
}

/** First address from proxy headers; empty when unknown. */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() ?? "";
}

/** SHA-256 of salt + IP, hex encoded. The raw IP is never stored. */
export async function hashIp(ip: string, salt: string): Promise<string | null> {
  if (!ip) return null;
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** Keeps stored header values bounded. */
export function truncate(value: string | null, max = 500): string | null {
  if (!value) return null;
  return value.length > max ? value.slice(0, max) : value;
}
