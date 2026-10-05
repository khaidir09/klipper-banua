import type { Database } from "@/types/database";

/**
 * Clips of `per_views` campaigns (PRD M18). Kept in code, not env, so the
 * thresholds are tested (PRD 10.3).
 */

export type ClipRejectionReason = Database["public"]["Enums"]["clip_rejection_reason"];

/** FR-M18-04: the reasons a clip can be rejected with. */
export const CLIP_REJECTION_REASON_LABELS: Record<ClipRejectionReason, string> = {
  bukan_pemilik: "Bukan pemilik akun",
  langgar_brief: "Melanggar brief atau larangan",
  di_luar_periode: "Tayang di luar periode kampanye",
  duplikat: "Klip duplikat",
  views_tidak_wajar: "Views tidak wajar",
  lainnya: "Lainnya",
};

export const CLIP_REJECTION_REASONS = Object.keys(
  CLIP_REJECTION_REASON_LABELS,
) as ClipRejectionReason[];

/**
 * FR-M18-04 checklist. Keys are stored in `content_reviews.checklist` and
 * required by `guard_content_review_insert` before an approval.
 */
export const CLIP_CHECKLIST_ITEMS = [
  { key: "kode_verifikasi", label: "Kode verifikasi kliper ada di caption" },
  { key: "akun_sesuai", label: "Akun sesuai akun sosial terdaftar" },
  { key: "sesuai_brief", label: "Isi sesuai brief" },
  { key: "tanpa_larangan", label: "Tidak melanggar larangan" },
  { key: "hashtag", label: "Hashtag wajib ada" },
  { key: "label_berbayar", label: "Label konten berbayar ada", onlyWhenPaidLabelRequired: true },
  { key: "dalam_periode", label: "Tayang di dalam periode kampanye" },
  { key: "views_cocok", label: "Views pada bukti cocok dengan halaman klip" },
  { key: "tanpa_views_palsu", label: "Tidak ada tanda views palsu" },
] as const;

export type ClipChecklistKey = (typeof CLIP_CHECKLIST_ITEMS)[number]["key"];
export type ClipChecklist = Partial<Record<ClipChecklistKey, boolean>>;

export function clipChecklistItemsFor(paidLabelRequired: boolean) {
  return CLIP_CHECKLIST_ITEMS.filter(
    (item) => !("onlyWhenPaidLabelRequired" in item) || paidLabelRequired,
  );
}

export function isClipChecklistComplete(
  checklist: ClipChecklist,
  paidLabelRequired: boolean,
): boolean {
  return clipChecklistItemsFor(paidLabelRequired).every((item) => checklist[item.key] === true);
}

/** FR-M18-05: minimum gap between two views submissions for one clip. */
export const VIEWS_UPDATE_MIN_HOURS = 24;

/** Clock skew accepted on "posted at", same as `guard_clip_change`. */
export const CLIP_POSTED_AT_SKEW_MINUTES = 5;

/** FR-M10-03: a clip waiting longer than this is flagged in the queue. */
export const CLIP_QUEUE_OVERDUE_HOURS = 24;

/**
 * FR-M18-07 risk flags. Warnings for the verifier, never automatic
 * decisions. Values are the first guess for the pilot (PRD 13.2).
 */
export const FRAUD_THRESHOLDS = {
  /** Views grow at least this many times over the previous submission… */
  spikeRatio: 5,
  /** …and by at least this many views. */
  spikeMinGain: 20_000,
  /** Likes + comments + shares below this share of views… */
  minEngagementRate: 0.005,
  /** …once the clip has at least this many views. */
  engagementMinViews: 5_000,
  /** Posted this soon after joining: the video probably existed already. */
  postedSoonAfterJoinMinutes: 30,
} as const;
