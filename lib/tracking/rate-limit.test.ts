import { describe, expect, it } from "vitest";
import { FixedWindowRateLimiter } from "@/lib/tracking/rate-limit";

describe("tracking link rate limit", () => {
  it("allows up to the limit within a window, then blocks with a retry time", () => {
    const limiter = new FixedWindowRateLimiter(3, 60_000);
    expect(limiter.check("ip", 0)).toEqual({ allowed: true, remaining: 2, retryAfterSeconds: 0 });
    limiter.check("ip", 1_000);
    expect(limiter.check("ip", 2_000).allowed).toBe(true);
    expect(limiter.check("ip", 15_000)).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 45,
    });
  });

  it("starts a fresh window after it expires", () => {
    const limiter = new FixedWindowRateLimiter(1, 60_000);
    limiter.check("ip", 0);
    expect(limiter.check("ip", 59_999).allowed).toBe(false);
    expect(limiter.check("ip", 60_000).allowed).toBe(true);
  });

  it("counts each visitor separately", () => {
    const limiter = new FixedWindowRateLimiter(1, 60_000);
    expect(limiter.check("a", 0).allowed).toBe(true);
    expect(limiter.check("b", 0).allowed).toBe(true);
    expect(limiter.check("a", 1).allowed).toBe(false);
  });

  it("keeps memory bounded under a flood of distinct keys", () => {
    const limiter = new FixedWindowRateLimiter(5, 60_000, 100);
    for (let i = 0; i < 1_000; i++) limiter.check(`ip-${i}`, i);
    expect(limiter.size).toBeLessThanOrEqual(100);
  });
});
