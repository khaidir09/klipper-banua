import { describe, expect, it } from "vitest";
import { clientPortalAccessSchema, inviteClientPortalSchema } from "@/lib/validation/clients";

const contactId = "de300000-0000-4000-8000-0000000000b1";

describe("inviteClientPortalSchema (FR-M14-01)", () => {
  it("lowercases the email address", () => {
    const parsed = inviteClientPortalSchema.safeParse({
      contact_id: contactId,
      email: "Siti@Kampus.AC.ID",
    });
    expect(parsed.success && parsed.data.email).toBe("siti@kampus.ac.id");
  });

  it("needs a valid contact and email", () => {
    expect(
      inviteClientPortalSchema.safeParse({ contact_id: contactId, email: "bukan-email" }).success,
    ).toBe(false);
    expect(
      inviteClientPortalSchema.safeParse({ contact_id: "x", email: "siti@kampus.ac.id" }).success,
    ).toBe(false);
  });
});

describe("clientPortalAccessSchema (FR-M14-01)", () => {
  it("only accepts a boolean switch", () => {
    expect(
      clientPortalAccessSchema.safeParse({ contact_id: contactId, is_active: false }).success,
    ).toBe(true);
    expect(
      clientPortalAccessSchema.safeParse({ contact_id: contactId, is_active: "ya" }).success,
    ).toBe(false);
  });
});
