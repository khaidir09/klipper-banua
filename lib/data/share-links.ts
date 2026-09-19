import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CampaignObjective } from "@/lib/constants/campaigns";
import { hashShareToken, isShareTokenFormat } from "@/lib/share/token";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import { getCampaignReport } from "./report";

export type ShareLinkRow = Database["public"]["Tables"]["report_share_links"]["Row"];

export type OpenShareLink = Pick<
  ShareLinkRow,
  "id" | "created_at" | "expires_at" | "view_count" | "last_viewed_at"
> & { creator: { full_name: string } | null };

/** The campaign's link that has not been revoked, if any (for the report tab). */
export async function getOpenShareLink(
  supabase: SupabaseClient<Database>,
  campaignId: string,
): Promise<OpenShareLink | null> {
  const { data, error } = await supabase
    .from("report_share_links")
    .select(
      "id, created_at, expires_at, view_count, last_viewed_at, creator:profiles!report_share_links_created_by_fkey(full_name)",
    )
    .eq("campaign_id", campaignId)
    .is("revoked_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Resolves a public report token (FR-M9-05) and loads the report.
 *
 * Runs with the service role because the visitor has no session. The token
 * is checked and the view counted in one database call; after that only the
 * columns the client report shows are read, and `getCampaignReport` touches
 * no finance tables (FR-M9-03). Returns null for any link that is not valid.
 */
export async function openSharedReport(token: string) {
  if (!isShareTokenFormat(token)) return null;

  const admin = createSupabaseAdminClient();
  const { data: campaignId, error } = await admin.rpc("open_report_share_link", {
    p_token_hash: hashShareToken(token),
  });
  if (error) throw new Error(error.message);
  if (!campaignId) return null;

  const { data: campaign, error: campaignError } = await admin
    .from("campaigns")
    .select(
      "id, code, name, objective, start_date, end_date, closing_notes, target_contents, target_views, target_registrants, client:clients(name)",
    )
    .eq("id", campaignId)
    .single();
  if (campaignError) throw new Error(campaignError.message);

  const report = await getCampaignReport(admin, campaign);
  return {
    campaign: {
      code: campaign.code,
      name: campaign.name,
      objective: campaign.objective as CampaignObjective,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      closing_notes: campaign.closing_notes,
      clientName: campaign.client?.name ?? null,
    },
    report,
  };
}
