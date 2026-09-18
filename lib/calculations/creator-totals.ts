import type { PayoutStatus } from "@/lib/constants/finance";

/**
 * FR-M3-08: lifetime totals on the creator page. "Honor diterima" counts only
 * payouts that were actually paid (`dibayar`), not drafts or approvals.
 */
export function creatorTotals(
  assignments: {
    views: number;
    registrants: number;
    payout: { status: PayoutStatus; total_amount: number } | null;
  }[],
) {
  return {
    views: assignments.reduce((sum, a) => sum + a.views, 0),
    registrants: assignments.reduce((sum, a) => sum + a.registrants, 0),
    feesReceived: assignments.reduce(
      (sum, a) => sum + (a.payout?.status === "dibayar" ? a.payout.total_amount : 0),
      0,
    ),
  };
}
