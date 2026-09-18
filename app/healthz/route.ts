/**
 * Liveness probe for Docker and Caddy. Public and cheap: it does not touch
 * Supabase, so an outage there does not restart a healthy app container.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
