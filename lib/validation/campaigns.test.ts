import { describe, expect, it } from "vitest";
import {
  assignmentCreateSchema,
  campaignSchema,
  hashtagsField,
  linesField,
} from "@/lib/validation/campaigns";
import { parseRupiah } from "@/lib/validation/money";

const validCampaign = {
  client_id: "3f6f2a57-6f5d-4f0f-9d8a-2a8a2f0b8c11",
  code: "pmb ubs 2026-01",
  name: "PMB 2026 Gelombang 1",
  objective: "pendaftar",
  brief: "Ceritakan pengalaman kuliah.",
  must_do: "- Sebut beasiswa\n\n• Tunjukkan kampus",
  must_not: "Menyebut kampus lain",
  hashtags: "#PMBUBS, KuliahDiBanua #PMBUBS",
  paid_label_required: true,
  landing_url: "https://pmb.ubs.ac.id/daftar",
  start_date: "2026-10-01",
  end_date: "2026-10-31",
  min_live_days: "30",
  package_price: "Rp 15.000.000",
  target_contents: "20",
  target_views: "200.000",
  target_registrants: "50",
  default_base_fee: "250.000",
  default_bonus_per_1000_views: "5.000",
  default_bonus_per_registrant: "25.000",
  default_views_bonus_cap: "",
  access: "terbuka",
  rate_per_1000_views: "10.000",
  creator_budget: "5.000.000",
  max_payout_per_clip: "",
  max_payout_per_creator: "1.000.000",
  min_views_to_earn: "1.000",
  max_clips_per_creator: "3",
  allowed_platforms: ["youtube", "tiktok", "tiktok"],
  local_only: false,
  claim_grace_days: "3",
};

describe("parseRupiah", () => {
  it("reads Indonesian-formatted whole amounts", () => {
    expect(parseRupiah("1.500.000")).toBe(1_500_000);
    expect(parseRupiah("Rp 250.000")).toBe(250_000);
    expect(parseRupiah("  7500 ")).toBe(7500);
    expect(parseRupiah(42)).toBe(42);
  });

  it("rejects decimals, negatives and garbage", () => {
    expect(parseRupiah("1.500,50")).toBeNull();
    expect(parseRupiah("-500")).toBeNull();
    expect(parseRupiah(12.5)).toBeNull();
    expect(parseRupiah("abc")).toBeNull();
    expect(parseRupiah("")).toBeNull();
  });
});

describe("campaignSchema", () => {
  it("normalises the code, lists, hashtags and money", () => {
    const result = campaignSchema.parse(validCampaign);
    expect(result.code).toBe("PMB-UBS-2026-01");
    expect(result.must_do).toEqual(["Sebut beasiswa", "Tunjukkan kampus"]);
    expect(result.hashtags).toEqual(["#PMBUBS", "#KuliahDiBanua"]);
    expect(result.package_price).toBe(15_000_000);
    expect(result.target_views).toBe(200_000);
    expect(result.default_views_bonus_cap).toBeNull();
  });

  it("rejects an end date before the start date", () => {
    const result = campaignSchema.safeParse({ ...validCampaign, end_date: "2026-09-01" });
    expect(result.success).toBe(false);
  });

  it("rejects non-http landing URLs but allows an empty one on drafts", () => {
    expect(
      campaignSchema.safeParse({ ...validCampaign, landing_url: "ftp://x.test" }).success,
    ).toBe(false);
    expect(campaignSchema.parse({ ...validCampaign, landing_url: "" }).landing_url).toBeNull();
  });

  it("rejects fractional money", () => {
    expect(
      campaignSchema.safeParse({ ...validCampaign, package_price: "1.500.000,50" }).success,
    ).toBe(false);
  });
});

describe("campaignSchema per_views fields (FR-M17-01)", () => {
  it("parses rates, caps and platforms", () => {
    const result = campaignSchema.parse(validCampaign);
    expect(result.rate_per_1000_views).toBe(10_000);
    expect(result.creator_budget).toBe(5_000_000);
    expect(result.max_payout_per_clip).toBeNull();
    expect(result.max_payout_per_creator).toBe(1_000_000);
    expect(result.min_views_to_earn).toBe(1_000);
    // Deduplicated and in the enum's order.
    expect(result.allowed_platforms).toEqual(["tiktok", "youtube"]);
  });

  it("refuses a zero cap and an out-of-range clip limit", () => {
    expect(campaignSchema.safeParse({ ...validCampaign, max_payout_per_clip: "0" }).success).toBe(
      false,
    );
    expect(campaignSchema.safeParse({ ...validCampaign, max_clips_per_creator: "0" }).success).toBe(
      false,
    );
    expect(
      campaignSchema.safeParse({ ...validCampaign, max_clips_per_creator: "51" }).success,
    ).toBe(false);
    expect(campaignSchema.safeParse({ ...validCampaign, claim_grace_days: "61" }).success).toBe(
      false,
    );
  });

  it("accepts an unfinished draft", () => {
    const result = campaignSchema.parse({
      ...validCampaign,
      rate_per_1000_views: "",
      creator_budget: "",
      allowed_platforms: [],
    });
    expect(result.rate_per_1000_views).toBe(0);
    expect(result.allowed_platforms).toEqual([]);
  });
});

describe("list fields", () => {
  it("drops bullets and blank lines", () => {
    expect(linesField.parse("* satu\n\n  - dua  \n")).toEqual(["satu", "dua"]);
  });

  it("deduplicates hashtags and rejects punctuation", () => {
    expect(hashtagsField.parse("a #a b")).toEqual(["#a", "#b"]);
    expect(hashtagsField.safeParse("#halo-dunia").success).toBe(false);
  });
});

describe("assignmentCreateSchema", () => {
  const base = {
    creator_id: "3f6f2a57-6f5d-4f0f-9d8a-2a8a2f0b8c11",
    status: "diundang",
    contents_committed: "2",
    base_fee: "",
    bonus_per_1000_views: "",
    bonus_per_registrant: "30.000",
    views_bonus_cap: "",
    referral_code: "",
    tracking_slug: "",
  };

  it("keeps empty overrides as null so the campaign default applies", () => {
    const result = assignmentCreateSchema.parse(base);
    expect(result.base_fee).toBeNull();
    expect(result.bonus_per_registrant).toBe(30_000);
    expect(result.referral_code).toBeNull();
    expect(result.tracking_slug).toBeNull();
  });

  it("normalises a manual code and rejects ambiguous characters", () => {
    expect(assignmentCreateSchema.parse({ ...base, referral_code: "kmps-26" }).referral_code).toBe(
      "KMPS26",
    );
    expect(assignmentCreateSchema.safeParse({ ...base, referral_code: "KMPO01" }).success).toBe(
      false,
    );
  });

  it("validates a manual slug", () => {
    expect(assignmentCreateSchema.parse({ ...base, tracking_slug: "Siti-PMB" }).tracking_slug).toBe(
      "siti-pmb",
    );
    expect(assignmentCreateSchema.safeParse({ ...base, tracking_slug: "../x" }).success).toBe(
      false,
    );
  });
});
