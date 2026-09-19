import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { buildCampaignReport } from "@/lib/calculations/campaign-report";
import type { CampaignRow } from "./campaigns";

/** The campaign fields the report needs; the public link loads only these. */
export type ReportCampaignRef = Pick<
  CampaignRow,
  "id" | "target_contents" | "target_views" | "target_registrants"
>;

/**
 * Loads the client report (FR-M9-02). It deliberately reads no finance tables
 * (payouts, client_payments) so internal money never reaches the report.
 */
export async function getCampaignReport(
  supabase: SupabaseClient<Database>,
  campaign: ReportCampaignRef,
) {
  const [assignmentsResult, contentsResult, clicksResult, reportsResult] = await Promise.all([
    supabase
      .from("campaign_creators")
      .select("id, status, referral_code, creator:creators(full_name, stage_name)")
      .eq("campaign_id", campaign.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("contents")
      .select(
        `id, campaign_creator_id, platform, posted_url, posted_at, live_status,
         assignment:campaign_creators!inner(campaign_id),
         snapshots:metric_snapshots(checkpoint, captured_at, created_at, views, likes, comments, shares, saves)`,
      )
      .eq("assignment.campaign_id", campaign.id)
      .not("posted_at", "is", null),
    // PRD 8.4: only clicks not flagged as bots count as valid.
    supabase
      .from("campaign_creators")
      .select("id, human:link_clicks(count)")
      .eq("campaign_id", campaign.id)
      .eq("human.is_bot", false),
    supabase
      .from("registrant_reports")
      .select("campaign_creator_id, registrant_count")
      .eq("campaign_id", campaign.id),
  ]);

  for (const result of [assignmentsResult, contentsResult, clicksResult, reportsResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  return buildCampaignReport({
    targets: {
      contents: campaign.target_contents,
      views: campaign.target_views,
      registrants: campaign.target_registrants,
    },
    assignments: (assignmentsResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.creator?.stage_name || row.creator?.full_name || "–",
      referralCode: row.referral_code,
      status: row.status,
    })),
    contents: (contentsResult.data ?? []).map((content) => ({
      id: content.id,
      assignmentId: content.campaign_creator_id,
      platform: content.platform,
      posted_url: content.posted_url,
      // Filtered on `posted_at is not null` above.
      posted_at: content.posted_at!,
      live_status: content.live_status,
      snapshots: content.snapshots,
    })),
    clicks: (clicksResult.data ?? []).map((row) => ({
      assignmentId: row.id,
      human: row.human[0]?.count ?? 0,
    })),
    reports: (reportsResult.data ?? []).map((row) => ({
      assignmentId: row.campaign_creator_id,
      registrant_count: row.registrant_count,
    })),
  });
}
