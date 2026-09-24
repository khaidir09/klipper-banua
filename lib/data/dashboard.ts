import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dueSnapshots, type DueSnapshot } from "@/lib/calculations/checkpoints";
import { liveDays, removedBeforeMinLiveDays } from "@/lib/calculations/live-duration";
import type { Database } from "@/types/database";

type CampaignRef = { id: string; code: string; name: string; status: string };
type JoinedCampaign = CampaignRef & {
  payout_model: Database["public"]["Enums"]["payout_model"];
};

const OPEN_STATUSES = new Set(["draft", "aktif"]);

type Joined = {
  assignment: {
    campaign: JoinedCampaign | null;
    creator: { full_name: string; stage_name: string } | null;
  };
};

function creatorName(row: Joined) {
  return row.assignment.creator?.stage_name || row.assignment.creator?.full_name || "–";
}

export type DueItem = DueSnapshot & {
  campaign: CampaignRef;
  creatorName: string;
  /** Empty when the creator has no stage name (the reminder never uses legal names). */
  stageName: string;
  platform: Database["public"]["Enums"]["social_platform"];
};
export type PendingItem = {
  contentId: string;
  campaign: CampaignRef;
  creatorName: string;
  platform: string;
  revisionCount: number;
  waitingSince: string;
};
/** FR-M10-01 (v2.0): what creators sent from the portal and nobody checked yet. */
export type CreatorSubmissionItem = {
  kind: "metrik" | "tayang";
  id: string;
  campaign: CampaignRef;
  creatorName: string;
  detail: string;
  sentAt: string;
};
export type EarlyRemovalItem = {
  contentId: string;
  campaign: CampaignRef;
  creatorName: string;
  liveDays: number;
  minLiveDays: number;
  removedAt: string;
};

const JOIN = `assignment:campaign_creators!inner(campaign:campaigns(id, code, name, status, min_live_days, payout_model), creator:creators(full_name, stage_name))`;

function openRows<T extends Joined>(rows: T[]) {
  return rows.filter(
    (row) => row.assignment.campaign && OPEN_STATUSES.has(row.assignment.campaign.status),
  );
}

/**
 * Package campaigns only. Clips of `per_views` campaigns have their own
 * queue on /verifikasi (FR-M10-03, lib/data/clips.ts).
 */
function paketRows<T extends Joined>(rows: T[]) {
  return openRows(rows).filter((row) => row.assignment.campaign!.payout_model === "paket");
}

/**
 * FR-M10-02: snapshots due on open campaigns, most overdue first. Shared by
 * the dashboard and the Telegram reminder (FR-M10-05) so both always agree.
 */
export async function getDueSnapshotItems(
  supabase: SupabaseClient<Database>,
  now: Date,
  timezone: string,
): Promise<DueItem[]> {
  const { data, error } = await supabase
    .from("contents")
    .select(`id, platform, posted_at, live_status, snapshots:metric_snapshots(checkpoint), ${JOIN}`)
    .eq("live_status", "tayang");
  if (error) throw new Error(error.message);

  // Checkpoints are a package-campaign rule; clips get views updates (FR-M18-05).
  const liveRows = paketRows(data ?? []);
  const byContent = new Map(liveRows.map((row) => [row.id, row]));
  return dueSnapshots(
    liveRows.map((row) => ({
      id: row.id,
      posted_at: row.posted_at,
      live_status: row.live_status,
      checkpoints: row.snapshots.map((s) => s.checkpoint),
    })),
    now,
    timezone,
  ).map((due) => {
    const row = byContent.get(due.contentId)!;
    return {
      ...due,
      campaign: row.assignment.campaign!,
      creatorName: creatorName(row),
      stageName: row.assignment.creator?.stage_name ?? "",
      platform: row.platform,
    };
  });
}

/** FR-M10-01 … FR-M10-04. Only open (draft/aktif) campaigns need action. */
export async function getDashboard(
  supabase: SupabaseClient<Database>,
  now: Date,
  timezone: string,
) {
  const [
    active,
    pending,
    dueItems,
    removed,
    unpaidPayouts,
    openInvoices,
    metricSubmissions,
    liveReports,
  ] = await Promise.all([
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "aktif"),
    supabase
      .from("contents")
      .select(`id, platform, revision_count, updated_at, ${JOIN}`)
      .eq("review_status", "menunggu_review")
      .order("updated_at", { ascending: true }),
    getDueSnapshotItems(supabase, now, timezone),
    supabase
      .from("contents")
      .select(`id, posted_at, removed_at, ${JOIN}`)
      .eq("live_status", "dihapus")
      .order("removed_at", { ascending: false }),
    // FR-M10-01: payouts not yet paid, invoices not yet settled.
    supabase.from("payouts").select("total_amount").neq("status", "dibayar"),
    supabase.from("client_payments").select("amount, paid_amount").neq("status", "lunas"),
    // FR-M13-06 and FR-M13-09: the creator queue, across campaigns.
    supabase
      .from("metric_submissions")
      .select(
        `id, checkpoint, views, created_at,
         content:contents!inner(
           platform,
           assignment:campaign_creators!inner(
             campaign:campaigns(id, code, name, status, min_live_days, payout_model),
             creator:creators(full_name, stage_name)
           )
         )`,
      )
      .eq("status", "menunggu")
      .order("created_at", { ascending: true }),
    supabase
      .from("contents")
      .select(`id, platform, proposed_posted_url, proposed_at, ${JOIN}`)
      .not("proposed_posted_url", "is", null)
      .eq("live_status", "belum_tayang")
      .order("proposed_at", { ascending: true }),
  ]);

  for (const result of [
    active,
    pending,
    removed,
    unpaidPayouts,
    openInvoices,
    metricSubmissions,
    liveReports,
  ]) {
    if (result.error) throw new Error(result.error.message);
  }

  // FR-M10-03: oldest waiting first. `updated_at` moves when a new draft is
  // submitted, i.e. when the content (re)entered the queue.
  const pendingItems: PendingItem[] = paketRows(pending.data ?? []).map((row) => ({
    contentId: row.id,
    campaign: row.assignment.campaign!,
    creatorName: creatorName(row),
    platform: row.platform,
    revisionCount: row.revision_count,
    waitingSince: row.updated_at,
  }));

  // FR-M10-04
  const earlyRemovals: EarlyRemovalItem[] = openRows(removed.data ?? [])
    .filter(
      (row) =>
        row.posted_at &&
        row.removed_at &&
        removedBeforeMinLiveDays(
          row.posted_at,
          row.removed_at,
          row.assignment.campaign!.min_live_days,
        ),
    )
    .map((row) => ({
      contentId: row.id,
      campaign: row.assignment.campaign!,
      creatorName: creatorName(row),
      liveDays: liveDays(row.posted_at!, row.removed_at!),
      minLiveDays: row.assignment.campaign!.min_live_days,
      removedAt: row.removed_at!,
    }));

  // FR-M10-01 (v2.0): both kinds of creator submission in one queue.
  const creatorSubmissions: CreatorSubmissionItem[] = [
    ...paketRows((metricSubmissions.data ?? []).map((row) => ({ ...row, ...row.content }))).map(
      (row) => ({
        kind: "metrik" as const,
        id: row.id,
        campaign: row.assignment.campaign!,
        creatorName: creatorName(row),
        detail: `Bukti metrik ${row.checkpoint} · ${row.views} views`,
        sentAt: row.created_at,
      }),
    ),
    ...paketRows(liveReports.data ?? []).map((row) => ({
      kind: "tayang" as const,
      id: row.id,
      campaign: row.assignment.campaign!,
      creatorName: creatorName(row),
      detail: "Laporan konten tayang",
      sentAt: row.proposed_at ?? "",
    })),
  ].sort((a, b) => a.sentAt.localeCompare(b.sentAt));

  const payouts = unpaidPayouts.data ?? [];
  const invoices = openInvoices.data ?? [];

  return {
    unpaidPayouts: {
      count: payouts.length,
      amount: payouts.reduce((sum, p) => sum + p.total_amount, 0),
    },
    openInvoices: {
      count: invoices.length,
      outstanding: invoices.reduce((sum, i) => sum + Math.max(0, i.amount - i.paid_amount), 0),
    },
    activeCampaigns: active.count ?? 0,
    pending: pendingItems,
    due: dueItems,
    earlyRemovals,
    creatorSubmissions,
  };
}
