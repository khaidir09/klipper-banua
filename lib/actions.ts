import { z } from "zod";

/** Shape every Server Action returns when it does not redirect. */
export type ActionResult<T = undefined> =
  | { status: "success"; message: string; data?: T }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export function ok<T>(message: string, data?: T): ActionResult<T> {
  return { status: "success", message, data };
}

export function fail<T = undefined>(message: string): ActionResult<T> {
  return { status: "error", message };
}

/** Turns a Zod failure into one general message plus per-field messages. */
export function invalid<T = undefined>(error: z.ZodError): ActionResult<T> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  const first = error.issues[0]?.message ?? "Periksa kembali isian Anda.";
  return { status: "error", message: first, fieldErrors };
}

/** Postgres error codes, used to give friendlier messages. */
export const PG_UNIQUE_VIOLATION = "23505";
export const PG_CHECK_VIOLATION = "23514";
export const PG_FOREIGN_KEY_VIOLATION = "23503";

/**
 * Messages for the rule violations raised by the database triggers
 * (see supabase/migrations/*campaign*). The trigger message starts with the key.
 */
const DB_RULE_MESSAGES: Record<string, string> = {
  CAMPAIGN_LOCKED: "Kampanye sudah selesai atau dibatalkan; hanya owner yang dapat mengubahnya.",
  INVALID_TRANSITION: "Perubahan status kampanye tersebut tidak diizinkan.",
  ACTIVATION_NEEDS_LANDING_URL: "Kampanye bertujuan pendaftar wajib memiliki URL tujuan.",
  ACTIVATION_NEEDS_CREATOR: "Tugaskan minimal satu kreator sebelum mengaktifkan kampanye.",
  CREATOR_BLOCKED: "Kreator yang diblokir tidak dapat ditugaskan.",
  CREATOR_NOT_VERIFIED: "Hanya kreator terverifikasi atau aktif yang dapat ditugaskan.",
  TRACKING_FROZEN: "Kode referal dan slug tidak dapat diubah karena sudah ada klik tercatat.",
};

/** Maps a trigger rule violation to Indonesian text; falls back otherwise. */
export function dbRuleMessage(error: { message?: string } | null, fallback: string): string {
  const key = error?.message?.split(":")[0]?.trim();
  return (key && DB_RULE_MESSAGES[key]) || fallback;
}
