import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { budgetRemaining, budgetRemainingPct } from "@/lib/calculations/campaign-budget";
import { clipEarning, type ClipEarning } from "@/lib/calculations/clip-earning";
import { fraudFlags, type FraudFlag } from "@/lib/calculations/fraud-flags";
import { CLIP_QUEUE_OVERDUE_HOURS, type ClipRejectionReason } from "@/lib/constants/clips";
import type { LiveStatus, ReviewDecision, ReviewStatus } from "@/lib/constants/contents";
import type { SocialPlatform } from "@/lib/constants/creators";
import { METRIC_PROOF_BUCKET, type SubmissionStatus } from "@/lib/constants/metrics";
import type { Database } from "@/types/database";

/**
 * Team reads for clip verification (PRD M18, FR-M10-01, FR-M10-03). The team
 * reads the base tables under RLS; the ledger sums here feed
 * lib/calculations/clip-earning.ts, and the database re-checks them.
 */

type Supabase = SupabaseClient<Database>;

const PROOF_URL_SECONDS = 10 * 60;
const HOUR = 60 * 60 * 1000;
const CLIP_ENTRY_TYPES = ["honor_klip", "pembatalan"] as const;

type CampaignRef = { id: string; code: string; name: string };

export type ClipQueueItem = {
  kind: "klip" | "views";
  contentId: string;
  submissionId: string;
  campaign: CampaignRef;
  creatorName: string;
  platform: SocialPlatform;
  claimedViews: number;
  revisionCount: number;
  /** When the item (re)entered the queue. */
  waitingSince: string;
  overdue: boolean;
};

/**
 * FR-M10-03: open clips and views updates on running `per_views` campaigns,
 * oldest first, flagged after 24 hours.
 */
export async function listClipQueue(
  supabase: Supabase,
  now: Date = new Date(),
): Promise<{ clips: ClipQueueItem[]; viewsUpdates: ClipQueueItem[] }> {
  const { data, error } = await supabase
    .from("metric_submissions")
    .select(
      `id, views, created_at,
       content:contents!inner(
         id, platform, review_status, revision_count, updated_at,
         assignment:campaign_creators!inner(
           campaign:campaigns!inner(id, code, name, status, payout_model),
           creator:creators(full_name, stage_name)
         )
       )`,
    )
    .eq("status", "menunggu")
    .eq("content.assignment.campaign.payout_model", "per_views")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  const items: ClipQueueItem[] = [];
  for (const row of data ?? []) {
    const content = row.content;
    const campaign = content.assignment.campaign;
    if (!campaign || !["aktif", "selesai"].includes(campaign.status)) continue;

    const kind =
      content.review_status === "menunggu_review"
        ? "klip"
        : content.review_status === "disetujui"
          ? "views"
          : null;
    if (!kind) continue;

    // A resubmitted clip re-enters the queue when its status moves back.
    const waitingSince = kind === "klip" ? content.updated_at : row.created_at;
    items.push({
      kind,
      contentId: content.id,
      submissionId: row.id,
      campaign: { id: campaign.id, code: campaign.code, name: campaign.name },
      creatorName:
        content.assignment.creator?.stage_name || content.assignment.creator?.full_name || "–",
      platform: content.platform,
      claimedViews: Number(row.views),
      revisionCount: content.revision_count,
      waitingSince,
      overdue: now.getTime() - new Date(waitingSince).getTime() > CLIP_QUEUE_OVERDUE_HOURS * HOUR,
    });
  }

  const byAge = (a: ClipQueueItem, b: ClipQueueItem) =>
    a.waitingSince.localeCompare(b.waitingSince);
  return {
    clips: items.filter((item) => item.kind === "klip").sort(byAge),
    viewsUpdates: items.filter((item) => item.kind === "views").sort(byAge),
  };
}

/* ------------------------------------------------------------------ */
/* Credit context (PRD 8.6)                                            */
/* ------------------------------------------------------------------ */

export type ClipCampaignTerms = {
  id: string;
  ratePer1000Views: number;
  minViewsToEarn: number;
  maxPayoutPerClip: number | null;
  maxPayoutPerCreator: number | null;
  creatorBudget: number;
};

export type ClipLedgerSums = {
  alreadyCreditedForClip: number;
  creatorEarnedInCampaign: number;
  campaignCost: number;
};

/** Fresh ledger sums for one clip (PRD 8.6); read right before a decision. */
export async function loadClipLedgerSums(
  supabase: Supabase,
  input: { campaignId: string; contentId: string; creatorId: string },
): Promise<ClipLedgerSums> {
  const { data, error } = await supabase
    .from("creator_ledger_entries")
    .select("amount, content_id, creator_id")
    .eq("campaign_id", input.campaignId)
    .in("entry_type", [...CLIP_ENTRY_TYPES]);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const sum = (filter: (row: (typeof rows)[number]) => boolean) =>
    rows.filter(filter).reduce((total, row) => total + Number(row.amount), 0);
  return {
    alreadyCreditedForClip: sum((row) => row.content_id === input.contentId),
    creatorEarnedInCampaign: sum((row) => row.creator_id === input.creatorId),
    campaignCost: sum(() => true),
  };
}

export async function computeClipCredit(
  supabase: Supabase,
  input: {
    campaign: ClipCampaignTerms;
    contentId: string;
    creatorId: string;
    verifiedViews: number;
  },
): Promise<ClipEarning> {
  const sums = await loadClipLedgerSums(supabase, {
    campaignId: input.campaign.id,
    contentId: input.contentId,
    creatorId: input.creatorId,
  });
  return clipEarning({
    ...sums,
    verifiedViews: input.verifiedViews,
    ratePer1000Views: input.campaign.ratePer1000Views,
    minViewsToEarn: input.campaign.minViewsToEarn,
    maxPayoutPerClip: input.campaign.maxPayoutPerClip,
    maxPayoutPerCreator: input.campaign.maxPayoutPerCreator,
    creatorBudget: input.campaign.creatorBudget,
  });
}

/* ------------------------------------------------------------------ */
/* One clip, for the verification page                                 */
/* ------------------------------------------------------------------ */

export type ClipSubmissionDetail = {
  id: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  verifiedViews: number | null;
  status: SubmissionStatus;
  reviewNotes: string;
  creditedAmount: number | null;
  creditLimited: boolean;
  createdAt: string;
  reviewedAt: string | null;
  proofUrl: string | null;
};

export type ClipDetail = {
  id: string;
  platform: SocialPlatform;
  url: string | null;
  postedAt: string | null;
  proposedAt: string | null;
  reviewStatus: ReviewStatus;
  liveStatus: LiveStatus;
  removedAt: string | null;
  revisionCount: number;
  verifiedViews: number | null;
  rejectionReason: ClipRejectionReason | null;
  captionCodeChecked: boolean;
  assignment: { id: string; joinedAt: string | null; status: string };
  creator: {
    id: string;
    name: string;
    stageName: string;
    verificationCode: string | null;
    status: string;
    socialAccounts: {
      platform: SocialPlatform;
      handle: string;
      profileUrl: string;
      followers: number;
    }[];
  };
  campaign: ClipCampaignTerms & {
    code: string;
    name: string;
    status: Database["public"]["Enums"]["campaign_status"];
    startDate: string;
    endDate: string;
    minLiveDays: number;
    paidLabelRequired: boolean;
    hashtags: string[];
    mustDo: string[];
    mustNot: string[];
  };
  submissions: ClipSubmissionDetail[];
  pendingSubmission: ClipSubmissionDetail | null;
  reviews: {
    id: string;
    decision: ReviewDecision;
    notes: string;
    reviewerName: string | null;
    createdAt: string;
  }[];
  /** Ledger sums behind the credit preview on the verification form. */
  ledger: ClipLedgerSums;
  flags: FraudFlag[];
};

export async function getClipForVerification(
  supabase: Supabase,
  contentId: string,
): Promise<ClipDetail | null> {
  const { data: content, error } = await supabase
    .from("contents")
    .select(
      `id, platform, posted_url, posted_at, proposed_posted_url, proposed_posted_at, proposed_at,
       review_status, live_status, removed_at, revision_count, verified_views, rejection_reason,
       caption_code_checked,
       assignment:campaign_creators!inner(
         id, joined_at, status,
         creator:creators!inner(id, full_name, stage_name, verification_code, status),
         campaign:campaigns!inner(
           id, code, name, status, payout_model, start_date, end_date, min_live_days,
           paid_label_required, hashtags, must_do, must_not, rate_per_1000_views,
           min_views_to_earn, max_payout_per_clip, max_payout_per_creator, creator_budget
         )
       )`,
    )
    .eq("id", contentId)
    .maybeSingle();
  if (error) {
    if (error.code === "22P02") return null;
    throw new Error(error.message);
  }
  if (!content || content.assignment.campaign.payout_model !== "per_views") return null;

  const { assignment } = content;
  const { campaign, creator } = assignment;

  const [submissionsResult, reviewsResult, accountsResult, ledger] = await Promise.all([
    supabase
      .from("metric_submissions")
      .select(
        "id, views, likes, comments, shares, verified_views, status, review_notes, credited_amount, credit_limited, created_at, reviewed_at, proof_path",
      )
      .eq("content_id", contentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("content_reviews")
      .select("id, decision, notes, created_at, reviewer:profiles(full_name)")
      .eq("content_id", contentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("creator_social_accounts")
      .select("platform, handle, profile_url, followers_count")
      .eq("creator_id", creator.id),
    loadClipLedgerSums(supabase, { campaignId: campaign.id, contentId, creatorId: creator.id }),
  ]);
  for (const result of [submissionsResult, reviewsResult, accountsResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const submissionRows = submissionsResult.data ?? [];
  const paths = submissionRows.map((row) => row.proof_path);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data } = await supabase.storage
      .from(METRIC_PROOF_BUCKET)
      .createSignedUrls(paths, PROOF_URL_SECONDS);
    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    }
  }

  const submissions: ClipSubmissionDetail[] = submissionRows.map((row) => ({
    id: row.id,
    views: Number(row.views),
    likes: Number(row.likes),
    comments: Number(row.comments),
    shares: Number(row.shares),
    verifiedViews: row.verified_views === null ? null : Number(row.verified_views),
    status: row.status,
    reviewNotes: row.review_notes,
    creditedAmount: row.credited_amount === null ? null : Number(row.credited_amount),
    creditLimited: row.credit_limited,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    proofUrl: signed.get(row.proof_path) ?? null,
  }));
  const pendingSubmission = submissions.find((row) => row.status === "menunggu") ?? null;

  const terms: ClipCampaignTerms = {
    id: campaign.id,
    ratePer1000Views: Number(campaign.rate_per_1000_views),
    minViewsToEarn: Number(campaign.min_views_to_earn),
    maxPayoutPerClip:
      campaign.max_payout_per_clip === null ? null : Number(campaign.max_payout_per_clip),
    maxPayoutPerCreator:
      campaign.max_payout_per_creator === null ? null : Number(campaign.max_payout_per_creator),
    creatorBudget: Number(campaign.creator_budget),
  };

  const lastAccepted = submissions.find((row) => row.status === "diterima");
  const postedAt = content.posted_at ?? content.proposed_posted_at;
  const flags =
    pendingSubmission && postedAt
      ? fraudFlags({
          claim: pendingSubmission,
          previousViews: lastAccepted?.verifiedViews ?? null,
          postedAt,
          joinedAt: assignment.joined_at,
        })
      : [];

  return {
    id: content.id,
    platform: content.platform,
    url: content.posted_url ?? content.proposed_posted_url,
    postedAt,
    proposedAt: content.proposed_at,
    reviewStatus: content.review_status,
    liveStatus: content.live_status,
    removedAt: content.removed_at,
    revisionCount: content.revision_count,
    verifiedViews: content.verified_views === null ? null : Number(content.verified_views),
    rejectionReason: content.rejection_reason,
    captionCodeChecked: content.caption_code_checked,
    assignment: { id: assignment.id, joinedAt: assignment.joined_at, status: assignment.status },
    creator: {
      id: creator.id,
      name: creator.full_name,
      stageName: creator.stage_name,
      verificationCode: creator.verification_code,
      status: creator.status,
      socialAccounts: (accountsResult.data ?? []).map((row) => ({
        platform: row.platform,
        handle: row.handle,
        profileUrl: row.profile_url,
        followers: row.followers_count,
      })),
    },
    campaign: {
      ...terms,
      code: campaign.code,
      name: campaign.name,
      status: campaign.status,
      startDate: campaign.start_date,
      endDate: campaign.end_date,
      minLiveDays: campaign.min_live_days,
      paidLabelRequired: campaign.paid_label_required,
      hashtags: campaign.hashtags,
      mustDo: campaign.must_do,
      mustNot: campaign.must_not,
    },
    submissions,
    pendingSubmission,
    reviews: (reviewsResult.data ?? []).map((row) => ({
      id: row.id,
      decision: row.decision,
      notes: row.notes,
      reviewerName: row.reviewer?.full_name ?? null,
      createdAt: row.created_at,
    })),
    ledger,
    flags,
  };
}

/* ------------------------------------------------------------------ */
/* Clips of one campaign (Konten tab of a per_views campaign)          */
/* ------------------------------------------------------------------ */

export type CampaignClipRow = {
  id: string;
  creatorName: string;
  platform: SocialPlatform;
  url: string | null;
  postedAt: string | null;
  reviewStatus: ReviewStatus;
  liveStatus: LiveStatus;
  verifiedViews: number | null;
  earned: number;
  pendingViews: boolean;
};

export async function listCampaignClips(
  supabase: Supabase,
  campaignId: string,
): Promise<CampaignClipRow[]> {
  const [contentsResult, ledgerResult] = await Promise.all([
    supabase
      .from("contents")
      .select(
        `id, platform, posted_url, posted_at, proposed_posted_url, proposed_posted_at,
         review_status, live_status, verified_views, created_at,
         submissions:metric_submissions(status),
         assignment:campaign_creators!inner(campaign_id, creator:creators(full_name, stage_name))`,
      )
      .eq("assignment.campaign_id", campaignId)
      .order("created_at", { ascending: false }),
    supabase
      .from("creator_ledger_entries")
      .select("content_id, amount")
      .eq("campaign_id", campaignId)
      .in("entry_type", [...CLIP_ENTRY_TYPES]),
  ]);
  if (contentsResult.error) throw new Error(contentsResult.error.message);
  if (ledgerResult.error) throw new Error(ledgerResult.error.message);

  const earned = new Map<string, number>();
  for (const row of ledgerResult.data ?? []) {
    if (!row.content_id) continue;
    earned.set(row.content_id, (earned.get(row.content_id) ?? 0) + Number(row.amount));
  }

  return (contentsResult.data ?? []).map((row) => ({
    id: row.id,
    creatorName: row.assignment.creator?.stage_name || row.assignment.creator?.full_name || "–",
    platform: row.platform,
    url: row.posted_url ?? row.proposed_posted_url,
    postedAt: row.posted_at ?? row.proposed_posted_at,
    reviewStatus: row.review_status,
    liveStatus: row.live_status,
    verifiedViews: row.verified_views === null ? null : Number(row.verified_views),
    earned: earned.get(row.id) ?? 0,
    pendingViews:
      row.review_status === "disetujui" && row.submissions.some((s) => s.status === "menunggu"),
  }));
}

/* ------------------------------------------------------------------ */
/* Dashboard (FR-M10-01)                                               */
/* ------------------------------------------------------------------ */

export type LowBudgetCampaign = CampaignRef & {
  remainingPct: number;
  /** Whole Rupiah: `creator_budget`, honor spent, and what is left of it. */
  budget: number;
  used: number;
  remaining: number;
};

/** Running per_views campaigns with less than 10% of the klipper budget left. */
export async function listLowBudgetCampaigns(supabase: Supabase): Promise<LowBudgetCampaign[]> {
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, code, name, creator_budget, rate_per_1000_views")
    .eq("status", "aktif")
    .eq("payout_model", "per_views")
    .gt("creator_budget", 0);
  if (error) throw new Error(error.message);
  if (!campaigns?.length) return [];

  const { data: ledger, error: ledgerError } = await supabase
    .from("creator_ledger_entries")
    .select("campaign_id, amount")
    .in(
      "campaign_id",
      campaigns.map((campaign) => campaign.id),
    )
    .in("entry_type", [...CLIP_ENTRY_TYPES]);
  if (ledgerError) throw new Error(ledgerError.message);

  const cost = new Map<string, number>();
  for (const row of ledger ?? []) {
    if (!row.campaign_id) continue;
    cost.set(row.campaign_id, (cost.get(row.campaign_id) ?? 0) + Number(row.amount));
  }

  return campaigns
    .map((campaign) => {
      const input = {
        creatorBudget: Number(campaign.creator_budget),
        creatorCost: cost.get(campaign.id) ?? 0,
        ratePer1000Views: Number(campaign.rate_per_1000_views),
      };
      return {
        id: campaign.id,
        code: campaign.code,
        name: campaign.name,
        remainingPct: budgetRemainingPct(input),
        budget: input.creatorBudget,
        used: Math.max(input.creatorCost, 0),
        remaining: budgetRemaining(input),
      };
    })
    .filter((campaign) => campaign.remainingPct < 10)
    .sort((a, b) => a.remainingPct - b.remainingPct);
}
