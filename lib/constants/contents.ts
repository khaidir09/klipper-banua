import type { Database } from "@/types/database";

export type ReviewStatus = Database["public"]["Enums"]["review_status"];
export type ReviewDecision = Database["public"]["Enums"]["review_decision"];
export type LiveStatus = Database["public"]["Enums"]["live_status"];

export const REVIEW_STATUS_LABELS: Record<ReviewStatus, string> = {
  menunggu_review: "Menunggu review",
  disetujui: "Disetujui",
  revisi: "Revisi",
  ditolak: "Ditolak",
};

export const REVIEW_STATUSES = Object.keys(REVIEW_STATUS_LABELS) as ReviewStatus[];

export const REVIEW_DECISION_LABELS: Record<ReviewDecision, string> = {
  disetujui: "Setujui",
  revisi: "Minta revisi",
  ditolak: "Tolak",
};

export const REVIEW_DECISIONS = Object.keys(REVIEW_DECISION_LABELS) as ReviewDecision[];

export const LIVE_STATUS_LABELS: Record<LiveStatus, string> = {
  belum_tayang: "Belum tayang",
  tayang: "Tayang",
  dihapus: "Dihapus",
};

/** Private bucket for draft files (PRD 7.1). */
export const CONTENT_DRAFT_BUCKET = "content-drafts";
export const CONTENT_DRAFT_MAX_BYTES = 50 * 1024 * 1024;
export const CONTENT_DRAFT_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;
