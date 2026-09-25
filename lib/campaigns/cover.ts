import { CAMPAIGN_COVER_BUCKET } from "@/lib/constants/campaigns";
import { publicEnv } from "@/lib/env";

/**
 * Public URL of a campaign cover (FR-M15-09). The `campaign-covers` bucket is
 * public, so the URL needs no session or signature and the public site can
 * build it without importing a Supabase client.
 */
export function campaignCoverUrl(path: string | null): string | null {
  if (!path) return null;
  const encoded = path.split("/").map(encodeURIComponent).join("/");
  const base = publicEnv.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${CAMPAIGN_COVER_BUCKET}/${encoded}`;
}
