import { describe, expect, it } from "vitest";
import { fraudFlags, type FraudFlagInput } from "./fraud-flags";

const base: FraudFlagInput = {
  claim: { views: 10_000, likes: 500, comments: 40, shares: 10 },
  previousViews: null,
  postedAt: "2026-10-02T10:00:00Z",
  joinedAt: "2026-10-01T10:00:00Z",
};

const codes = (input: FraudFlagInput) => fraudFlags(input).map((flag) => flag.code);

describe("fraud flags (FR-M18-07)", () => {
  it("raises nothing for an ordinary clip", () => {
    expect(codes(base)).toEqual([]);
  });

  it("flags a spike between submissions", () => {
    expect(
      codes({ ...base, previousViews: 5_000, claim: { ...base.claim, views: 30_000 } }),
    ).toContain("views_spike");
  });

  it("ignores a large ratio on small numbers", () => {
    expect(
      codes({ ...base, previousViews: 100, claim: { ...base.claim, views: 2_000 } }),
    ).not.toContain("views_spike");
  });

  it("flags views that went down", () => {
    expect(codes({ ...base, previousViews: 12_000 })).toContain("views_decreased");
  });

  it("flags low engagement once the clip has enough views", () => {
    expect(
      codes({ ...base, claim: { views: 50_000, likes: 100, comments: 0, shares: 0 } }),
    ).toContain("low_engagement");
    expect(
      codes({ ...base, claim: { views: 4_000, likes: 0, comments: 0, shares: 0 } }),
    ).not.toContain("low_engagement");
  });

  it("flags a clip posted right after joining", () => {
    expect(codes({ ...base, postedAt: "2026-10-01T10:10:00Z" })).toContain(
      "posted_soon_after_join",
    );
    expect(codes({ ...base, joinedAt: null })).not.toContain("posted_soon_after_join");
  });

  it("explains each flag", () => {
    const [flag] = fraudFlags({ ...base, previousViews: 12_000 });
    expect(flag?.message).toMatch(/12\.000/);
  });
});
