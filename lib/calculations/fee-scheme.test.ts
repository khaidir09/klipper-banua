import { describe, expect, it } from "vitest";
import { effectiveFeeScheme } from "@/lib/calculations/fee-scheme";

const campaign = {
  default_base_fee: 250_000,
  default_bonus_per_1000_views: 5_000,
  default_bonus_per_registrant: 25_000,
  default_views_bonus_cap: 500_000,
};

const noOverrides = {
  base_fee: null,
  bonus_per_1000_views: null,
  bonus_per_registrant: null,
  views_bonus_cap: null,
};

describe("effectiveFeeScheme (PRD 8.1)", () => {
  it("uses the campaign defaults when nothing is overridden", () => {
    const scheme = effectiveFeeScheme(noOverrides, campaign);
    expect(scheme).toMatchObject({
      baseFee: 250_000,
      bonusPer1000Views: 5_000,
      bonusPerRegistrant: 25_000,
      viewsBonusCap: 500_000,
    });
    expect(Object.values(scheme.overridden).every((v) => !v)).toBe(true);
  });

  it("prefers the assignment override, including an explicit zero", () => {
    const scheme = effectiveFeeScheme(
      { ...noOverrides, base_fee: 400_000, bonus_per_registrant: 0 },
      campaign,
    );
    expect(scheme.baseFee).toBe(400_000);
    expect(scheme.bonusPerRegistrant).toBe(0);
    expect(scheme.bonusPer1000Views).toBe(5_000);
    expect(scheme.overridden).toEqual({
      baseFee: true,
      bonusPer1000Views: false,
      bonusPerRegistrant: true,
      viewsBonusCap: false,
    });
  });

  it("keeps an uncapped views bonus as null", () => {
    expect(
      effectiveFeeScheme(noOverrides, { ...campaign, default_views_bonus_cap: null }).viewsBonusCap,
    ).toBeNull();
  });
});
