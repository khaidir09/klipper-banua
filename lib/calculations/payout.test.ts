import { describe, expect, it } from "vitest";
import { effectiveFeeScheme } from "@/lib/calculations/fee-scheme";
import { campaignFinance, clientPaymentStatus } from "@/lib/calculations/finance";
import {
  calculatePayout,
  contentEligibility,
  payoutTotal,
  type PayoutContentInput,
  type PayoutInput,
} from "@/lib/calculations/payout";

const campaign = {
  default_base_fee: 250_000,
  default_bonus_per_1000_views: 5_000,
  default_bonus_per_registrant: 25_000,
  default_views_bonus_cap: null as number | null,
};

const noOverrides = {
  base_fee: null,
  bonus_per_1000_views: null,
  bonus_per_registrant: null,
  views_bonus_cap: null,
};

let seq = 0;
function live(views: number, overrides: Partial<PayoutContentInput> = {}): PayoutContentInput {
  seq += 1;
  return {
    id: `c${seq}`,
    review_status: "disetujui",
    posted_url: `https://tiktok.com/@x/${seq}`,
    posted_at: `2026-10-0${Math.min(seq, 9)}T02:00:00Z`,
    live_status: "tayang",
    removed_at: null,
    views,
    ...overrides,
  };
}

function input(overrides: Partial<PayoutInput> = {}): PayoutInput {
  return {
    scheme: effectiveFeeScheme(noOverrides, campaign),
    contentsCommitted: 2,
    minLiveDays: 30,
    contents: [live(12_400), live(8_750)],
    registrantCount: 3,
    adjustmentAmount: 0,
    ...overrides,
  };
}

describe("calculatePayout — PRD 8.3 formula", () => {
  it("computes base, views bonus, registrant bonus and total", () => {
    const result = calculatePayout(input());
    expect(result.validContents).toBe(2);
    expect(result.baseAmount).toBe(500_000);
    expect(result.totalViews).toBe(21_150);
    // floor(21_150 / 1000) = 21 → 21 × 5.000
    expect(result.viewsBonus).toBe(105_000);
    expect(result.registrantBonus).toBe(75_000);
    expect(result.totalAmount).toBe(680_000);
  });

  it("rounds the views bonus down to whole thousands of views", () => {
    const result = calculatePayout(input({ contents: [live(999), live(1_999)] }));
    // 2.998 views → floor(2,998) = 2
    expect(result.viewsBonus).toBe(10_000);
  });
});

describe("override vs default (PRD 8.1)", () => {
  it("uses the assignment override instead of the campaign default", () => {
    const scheme = effectiveFeeScheme(
      { ...noOverrides, base_fee: 400_000, bonus_per_registrant: 0 },
      campaign,
    );
    const result = calculatePayout(input({ scheme }));
    expect(result.baseAmount).toBe(800_000);
    expect(result.registrantBonus).toBe(0);
    // Views rate still comes from the campaign default.
    expect(result.viewsBonus).toBe(105_000);
  });
});

describe("views bonus cap", () => {
  it("caps the views bonus", () => {
    const scheme = effectiveFeeScheme(noOverrides, {
      ...campaign,
      default_views_bonus_cap: 50_000,
    });
    const result = calculatePayout(input({ scheme }));
    expect(result.viewsBonusRaw).toBe(105_000);
    expect(result.viewsBonus).toBe(50_000);
  });

  it("does not cap when the cap is null, and a zero cap pays no views bonus", () => {
    expect(calculatePayout(input()).viewsBonus).toBe(105_000);
    const zeroCap = effectiveFeeScheme({ ...noOverrides, views_bonus_cap: 0 }, campaign);
    expect(calculatePayout(input({ scheme: zeroCap })).viewsBonus).toBe(0);
  });

  it("leaves a cap above the earned bonus untouched", () => {
    const scheme = effectiveFeeScheme(noOverrides, {
      ...campaign,
      default_views_bonus_cap: 1_000_000,
    });
    expect(calculatePayout(input({ scheme })).viewsBonus).toBe(105_000);
  });
});

describe("content removed before/after min_live_days (PRD 8.2)", () => {
  const posted = "2026-10-01T02:00:00Z";

  it("excludes content removed before the minimum", () => {
    const early = live(50_000, {
      posted_at: posted,
      live_status: "dihapus",
      removed_at: "2026-10-20T02:00:00Z",
    });
    expect(contentEligibility(early, 30)).toEqual({ eligible: false, reason: "removed_early" });
    const result = calculatePayout(input({ contents: [live(1_000), early] }));
    expect(result.eligibleContents).toBe(1);
    expect(result.baseAmount).toBe(250_000);
    // Its 50.000 views do not count either.
    expect(result.totalViews).toBe(1_000);
  });

  it("includes content removed on or after the minimum", () => {
    const exactly = live(50_000, {
      posted_at: posted,
      live_status: "dihapus",
      removed_at: "2026-10-31T02:00:00Z",
    });
    expect(contentEligibility(exactly, 30)).toEqual({ eligible: true });
    const result = calculatePayout(input({ contents: [live(1_000), exactly] }));
    expect(result.eligibleContents).toBe(2);
    expect(result.totalViews).toBe(51_000);
  });
});

describe("other eligibility rules (PRD 8.2)", () => {
  it("excludes unapproved and unposted content", () => {
    expect(contentEligibility(live(10, { review_status: "revisi" }), 30)).toEqual({
      eligible: false,
      reason: "not_approved",
    });
    expect(
      contentEligibility(
        live(10, { posted_url: null, posted_at: null, live_status: "belum_tayang" }),
        30,
      ),
    ).toEqual({ eligible: false, reason: "not_posted" });
  });
});

describe("content beyond contents_committed", () => {
  it("pays the base fee only up to the committed count, earliest first", () => {
    const contents = [
      live(1_000, { id: "late", posted_at: "2026-10-09T02:00:00Z" }),
      live(1_000, { id: "early", posted_at: "2026-10-01T02:00:00Z" }),
      live(1_000, { id: "middle", posted_at: "2026-10-05T02:00:00Z" }),
    ];
    const result = calculatePayout(input({ contentsCommitted: 2, contents }));
    expect(result.eligibleContents).toBe(3);
    expect(result.validContents).toBe(2);
    expect(result.baseAmount).toBe(500_000);
    expect(result.contents.filter((c) => c.countsForBaseFee).map((c) => c.id)).toEqual([
      "early",
      "middle",
    ]);
    // Views of the extra content still count toward the views bonus.
    expect(result.totalViews).toBe(3_000);
  });

  it("pays no base fee when nothing was committed", () => {
    expect(calculatePayout(input({ contentsCommitted: 0 })).baseAmount).toBe(0);
  });
});

describe("adjustments (FR-M8-02)", () => {
  it("applies a negative adjustment", () => {
    expect(calculatePayout(input({ adjustmentAmount: -80_000 })).totalAmount).toBe(600_000);
  });

  it("applies a positive adjustment", () => {
    expect(calculatePayout(input({ adjustmentAmount: 20_000 })).totalAmount).toBe(700_000);
  });

  it("never lets the total go below zero", () => {
    expect(calculatePayout(input({ adjustmentAmount: -5_000_000 })).totalAmount).toBe(0);
  });

  it("rejects fractional money", () => {
    expect(() => calculatePayout(input({ adjustmentAmount: 10.5 }))).toThrow(RangeError);
  });
});

describe("campaignFinance (PRD 8.4) and division by zero", () => {
  const base = {
    packagePrice: 15_000_000,
    clientPayments: [{ paid_amount: 7_500_000 }, { paid_amount: 2_500_000 }],
    payouts: [{ total_amount: 680_000 }, { total_amount: 1_320_000 }],
    totalViews: 200_000,
    totalRegistrants: 50,
  };

  it("computes margin, CPM and cost per registrant", () => {
    const finance = campaignFinance(base);
    expect(finance.clientPaid).toBe(10_000_000);
    expect(finance.clientOutstanding).toBe(5_000_000);
    expect(finance.totalPayouts).toBe(2_000_000);
    expect(finance.grossMargin).toBe(13_000_000);
    expect(finance.grossMarginPct).toBeCloseTo(86.667, 2);
    // 15.000.000 / 200.000 × 1000
    expect(finance.cpm).toBe(75_000);
    expect(finance.costPerRegistrant).toBe(300_000);
  });

  it("rounds CPM and cost per registrant down to whole Rupiah", () => {
    const finance = campaignFinance({ ...base, totalViews: 3, totalRegistrants: 7 });
    expect(finance.cpm).toBe(5_000_000_000);
    expect(finance.costPerRegistrant).toBe(2_142_857);
  });

  it("returns null instead of dividing by zero", () => {
    const finance = campaignFinance({
      ...base,
      totalViews: 0,
      totalRegistrants: 0,
      packagePrice: 0,
    });
    expect(finance.cpm).toBeNull();
    expect(finance.costPerRegistrant).toBeNull();
    expect(finance.grossMarginPct).toBeNull();
  });

  it("allows a negative margin when payouts exceed the package", () => {
    const finance = campaignFinance({ ...base, payouts: [{ total_amount: 16_000_000 }] });
    expect(finance.grossMargin).toBe(-1_000_000);
  });
});

describe("clientPaymentStatus (FR-M8-05)", () => {
  it("derives the status from the paid amount", () => {
    expect(clientPaymentStatus(10_000_000, 0)).toBe("belum_dibayar");
    expect(clientPaymentStatus(10_000_000, 4_000_000)).toBe("sebagian");
    expect(clientPaymentStatus(10_000_000, 10_000_000)).toBe("lunas");
    expect(clientPaymentStatus(10_000_000, 12_000_000)).toBe("lunas");
  });
});

describe("payoutTotal", () => {
  it("adds the components and clamps at zero", () => {
    expect(
      payoutTotal({
        baseAmount: 500_000,
        viewsBonus: 105_000,
        registrantBonus: 75_000,
        adjustmentAmount: -80_000,
      }),
    ).toBe(600_000);
    expect(
      payoutTotal({ baseAmount: 0, viewsBonus: 0, registrantBonus: 0, adjustmentAmount: -1 }),
    ).toBe(0);
  });
});
