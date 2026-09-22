import { describe, expect, it } from "vitest";
import { CONTACT_MESSAGES, whatsappDisplay, whatsappUrl } from "@/lib/marketing/contact";

describe("whatsappUrl", () => {
  it("builds a wa.me link with the prefilled message", () => {
    const url = whatsappUrl("6282254866889", "client");

    expect(url).toBe(
      `https://wa.me/6282254866889?text=${encodeURIComponent(CONTACT_MESSAGES.client)}`,
    );
  });

  it("strips separators a human would type", () => {
    expect(whatsappUrl("+62 822-5486-6889", "creator")).toContain("https://wa.me/6282254866889?");
  });

  it("uses a different opener per intent", () => {
    expect(whatsappUrl("6282254866889", "client")).not.toBe(
      whatsappUrl("6282254866889", "creator"),
    );
  });

  it("returns null when the number is missing or too short to be real", () => {
    expect(whatsappUrl(undefined, "client")).toBeNull();
    expect(whatsappUrl("", "client")).toBeNull();
    expect(whatsappUrl("62822", "client")).toBeNull();
  });
});

describe("whatsappDisplay", () => {
  it("shows the number in international form", () => {
    expect(whatsappDisplay("+62 822-5486-6889")).toBe("+6282254866889");
  });

  it("returns null when the number is not configured", () => {
    expect(whatsappDisplay(undefined)).toBeNull();
    expect(whatsappDisplay("")).toBeNull();
  });
});
