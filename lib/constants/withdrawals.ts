import type { Database } from "@/types/database";

/** Balance, bank accounts and withdrawals (PRD M19). */

export type WithdrawalStatus = Database["public"]["Enums"]["withdrawal_status"];
export type LedgerEntryType = Database["public"]["Enums"]["ledger_entry_type"];

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalStatus, string> = {
  diajukan: "Diajukan",
  diproses: "Diproses",
  dibayar: "Dibayar",
  ditolak: "Ditolak",
};

export const WITHDRAWAL_STATUSES = Object.keys(WITHDRAWAL_STATUS_LABELS) as WithdrawalStatus[];

export const LEDGER_ENTRY_TYPE_LABELS: Record<LedgerEntryType, string> = {
  honor_klip: "Honor klip",
  pembatalan: "Pembatalan honor",
  penyesuaian: "Penyesuaian",
  penarikan: "Penarikan",
  pengembalian_penarikan: "Pengembalian penarikan",
};

/**
 * Fallback for the minimum withdrawal. The value in force lives in
 * `platform_settings.min_withdrawal` and the owner changes it on
 * Pengaturan → Penarikan (owner decision 24 Sep 2026: Rp 100.000 =
 * 10.000 views at Rp 10.000 per 1.000).
 */
export const DEFAULT_MIN_WITHDRAWAL = 100_000;
/** Bounds of `platform_settings_min_withdrawal_check`. */
export const MIN_WITHDRAWAL_FLOOR = 10_000;
export const MIN_WITHDRAWAL_CEILING = 100_000_000;

/** FR-M19-04: withdrawals wait this long after a bank account change. */
export const BANK_CHANGE_HOLD_HOURS = 24;

/** FR-M19-04: the fixed list of banks and e-wallets a klipper picks from. */
export const PAYOUT_BANKS = [
  "BCA",
  "BRI",
  "BNI",
  "Mandiri",
  "BSI",
  "BTN",
  "CIMB Niaga",
  "Danamon",
  "Permata",
  "Bank Kalsel",
  "Bank Kalbar",
  "Bank Kalteng",
  "Bank Kaltimtara",
  "Bank Jago",
  "SeaBank",
  "DANA",
  "OVO",
  "GoPay",
  "ShopeePay",
] as const;

export type PayoutBank = (typeof PAYOUT_BANKS)[number];
