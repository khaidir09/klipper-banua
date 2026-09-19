import { describe, expect, it } from "vitest";
import { createShareLinkSchema, revokeShareLinkSchema } from "./share-links";

const campaign_id = "de300000-0000-4000-8000-0000000000c1";

describe("createShareLinkSchema", () => {
  it("treats a missing or empty expiry as no expiry", () => {
    expect(createShareLinkSchema.parse({ campaign_id }).expires_on).toBeNull();
    expect(createShareLinkSchema.parse({ campaign_id, expires_on: "" }).expires_on).toBeNull();
    expect(createShareLinkSchema.parse({ campaign_id, expires_on: null }).expires_on).toBeNull();
  });

  it("keeps a calendar date and parses its own output again", () => {
    const parsed = createShareLinkSchema.parse({ campaign_id, expires_on: " 2026-12-31 " });
    expect(parsed.expires_on).toBe("2026-12-31");
    expect(createShareLinkSchema.parse(parsed)).toEqual(parsed);
  });

  it("rejects malformed dates and ids", () => {
    expect(createShareLinkSchema.safeParse({ campaign_id, expires_on: "31/12/2026" }).success).toBe(
      false,
    );
    expect(createShareLinkSchema.safeParse({ campaign_id, expires_on: "2026-02-30" }).success).toBe(
      false,
    );
    expect(createShareLinkSchema.safeParse({ campaign_id: "x" }).success).toBe(false);
  });
});

describe("revokeShareLinkSchema", () => {
  it("needs both ids", () => {
    expect(revokeShareLinkSchema.safeParse({ campaign_id }).success).toBe(false);
    expect(revokeShareLinkSchema.safeParse({ campaign_id, link_id: campaign_id }).success).toBe(
      true,
    );
  });
});
