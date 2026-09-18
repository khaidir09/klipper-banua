import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { dueSnapshots, type DueSnapshot } from "@/lib/calculations/checkpoints";
import { liveDays, removedBeforeMinLiveDays } from "@/lib/calculations/live-duration";
import type { Database } from "@/types/database";

type CampaignRef = { id: string; code: string; name: string; status: string };

const OPEN_STATUSES = new Set(["draft", "aktif"]);

type Joined = {
  assignment: {
    campaign: CampaignRef | null;
    creator: { full_name: string; stage_name: string } | null;
  };
};

function creatorName(row: Joined) {
  return row.assignment.creator?.stage_name || row.assignment.creator?.full_name || "–";
}

export type DueItem = DueSnapshot & {
  campaign: CampaignRef;
  creatorName: string;
  platform: string;
};
export type PendingItem = {
  contentId: string;
  campaign: CampaignRef;
  creatorName: string;
  platform: string;
  revisionCount: number;
  waitingSince: string;
};
export type EarlyRemovalItem = {
  contentId: string;
  campaign: CampaignRef;
  creatorName: string;
  liveDays: number;
  minLiveDays: number;
  removedAt: string;
};

/** FR-M10-01 … FR-M10-04. Only open (draft/aktif) campaigns need action. */
export async function getDashboard(
  supabase: SupabaseClient<Database>,
  now: Date,
  timezone: string,
) {
  const join = `assignment:campaign_creators!inner(campaign:campaigns(id, code, name, status, min_live_days), creator:creators(full_name, stage_name))`;

  const [active, pending, live, removed] = await Promise.all([
    supabase.from("campaigns").select("id", { count: "exact", head: true }).eq("status", "aktif"),
    supabase
      .from("contents")
      .select(`id, platform, revision_count, updated_at, ${join}`)
      .eq("review_status", "menunggu_review")
      .order("updated_at", { ascending: true }),
    supabase
      .from("contents")
      .select(
        `id, platform, posted_at, live_status, snapshots:metric_snapshots(checkpoint), ${join}`,
      )
      .eq("live_status", "tayang"),
    supabase
      .from("contents")
      .select(`id, posted_at, removed_at, ${join}`)
      .eq("live_status", "dihapus")
      .order("removed_at", { ascending: false }),
  ]);

  for (const result of [active, pending, live, removed]) {
    if (result.error) throw new Error(result.error.message);
  }

  const open = <T extends Joined>(rows: T[]) =>
    rows.filter(
      (row) => row.assignment.campaign && OPEN_STATUSES.has(row.assignment.campaign.status),
    );

  // FR-M10-03: oldest waiting first. `updated_at` moves when a new draft is
  // submitted, i.e. when the content (re)entered the queue.
  const pendingItems: PendingItem[] = open(pending.data ?? []).map((row) => ({
    contentId: row.id,
    campaign: row.assignment.campaign!,
    creatorName: creatorName(row),
    platform: row.platform,
    revisionCount: row.revision_count,
    waitingSince: row.updated_at,
  }));

  // FR-M10-02
  const liveRows = open(live.data ?? []);
  const byContent = new Map(liveRows.map((row) => [row.id, row]));
  const dueItems: DueItem[] = dueSnapshots(
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
      platform: row.platform,
    };
  });

  // FR-M10-04
  const earlyRemovals: EarlyRemovalItem[] = open(removed.data ?? [])
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

  return {
    activeCampaigns: active.count ?? 0,
    pending: pendingItems,
    due: dueItems,
    earlyRemovals,
  };
}
