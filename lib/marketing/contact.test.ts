import { describe, expect, it } from "vitest";
import { CONTACT_INTENTS, mailtoUrl, whatsappUrl } from "@/lib/marketing/contact";

describe("whatsappUrl", () => {
  it("builds a wa.me link with the prefilled message", () => {
    const url = whatsappUrl("6281234567890", "client");

    expect(url).toBe(
      `https://wa.me/6281234567890?text=${encodeURIComponent(CONTACT_INTENTS.client.message)}`,
    );
  });

  it("strips separators a human would type", () => {
    expect(whatsappUrl("+62 812-3456-7890", "creator")).toContain("https://wa.me/6281234567890?");
  });

  it("uses a different opener per intent", () => {
    expect(whatsappUrl("6281234567890", "client")).not.toBe(
      whatsappUrl("6281234567890", "creator"),
    );
  });

  it("returns null when the number is missing or too short to be real", () => {
    expect(whatsappUrl(undefined, "client")).toBeNull();
    expect(whatsappUrl("", "client")).toBeNull();
    expect(whatsappUrl("62812", "client")).toBeNull();
  });
});

describe("mailtoUrl", () => {
  it("builds a mailto link with an encoded subject", () => {
    expect(mailtoUrl("tim@contoh.id", "creator")).toBe(
      `mailto:tim@contoh.id?subject=${encodeURIComponent(CONTACT_INTENTS.creator.subject)}`,
    );
  });

  it("returns null when the address is missing", () => {
    expect(mailtoUrl(undefined, "client")).toBeNull();
  });
});
