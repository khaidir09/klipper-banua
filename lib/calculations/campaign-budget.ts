/**
 * Klipper budget of a `per_views` campaign (PRD 8.4, FR-M17-06). Whole Rupiah
 * only. Mirrored in the database by `campaign_budget_exhausted()` and the
 * `budget_remaining_pct` column of `creator_portal_catalog`.
 */

export type CampaignBudgetInput = {
  /** `campaigns.creator_budget`. */
  creatorBudget: number;
  /** Honor already spent: Σ ledger `honor_klip` + `pembatalan` (PRD 8.4). */
  creatorCost: number;
  /** `campaigns.rate_per_1000_views`. */
  ratePer1000Views: number;
};

/** `budget_remaining = creator_budget − creator_cost`, never below zero. */
export function budgetRemaining({ creatorBudget, creatorCost }: CampaignBudgetInput): number {
  return Math.max(creatorBudget - creatorCost, 0);
}

/**
 * Share of the budget still available, 0–100, rounded down. The catalog shows
 * this instead of the amount (FR-M17-03).
 */
export function budgetRemainingPct(input: CampaignBudgetInput): number {
  if (input.creatorBudget <= 0) return 0;
  return Math.min(100, Math.floor((budgetRemaining(input) * 100) / input.creatorBudget));
}

/** `budget_used_pct = creator_cost / creator_budget × 100`, rounded down. */
export function budgetUsedPct({ creatorBudget, creatorCost }: CampaignBudgetInput): number {
  if (creatorBudget <= 0) return 0;
  return Math.floor((Math.max(creatorCost, 0) * 100) / creatorBudget);
}

/**
 * FR-M17-06: the rest cannot pay for another 1,000 views, so the campaign
 * takes no new klippers and no new clips.
 */
export function isBudgetExhausted(input: CampaignBudgetInput): boolean {
  return input.creatorBudget - input.creatorCost < input.ratePer1000Views;
}
