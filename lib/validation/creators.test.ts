import { describe, expect, it } from "vitest";
import {
  UNDERAGE_MESSAGE,
  bankAccountSchema,
  creatorSchema,
  invitePortalSchema,
  isAdult,
  portalAccessSchema,
  socialAccountSchema,
  verificationBlockers,
} from "@/lib/validation/creators";
import { formatWhatsapp, normalizeWhatsapp } from "@/lib/validation/phone";

const today = new Date("2026-09-18T00:00:00Z");

describe("isAdult", () => {
  it("accepts someone who turns 18 today", () => {
    expect(isAdult(new Date("2008-09-18T00:00:00Z"), today)).toBe(true);
  });

  it("rejects someone who turns 18 tomorrow", () => {
    expect(isAdult(new Date("2008-09-19T00:00:00Z"), today)).toBe(false);
  });

  it("accepts older creators", () => {
    expect(isAdult(new Date("1990-01-01T00:00:00Z"), today)).toBe(true);
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

  it("rejects creators under 18 with a clear message", () => {
    const result = creatorSchema.safeParse({ ...valid, birth_date: "2015-01-01" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.map((issue) => issue.message)).toContain(UNDERAGE_MESSAGE);
    }
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
