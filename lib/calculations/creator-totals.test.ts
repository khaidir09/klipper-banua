import { describe, expect, it } from "vitest";
import { creatorTotals } from "@/lib/calculations/creator-totals";

describe("creatorTotals (FR-M3-08)", () => {
  it("sums views and registrants, and counts only paid fees as received", () => {
    expect(
      creatorTotals([
        { views: 12_000, registrants: 4, payout: { status: "dibayar", total_amount: 680_000 } },
        { views: 3_000, registrants: 1, payout: { status: "disetujui", total_amount: 250_000 } },
        { views: 0, registrants: 0, payout: null },
      ]),
    ).toEqual({ views: 15_000, registrants: 5, feesReceived: 680_000 });
  });

  it("is zero for a creator without assignments", () => {
    expect(creatorTotals([])).toEqual({ views: 0, registrants: 0, feesReceived: 0 });
  });
});
