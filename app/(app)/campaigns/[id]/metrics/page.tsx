import type { Metadata } from "next";
import {
  cumulativeViewsByCheckpoint,
  decreasedSnapshotIds,
  metricsByAssignment,
  progressPercent,
  totalRegistrants,
  totalViews,
} from "@/lib/calculations/campaign-metrics";
import { dueSnapshots, suggestCheckpoint } from "@/lib/calculations/checkpoints";
import { listAssignments } from "@/lib/data/campaigns";
import { getCampaignMetrics, listPendingSubmissions } from "@/lib/data/metrics";
import { loadCampaign } from "../data";
import { MetricsPanel, type MetricsPanelProps } from "./metrics-panel";

export const metadata: Metadata = { title: "Metrik kampanye" };

export default async function CampaignMetricsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, campaign, canEdit, session } = await loadCampaign(id);
  const tz = session.profile.timezone;
  const now = new Date();

  const [assignments, metrics, pendingSubmissions] = await Promise.all([
    listAssignments(supabase, id),
    getCampaignMetrics(supabase, id),
    listPendingSubmissions(supabase, id),
  ]);

  // Every content returned here has gone live (posted_at is set).
  const contentInputs = metrics.contents.map((content) => ({
    assignmentId: content.assignmentId,
    posted: true,
    snapshots: content.snapshots,
  }));

  const views = totalViews(contentInputs);
  const registrants = totalRegistrants(metrics.reports);
  const clicks = metrics.clicks.reduce((sum, row) => sum + row.total, 0);
  const humanClicks = metrics.clicks.reduce((sum, row) => sum + row.human, 0);

  const names = new Map(
    assignments.map((a) => [a.id, a.creator?.stage_name || a.creator?.full_name || "–"]),
  );

  const due = dueSnapshots(
    metrics.contents.map((content) => ({
      id: content.id,
      posted_at: content.posted_at,
      live_status: content.live_status,
      checkpoints: content.snapshots.map((s) => s.checkpoint),
    })),
    now,
    tz,
  );

  const props: MetricsPanelProps = {
    campaignId: id,
    canEdit,
    timezone: tz,
    summary: {
      views,
      viewsProgress: progressPercent(views, campaign.target_views),
      targetViews: campaign.target_views,
      clicks,
      humanClicks,
      registrants,
      registrantsProgress: progressPercent(registrants, campaign.target_registrants),
      targetRegistrants: campaign.target_registrants,
      liveContents: metrics.contents.length,
      targetContents: campaign.target_contents,
    },
    chart: cumulativeViewsByCheckpoint(contentInputs),
    creators: metricsByAssignment({
      assignmentIds: assignments.map((a) => a.id),
      contents: contentInputs,
      clicks: metrics.clicks,
      reports: metrics.reports,
    }).map((row) => ({ ...row, name: names.get(row.assignmentId) ?? "–" })),
    contents: metrics.contents.map((content) => ({
      ...content,
      creatorName: names.get(content.assignmentId) ?? "–",
      views: totalViews([{ posted: true, snapshots: content.snapshots }]),
      decreased: [...decreasedSnapshotIds(content.snapshots)],
      due: due.filter((d) => d.contentId === content.id),
      suggestedCheckpoint: suggestCheckpoint(
        { posted_at: content.posted_at, checkpoints: content.snapshots.map((s) => s.checkpoint) },
        now,
        tz,
      ),
    })),
    reports: metrics.reports,
    pendingSubmissions,
    assignments: assignments.map((a) => ({
      id: a.id,
      name: names.get(a.id) ?? "–",
      referralCode: a.referral_code,
    })),
  };

  return <MetricsPanel {...props} />;
}
