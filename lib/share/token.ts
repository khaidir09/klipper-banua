import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Tokens for the client report links (FR-M9-05). The token travels in the
 * URL; only its SHA-256 hash is stored, so a database leak does not expose
 * working links.
 */

const TOKEN_BYTES = 32;
/** 32 random bytes as base64url, without padding. */
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateShareToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function isShareTokenFormat(value: string): boolean {
  return TOKEN_PATTERN.test(value);
}

/** Lowercase hex SHA-256, the form kept in `report_share_links.token_hash`. */
export function hashShareToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/**
 * Constant-time comparison for bearer secrets. Both sides are hashed first so
 * the lengths always match and the secret's length does not leak.
 */
export function secretsEqual(received: string, expected: string): boolean {
  const a = createHash("sha256").update(received, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}
