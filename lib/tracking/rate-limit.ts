/**
 * Simple in-memory rate limit for the public `/r/[slug]` route (PRD section 9).
 * A fixed window per key (the salted IP hash): enough for one VPS process;
 * counts reset when the process restarts. Pure apart from the injected clock.
 */

export type RateLimitDecision = { allowed: boolean; remaining: number; retryAfterSeconds: number };

type Window = { start: number; count: number };

export class FixedWindowRateLimiter {
  private readonly windows = new Map<string, Window>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    /** Upper bound on tracked keys so a flood of IPs cannot exhaust memory. */
    private readonly maxKeys = 10_000,
  ) {}

  check(key: string, now: number = Date.now()): RateLimitDecision {
    let window = this.windows.get(key);
    if (!window || now - window.start >= this.windowMs) {
      if (!window && this.windows.size >= this.maxKeys) this.prune(now);
      window = { start: now, count: 0 };
      this.windows.set(key, window);
    }

    window.count += 1;
    const allowed = window.count <= this.limit;
    return {
      allowed,
      remaining: Math.max(0, this.limit - window.count),
      retryAfterSeconds: allowed ? 0 : Math.ceil((window.start + this.windowMs - now) / 1000),
    };
  }

  /** Drops expired windows; if all are still live, drops the oldest half. */
  private prune(now: number) {
    for (const [key, window] of this.windows) {
      if (now - window.start >= this.windowMs) this.windows.delete(key);
    }
    if (this.windows.size < this.maxKeys) return;
    const oldest = [...this.windows.entries()].sort((a, b) => a[1].start - b[1].start);
    for (const [key] of oldest.slice(0, Math.ceil(oldest.length / 2))) this.windows.delete(key);
  }

  get size() {
    return this.windows.size;
  }
}

/** 30 requests per minute per visitor across all tracking links. */
export const TRACKING_RATE_LIMIT = { limit: 30, windowMs: 60_000 } as const;
