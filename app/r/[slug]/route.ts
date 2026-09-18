import { NextResponse, type NextRequest } from "next/server";
import { serverEnv } from "@/lib/env.server";
import { isValidTrackingSlug } from "@/lib/referral/generate";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { FixedWindowRateLimiter, TRACKING_RATE_LIMIT } from "@/lib/tracking/rate-limit";
import {
  buildRedirectUrl,
  clientIpFromHeaders,
  hashIp,
  isBotUserAgent,
  truncate,
} from "@/lib/tracking/redirect";

/**
 * Public tracking link (FR-M5-05).
 *
 * The destination comes only from `campaigns.landing_url` in the database;
 * the request's query string is never read, so the link cannot be turned
 * into an open redirect. Clicks are written with the service role because
 * `link_clicks` has no insert policy for any client role.
 */

// One limiter per server process (PRD section 9: simple rate limit).
const limiter = new FixedWindowRateLimiter(TRACKING_RATE_LIMIT.limit, TRACKING_RATE_LIMIT.windowMs);

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isValidTrackingSlug(slug)) return notFoundResponse();

  // Keyed by the salted hash so raw IPs are not even held in memory. Requests
  // without a client IP (no proxy header) are not limited rather than lumped
  // together into one shared bucket.
  const ipHash = await hashIp(clientIpFromHeaders(request.headers), serverEnv().CLICK_IP_HASH_SALT);
  if (ipHash) {
    const decision = limiter.check(ipHash);
    if (!decision.allowed) return tooManyRequestsResponse(decision.retryAfterSeconds);
  }

  const admin = createSupabaseAdminClient();
  const { data: assignment } = await admin
    .from("campaign_creators")
    .select("id, referral_code, tracking_slug, campaign:campaigns(code, landing_url, status)")
    .eq("tracking_slug", slug)
    .maybeSingle();

  const campaign = assignment?.campaign;
  if (!assignment || !campaign || campaign.status === "dibatalkan") return notFoundResponse();

  const destination = buildRedirectUrl({
    landingUrl: campaign.landing_url,
    campaignCode: campaign.code,
    referralCode: assignment.referral_code,
    trackingSlug: assignment.tracking_slug,
  });
  if (!destination) return notFoundResponse();

  const userAgent = request.headers.get("user-agent");
  const { error } = await admin.from("link_clicks").insert({
    campaign_creator_id: assignment.id,
    referrer: truncate(request.headers.get("referer")),
    user_agent: truncate(userAgent),
    ip_hash: ipHash,
    is_bot: isBotUserAgent(userAgent),
  });
  // A failed insert must never break the visitor's redirect.
  if (error) console.error("link click insert failed:", error.message);

  return NextResponse.redirect(destination, {
    status: 302,
    headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

function tooManyRequestsResponse(retryAfterSeconds: number) {
  const html = `<!doctype html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Terlalu banyak permintaan</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px;color:#222;background:#fafafa;text-align:center}h1{font-size:1.25rem;margin:0 0 .5rem}p{color:#666;margin:0}</style></head>
<body><main><h1>Terlalu banyak permintaan</h1><p>Coba buka tautan ini lagi sebentar lagi.</p></main></body>
</html>`;
  return new NextResponse(html, {
    status: 429,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": String(retryAfterSeconds),
      "X-Robots-Tag": "noindex",
    },
  });
}

function notFoundResponse() {
  const html = `<!doctype html>
<html lang="id">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Tautan tidak ditemukan</title>
<style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px;color:#222;background:#fafafa;text-align:center}h1{font-size:1.25rem;margin:0 0 .5rem}p{color:#666;margin:0}</style></head>
<body><main><h1>Tautan tidak ditemukan</h1><p>Tautan ini tidak berlaku atau kampanyenya sudah berakhir.</p></main></body>
</html>`;
  return new NextResponse(html, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
