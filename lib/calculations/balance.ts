import type { LedgerEntryType, WithdrawalStatus } from "@/lib/constants/withdrawals";

/**
 * Kliper balance and withdrawal rules (PRD 8.7, FR-M19-03, FR-M19-05).
 * Whole Rupiah only. The database enforces the same rules in
 * `request_withdrawal()` and computes the same sums in
 * `creator_portal_balance`; these explain them in the portal.
 */

export type LedgerLine = { entryType: LedgerEntryType; amount: number };

export type BalanceSummary = {
  /** saldo_tersedia = Σ ledger. May go negative after a cancellation. */
  available: number;
  /** Honor, cancellations and adjustments: what the kliper earned. */
  totalEarned: number;
  /** Withdrawn, including withdrawals in progress, net of refunds. */
  totalWithdrawn: number;
};

const EARNING_TYPES: readonly LedgerEntryType[] = ["honor_klip", "pembatalan", "penyesuaian"];
const WITHDRAWAL_TYPES: readonly LedgerEntryType[] = ["penarikan", "pengembalian_penarikan"];

export function balanceSummary(lines: readonly LedgerLine[]): BalanceSummary {
  let available = 0;
  let totalEarned = 0;
  let totalWithdrawn = 0;
  for (const line of lines) {
    available += line.amount;
    if (EARNING_TYPES.includes(line.entryType)) totalEarned += line.amount;
    if (WITHDRAWAL_TYPES.includes(line.entryType)) totalWithdrawn -= line.amount;
  }
  return { available, totalEarned, totalWithdrawn };
}

export type WithdrawalBlocker =
  | "creator_blocked"
  | "no_birth_date"
  | "no_bank_account"
  | "bank_recently_changed"
  | "withdrawal_in_progress"
  | "below_minimum"
  | "above_balance";

export type WithdrawalCheckInput = {
  creatorBlocked: boolean;
  /** FR-M3-02: age is not a requirement, but the birth date must be filled in. */
  hasBirthDate: boolean;
  hasBankAccount: boolean;
  /** When the 24-hour hold after a bank change ends; null without a hold. */
  bankHoldUntil: Date | null;
  openWithdrawalStatuses: readonly WithdrawalStatus[];
  amount: number;
  available: number;
  minWithdrawal: number;
  now: Date;
};

/**
 * boleh_tarik (PRD 8.7), in the order `request_withdrawal()` checks it.
 * Empty when the withdrawal may be requested.
 */
export function withdrawalBlockers(input: WithdrawalCheckInput): WithdrawalBlocker[] {
  const blockers: WithdrawalBlocker[] = [];
  if (input.creatorBlocked) blockers.push("creator_blocked");
  if (!input.hasBirthDate) blockers.push("no_birth_date");
  if (!input.hasBankAccount) blockers.push("no_bank_account");
  if (input.bankHoldUntil && input.bankHoldUntil > input.now)
    blockers.push("bank_recently_changed");
  if (
    input.openWithdrawalStatuses.some((status) => status === "diajukan" || status === "diproses")
  ) {
    blockers.push("withdrawal_in_progress");
  }
  if (input.amount < input.minWithdrawal) blockers.push("below_minimum");
  if (input.amount > input.available) blockers.push("above_balance");
  return blockers;
}

/**
 * Whether the balance alone can ever pass the minimum right now; used to
 * hide the form and explain why before an amount is typed.
 */
export function canReachMinimum(available: number, minWithdrawal: number): boolean {
  return available >= minWithdrawal;
}
