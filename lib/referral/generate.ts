/**
 * Referral codes and tracking slugs (FR-M5-03, FR-M5-04).
 *
 * Codes are typed by hand into a campus registration form, so the alphabet
 * leaves out characters that are easy to confuse: I/1 and O/0.
 */
export const REFERRAL_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const REFERRAL_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6,8}$/;
export const TRACKING_SLUG_PATTERN = /^[a-z0-9]([a-z0-9-]{2,38}[a-z0-9])$/;

const SLUG_SUFFIX_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

/** Returns `count` random integers in `[0, max)`; injectable for tests. */
export type RandomInts = (count: number, max: number) => number[];

export const cryptoRandomInts: RandomInts = (count, max) => {
  // Rejection sampling keeps the distribution uniform for any alphabet size.
  const limit = Math.floor(256 / max) * max;
  const result: number[] = [];
  while (result.length < count) {
    const bytes = new Uint8Array(count * 2);
    globalThis.crypto.getRandomValues(bytes);
    for (const byte of bytes) {
      if (byte < limit) result.push(byte % max);
      if (result.length === count) break;
    }
  }
  return result;
};

function pick(alphabet: string, count: number, random: RandomInts): string {
  return random(count, alphabet.length)
    .map((index) => alphabet[index])
    .join("");
}

export function generateReferralCode(length = 6, random: RandomInts = cryptoRandomInts): string {
  if (length < 6 || length > 8) throw new RangeError("Referral codes are 6–8 characters long.");
  return pick(REFERRAL_ALPHABET, length, random);
}

/** Uppercases and strips separators so "ab-cd 23" is checked as "ABCD23". */
export function normalizeReferralCode(value: string): string {
  return value.toUpperCase().replace(/[\s-]/g, "");
}

export function isValidReferralCode(value: string): boolean {
  return REFERRAL_CODE_PATTERN.test(value);
}

/** Lowercase ASCII slug, e.g. "Siti Rahma Kuliner!" → "siti-rahma-kuliner". */
export function slugify(value: string, maxLength = 20): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength)
    .replace(/-+$/g, "");
}

/**
 * Public slug for `/r/<slug>`. Built from the stage name only (never the legal
 * name) plus a random suffix; without a stage name it is fully random.
 */
export function generateTrackingSlug(
  stageName: string | null | undefined,
  random: RandomInts = cryptoRandomInts,
): string {
  const base = slugify(stageName ?? "");
  const suffix = pick(SLUG_SUFFIX_ALPHABET, base.length >= 3 ? 4 : 8, random);
  return base.length >= 3 ? `${base}-${suffix}` : suffix;
}

export function normalizeTrackingSlug(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidTrackingSlug(value: string): boolean {
  return TRACKING_SLUG_PATTERN.test(value);
}
