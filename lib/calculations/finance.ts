/**
 * Campaign finance metrics (PRD 8.4, FR-M8-06) and client payment status
 * (FR-M8-05). Amounts are whole Rupiah; divisions use bigint so they stay
 * exact and round down.
 */

export type ClientPaymentStatus = "belum_dibayar" | "sebagian" | "lunas";

/** Mirrors the `client_payments` trigger. */
export function clientPaymentStatus(amount: number, paidAmount: number): ClientPaymentStatus {
  if (paidAmount <= 0) return "belum_dibayar";
  return paidAmount >= amount ? "lunas" : "sebagian";
}

/** floor(numerator / denominator) on whole numbers; null when dividing by zero. */
function floorDiv(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Number(BigInt(numerator) / BigInt(denominator));
}

export type CampaignFinance = {
  packagePrice: number;
  clientPaid: number;
  clientOutstanding: number;
  totalPayouts: number;
  grossMargin: number;
  /** null when the package price is 0. */
  grossMarginPct: number | null;
  /** Cost per 1.000 views; null (shown as "–") when there are no views. */
  cpm: number | null;
  /** null (shown as "–") when there are no registrants. */
  costPerRegistrant: number | null;
};

export function campaignFinance(input: {
  packagePrice: number;
  clientPayments: { paid_amount: number }[];
  payouts: { total_amount: number }[];
  totalViews: number;
  totalRegistrants: number;
}): CampaignFinance {
  const clientPaid = input.clientPayments.reduce((sum, p) => sum + p.paid_amount, 0);
  const totalPayouts = input.payouts.reduce((sum, p) => sum + p.total_amount, 0);
  const grossMargin = input.packagePrice - totalPayouts;

  return {
    packagePrice: input.packagePrice,
    clientPaid,
    clientOutstanding: Math.max(0, input.packagePrice - clientPaid),
    totalPayouts,
    grossMargin,
    grossMarginPct: input.packagePrice > 0 ? (grossMargin / input.packagePrice) * 100 : null,
    cpm: input.totalViews > 0 ? floorDiv(input.packagePrice * 1000, input.totalViews) : null,
    costPerRegistrant: floorDiv(input.packagePrice, input.totalRegistrants),
  };
}
