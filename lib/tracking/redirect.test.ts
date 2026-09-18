import { describe, expect, it } from "vitest";
import {
  buildRedirectUrl,
  clientIpFromHeaders,
  hashIp,
  isBotUserAgent,
  truncate,
} from "@/lib/tracking/redirect";

const target = {
  landingUrl: "https://pmb.ubs.ac.id/daftar",
  campaignCode: "PMB-UBS-2026-01",
  referralCode: "KMPS26",
  trackingSlug: "siti-a2b3",
};

describe("buildRedirectUrl", () => {
  it("appends the UTM parameters and the referral code", () => {
    const url = new URL(buildRedirectUrl(target)!);
    expect(url.origin + url.pathname).toBe("https://pmb.ubs.ac.id/daftar");
    expect(url.searchParams.get("utm_source")).toBe("siti-a2b3");
    expect(url.searchParams.get("utm_medium")).toBe("kreator");
    expect(url.searchParams.get("utm_campaign")).toBe("PMB-UBS-2026-01");
    expect(url.searchParams.get("ref")).toBe("KMPS26");
  });

  it("keeps existing landing URL parameters and overrides clashing ones", () => {
    const url = new URL(
      buildRedirectUrl({
        ...target,
        landingUrl: "https://pmb.ubs.ac.id/daftar?jalur=reguler&ref=lama#form",
      })!,
    );
    expect(url.searchParams.get("jalur")).toBe("reguler");
    expect(url.searchParams.get("ref")).toBe("KMPS26");
    expect(url.hash).toBe("#form");
  });

  it("only ever uses the stored landing URL as the destination", () => {
    // The route passes nothing from the request; even a hostile-looking
    // tracking value cannot change the host.
    const url = new URL(buildRedirectUrl({ ...target, trackingSlug: "https://evil.example/?x=" })!);
    expect(url.host).toBe("pmb.ubs.ac.id");
  });

  it("returns null for missing or non-http landing URLs", () => {
    expect(buildRedirectUrl({ ...target, landingUrl: null })).toBeNull();
    expect(buildRedirectUrl({ ...target, landingUrl: "javascript:alert(1)" })).toBeNull();
    expect(buildRedirectUrl({ ...target, landingUrl: "not a url" })).toBeNull();
  });
});

describe("isBotUserAgent", () => {
  it("flags crawlers, link previews and scripts", () => {
    expect(isBotUserAgent("Googlebot/2.1 (+http://www.google.com/bot.html)")).toBe(true);
    expect(isBotUserAgent("WhatsApp/2.23.20.0 A")).toBe(true);
    expect(isBotUserAgent("facebookexternalhit/1.1")).toBe(true);
    expect(isBotUserAgent("curl/8.4.0")).toBe(true);
    expect(isBotUserAgent("")).toBe(true);
    expect(isBotUserAgent(null)).toBe(true);
  });

  it("accepts regular mobile browsers", () => {
    expect(
      isBotUserAgent(
        "Mozilla/5.0 (Linux; Android 14; SM-A155F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36",
      ),
    ).toBe(false);
    expect(
      isBotUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
  });
});

describe("clientIpFromHeaders", () => {
  it("takes the first forwarded address", () => {
    expect(clientIpFromHeaders(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe(
      "203.0.113.5",
    );
  });

  it("falls back to x-real-ip, then empty", () => {
    expect(clientIpFromHeaders(new Headers({ "x-real-ip": "198.51.100.7" }))).toBe("198.51.100.7");
    expect(clientIpFromHeaders(new Headers())).toBe("");
  });
});

describe("hashIp", () => {
  it("is stable for the same salt and differs across salts", async () => {
    const a = await hashIp("203.0.113.5", "salt-a");
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashIp("203.0.113.5", "salt-a")).toBe(a);
    expect(await hashIp("203.0.113.5", "salt-b")).not.toBe(a);
  });

  it("never returns the raw address", async () => {
    expect(await hashIp("203.0.113.5", "s")).not.toContain("203.0.113.5");
    expect(await hashIp("", "s")).toBeNull();
  });
});

describe("truncate", () => {
  it("bounds long header values", () => {
    expect(truncate("x".repeat(600))).toHaveLength(500);
    expect(truncate(null)).toBeNull();
  });
});
