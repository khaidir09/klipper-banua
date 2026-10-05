import { describe, expect, it } from "vitest";
import { clipEarning, removedBeforeMinLive, type ClipEarningInput } from "./clip-earning";

const base: ClipEarningInput = {
  verifiedViews: 23_450,
  ratePer1000Views: 10_000,
  minViewsToEarn: 0,
  maxPayoutPerClip: null,
  maxPayoutPerCreator: null,
  alreadyCreditedForClip: 0,
  creatorEarnedInCampaign: 0,
  creatorBudget: 5_000_000,
  campaignCost: 0,
};

describe("clip earning (PRD 8.6)", () => {
  it("pays the rate per 1,000 verified views (PRD example)", () => {
    const result = clipEarning(base);
    expect(result.clipEarning).toBe(234_500);
    expect(result.credit).toBe(234_500);
    expect(result.limitedBy).toBeNull();
  });

  it("only credits the difference on a views update (PRD example)", () => {
    const result = clipEarning({
      ...base,
      verifiedViews: 41_000,
      alreadyCreditedForClip: 234_500,
      creatorEarnedInCampaign: 234_500,
      campaignCost: 234_500,
    });
    expect(result.clipEarning).toBe(410_000);
    expect(result.delta).toBe(175_500);
    expect(result.credit).toBe(175_500);
  });

  it("pays nothing below min_views_to_earn", () => {
    const result = clipEarning({ ...base, verifiedViews: 999, minViewsToEarn: 1_000 });
    expect(result.eligibleViews).toBe(0);
    expect(result.credit).toBe(0);
    expect(clipEarning({ ...base, verifiedViews: 1_000, minViewsToEarn: 1_000 }).credit).toBe(
      10_000,
    );
  });

  it("caps one clip at max_payout_per_clip", () => {
    const result = clipEarning({ ...base, maxPayoutPerClip: 200_000 });
    expect(result.clipEarning).toBe(200_000);
    expect(result.credit).toBe(200_000);
    // Not a campaign limit: the clip simply earns no more.
    expect(result.limitedBy).toBeNull();
  });

  it("stops at the per-kliper cap", () => {
    const result = clipEarning({
      ...base,
      maxPayoutPerCreator: 300_000,
      creatorEarnedInCampaign: 150_000,
      campaignCost: 150_000,
    });
    expect(result.creatorRoom).toBe(150_000);
    expect(result.credit).toBe(150_000);
    expect(result.limitedBy).toBe("kliper");
  });

  it("stops at the remaining budget", () => {
    const result = clipEarning({ ...base, creatorBudget: 400_000, campaignCost: 234_500 });
    expect(result.budgetRoom).toBe(165_500);
    expect(result.credit).toBe(165_500);
    expect(result.limitedBy).toBe("anggaran");
  });

  it("names the budget when it is the tighter limit", () => {
    const result = clipEarning({
      ...base,
      maxPayoutPerCreator: 300_000,
      creatorBudget: 100_000,
    });
    expect(result.credit).toBe(100_000);
    expect(result.limitedBy).toBe("anggaran");
  });

  it("never takes money back when views go down", () => {
    const result = clipEarning({
      ...base,
      verifiedViews: 20_000,
      alreadyCreditedForClip: 234_500,
    });
    expect(result.clipEarning).toBe(200_000);
    expect(result.delta).toBe(0);
    expect(result.credit).toBe(0);
    expect(result.limitedBy).toBeNull();
  });

  it("rounds down to whole Rupiah", () => {
    expect(clipEarning({ ...base, verifiedViews: 1_234, ratePer1000Views: 7_500 }).credit).toBe(
      9_255,
    );
    expect(clipEarning({ ...base, verifiedViews: 1, ratePer1000Views: 999 }).credit).toBe(0);
  });

  it("credits zero when the budget is used up", () => {
    const result = clipEarning({ ...base, creatorBudget: 400_000, campaignCost: 400_000 });
    expect(result.credit).toBe(0);
    expect(result.limitedBy).toBe("anggaran");
  });

  it("credits zero when there are no views", () => {
    const result = clipEarning({ ...base, verifiedViews: 0 });
    expect(result.credit).toBe(0);
    expect(result.limitedBy).toBeNull();
  });

  it("does not over-credit when a cancellation brought the clip back to zero", () => {
    // Earlier credit 234.500 was cancelled (net 0), then the clip earns again.
    const result = clipEarning({ ...base, alreadyCreditedForClip: 0 });
    expect(result.credit).toBe(234_500);
  });
});

describe("removedBeforeMinLive (FR-M18-06)", () => {
  const posted = "2026-10-01T10:00:00Z";

  it("is true inside the minimum live days", () => {
    expect(removedBeforeMinLive(posted, "2026-10-07T09:59:59Z", 6)).toBe(true);
  });

  it("is false from the moment the minimum is reached", () => {
    expect(removedBeforeMinLive(posted, "2026-10-07T10:00:00Z", 6)).toBe(false);
  });
});
