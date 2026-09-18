import type { LiveStatus, ReviewStatus } from "@/lib/constants/contents";

/**
 * Review checklist (FR-M6-03). Keys are stored in `content_reviews.checklist`
 * and mirrored by the `guard_content_review_insert` trigger.
 */
export const CHECKLIST_ITEMS = [
  { key: "sesuai_brief", label: "Sesuai brief" },
  { key: "tanpa_larangan", label: "Tidak melanggar larangan" },
  { key: "label_berbayar", label: "Ada label konten berbayar", onlyWhenPaidLabelRequired: true },
  { key: "info_akurat", label: "Tidak ada informasi keliru tentang klien" },
] as const;

export type ChecklistKey = (typeof CHECKLIST_ITEMS)[number]["key"];
export type Checklist = Partial<Record<ChecklistKey, boolean>>;

/** Items that apply to a campaign; the paid-label item only when required. */
export function checklistItemsFor(paidLabelRequired: boolean) {
  return CHECKLIST_ITEMS.filter(
    (item) => !("onlyWhenPaidLabelRequired" in item) || paidLabelRequired,
  );
}

export function isChecklistComplete(checklist: Checklist, paidLabelRequired: boolean): boolean {
  return checklistItemsFor(paidLabelRequired).every((item) => checklist[item.key] === true);
}

/** FR-M6-02: only content waiting for review can be reviewed. */
export function canReview(status: ReviewStatus): boolean {
  return status === "menunggu_review";
}

/** A new draft answers a revision request and sends the content back to review. */
export function canSubmitNewDraft(status: ReviewStatus): boolean {
  return status === "revisi";
}

/** Drafts can be corrected while waiting for review; afterwards they are frozen. */
export function canEditDraft(status: ReviewStatus): boolean {
  return status === "menunggu_review";
}

/** Reviewed content keeps its history, so only unreviewed content can be deleted. */
export function canDeleteContent(status: ReviewStatus, revisionCount: number): boolean {
  return status === "menunggu_review" && revisionCount === 0;
}

/** FR-M6-04: the live URL is only filled for approved content. */
export function canMarkPosted(status: ReviewStatus): boolean {
  return status === "disetujui";
}

/** FR-M6-05: only live content can be marked as removed. */
export function canMarkRemoved(status: ReviewStatus, liveStatus: LiveStatus): boolean {
  return status === "disetujui" && liveStatus === "tayang";
}
