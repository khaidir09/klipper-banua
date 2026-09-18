import { describe, expect, it } from "vitest";
import {
  REFERRAL_ALPHABET,
  generateReferralCode,
  generateTrackingSlug,
  isValidReferralCode,
  isValidTrackingSlug,
  normalizeReferralCode,
  slugify,
  type RandomInts,
} from "@/lib/referral/generate";

/** Deterministic source that walks through the alphabet. */
const sequence: RandomInts = (count, max) => Array.from({ length: count }, (_, i) => i % max);

describe("generateReferralCode", () => {
  it("produces 6 characters by default", () => {
    expect(generateReferralCode()).toHaveLength(6);
  });

  it("supports 6 to 8 characters and rejects other lengths", () => {
    expect(generateReferralCode(8)).toHaveLength(8);
    expect(() => generateReferralCode(5)).toThrow(RangeError);
    expect(() => generateReferralCode(9)).toThrow(RangeError);
  });

  it("never uses look-alike characters", () => {
    expect(REFERRAL_ALPHABET).not.toMatch(/[IO01]/);
    for (let i = 0; i < 500; i++) {
      const code = generateReferralCode(8);
      expect(code).not.toMatch(/[IO01]/);
      expect(isValidReferralCode(code)).toBe(true);
    }
  });

  it("is deterministic with an injected random source", () => {
    expect(generateReferralCode(6, sequence)).toBe("ABCDEF");
  });

  it("rarely collides across many draws", () => {
    const codes = new Set(Array.from({ length: 2000 }, () => generateReferralCode()));
    // 32^6 ≈ 1e9 combinations; 2000 draws should essentially never repeat.
    expect(codes.size).toBeGreaterThan(1995);
  });
});

describe("referral code validation", () => {
  it("normalises separators and case", () => {
    expect(normalizeReferralCode("ab-cd 23")).toBe("ABCD23");
  });

  it("rejects ambiguous characters and wrong lengths", () => {
    expect(isValidReferralCode("ABCDE0")).toBe(false);
    expect(isValidReferralCode("ABCDEI")).toBe(false);
    expect(isValidReferralCode("ABCDE")).toBe(false);
    expect(isValidReferralCode("ABCDEFGHJ")).toBe(false);
    expect(isValidReferralCode("KMPS26")).toBe(true);
  });
});

describe("slugify", () => {
  it("builds a lowercase ASCII slug", () => {
    expect(slugify("Siti Rahma Kuliner!")).toBe("siti-rahma-kuliner");
    expect(slugify("  Café  Banua ")).toBe("cafe-banua");
  });

  it("trims to the maximum length without a trailing dash", () => {
    expect(slugify("aaaaaaaaaaaaaaaaaaa bbbb", 20)).toBe("aaaaaaaaaaaaaaaaaaa");
  });
});

describe("generateTrackingSlug", () => {
  it("prefixes the stage name and adds a random suffix", () => {
    const slug = generateTrackingSlug("Siti Kuliner");
    expect(slug).toMatch(/^siti-kuliner-[a-z2-9]{4}$/);
    expect(isValidTrackingSlug(slug)).toBe(true);
  });

  it("is fully random without a usable stage name", () => {
    expect(generateTrackingSlug(null)).toMatch(/^[a-z2-9]{8}$/);
    expect(generateTrackingSlug("!!")).toMatch(/^[a-z2-9]{8}$/);
  });

  it("produces unique slugs for the same stage name", () => {
    const slugs = new Set(Array.from({ length: 200 }, () => generateTrackingSlug("banua")));
    expect(slugs.size).toBeGreaterThan(195);
  });
});

describe("isValidTrackingSlug", () => {
  it("accepts lowercase slugs and rejects unsafe ones", () => {
    expect(isValidTrackingSlug("siti-a2b3")).toBe(true);
    expect(isValidTrackingSlug("Siti")).toBe(false);
    expect(isValidTrackingSlug("-siti")).toBe(false);
    expect(isValidTrackingSlug("ab")).toBe(false);
    expect(isValidTrackingSlug("../etc")).toBe(false);
  });
});
