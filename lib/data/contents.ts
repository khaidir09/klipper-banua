import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CONTENT_DRAFT_BUCKET } from "@/lib/constants/contents";
import type { Database, Json } from "@/types/database";

type ContentRow = Database["public"]["Tables"]["contents"]["Row"];
type ReviewRow = Database["public"]["Tables"]["content_reviews"]["Row"];

/** Long enough for a reviewer to watch a draft video without the link expiring. */
const DRAFT_URL_SECONDS = 15 * 60;

export type DraftSnapshot = {
  draft_url: string | null;
  draft_file_path: string | null;
  caption_draft: string;
  platform: string;
  revision_count: number;
};

export type ContentReviewView = Pick<ReviewRow, "id" | "decision" | "notes" | "created_at"> & {
  checklist: Record<string, boolean>;
  snapshot: DraftSnapshot;
  snapshotFileUrl: string | null;
  reviewerName: string | null;
};

export type ContentView = ContentRow & {
  creatorName: string;
  draftFileUrl: string | null;
  reviews: ContentReviewView[];
};

function asRecord(value: Json): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function toSnapshot(value: Json): DraftSnapshot {
  const record = asRecord(value);
  return {
    draft_url: typeof record.draft_url === "string" ? record.draft_url : null,
    draft_file_path: typeof record.draft_file_path === "string" ? record.draft_file_path : null,
    caption_draft: typeof record.caption_draft === "string" ? record.caption_draft : "",
    platform: typeof record.platform === "string" ? record.platform : "",
    revision_count: typeof record.revision_count === "number" ? record.revision_count : 0,
  };
}

function toChecklist(value: Json): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(asRecord(value)).map(([key, checked]) => [key, checked === true]),
  );
}

/** All content of a campaign with its review history, oldest review first (FR-M6-06). */
export async function listCampaignContents(
  supabase: SupabaseClient<Database>,
  campaignId: string,
): Promise<ContentView[]> {
  const { data, error } = await supabase
    .from("contents")
    .select(
      `*,
       assignment:campaign_creators!inner(campaign_id, creator:creators(full_name, stage_name)),
       reviews:content_reviews(id, decision, checklist, notes, draft_snapshot, created_at, reviewer:profiles(full_name))`,
    )
    .eq("assignment.campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .order("created_at", { referencedTable: "content_reviews", ascending: true });

  if (error) throw new Error(error.message);

  // Sign every draft file (current and historical) in one request.
  const paths = new Set<string>();
  for (const content of data) {
    if (content.draft_file_path) paths.add(content.draft_file_path);
    for (const review of content.reviews) {
      const path = toSnapshot(review.draft_snapshot).draft_file_path;
      if (path) paths.add(path);
    }
  }
  const signed = new Map<string, string>();
  if (paths.size) {
    const { data: urls } = await supabase.storage
      .from(CONTENT_DRAFT_BUCKET)
      .createSignedUrls([...paths], DRAFT_URL_SECONDS);
    for (const entry of urls ?? []) {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    }
  }

  return data.map(({ assignment, reviews, ...content }) => ({
    ...content,
    creatorName: assignment.creator?.stage_name || assignment.creator?.full_name || "–",
    draftFileUrl: content.draft_file_path ? (signed.get(content.draft_file_path) ?? null) : null,
    reviews: reviews.map((review) => {
      const snapshot = toSnapshot(review.draft_snapshot);
      return {
        id: review.id,
        decision: review.decision,
        notes: review.notes,
        created_at: review.created_at,
        checklist: toChecklist(review.checklist),
        snapshot,
        snapshotFileUrl: snapshot.draft_file_path
          ? (signed.get(snapshot.draft_file_path) ?? null)
          : null,
        reviewerName: review.reviewer?.full_name ?? null,
      };
    }),
  }));
}
