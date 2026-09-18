import type { LiveStatus, ReviewStatus } from "@/lib/constants/contents";
import type { EffectiveFeeScheme } from "./fee-scheme";
import { removedBeforeMinLiveDays } from "./live-duration";

/**
 * Creator payout per assignment (PRD 8.2, 8.3). Pure and deterministic; all
 * amounts are whole Rupiah integers and every division rounds down.
 */

export type PayoutContentInput = {
  id: string;
  review_status: ReviewStatus;
  posted_url: string | null;
  posted_at: string | null;
  live_status: LiveStatus;
  removed_at: string | null;
  /** Views of the latest snapshot (FR-M7-02); 0 without snapshots. */
  views: number;
};

export type IneligibleReason = "not_approved" | "not_posted" | "removed_early";

export const INELIGIBLE_REASON_LABELS: Record<IneligibleReason, string> = {
  not_approved: "Belum disetujui",
  not_posted: "Belum tayang",
  removed_early: "Dihapus sebelum minimal hari tayang",
};

/** PRD 8.2: all three conditions must hold. */
export function contentEligibility(
  content: PayoutContentInput,
  minLiveDays: number,
): { eligible: true } | { eligible: false; reason: IneligibleReason } {
  if (content.review_status !== "disetujui") return { eligible: false, reason: "not_approved" };
  if (!content.posted_url || !content.posted_at || content.live_status === "belum_tayang") {
    return { eligible: false, reason: "not_posted" };
  }
  if (content.live_status === "dihapus") {
    if (
      !content.removed_at ||
      removedBeforeMinLiveDays(content.posted_at, content.removed_at, minLiveDays)
    ) {
      return { eligible: false, reason: "removed_early" };
    }
  }
  return { eligible: true };
}

export type PayoutInput = {
  scheme: EffectiveFeeScheme;
  contentsCommitted: number;
  minLiveDays: number;
  contents: PayoutContentInput[];
  /** Σ registrant_count of reports for this referral code. */
  registrantCount: number;
  /** May be negative (FR-M8-02). */
  adjustmentAmount: number;
};

export type PayoutContentLine = {
  id: string;
  views: number;
  eligible: boolean;
  reason: IneligibleReason | null;
  /** Whether this content earns the base fee (the first `contents_committed` eligible ones). */
  countsForBaseFee: boolean;
};

export type PayoutCalculation = {
  eligibleContents: number;
  validContents: number;
  baseAmount: number;
  totalViews: number;
  viewsBonusRaw: number;
  viewsBonus: number;
  registrantCount: number;
  registrantBonus: number;
  adjustmentAmount: number;
  /** Never negative (PRD 8.3). */
  totalAmount: number;
  contents: PayoutContentLine[];
};

/**
 * PRD 8.3: total = base + views bonus + registrant bonus + adjustment, never
 * below zero. Also used when only the adjustment of a draft changes.
 */
export function payoutTotal(components: {
  baseAmount: number;
  viewsBonus: number;
  registrantBonus: number;
  adjustmentAmount: number;
}): number {
  return Math.max(
    0,
    components.baseAmount +
      components.viewsBonus +
      components.registrantBonus +
      components.adjustmentAmount,
  );
}

function assertWhole(name: string, value: number) {
  if (!Number.isSafeInteger(value))
    throw new RangeError(`${name} must be a whole number: ${value}`);
}

function byPostingTime(a: PayoutContentInput, b: PayoutContentInput): number {
  return (a.posted_at ?? "").localeCompare(b.posted_at ?? "") || a.id.localeCompare(b.id);
}

export function calculatePayout(input: PayoutInput): PayoutCalculation {
  const { scheme } = input;
  assertWhole("contentsCommitted", input.contentsCommitted);
  assertWhole("registrantCount", input.registrantCount);
  assertWhole("adjustmentAmount", input.adjustmentAmount);
  assertWhole("baseFee", scheme.baseFee);
  assertWhole("bonusPer1000Views", scheme.bonusPer1000Views);
  assertWhole("bonusPerRegistrant", scheme.bonusPerRegistrant);
  if (scheme.viewsBonusCap !== null) assertWhole("viewsBonusCap", scheme.viewsBonusCap);
  for (const content of input.contents) assertWhole(`views of ${content.id}`, content.views);

  const ordered = [...input.contents].sort(byPostingTime);
  const committed = Math.max(0, input.contentsCommitted);
  let baseSlots = committed;

  const contents: PayoutContentLine[] = ordered.map((content) => {
    const eligibility = contentEligibility(content, input.minLiveDays);
    const countsForBaseFee = eligibility.eligible && baseSlots > 0;
    if (countsForBaseFee) baseSlots -= 1;
    return {
      id: content.id,
      views: content.views,
      eligible: eligibility.eligible,
      reason: eligibility.eligible ? null : eligibility.reason,
      countsForBaseFee,
    };
  });

  const eligible = contents.filter((line) => line.eligible);
  const eligibleContents = eligible.length;
  const validContents = Math.min(eligibleContents, committed);
  const baseAmount = validContents * scheme.baseFee;

  // Views of every eligible content count, not just the committed ones (PRD 8.3).
  const totalViews = eligible.reduce((sum, line) => sum + line.views, 0);
  const viewsBonusRaw = Math.floor(totalViews / 1000) * scheme.bonusPer1000Views;
  // null = no cap; 0 is a real cap of zero.
  const viewsBonus =
    scheme.viewsBonusCap === null ? viewsBonusRaw : Math.min(viewsBonusRaw, scheme.viewsBonusCap);

  const registrantBonus = input.registrantCount * scheme.bonusPerRegistrant;
  const totalAmount = payoutTotal({
    baseAmount,
    viewsBonus,
    registrantBonus,
    adjustmentAmount: input.adjustmentAmount,
  });

  return {
    eligibleContents,
    validContents,
    baseAmount,
    totalViews,
    viewsBonusRaw,
    viewsBonus,
    registrantCount: input.registrantCount,
    registrantBonus,
    adjustmentAmount: input.adjustmentAmount,
    totalAmount,
    contents,
  };
}
