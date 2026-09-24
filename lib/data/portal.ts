import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { claimDeadline, viewsUpdateState } from "@/lib/campaigns/clips";
import { campaignToday } from "@/lib/campaigns/open";
import type { ClipRejectionReason } from "@/lib/constants/clips";
import type { LiveStatus, ReviewDecision, ReviewStatus } from "@/lib/constants/contents";
import type { SocialPlatform } from "@/lib/constants/creators";
import type { SubmissionStatus } from "@/lib/constants/metrics";
import { formatCalendarDate, formatDateTime } from "@/lib/format/date";
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
type CatalogView = Database["public"]["Views"]["creator_portal_catalog"]["Row"];

export type PortalProfile = NonNullableExcept<
  ProfileView,
  | "terms_version"
  | "terms_agreed_at"
  | "portal_invited_at"
  | "local_badge_at"
  | "deletion_requested_at"
  | "birth_date"
>;
export type PortalAssignment = NonNullableExcept<
  AssignmentView,
  | "landing_url"
  | "joined_at"
  | "views_bonus_cap"
  | "creator_confirmed_at"
  | "max_payout_per_clip"
  | "max_payout_per_creator"
  | "withdrawn_at"
>;
export type PortalCatalogCampaign = NonNullableExcept<
  CatalogView,
  | "max_payout_per_clip"
  | "max_payout_per_creator"
  | "published_at"
  | "assignment_id"
  | "assignment_status"
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
  | "verified_views"
  | "rejection_reason"
>;
export type PortalReview = NonNullableExcept<ReviewView, never>;
export type PortalMetric = NonNullableExcept<MetricView, never>;
export type PortalSubmission = NonNullableExcept<
  SubmissionView,
  "reviewed_at" | "verified_views" | "credited_amount"
>;
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

/**
 * FR-M17-03: open campaigns the klipper may browse. The view already hides
 * everything a klipper must not see and returns nothing to other roles.
 */
export async function listPortalCatalog(
  supabase: SupabaseClient<Database>,
): Promise<PortalCatalogCampaign[]> {
  const { data, error } = await supabase.from("creator_portal_catalog").select("*");
  if (error) throw new Error(error.message);
  return data as PortalCatalogCampaign[];
}

export async function getPortalCatalogCampaign(
  supabase: SupabaseClient<Database>,
  campaignId: string,
): Promise<PortalCatalogCampaign | null> {
  const { data, error } = await supabase
    .from("creator_portal_catalog")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data as PortalCatalogCampaign) : null;
}

/**
 * FR-M13-04, PRD 7.4. Signed URLs are short-lived and only work for campaigns
 * the klipper is on, or open catalog campaigns once their account is active.
 */
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

/* ------------------------------------------------------------------ */
/* Clips of per_views campaigns (PRD M18)                              */
/* ------------------------------------------------------------------ */

export type PortalClipSubmission = {
  id: string;
  views: number;
  verifiedViews: number | null;
  status: SubmissionStatus;
  reviewNotes: string;
  creditedAmount: number | null;
  creditLimited: boolean;
  createdAt: string;
};

export type PortalClip = {
  id: string;
  assignmentId: string;
  campaignId: string;
  campaignName: string;
  platform: SocialPlatform;
  /** The live URL: approved, or as sent while it waits. */
  url: string | null;
  postedAt: string | null;
  reviewStatus: ReviewStatus;
  liveStatus: LiveStatus;
  removedAt: string | null;
  revisionCount: number;
  verifiedViews: number | null;
  earnedAmount: number;
  rejectionReason: ClipRejectionReason | null;
  lastReview: { decision: ReviewDecision; notes: string; createdAt: string } | null;
  submissions: PortalClipSubmission[];
  /** FR-M18-05: whether a views update can be sent now, and why not. */
  viewsUpdate: { allowed: boolean; message: string | null };
  createdAt: string;
};

/**
 * FR-M18-01 … FR-M18-05: the klipper's clips on `per_views` campaigns, newest
 * first, with their review, honor and whether new views can be sent. Pass an
 * assignment to limit the list to one campaign.
 */
export async function listPortalClips(
  supabase: SupabaseClient<Database>,
  options: { assignmentId?: string; timezone: string },
): Promise<PortalClip[]> {
  let assignmentsQuery = supabase
    .from("creator_portal_assignments")
    .select("id, campaign_id, campaign_name, campaign_status, end_date, claim_grace_days")
    .eq("payout_model", "per_views");
  if (options.assignmentId) assignmentsQuery = assignmentsQuery.eq("id", options.assignmentId);
  const { data: assignmentRows, error: assignmentsError } = await assignmentsQuery;
  if (assignmentsError) throw new Error(assignmentsError.message);

  const assignments = new Map(
    (assignmentRows as PortalAssignment[]).map((row) => [row.id, row] as const),
  );
  if (!assignments.size) return [];

  const { data: contentRows, error } = await supabase
    .from("creator_portal_contents")
    .select("*")
    .in("campaign_creator_id", [...assignments.keys()])
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const contents = contentRows as PortalContent[];

  const ids = contents.map((content) => content.id);
  const [reviews, submissions] = await Promise.all([
    listPortalReviews(supabase, ids),
    listPortalSubmissions(supabase, ids),
  ]);

  const now = new Date();
  const today = campaignToday(now);

  return contents.map((content) => {
    const assignment = assignments.get(content.campaign_creator_id)!;
    const own = submissions.filter((row) => row.content_id === content.id);
    const review = reviews.find((row) => row.content_id === content.id);

    const state = viewsUpdateState({
      reviewStatus: content.review_status,
      liveStatus: content.live_status,
      campaignStatus: assignment.campaign_status,
      endDate: assignment.end_date,
      claimGraceDays: assignment.claim_grace_days,
      today,
      lastSubmittedAt: own[0]?.created_at ?? null,
      hasPendingSubmission: own.some((row) => row.status === "menunggu"),
      now,
    });
    let message: string | null = null;
    if (!state.allowed) {
      switch (state.reason) {
        case "too_soon":
          message = `Pembaruan views berikutnya bisa dikirim mulai ${formatDateTime(state.nextAt, options.timezone)}.`;
          break;
        case "pending":
          message = "Pembaruan views sebelumnya masih menunggu verifikasi tim.";
          break;
        case "closed":
          message = `Masa klaim berakhir ${formatCalendarDate(claimDeadline(assignment.end_date, assignment.claim_grace_days))}.`;
          break;
        default:
          message = null;
      }
    }

    return {
      id: content.id,
      assignmentId: content.campaign_creator_id,
      campaignId: content.campaign_id,
      campaignName: assignment.campaign_name,
      platform: content.platform,
      url: content.posted_url ?? content.proposed_posted_url,
      postedAt: content.posted_at ?? content.proposed_posted_at,
      reviewStatus: content.review_status,
      liveStatus: content.live_status,
      removedAt: content.removed_at,
      revisionCount: content.revision_count,
      verifiedViews: content.verified_views === null ? null : Number(content.verified_views),
      earnedAmount: Number(content.earned_amount),
      rejectionReason: content.rejection_reason,
      lastReview: review
        ? { decision: review.decision, notes: review.notes, createdAt: review.created_at }
        : null,
      submissions: own.map((row) => ({
        id: row.id,
        views: Number(row.views),
        verifiedViews: row.verified_views === null ? null : Number(row.verified_views),
        status: row.status,
        reviewNotes: row.review_notes,
        creditedAmount: row.credited_amount === null ? null : Number(row.credited_amount),
        creditLimited: row.credit_limited,
        createdAt: row.created_at,
      })),
      viewsUpdate: { allowed: state.allowed, message },
      createdAt: content.created_at,
    };
  });
}

/* ------------------------------------------------------------------ */
/* Balance, bank account and withdrawals (PRD M19)                     */
/* ------------------------------------------------------------------ */

type LedgerView = Database["public"]["Views"]["creator_portal_ledger"]["Row"];
type BalanceView = Database["public"]["Views"]["creator_portal_balance"]["Row"];
type WithdrawalView = Database["public"]["Views"]["creator_portal_withdrawals"]["Row"];
type BankAccountView = Database["public"]["Views"]["creator_portal_bank_account"]["Row"];

export type PortalLedgerEntry = NonNullableExcept<
  LedgerView,
  "campaign_id" | "campaign_name" | "content_id" | "withdrawal_id"
>;
export type PortalBalance = NonNullableExcept<BalanceView, never>;
export type PortalWithdrawal = NonNullableExcept<
  WithdrawalView,
  "processed_at" | "paid_at" | "rejection_reason"
>;
export type PortalBankAccount = NonNullableExcept<BankAccountView, "changed_at" | "hold_until">;

/**
 * FR-M19-03. These views read through `current_creator_account_id()`, so a
 * blocked klipper still sees their frozen balance (FR-M3-09).
 */
export async function getPortalBalance(
  supabase: SupabaseClient<Database>,
): Promise<PortalBalance | null> {
  const { data, error } = await supabase.from("creator_portal_balance").select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data as PortalBalance) : null;
}

export async function listPortalLedger(
  supabase: SupabaseClient<Database>,
): Promise<PortalLedgerEntry[]> {
  const { data, error } = await supabase
    .from("creator_portal_ledger")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as PortalLedgerEntry[];
}

export async function listPortalWithdrawals(
  supabase: SupabaseClient<Database>,
): Promise<PortalWithdrawal[]> {
  const { data, error } = await supabase
    .from("creator_portal_withdrawals")
    .select("*")
    .order("requested_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as PortalWithdrawal[];
}

/** FR-M19-04: the klipper's own account, number masked. */
export async function getPortalBankAccount(
  supabase: SupabaseClient<Database>,
): Promise<PortalBankAccount | null> {
  const { data, error } = await supabase
    .from("creator_portal_bank_account")
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data as PortalBankAccount) : null;
}
