import { z } from "zod";
import {
  MIN_WITHDRAWAL_CEILING,
  MIN_WITHDRAWAL_FLOOR,
  PAYOUT_BANKS,
} from "@/lib/constants/withdrawals";
import { formatRupiah } from "@/lib/format/currency";
import { uuidField } from "./common";
import { moneyField, signedMoneyField } from "./money";

const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Isi tanggal transfer." });

/** FR-M19-04: a kliper's own bank or e-wallet account. */
export const portalBankAccountSchema = z.object({
  bank_name: z.enum(PAYOUT_BANKS, { message: "Pilih bank atau e-wallet." }),
  account_number: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(
      z.string().regex(/^\d{4,30}$/, { message: "Nomor rekening harus angka, minimal 4 digit." }),
    ),
  account_holder: z
    .string()
    .trim()
    .min(1, { message: "Nama pemilik rekening wajib diisi." })
    .max(200),
});

export type PortalBankAccountFormInput = z.input<typeof portalBankAccountSchema>;
export type PortalBankAccountInput = z.output<typeof portalBankAccountSchema>;

/** FR-M19-05. The minimum and the balance are checked on the server. */
export const withdrawalRequestSchema = z.object({
  amount: moneyField.refine((value) => value > 0, { message: "Isi nominal penarikan." }),
});

export type WithdrawalRequestFormInput = z.input<typeof withdrawalRequestSchema>;
export type WithdrawalRequestInput = z.output<typeof withdrawalRequestSchema>;

/** FR-M19-06: the owner's next step on one withdrawal. */
export const withdrawalProcessSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("diproses"), withdrawal_id: uuidField }),
  z.object({
    status: z.literal("dibayar"),
    withdrawal_id: uuidField,
    paid_at: dateField,
    proof_path: z.string().trim().min(1, { message: "Unggah bukti transfer." }),
    // Borne by the kliper (owner decision); empty means no fee.
    transfer_fee: moneyField.default(0),
  }),
  z.object({
    status: z.literal("ditolak"),
    withdrawal_id: uuidField,
    reason: z.string().trim().min(1, { message: "Tulis alasan penolakan untuk kliper." }).max(1000),
  }),
]);

export type WithdrawalProcessFormInput = z.input<typeof withdrawalProcessSchema>;
export type WithdrawalProcessInput = z.output<typeof withdrawalProcessSchema>;

/** FR-M19-06: the owner's balance correction, signed, with a reason. */
export const balanceAdjustmentSchema = z.object({
  creator_id: uuidField,
  amount: signedMoneyField.refine((value) => value !== 0, {
    message: "Nominal penyesuaian tidak boleh nol.",
  }),
  reason: z.string().trim().min(1, { message: "Alasan penyesuaian wajib diisi." }).max(1000),
});

export type BalanceAdjustmentFormInput = z.input<typeof balanceAdjustmentSchema>;
export type BalanceAdjustmentInput = z.output<typeof balanceAdjustmentSchema>;

/** Pengaturan → Penarikan (owner): the minimum withdrawal. */
export const minWithdrawalSchema = z.object({
  min_withdrawal: moneyField.refine(
    (value) => value >= MIN_WITHDRAWAL_FLOOR && value <= MIN_WITHDRAWAL_CEILING,
    {
      message: `Minimum penarikan antara ${formatRupiah(MIN_WITHDRAWAL_FLOOR)} dan ${formatRupiah(MIN_WITHDRAWAL_CEILING)}.`,
    },
  ),
});

export type MinWithdrawalFormInput = z.input<typeof minWithdrawalSchema>;
export type MinWithdrawalInput = z.output<typeof minWithdrawalSchema>;

/** Filters of the owner's withdrawal page (FR-M19-08). */
export const withdrawalListQuerySchema = z.object({
  status: z.enum(["diajukan", "diproses", "dibayar", "ditolak", "semua"]).catch("semua"),
  dari: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
  sampai: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined),
});

export type WithdrawalListQuery = z.output<typeof withdrawalListQuerySchema>;
