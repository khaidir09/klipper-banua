import type { CampaignAccess, CampaignStatus, PayoutModel } from "@/lib/constants/campaigns";
import type { CreatorStatus } from "@/lib/constants/creators";
import { formatDateInput } from "@/lib/format/date";

/**
 * Open campaigns and the klipper catalog (PRD M17). The database enforces the
 * same rules in `guard_campaign_creator_change` and
 * `guard_portal_assignment_confirm`; these give the portal its explanations.
 */

/** Business timezone behind `end_date` checks; same as `public.campaign_today()`. */
export const CAMPAIGN_BUSINESS_TIMEZONE = "Asia/Makassar";

/** Today as `yyyy-MM-dd` in the business timezone. */
export function campaignToday(now: Date = new Date()): string {
  return formatDateInput(now, CAMPAIGN_BUSINESS_TIMEZONE);
}

/** Reasons a klipper cannot join, in the order the trigger checks them. */
export type JoinBlocker =
  | "already_joined"
  | "creator_not_active"
  | "terms_outdated"
  | "campaign_closed"
  | "past_deadline"
  | "budget_exhausted"
  | "local_only";

export const JOIN_BLOCKER_MESSAGES: Record<JoinBlocker, string> = {
  already_joined: "Kamu sudah ikut kampanye ini.",
  creator_not_active:
    "Tambahkan minimal satu akun medsos di Profil dulu supaya akunmu aktif dan bisa gabung.",
  terms_outdated:
    "Syarat Klipper sudah diperbarui. Setujui versi terbarunya dulu, baru kamu bisa gabung.",
  campaign_closed: "Kampanye ini lagi nggak terima klipper baru.",
  past_deadline: "Kampanye ini sudah selesai.",
  budget_exhausted: "Anggaran kampanye ini sudah habis. Cari kampanye lain, yuk!",
  local_only: "Kampanye ini khusus pemegang lencana Klipper Lokal. Ajukan lencananya di Profil.",
};

export type JoinCheckInput = {
  creator: {
    status: CreatorStatus;
    termsVersion: string | null;
    hasLocalBadge: boolean;
  };
  campaign: {
    status: CampaignStatus;
    access: CampaignAccess;
    payoutModel: PayoutModel;
    /** `yyyy-MM-dd`. */
    endDate: string;
    localOnly: boolean;
    budgetExhausted: boolean;
  };
  /** The klipper already has an assignment on this campaign (any status). */
  alreadyJoined: boolean;
  currentTermsVersion: string;
  today: string;
};

/** FR-M17-04. Empty when the klipper may join. */
export function joinBlockers(input: JoinCheckInput): JoinBlocker[] {
  const { creator, campaign } = input;
  const blockers: JoinBlocker[] = [];
  if (input.alreadyJoined) blockers.push("already_joined");
  if (creator.status !== "aktif" && creator.status !== "terverifikasi") {
    blockers.push("creator_not_active");
  }
  if (creator.termsVersion !== input.currentTermsVersion) blockers.push("terms_outdated");
  if (
    campaign.status !== "aktif" ||
    campaign.access !== "terbuka" ||
    campaign.payoutModel !== "per_views"
  ) {
    blockers.push("campaign_closed");
  }
  if (campaign.endDate < input.today) blockers.push("past_deadline");
  if (campaign.budgetExhausted) blockers.push("budget_exhausted");
  if (campaign.localOnly && !creator.hasLocalBadge) blockers.push("local_only");
  return blockers;
}

/**
 * FR-M17-05: a klipper leaves a running `per_views` campaign on their own
 * while none of their clips was approved.
 */
export function canWithdraw(input: {
  assignmentStatus: string;
  campaignStatus: CampaignStatus;
  payoutModel: PayoutModel;
  approvedClipCount: number;
}): boolean {
  return (
    input.assignmentStatus === "bergabung" &&
    input.campaignStatus === "aktif" &&
    input.payoutModel === "per_views" &&
    input.approvedClipCount === 0
  );
}

/* ------------------------------------------------------------------ */
/* Catalog filters (FR-M17-03)                                          */
/* ------------------------------------------------------------------ */

export const CATALOG_SORTS = ["terbaru", "tarif", "tenggat"] as const;
export type CatalogSort = (typeof CATALOG_SORTS)[number];

export const CATALOG_SORT_LABELS: Record<CatalogSort, string> = {
  terbaru: "Terbaru",
  tarif: "Tarif tertinggi",
  tenggat: "Tenggat terdekat",
};

type Sortable = {
  published_at: string | null;
  rate_per_1000_views: number;
  end_date: string;
  name: string;
};

/** Stable order for the catalog; ties fall back to the campaign name. */
export function sortCatalog<T extends Sortable>(rows: readonly T[], sort: CatalogSort): T[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, "id");
  const compare: Record<CatalogSort, (a: T, b: T) => number> = {
    terbaru: (a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? "") || byName(a, b),
    tarif: (a, b) => b.rate_per_1000_views - a.rate_per_1000_views || byName(a, b),
    tenggat: (a, b) => a.end_date.localeCompare(b.end_date) || byName(a, b),
  };
  return [...rows].sort(compare[sort]);
}
