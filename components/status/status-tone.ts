import type { AssignmentStatus, CampaignStatus } from "@/lib/constants/campaigns";
import type { LiveStatus, ReviewStatus } from "@/lib/constants/contents";
import type { CreatorStatus } from "@/lib/constants/creators";
import type { ClientPaymentStatus, PayoutStatus } from "@/lib/constants/finance";
import type { SubmissionStatus } from "@/lib/constants/metrics";

/**
 * Every status colour in one place, so a badge means the same thing wherever it
 * appears. The enum values themselves come from the PRD and never change here.
 *
 * The vocabulary, applied consistently across domains:
 *   neutral — not started yet, nothing owed
 *   info    — in flight
 *   success — finished, approved, settled
 *   warning — a queue the team has to clear
 *   destructive — rejected, cancelled, blocked
 */
export type StatusTone = "neutral" | "info" | "success" | "warning" | "destructive";

export const CAMPAIGN_TONES: Record<CampaignStatus, StatusTone> = {
  draft: "neutral",
  aktif: "info",
  selesai: "success",
  dibatalkan: "destructive",
};

export const ASSIGNMENT_TONES: Record<AssignmentStatus, StatusTone> = {
  diundang: "neutral",
  bergabung: "info",
  selesai: "success",
  mundur: "destructive",
};

export const CREATOR_TONES: Record<CreatorStatus, StatusTone> = {
  prospek: "neutral",
  terverifikasi: "info",
  aktif: "success",
  nonaktif: "neutral",
  diblokir: "destructive",
};

export const REVIEW_TONES: Record<ReviewStatus, StatusTone> = {
  menunggu_review: "warning",
  disetujui: "success",
  revisi: "info",
  ditolak: "destructive",
};

export const LIVE_TONES: Record<LiveStatus, StatusTone> = {
  belum_tayang: "neutral",
  tayang: "success",
  dihapus: "destructive",
};

export const PAYOUT_TONES: Record<PayoutStatus, StatusTone> = {
  draf: "neutral",
  disetujui: "info",
  dibayar: "success",
};

export const CLIENT_PAYMENT_TONES: Record<ClientPaymentStatus, StatusTone> = {
  belum_dibayar: "warning",
  sebagian: "info",
  lunas: "success",
};

export const SUBMISSION_TONES: Record<SubmissionStatus, StatusTone> = {
  menunggu: "warning",
  diterima: "success",
  ditolak: "destructive",
};
