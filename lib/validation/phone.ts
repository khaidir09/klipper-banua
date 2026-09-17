import { z } from "zod";

/**
 * Normalises an Indonesian WhatsApp number to the international form the
 * team pastes into wa.me links: `08123456789` and `+62 812-3456-789` both
 * become `628123456789`. Returns null when the input is not a phone number.
 */
export function normalizeWhatsapp(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits) return null;

  let national: string;
  if (digits.startsWith("+62")) {
    national = digits.slice(3);
  } else if (digits.startsWith("62")) {
    national = digits.slice(2);
  } else if (digits.startsWith("0")) {
    national = digits.slice(1);
  } else if (digits.startsWith("8")) {
    national = digits;
  } else {
    return null;
  }

  if (!/^8\d{7,12}$/.test(national)) return null;
  return `62${national}`;
}

/** Zod field: optional, but must be a valid number when filled. */
export const whatsappField = z
  .string()
  .trim()
  .max(32)
  .transform((value, ctx) => {
    if (!value) return "";
    const normalized = normalizeWhatsapp(value);
    if (!normalized) {
      ctx.addIssue({
        code: "custom",
        message: "Nomor WhatsApp tidak valid. Contoh: 0812-3456-7890.",
      });
      return z.NEVER;
    }
    return normalized;
  });

/** e.g. `628123456789` → `0812-3456-789` for display. */
export function formatWhatsapp(value: string): string {
  if (!value) return "";
  const national = value.startsWith("62") ? `0${value.slice(2)}` : value;
  return national.replace(/^(\d{4})(\d{4})(\d+)$/, "$1-$2-$3");
}

export function whatsappLink(value: string): string {
  return `https://wa.me/${value}`;
}
