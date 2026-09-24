/**
 * Honor of one `per_views` clip (PRD 8.6). Whole Rupiah only, rounded down.
 *
 * The verification action computes the credit here and hands it to
 * `verify_clip()` / `verify_views_update()`, which lock the campaign row and
 * re-check the invariants (budget, per-klipper cap, never above what the
 * verified views earn). A credit computed on stale numbers is refused there
 * with `BUDGET_EXCEEDED` or `CREDIT_ABOVE_CREATOR_CAP`, and the action
 * recomputes once.
 */

export type ClipEarningInput = {
  /** Views the team verified on this submission. */
  verifiedViews: number;
  ratePer1000Views: number;
  minViewsToEarn: number;
  maxPayoutPerClip: number | null;
  maxPayoutPerCreator: number | null;
  /** Σ ledger `honor_klip` + `pembatalan` for this clip. */
  alreadyCreditedForClip: number;
  /** Σ ledger `honor_klip` + `pembatalan` for this klipper in this campaign. */
  creatorEarnedInCampaign: number;
  creatorBudget: number;
  /** Σ ledger `honor_klip` + `pembatalan` for the whole campaign. */
  campaignCost: number;
};

export type ClipEarningLimit = "klipper" | "anggaran";

export type ClipEarning = {
  eligibleViews: number;
  /** What the verified views earn for the whole clip, capped per clip. */
  clipEarning: number;
  /** Not yet credited for this clip; never below zero. */
  delta: number;
  /** Room under the per-klipper cap, or null without a cap. */
  creatorRoom: number | null;
  budgetRoom: number;
  /** The amount to credit now; zero means no ledger entry. */
  credit: number;
  /** Set when the credit was cut below `delta` ("dibatasi batas kampanye"). */
  limitedBy: ClipEarningLimit | null;
};

const floorRupiah = (value: number) => Math.max(Math.floor(value), 0);

export function clipEarning(input: ClipEarningInput): ClipEarning {
  const views = Math.max(Math.floor(input.verifiedViews), 0);
  const eligibleViews = views >= input.minViewsToEarn ? views : 0;

  let earning = floorRupiah((eligibleViews * input.ratePer1000Views) / 1000);
  if (input.maxPayoutPerClip !== null) earning = Math.min(earning, input.maxPayoutPerClip);

  const delta = Math.max(earning - input.alreadyCreditedForClip, 0);
  const creatorRoom =
    input.maxPayoutPerCreator === null
      ? null
      : Math.max(input.maxPayoutPerCreator - input.creatorEarnedInCampaign, 0);
  const budgetRoom = Math.max(input.creatorBudget - input.campaignCost, 0);

  const credit = Math.min(delta, creatorRoom ?? Number.POSITIVE_INFINITY, budgetRoom);

  let limitedBy: ClipEarningLimit | null = null;
  if (credit < delta) {
    limitedBy = creatorRoom !== null && creatorRoom <= budgetRoom ? "klipper" : "anggaran";
  }

  return { eligibleViews, clipEarning: earning, delta, creatorRoom, budgetRoom, credit, limitedBy };
}

/**
 * FR-M18-06: a clip taken down before `min_live_days` loses its honor.
 * Mirrors the check in `cancel_clip()`.
 */
export function removedBeforeMinLive(
  postedAt: Date | string,
  removedAt: Date | string,
  minLiveDays: number,
): boolean {
  const posted = new Date(postedAt).getTime();
  const removed = new Date(removedAt).getTime();
  return removed < posted + minLiveDays * 24 * 60 * 60 * 1000;
}
