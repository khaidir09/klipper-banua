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
 * (see supabase/migrations). The trigger message starts with the key.
 */
const DB_RULE_MESSAGES: Record<string, string> = {
  CAMPAIGN_LOCKED: "Kampanye sudah selesai atau dibatalkan; hanya owner yang dapat mengubahnya.",
  INVALID_TRANSITION: "Perubahan status kampanye tersebut tidak diizinkan.",
  ACTIVATION_NEEDS_LANDING_URL: "Kampanye bertujuan pendaftar wajib memiliki URL tujuan.",
  ACTIVATION_NEEDS_CREATOR: "Tugaskan minimal satu kreator sebelum mengaktifkan kampanye.",
  CREATOR_BLOCKED: "Kreator yang diblokir tidak dapat ditugaskan.",
  CREATOR_NOT_VERIFIED: "Hanya kreator terverifikasi atau aktif yang dapat ditugaskan.",
  TRACKING_FROZEN: "Kode referal dan slug tidak dapat diubah karena sudah ada klik tercatat.",
  REVIEW_NOT_PENDING: "Konten ini sudah direview; tunggu draf baru sebelum mereview lagi.",
  CHECKLIST_INCOMPLETE: "Centang semua item checklist sebelum menyetujui konten.",
  INVALID_REVIEW_TRANSITION: "Status review hanya berubah lewat keputusan review atau draf baru.",
  DRAFT_FROZEN: "Draf yang sudah direview tidak dapat diubah; kirim draf baru setelah revisi.",
  REVIEW_IMMUTABLE: "Riwayat review tidak dapat diubah atau dihapus.",
  CONTENT_ASSIGNMENT_FIXED: "Konten tidak dapat dipindahkan ke kreator lain.",
};

/** Check constraints whose violation deserves a specific message. */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  contents_posted_requires_approval:
    "URL tayang hanya dapat diisi untuk konten yang sudah disetujui.",
  content_reviews_revision_notes_check: "Catatan wajib diisi untuk permintaan revisi.",
  contents_removed_check: "Waktu penghapusan tidak boleh sebelum waktu tayang.",
};

/** Maps a trigger or constraint violation to Indonesian text; falls back otherwise. */
export function dbRuleMessage(error: { message?: string } | null, fallback: string): string {
  const message = error?.message ?? "";
  const key = message.split(":")[0]?.trim();
  if (key && DB_RULE_MESSAGES[key]) return DB_RULE_MESSAGES[key];
  const constraint = Object.keys(CONSTRAINT_MESSAGES).find((name) => message.includes(name));
  return constraint ? CONSTRAINT_MESSAGES[constraint]! : fallback;
}
