import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * The public campaign list (FR-M15-09, PRD 1.6): the one database read the
 * public site makes. It uses the anon key with no session and no cookies, so
 * the page stays cacheable and never learns who is looking; the view
 * `public_campaign_catalog` decides what an anonymous visitor may see.
 */

type PublicCatalogRow = Database["public"]["Views"]["public_campaign_catalog"]["Row"];

type NonNullableExcept<T, K extends keyof T> = {
  [P in keyof T]: P extends K ? T[P] : NonNullable<T[P]>;
};

export type PublicCampaign = NonNullableExcept<
  PublicCatalogRow,
  "max_payout_per_clip" | "published_at"
>;

/**
 * Open campaigns, or `null` when the database cannot be reached: the page then
 * says so instead of failing, and the next revalidation tries again.
 */
export async function listPublicCampaigns(): Promise<PublicCampaign[] | null> {
  const supabase = createClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } },
  );

  try {
    const { data, error } = await supabase.from("public_campaign_catalog").select("*");
    if (error) {
      console.error("[kampanye] public catalog query failed:", error.message);
      return null;
    }
    return data as PublicCampaign[];
  } catch (error) {
    console.error("[kampanye] public catalog unreachable:", error);
    return null;
  }
}
