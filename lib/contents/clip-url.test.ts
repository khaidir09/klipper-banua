import { describe, expect, it } from "vitest";
import { normalizeClipUrl } from "./clip-url";

describe("normalizeClipUrl (FR-M18-02)", () => {
  it("lower-cases and drops tracking parameters and the trailing slash", () => {
    expect(
      normalizeClipUrl(" HTTPS://www.TikTok.com/@a/video/123/?is_from_webapp=1&sender_device=pc#x"),
    ).toBe("https://tiktok.com/@a/video/123");
  });

  it("drops every utm_ parameter", () => {
    expect(normalizeClipUrl("http://instagram.com/reel/XYZ/?igsh=abc&utm_source=ig")).toBe(
      "https://instagram.com/reel/xyz",
    );
  });

  it("keeps the parameters that identify the video, sorted", () => {
    // Same answer as public.normalize_clip_url (guards-check P17-40).
    expect(normalizeClipUrl("https://m.YouTube.com/watch?v=AbC&si=zz&list=L&t=30#x")).toBe(
      "https://youtube.com/watch?list=l&v=abc",
    );
  });

  it("treats http, www and mobile hosts as the same link", () => {
    const a = normalizeClipUrl("https://tiktok.com/@a/video/1");
    expect(normalizeClipUrl("http://www.tiktok.com/@a/video/1")).toBe(a);
    expect(normalizeClipUrl("https://m.tiktok.com/@a/video/1/")).toBe(a);
  });

  it("returns null for an empty value", () => {
    expect(normalizeClipUrl("")).toBeNull();
    expect(normalizeClipUrl("   ")).toBeNull();
    expect(normalizeClipUrl(null)).toBeNull();
  });

  it("drops an empty query", () => {
    expect(normalizeClipUrl("https://youtu.be/abc?")).toBe("https://youtu.be/abc");
  });
});
