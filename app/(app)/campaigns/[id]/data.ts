import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireInternal } from "@/lib/auth/guards";
import { isCampaignLocked } from "@/lib/campaigns/status";
import { progressPercent, totalRegistrants, totalViews } from "@/lib/calculations/campaign-metrics";
import { dueSnapshots } from "@/lib/calculations/checkpoints";
import { getCampaign } from "@/lib/data/campaigns";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Loads the campaign once per request for the layout and every tab page.
 * `canEdit` mirrors the database lock: closed campaigns are owner-only.
 */
export const loadCampaign = cache(async (id: string) => {
  const session = await requireInternal();
  const supabase = await createSupabaseServerClient();
  const campaign = await getCampaign(supabase, id);
  if (!campaign) notFound();

  const isOwner = session.profile.role === "owner";
  return {
    session,
    supabase,
    campaign,
    isOwner,
    canEdit: isOwner || !isCampaignLocked(campaign.status),
  };
});

/**
 * How the campaign is doing and where work is waiting, in one slim pass.
 *
 * The tab bar (every tab) and the overview both need this, so it is cached per
 * request. Deliberately lighter than `getCampaignMetrics`: no click totals and
 * no signed proof URLs, since neither a tab counter nor a progress bar needs
 * them and signing costs a Storage round trip on every tab.
 */
export const loadCampaignPulse = cache(async (id: string) => {
  const { supabase, campaign, session } = await loadCampaign(id);
  const tz = session.profile.timezone;
  const now = new Date();

  const [contentsResult, reportsResult, submissionsResult] = await Promise.all([
    supabase
      .from("contents")
      .select(
        `id, posted_at, live_status, review_status, proposed_posted_url,
         assignment:campaign_creators!inner(campaign_id),
         snapshots:metric_snapshots(checkpoint, captured_at, created_at, views)`,
      )
      .eq("assignment.campaign_id", id),
    supabase.from("registrant_reports").select("registrant_count").eq("campaign_id", id),
    supabase
      .from("metric_submissions")
      .select("id, content:contents!inner(assignment:campaign_creators!inner(campaign_id))", {
        count: "exact",
        head: true,
      })
      .eq("status", "menunggu")
      .eq("content.assignment.campaign_id", id),
  ]);

  if (contentsResult.error) throw new Error(contentsResult.error.message);
  if (reportsResult.error) throw new Error(reportsResult.error.message);
  if (submissionsResult.error) throw new Error(submissionsResult.error.message);

  const contents = contentsResult.data ?? [];
  const live = contents.filter((content) => content.posted_at !== null);

  const due = dueSnapshots(
    live.map((content) => ({
      id: content.id,
      posted_at: content.posted_at,
      live_status: content.live_status,
      checkpoints: content.snapshots.map((snapshot) => snapshot.checkpoint),
    })),
    now,
    tz,
  );

  const views = totalViews(live.map((content) => ({ posted: true, snapshots: content.snapshots })));
  const registrants = totalRegistrants(reportsResult.data ?? []);
  const liveContents = live.length;

  // A creator reported a post that nobody has confirmed yet (FR-M13-09).
  const proposedLive = contents.filter(
    (content) => content.proposed_posted_url !== null && content.live_status === "belum_tayang",
  ).length;

  return {
    attention: {
      contents: contents.filter((content) => content.review_status === "menunggu_review").length,
      metrics: due.length + (submissionsResult.count ?? 0) + proposedLive,
    },
    progress: {
      liveContents,
      targetContents: campaign.target_contents,
      contentsPercent: progressPercent(liveContents, campaign.target_contents),
      views,
      targetViews: campaign.target_views,
      viewsPercent: progressPercent(views, campaign.target_views),
      registrants,
      targetRegistrants: campaign.target_registrants,
      registrantsPercent: progressPercent(registrants, campaign.target_registrants),
    },
  };
});
