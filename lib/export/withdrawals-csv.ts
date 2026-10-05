import type { WithdrawalStatus } from "@/lib/constants/withdrawals";
import { WITHDRAWAL_STATUS_LABELS } from "@/lib/constants/withdrawals";
import { formatDateTime } from "@/lib/format/date";
import { toCsv } from "./csv";

/**
 * FR-M19-08: withdrawals for a manual bulk transfer. The account number is
 * written as text, so a spreadsheet keeps its leading zeros visible as typed.
 * Owner only: the route checks the role and RLS returns rows to the owner
 * alone.
 */
export type WithdrawalCsvRow = {
  requestedAt: string;
  creatorName: string;
  stageName: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  holderMatchesName: boolean;
  amount: number;
  transferFee: number;
  status: WithdrawalStatus;
  paidAt: string | null;
};

export function withdrawalsCsv(rows: readonly WithdrawalCsvRow[], timezone: string): string {
  return toCsv(
    [
      "Diajukan",
      "Nama kliper",
      "Nama panggung",
      "Bank / e-wallet",
      "Nomor rekening",
      "Nama pemilik",
      "Nama cocok",
      "Nominal",
      "Biaya transfer",
      "Diterima kliper",
      "Status",
      "Tanggal bayar",
    ],
    rows.map((row) => [
      formatDateTime(row.requestedAt, timezone),
      row.creatorName,
      row.stageName,
      row.bankName,
      row.accountNumber,
      row.accountHolder,
      row.holderMatchesName ? "Ya" : "Tidak",
      row.amount,
      row.transferFee,
      row.amount - row.transferFee,
      WITHDRAWAL_STATUS_LABELS[row.status],
      row.paidAt ?? "",
    ]),
  );
}
