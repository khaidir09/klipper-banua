import type { Database } from "@/types/database";

export type PayoutStatus = Database["public"]["Enums"]["payout_status"];
export type ClientPaymentStatus = Database["public"]["Enums"]["client_payment_status"];

export const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  draf: "Draf",
  disetujui: "Disetujui",
  dibayar: "Dibayar",
};

export const CLIENT_PAYMENT_STATUS_LABELS: Record<ClientPaymentStatus, string> = {
  belum_dibayar: "Belum dibayar",
  sebagian: "Sebagian",
  lunas: "Lunas",
};

/** Private, owner-only bucket for transfer receipts and payment proofs. */
export const FINANCE_PROOF_BUCKET = "finance-proofs";
export const FINANCE_PROOF_MAX_BYTES = 10 * 1024 * 1024;
export const FINANCE_PROOF_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;
