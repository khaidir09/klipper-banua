import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { METRIC_PROOF_BUCKET, type MetricCheckpoint } from "@/lib/constants/metrics";
import type { Database } from "@/types/database";

const PROOF_URL_SECONDS = 10 * 60;

export type SnapshotView = {
  id: string;
  checkpoint: MetricCheckpoint;
  captured_at: string;
  created_at: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  proofUrl: string | null;
  enteredBy: string | null;
};

export type MetricContentView = {
  id: string;
  assignmentId: string;
  platform: string;
  posted_url: string | null;
  posted_at: string | null;
  live_status: Database["public"]["Enums"]["live_status"];
  snapshots: SnapshotView[];
};

export type RegistrantReportView = {
  id: string;
  assignmentId: string | null;
  period_start: string;
  period_end: string;
  registrant_count: number;
  notes: string;
  proofUrl: string | null;
  enteredBy: string | null;
  created_at: string;
};

export type AssignmentClicks = { assignmentId: string; total: number; human: number };

/** FR-M13-06: a creator's metric numbers waiting for the team. */
export type PendingSubmissionView = {
  id: string;
  contentId: string;
  creatorName: string;
  platform: Database["public"]["Enums"]["social_platform"];
  checkpoint: MetricCheckpoint;
  captured_at: string;
  created_at: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  proofUrl: string | null;
};

async function signPaths(supabase: SupabaseClient<Database>, paths: string[]) {
  const signed = new Map<string, string>();
  if (!paths.length) return signed;
  const { data } = await supabase.storage
    .from(METRIC_PROOF_BUCKET)
    .createSignedUrls(paths, PROOF_URL_SECONDS);
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
  }
  return signed;
}

/** Everything the Metrics tab needs for one campaign (FR-M7-01 … FR-M7-05). */
export async function getCampaignMetrics(supabase: SupabaseClient<Database>, campaignId: string) {
  const [contentsResult, clicksResult, reportsResult] = await Promise.all([
    supabase
      .from("contents")
      .select(
        `id, campaign_creator_id, platform, posted_url, posted_at, live_status,
         assignment:campaign_creators!inner(campaign_id),
         snapshots:metric_snapshots(id, checkpoint, captured_at, created_at, views, likes, comments, shares, saves, proof_path, entered:profiles(full_name))`,
      )
      .eq("assignment.campaign_id", campaignId)
      .not("posted_at", "is", null)
      .order("posted_at", { ascending: true }),
    // Click totals are counted by Postgres (FR-M7-03).
    supabase
      .from("campaign_creators")
      .select("id, total:link_clicks(count), human:link_clicks(count)")
      .eq("campaign_id", campaignId)
      .eq("human.is_bot", false),
    supabase
      .from("registrant_reports")
      .select(
        "id, campaign_creator_id, period_start, period_end, registrant_count, notes, proof_path, created_at, entered:profiles(full_name)",
      )
      .eq("campaign_id", campaignId)
      .order("period_start", { ascending: false }),
  ]);

  if (contentsResult.error) throw new Error(contentsResult.error.message);
  if (clicksResult.error) throw new Error(clicksResult.error.message);
  if (reportsResult.error) throw new Error(reportsResult.error.message);

  const proofPaths = [
    ...contentsResult.data.flatMap((c) => c.snapshots.map((s) => s.proof_path)),
    ...reportsResult.data.map((r) => r.proof_path).filter((p): p is string => Boolean(p)),
  ];
  const signed = await signPaths(supabase, proofPaths);

  const contents: MetricContentView[] = contentsResult.data.map((content) => ({
    id: content.id,
    assignmentId: content.campaign_creator_id,
    platform: content.platform,
    posted_url: content.posted_url,
    posted_at: content.posted_at,
    live_status: content.live_status,
    snapshots: content.snapshots
      .map((snapshot) => ({
        id: snapshot.id,
        checkpoint: snapshot.checkpoint,
        captured_at: snapshot.captured_at,
        created_at: snapshot.created_at,
        views: snapshot.views,
        likes: snapshot.likes,
        comments: snapshot.comments,
        shares: snapshot.shares,
        saves: snapshot.saves,
        proofUrl: signed.get(snapshot.proof_path) ?? null,
        enteredBy: snapshot.entered?.full_name ?? null,
      }))
      .sort((a, b) => a.captured_at.localeCompare(b.captured_at)),
  }));

  const clicks: AssignmentClicks[] = clicksResult.data.map((row) => ({
    assignmentId: row.id,
    total: row.total[0]?.count ?? 0,
    human: row.human[0]?.count ?? 0,
  }));

  const reports: RegistrantReportView[] = reportsResult.data.map((report) => ({
    id: report.id,
    assignmentId: report.campaign_creator_id,
    period_start: report.period_start,
    period_end: report.period_end,
    registrant_count: report.registrant_count,
    notes: report.notes,
    proofUrl: report.proof_path ? (signed.get(report.proof_path) ?? null) : null,
    enteredBy: report.entered?.full_name ?? null,
    created_at: report.created_at,
  }));

  return { contents, clicks, reports };
}

/** FR-M13-06: submissions from the portal that still need verification. */
export async function listPendingSubmissions(
  supabase: SupabaseClient<Database>,
  campaignId: string,
): Promise<PendingSubmissionView[]> {
  const { data, error } = await supabase
    .from("metric_submissions")
    .select(
      `id, content_id, checkpoint, captured_at, created_at, views, likes, comments, shares, saves, proof_path,
       content:contents!inner(platform, assignment:campaign_creators!inner(campaign_id, creator:creators(full_name, stage_name)))`,
    )
    .eq("status", "menunggu")
    .eq("content.assignment.campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  const signed = await signPaths(
    supabase,
    data.map((row) => row.proof_path),
  );

  return data.map((row) => ({
    id: row.id,
    contentId: row.content_id,
    creatorName:
      row.content.assignment.creator?.stage_name ||
      row.content.assignment.creator?.full_name ||
      "–",
    platform: row.content.platform,
    checkpoint: row.checkpoint,
    captured_at: row.captured_at,
    created_at: row.created_at,
    views: row.views,
    likes: row.likes,
    comments: row.comments,
    shares: row.shares,
    saves: row.saves,
    proofUrl: signed.get(row.proof_path) ?? null,
  }));
}
