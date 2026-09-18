import { z } from "zod";
import { moneyField, signedMoneyField } from "./money";

const dateField = (message: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message });

/** FR-M8-02: positive or negative, with a mandatory reason. */
export const adjustmentSchema = z
  .object({
    adjustment_amount: signedMoneyField,
    adjustment_reason: z.string().trim().max(500),
  })
  .refine((value) => value.adjustment_amount === 0 || value.adjustment_reason.length > 0, {
    path: ["adjustment_reason"],
    message: "Alasan penyesuaian wajib diisi.",
  });

export type AdjustmentFormInput = z.input<typeof adjustmentSchema>;
export type AdjustmentInput = z.output<typeof adjustmentSchema>;

/** FR-M8-03: `dibayar` needs the payment date and the transfer proof. */
export const markPaidSchema = z.object({
  paid_at: dateField("Tanggal bayar wajib diisi."),
  transfer_proof_path: z.string().trim().min(1, { message: "Unggah bukti transfer." }),
});

export type MarkPaidFormInput = z.input<typeof markPaidSchema>;
export type MarkPaidInput = z.output<typeof markPaidSchema>;

/** FR-M8-05: invoice to the client. */
export const clientPaymentSchema = z.object({
  invoice_number: z
    .string()
    .trim()
    .min(1, { message: "Nomor invoice wajib diisi." })
    .max(60)
    .transform((value) => value.toUpperCase()),
  amount: moneyField.refine((value) => value > 0, {
    message: "Nominal invoice harus lebih dari 0.",
  }),
  due_date: dateField("Tanggal jatuh tempo wajib diisi."),
});

export type ClientPaymentFormInput = z.input<typeof clientPaymentSchema>;
export type ClientPaymentInput = z.output<typeof clientPaymentSchema>;

/** Money received so far on an invoice; the status is derived from it. */
export const clientPaymentReceiptSchema = z
  .object({
    paid_amount: moneyField,
    paid_at: z
      .union([dateField("Tanggal bayar tidak valid."), z.literal(""), z.null()])
      .transform((value) => value || null),
    proof_path: z.union([z.string(), z.null()]).transform((value) => (value ?? "").trim() || null),
  })
  .refine((value) => value.paid_amount === 0 || value.paid_at !== null, {
    path: ["paid_at"],
    message: "Tanggal bayar wajib diisi jika ada pembayaran.",
  });

export type ClientPaymentReceiptFormInput = z.input<typeof clientPaymentReceiptSchema>;
export type ClientPaymentReceiptInput = z.output<typeof clientPaymentReceiptSchema>;
