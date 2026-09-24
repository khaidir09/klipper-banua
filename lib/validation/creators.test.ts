import { describe, expect, it } from "vitest";
import {
  bankAccountSchema,
  creatorSchema,
  invitePortalSchema,
  ownBirthDateSchema,
  portalAccessSchema,
  socialAccountSchema,
  verificationBlockers,
} from "@/lib/validation/creators";
import { formatWhatsapp, normalizeWhatsapp } from "@/lib/validation/phone";

describe("ownBirthDateSchema", () => {
  it("accepts any past date: age is not a requirement", () => {
    expect(ownBirthDateSchema.safeParse({ birth_date: "2015-01-01" }).success).toBe(true);
    expect(ownBirthDateSchema.safeParse({ birth_date: "1990-01-01" }).success).toBe(true);
  });

  it("requires a real date that is not in the future", () => {
    expect(ownBirthDateSchema.safeParse({ birth_date: "" }).success).toBe(false);
    expect(ownBirthDateSchema.safeParse({ birth_date: "1899-12-31" }).success).toBe(false);
    const nextYear = `${new Date().getUTCFullYear() + 1}-01-01`;
    expect(ownBirthDateSchema.safeParse({ birth_date: nextYear }).success).toBe(false);
  });
});

describe("creatorSchema", () => {
  const valid = {
    full_name: "Siti Rahma",
    stage_name: "sitirahma",
    phone_wa: "0812 3456 7890",
    email: "Siti@Example.com",
    city: "Banjarmasin",
    province: "Kalimantan Selatan",
    birth_date: "1999-05-20",
    niches: ["kuliner", "wisata"],
    tier: "mikro",
    status: "prospek",
    notes: "",
  };

  it("normalises phone and email", () => {
    const result = creatorSchema.parse(valid);
    expect(result.phone_wa).toBe("6281234567890");
    expect(result.email).toBe("siti@example.com");
  });

  it("accepts any age and an empty birth date", () => {
    expect(creatorSchema.parse({ ...valid, birth_date: "2015-01-01" }).birth_date).toBe(
      "2015-01-01",
    );
    expect(creatorSchema.parse({ ...valid, birth_date: "" }).birth_date).toBeNull();
  });

  it("rejects unknown niches and provinces", () => {
    expect(creatorSchema.safeParse({ ...valid, niches: ["memancing"] }).success).toBe(false);
    expect(creatorSchema.safeParse({ ...valid, province: "Mars" }).success).toBe(false);
  });
});

describe("socialAccountSchema", () => {
  it("strips the leading @ and coerces numbers", () => {
    const result = socialAccountSchema.parse({
      platform: "tiktok",
      handle: "@banuafood",
      profile_url: "",
      followers_count: "12000",
      kalimantan_audience_pct: "72.5",
      top_cities: "Banjarmasin, Banjarbaru",
      last_verified_at: "",
    });
    expect(result.handle).toBe("banuafood");
    expect(result.followers_count).toBe(12000);
    expect(result.kalimantan_audience_pct).toBe(72.5);
    expect(result.last_verified_at).toBeNull();
  });

  it("keeps the audience percentage inside 0–100", () => {
    const base = { platform: "instagram", handle: "x", followers_count: 0 };
    expect(socialAccountSchema.safeParse({ ...base, kalimantan_audience_pct: "120" }).success).toBe(
      false,
    );
    expect(
      socialAccountSchema.parse({ ...base, kalimantan_audience_pct: "" }).kalimantan_audience_pct,
    ).toBeNull();
  });
});

describe("bankAccountSchema", () => {
  it("strips spaces and dashes from the account number", () => {
    const result = bankAccountSchema.parse({
      bank_name: "Bank Kalsel",
      account_number: "1234-5678 90",
      account_holder: "Siti Rahma",
    });
    expect(result.account_number).toBe("1234567890");
  });

  it("rejects non-numeric account numbers", () => {
    expect(
      bankAccountSchema.safeParse({ bank_name: "BCA", account_number: "12AB", account_holder: "X" })
        .success,
    ).toBe(false);
  });
});

describe("verificationBlockers", () => {
  it("lists every missing prerequisite", () => {
    expect(verificationBlockers({ hasProofAccount: false, termsAgreedAt: null })).toHaveLength(2);
  });

  it("asks for the Kalimantan audience threshold once a proof exists (v4.0)", () => {
    expect(
      verificationBlockers({
        hasProofAccount: true,
        hasLocalAudience: false,
        termsAgreedAt: "2026-09-01T00:00:00Z",
      }),
    ).toEqual([expect.stringMatching(/audiens Kalimantan minimal 50%/)]);
  });

  it("is empty when both prerequisites are met", () => {
    expect(
      verificationBlockers({ hasProofAccount: true, termsAgreedAt: "2026-09-01T00:00:00Z" }),
    ).toEqual([]);
  });
});

describe("normalizeWhatsapp", () => {
  it("accepts the common Indonesian spellings", () => {
    expect(normalizeWhatsapp("0812-3456-7890")).toBe("6281234567890");
    expect(normalizeWhatsapp("+62 812 3456 7890")).toBe("6281234567890");
    expect(normalizeWhatsapp("6281234567890")).toBe("6281234567890");
    expect(normalizeWhatsapp("81234567890")).toBe("6281234567890");
  });

  it("rejects landlines and garbage", () => {
    expect(normalizeWhatsapp("0511-123456")).toBeNull();
    expect(normalizeWhatsapp("abc")).toBeNull();
    expect(normalizeWhatsapp("")).toBeNull();
  });

  it("formats for display", () => {
    expect(formatWhatsapp("6281234567890")).toBe("0812-3456-7890");
    expect(formatWhatsapp("")).toBe("");
  });
});

describe("invitePortalSchema", () => {
  const creatorId = "de300000-0000-4000-8000-0000000000a1";

  it("lowercases the email address", () => {
    const parsed = invitePortalSchema.safeParse({ creator_id: creatorId, email: "Rina@Contoh.ID" });
    expect(parsed.success && parsed.data.email).toBe("rina@contoh.id");
  });

  it("needs a valid creator and email", () => {
    expect(
      invitePortalSchema.safeParse({ creator_id: creatorId, email: "bukan-email" }).success,
    ).toBe(false);
    expect(invitePortalSchema.safeParse({ creator_id: "x", email: "rina@contoh.id" }).success).toBe(
      false,
    );
  });
});

describe("portalAccessSchema", () => {
  it("only accepts a boolean switch", () => {
    const creatorId = "de300000-0000-4000-8000-0000000000a1";
    expect(portalAccessSchema.safeParse({ creator_id: creatorId, is_active: false }).success).toBe(
      true,
    );
    expect(portalAccessSchema.safeParse({ creator_id: creatorId, is_active: "ya" }).success).toBe(
      false,
    );
  });
});
