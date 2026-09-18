import { z } from "zod";

/**
 * Whole-Rupiah amount typed as "1.500.000", "1500000" or a number.
 *
 * Amounts travel as JS integers (supabase-js serialises `bigint` columns as
 * JSON numbers). Every value is checked to be a safe integer, so no float
 * arithmetic or rounding ever touches money.
 */
export function parseRupiah(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) ? value : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // Accept Indonesian thousand separators and an optional "Rp" prefix.
  const digits = trimmed.replace(/^rp\.?\s*/i, "").replace(/[.\s]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

const MONEY_MESSAGE = "Masukkan nominal Rupiah utuh, mis. 1.500.000.";

/** Required amount; empty input becomes 0. */
export const moneyField = z.union([z.string(), z.number()]).transform((value, ctx) => {
  if (typeof value === "string" && !value.trim()) return 0;
  const parsed = parseRupiah(value);
  if (parsed === null) {
    ctx.addIssue({ code: "custom", message: MONEY_MESSAGE });
    return z.NEVER;
  }
  return parsed;
});

/** Optional amount; empty input becomes null (e.g. "use the campaign default"). */
export const optionalMoneyField = z
  .union([z.string(), z.number(), z.null()])
  .transform((value, ctx) => {
    if (value === null || (typeof value === "string" && !value.trim())) return null;
    const parsed = parseRupiah(value);
    if (parsed === null) {
      ctx.addIssue({ code: "custom", message: MONEY_MESSAGE });
      return z.NEVER;
    }
    return parsed;
  });

/** Whole, non-negative count such as a target or a number of contents. */
export const countField = z.union([z.string(), z.number()]).transform((value, ctx) => {
  if (typeof value === "string" && !value.trim()) return 0;
  const parsed = parseRupiah(value);
  if (parsed === null) {
    ctx.addIssue({ code: "custom", message: "Masukkan angka bulat, mis. 25." });
    return z.NEVER;
  }
  return parsed;
});

/** Signed whole-Rupiah amount, e.g. "-50.000" or "+25.000" (payout adjustments). */
export function parseSignedRupiah(value: unknown): number | null {
  if (typeof value === "number") return Number.isSafeInteger(value) ? value : null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim().replace(/\s+/g, "");
  const match = /^([+-]?)(.*)$/.exec(trimmed);
  const magnitude = parseRupiah(match?.[2] ?? "");
  if (magnitude === null) return null;
  return match?.[1] === "-" ? -magnitude : magnitude;
}

export const signedMoneyField = z.union([z.string(), z.number()]).transform((value, ctx) => {
  if (typeof value === "string" && !value.trim()) return 0;
  const parsed = parseSignedRupiah(value);
  if (parsed === null) {
    ctx.addIssue({
      code: "custom",
      message: "Masukkan nominal Rupiah utuh, mis. -50.000 atau 25.000.",
    });
    return z.NEVER;
  }
  return parsed;
});
