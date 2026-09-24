import { fromZonedTime } from "date-fns-tz";
import { CAMPAIGN_BUSINESS_TIMEZONE } from "@/lib/campaigns/open";
import type { CampaignStatus } from "@/lib/constants/campaigns";
import { CLIP_POSTED_AT_SKEW_MINUTES, VIEWS_UPDATE_MIN_HOURS } from "@/lib/constants/clips";
import type { LiveStatus, ReviewStatus } from "@/lib/constants/contents";
import type { CreatorStatus, SocialPlatform } from "@/lib/constants/creators";

/**
 * Clip submission rules (FR-M18-01, FR-M18-02, FR-M18-05). The database
 * enforces the same rules in `guard_clip_change` and
 * `guard_metric_submission_change`; these give the portal its explanations
 * before anything is sent.
 */

const HOUR = 60 * 60 * 1000;

/** Add days to a `yyyy-MM-dd` calendar date. */
function addCalendarDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

/**
 * The window a clip may be posted in: from the minute of joining (or the
 * campaign start, whichever is later) to the end of `end_date` in the
 * business timezone.
 * Mirrors `v_period_start` / `v_period_end` in `guard_clip_change`.
 */
export function clipPeriod(input: {
  joinedAt: string | null;
  startDate: string;
  endDate: string;
}): { start: Date; end: Date } {
  const campaignStart = fromZonedTime(`${input.startDate}T00:00:00`, CAMPAIGN_BUSINESS_TIMEZONE);
  // Minute precision, like the posting-time input (date_trunc in the guard).
  const joined = input.joinedAt
    ? new Date(Math.floor(new Date(input.joinedAt).getTime() / 60_000) * 60_000)
    : null;
  const start = joined && joined > campaignStart ? joined : campaignStart;
  const end = fromZonedTime(
    `${addCalendarDays(input.endDate, 1)}T00:00:00`,
    CAMPAIGN_BUSINESS_TIMEZONE,
  );
  return { start, end };
}

export type ClipBlocker =
  | "creator_not_active"
  | "terms_outdated"
  | "not_joined"
  | "campaign_closed"
  | "budget_exhausted"
  | "limit_reached";

export const CLIP_BLOCKER_MESSAGES: Record<ClipBlocker, string> = {
  creator_not_active: "Akunmu belum aktif. Tambahkan akun medsos di Profil dulu.",
  terms_outdated:
    "Syarat Klipper sudah diperbarui. Setujui versi terbarunya dulu, baru kamu bisa kirim klip.",
  not_joined: "Kamu cuma bisa kirim klip untuk kampanye yang kamu ikuti.",
  campaign_closed: "Kampanye ini sudah nggak terima klip baru.",
  budget_exhausted: "Anggaran kampanye ini sudah habis, jadi klip baru nggak diterima lagi.",
  limit_reached: "Kuota klipmu untuk kampanye ini sudah penuh.",
};

export type ClipCheckInput = {
  creatorStatus: CreatorStatus;
  termsVersion: string | null;
  currentTermsVersion: string;
  assignmentStatus: string;
  campaignStatus: CampaignStatus;
  endDate: string;
  today: string;
  budgetExhausted: boolean;
  maxClipsPerCreator: number;
  /** Clips of this klipper on this campaign that were not rejected. */
  activeClipCount: number;
};

/** Reasons the klipper cannot send a new clip now, in the trigger's order. */
export function clipSubmissionBlockers(input: ClipCheckInput): ClipBlocker[] {
  const blockers: ClipBlocker[] = [];
  if (input.creatorStatus !== "aktif" && input.creatorStatus !== "terverifikasi") {
    blockers.push("creator_not_active");
  }
  if (input.termsVersion !== input.currentTermsVersion) blockers.push("terms_outdated");
  if (input.assignmentStatus !== "bergabung") blockers.push("not_joined");
  if (input.campaignStatus !== "aktif" || input.endDate < input.today) {
    blockers.push("campaign_closed");
  }
  if (input.budgetExhausted) blockers.push("budget_exhausted");
  if (input.activeClipCount >= input.maxClipsPerCreator) blockers.push("limit_reached");
  return blockers;
}

/** Why one clip's details would be refused, for field-level messages. */
export function clipDetailProblems(input: {
  platform: SocialPlatform;
  postedAt: Date;
  now: Date;
  allowedPlatforms: readonly SocialPlatform[];
  registeredPlatforms: readonly SocialPlatform[];
  period: { start: Date; end: Date };
}): { platform?: string; posted_at?: string } {
  const problems: { platform?: string; posted_at?: string } = {};
  if (!input.allowedPlatforms.includes(input.platform)) {
    problems.platform = "Kampanye ini tidak menerima klip dari platform tersebut.";
  } else if (!input.registeredPlatforms.includes(input.platform)) {
    problems.platform = "Tambahkan akun media sosial untuk platform ini di Profil terlebih dahulu.";
  }

  const skew = CLIP_POSTED_AT_SKEW_MINUTES * 60 * 1000;
  if (input.postedAt.getTime() > input.now.getTime() + skew) {
    problems.posted_at = "Waktu tayang tidak boleh di masa depan.";
  } else if (input.postedAt < input.period.start || input.postedAt >= input.period.end) {
    problems.posted_at = "Waktu tayang harus setelah kamu gabung dan sebelum kampanye selesai.";
  }
  return problems;
}

export type ViewsUpdateState =
  | { allowed: true }
  | { allowed: false; reason: "not_approved" | "not_live" | "closed" | "pending" }
  | { allowed: false; reason: "too_soon"; nextAt: Date };

/**
 * FR-M18-05: a views update for an approved, live clip, at most every 24
 * hours after the last submission, until `end_date + claim_grace_days`.
 */
export function viewsUpdateState(input: {
  reviewStatus: ReviewStatus;
  liveStatus: LiveStatus;
  campaignStatus: CampaignStatus;
  endDate: string;
  claimGraceDays: number;
  today: string;
  /** `created_at` of the latest submission of this clip, any status. */
  lastSubmittedAt: string | null;
  hasPendingSubmission: boolean;
  now: Date;
}): ViewsUpdateState {
  if (input.reviewStatus !== "disetujui") return { allowed: false, reason: "not_approved" };
  if (input.liveStatus !== "tayang") return { allowed: false, reason: "not_live" };
  if (
    input.campaignStatus === "dibatalkan" ||
    input.today > addCalendarDays(input.endDate, input.claimGraceDays)
  ) {
    return { allowed: false, reason: "closed" };
  }
  if (input.hasPendingSubmission) return { allowed: false, reason: "pending" };
  if (input.lastSubmittedAt) {
    const nextAt = new Date(
      new Date(input.lastSubmittedAt).getTime() + VIEWS_UPDATE_MIN_HOURS * HOUR,
    );
    if (input.now < nextAt) return { allowed: false, reason: "too_soon", nextAt };
  }
  return { allowed: true };
}

/** Last day views updates are accepted, `yyyy-MM-dd`. */
export function claimDeadline(endDate: string, claimGraceDays: number): string {
  return addCalendarDays(endDate, claimGraceDays);
}
