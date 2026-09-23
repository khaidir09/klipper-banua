import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { CAMPAIGN_ASSET_BUCKET } from "./campaigns";
import { AUDIENCE_PROOF_BUCKET } from "./creators";

/**
 * Reads for the creator portal (PRD M13). Everything here goes through the
 * `creator_portal_*` views, which filter on the signed-in creator and carry
 * whitelisted columns only: no package price, no targets, no margin, no data
 * belonging to another creator.
 */

/**
 * Postgres cannot prove nullability through a view, so every generated view
 * column is `T | null`. The base columns are NOT NULL, so this narrows them
 * back and keeps `K` — the ones that really are optional — nullable.
 */
type NonNullableExcept<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]-?: NonNullable<T[P]>;
} & { [P in K]: T[P] };

type ProfileView = Database["public"]["Views"]["creator_portal_profile"]["Row"];
type ContentView = Database["public"]["Views"]["creator_portal_contents"]["Row"];
type ReviewView = Database["public"]["Views"]["creator_portal_reviews"]["Row"];
type MetricView = Database["public"]["Views"]["creator_portal_metrics"]["Row"];
type SubmissionView = Database["public"]["Views"]["creator_portal_submissions"]["Row"];
type PayoutView = Database["public"]["Views"]["creator_portal_payouts"]["Row"];
type AssignmentView = Database["public"]["Views"]["creator_portal_assignments"]["Row"];
type AssetView = Database["public"]["Views"]["creator_portal_assets"]["Row"];
type SocialAccountView = Database["public"]["Views"]["creator_portal_social_accounts"]["Row"];

export type PortalProfile = NonNullableExcept<
  ProfileView,
  | "terms_version"
  | "terms_agreed_at"
  | "portal_invited_at"
  | "local_badge_at"
  | "deletion_requested_at"
>;
export type PortalAssignment = NonNullableExcept<
  AssignmentView,
  "landing_url" | "joined_at" | "views_bonus_cap" | "creator_confirmed_at"
>;
export type PortalAsset = NonNullableExcept<AssetView, "file_path" | "external_url">;
export type PortalContent = NonNullableExcept<
  ContentView,
  | "draft_url"
  | "draft_file_path"
  | "posted_url"
  | "posted_at"
  | "removed_at"
  | "proposed_posted_url"
  | "proposed_posted_at"
  | "proposed_at"
>;
export type PortalReview = NonNullableExcept<ReviewView, never>;
export type PortalMetric = NonNullableExcept<MetricView, never>;
export type PortalSubmission = NonNullableExcept<SubmissionView, "reviewed_at">;
export type PortalPayout = NonNullableExcept<PayoutView, "paid_at">;
export type PortalSocialAccount = NonNullableExcept<
  SocialAccountView,
  | "kalimantan_audience_pct"
  | "audience_proof_path"
  | "last_verified_at"
  | "badge_requested_at"
  | "badge_review_notes"
> & { proof_url: string | null };

const SIGNED_URL_SECONDS = 60;

export async function getPortalProfile(
  supabase: SupabaseClient<Database>,
): Promise<PortalProfile | null> {
  const { data, error } = await supabase.from("creator_portal_profile").select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data as PortalProfile) : null;
}

/** FR-M13-03. Running campaigns first, then the finished ones. */
export async function listPortalAssignments(
  supabase: SupabaseClient<Database>,
): Promise<PortalAssignment[]> {
  const { data, error } = await supabase
    .from("creator_portal_assignments")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data as PortalAssignment[];
  const running = rows.filter((row) => row.campaign_status === "aktif");
  const finished = rows.filter((row) => row.campaign_status !== "aktif");
  return [...running, ...finished];
}

export async function getPortalAssignment(
  supabase: SupabaseClient<Database>,
  assignmentId: string,
): Promise<PortalAssignment | null> {
  const { data, error } = await supabase
    .from("creator_portal_assignments")
    .select("*")
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? (data as PortalAssignment) : null;
}

/** FR-M13-04. Signed URLs are short-lived and only work for assigned campaigns. */
export async function listPortalAssets(
  supabase: SupabaseClient<Database>,
  campaignId: string,
): Promise<(PortalAsset & { signed_url: string | null })[]> {
  const { data, error } = await supabase
    .from("creator_portal_assets")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return Promise.all(
    (data as PortalAsset[]).map(async (asset) => {
      if (!asset.file_path) return { ...asset, signed_url: null };
      const { data: signed } = await supabase.storage
        .from(CAMPAIGN_ASSET_BUCKET)
        .createSignedUrl(asset.file_path, SIGNED_URL_SECONDS, { download: true });
      return { ...asset, signed_url: signed?.signedUrl ?? null };
    }),
  );
}

/** FR-M13-05: the creator's own content for one assignment. */
export async function listPortalContents(
  supabase: SupabaseClient<Database>,
  assignmentId: string,
): Promise<PortalContent[]> {
  const { data, error } = await supabase
    .from("creator_portal_contents")
    .select("*")
    .eq("campaign_creator_id", assignmentId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as PortalContent[];
}

/** FR-M13-05: review decisions, newest first, for the given content. */
export async function listPortalReviews(
  supabase: SupabaseClient<Database>,
  contentIds: string[],
): Promise<PortalReview[]> {
  if (!contentIds.length) return [];

  const { data, error } = await supabase
    .from("creator_portal_reviews")
    .select("*")
    .in("content_id", contentIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as PortalReview[];
}

/** FR-M13-06: numbers the team has already verified. */
export async function listPortalMetrics(
  supabase: SupabaseClient<Database>,
  contentIds: string[],
): Promise<PortalMetric[]> {
  if (!contentIds.length) return [];

  const { data, error } = await supabase
    .from("creator_portal_metrics")
    .select("*")
    .in("content_id", contentIds)
    .order("captured_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as PortalMetric[];
}

/** FR-M13-06: what the creator sent and how it was verified. */
export async function listPortalSubmissions(
  supabase: SupabaseClient<Database>,
  contentIds: string[],
): Promise<PortalSubmission[]> {
  if (!contentIds.length) return [];

  const { data, error } = await supabase
    .from("creator_portal_submissions")
    .select("*")
    .in("content_id", contentIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as PortalSubmission[];
}

/** FR-M13-07: the creator's own fee for one assignment, if it exists yet. */
export async function getPortalPayout(
  supabase: SupabaseClient<Database>,
  assignmentId: string,
): Promise<PortalPayout | null> {
  const { data, error } = await supabase
    .from("creator_portal_payouts")
    .select("*")
    .eq("campaign_creator_id", assignmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? (data as PortalPayout) : null;
}

/**
 * FR-M3-03, FR-M16-08: the creator's own social accounts, with a short-lived
 * link to each audience screenshot (the storage policy limits it to their
 * own folder).
 */
export async function listPortalSocialAccounts(
  supabase: SupabaseClient<Database>,
): Promise<PortalSocialAccount[]> {
  const { data, error } = await supabase
    .from("creator_portal_social_accounts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as Omit<PortalSocialAccount, "proof_url">[];
  const paths = rows.map((row) => row.audience_proof_path).filter((path): path is string => !!path);
  const urls = new Map<string, string>();
  if (paths.length) {
    const { data: signed } = await supabase.storage
      .from(AUDIENCE_PROOF_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_SECONDS);
    for (const item of signed ?? []) {
      if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    }
  }

  return rows.map((row) => ({
    ...row,
    proof_url: row.audience_proof_path ? (urls.get(row.audience_proof_path) ?? null) : null,
  }));
}
