"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { payoutTotal } from "@/lib/calculations/payout";
import {
  FINANCE_PROOF_BUCKET,
  FINANCE_PROOF_MAX_BYTES,
  FINANCE_PROOF_MIME_TYPES,
} from "@/lib/constants/finance";
import { formatAmountDigits, formatRupiah } from "@/lib/format/currency";
import { formatDateInput } from "@/lib/format/date";
import { applyFieldErrors } from "@/lib/forms";
import { uploadToBucket } from "@/lib/storage/upload";
import {
  adjustmentSchema,
  clientPaymentReceiptSchema,
  clientPaymentSchema,
  type AdjustmentFormInput,
  type AdjustmentInput,
  type ClientPaymentFormInput,
  type ClientPaymentInput,
  type ClientPaymentReceiptFormInput,
  type ClientPaymentReceiptInput,
} from "@/lib/validation/finance";
import { parseSignedRupiah } from "@/lib/validation/money";
import {
  adjustPayoutAction,
  createClientPaymentAction,
  markPayoutPaidAction,
  recordClientPaymentAction,
} from "../../finance-actions";
import type { PaymentView } from "./finance-panel";

function checkProof(file: File | null): string | null {
  if (!file) return null;
  if (file.size > FINANCE_PROOF_MAX_BYTES) return "Bukti maksimal 10 MB.";
  if (!(FINANCE_PROOF_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Bukti harus berupa gambar (PNG, JPG, WebP) atau PDF.";
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Adjustment (FR-M8-02)                                                */
/* ------------------------------------------------------------------ */

export function AdjustmentDialog({
  campaignId,
  payout,
  creatorName,
  onClose,
}: {
  campaignId: string;
  payout: {
    id: string;
    base_amount: number;
    views_bonus: number;
    registrant_bonus: number;
    adjustment_amount: number;
    adjustment_reason: string;
  };
  creatorName: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [amountText, setAmountText] = useState(
    payout.adjustment_amount === 0
      ? ""
      : `${payout.adjustment_amount < 0 ? "-" : ""}${formatAmountDigits(Math.abs(payout.adjustment_amount))}`,
  );

  const form = useForm<AdjustmentFormInput, unknown, AdjustmentInput>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: { adjustment_amount: amountText, adjustment_reason: payout.adjustment_reason },
  });

  // Live preview of the new total (PRD 8.3, never below zero).
  const parsedAmount = parseSignedRupiah(amountText || "0");
  const previewTotal =
    parsedAmount === null
      ? null
      : payoutTotal({
          baseAmount: payout.base_amount,
          viewsBonus: payout.views_bonus,
          registrantBonus: payout.registrant_bonus,
          adjustmentAmount: parsedAmount,
        });

  function onSubmit(values: AdjustmentInput) {
    startTransition(async () => {
      const result = await adjustPayoutAction(campaignId, payout.id, values);
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;
  const amountField = form.register("adjustment_amount");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Penyesuaian honor · {creatorName}</DialogTitle>
            <DialogDescription>
              Pakai tanda minus untuk potongan, mis. -50.000. Alasan wajib diisi.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-4">
            <Field>
              <FieldLabel htmlFor="adj-amount">Nominal penyesuaian (Rp)</FieldLabel>
              <Input
                id="adj-amount"
                inputMode="text"
                placeholder="0"
                aria-invalid={Boolean(errors.adjustment_amount)}
                {...amountField}
                onChange={(event) => {
                  setAmountText(event.target.value);
                  void amountField.onChange(event);
                }}
              />
              <FieldDescription>
                Total baru: {previewTotal === null ? "–" : formatRupiah(previewTotal)}
              </FieldDescription>
              <FieldError errors={[errors.adjustment_amount]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="adj-reason">Alasan</FieldLabel>
              <Textarea
                id="adj-reason"
                rows={3}
                aria-invalid={Boolean(errors.adjustment_reason)}
                {...form.register("adjustment_reason")}
              />
              <FieldError errors={[errors.adjustment_reason]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan penyesuaian"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Mark paid (FR-M8-03, owner only)                                     */
/* ------------------------------------------------------------------ */

export function MarkPaidDialog({
  campaignId,
  payoutId,
  total,
  creatorName,
  onClose,
}: {
  campaignId: string;
  payoutId: string;
  total: number;
  creatorName: string;
  onClose: () => void;
}) {
  const [paidAt, setPaidAt] = useState(formatDateInput(new Date()));
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!paidAt) return setError("Tanggal bayar wajib diisi.");
    if (!file) return setError("Unggah bukti transfer.");
    const problem = checkProof(file);
    if (problem) return setError(problem);

    startTransition(async () => {
      const upload = await uploadToBucket(FINANCE_PROOF_BUCKET, campaignId, file);
      if (upload.error !== null) {
        setError(`Bukti gagal diunggah: ${upload.error}`);
        return;
      }
      const result = await markPayoutPaidAction(campaignId, payoutId, {
        paid_at: paidAt,
        transfer_proof_path: upload.path,
      });
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Tandai dibayar · {creatorName}</DialogTitle>
            <DialogDescription>
              Transfer {formatRupiah(total)}. Setelah ditandai dibayar, honor tidak dapat diubah
              lagi.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-4">
            <Field>
              <FieldLabel htmlFor="paid-at">Tanggal bayar</FieldLabel>
              <Input
                id="paid-at"
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="paid-proof">Bukti transfer (wajib)</FieldLabel>
              <Input
                id="paid-proof"
                type="file"
                accept={FINANCE_PROOF_MIME_TYPES.join(",")}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <FieldDescription>
                Gambar atau PDF, maks. 10 MB. Hanya owner yang dapat melihatnya.
              </FieldDescription>
            </Field>
            {error ? <FieldError>{error}</FieldError> : null}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Tandai dibayar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Client payments (FR-M8-05)                                           */
/* ------------------------------------------------------------------ */

export function ClientPaymentDialog({
  campaignId,
  onClose,
}: {
  campaignId: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ClientPaymentFormInput, unknown, ClientPaymentInput>({
    resolver: zodResolver(clientPaymentSchema),
    defaultValues: { invoice_number: "", amount: "", due_date: "" },
  });

  function onSubmit(values: ClientPaymentInput) {
    startTransition(async () => {
      const result = await createClientPaymentAction(campaignId, values);
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Catat invoice</DialogTitle>
            <DialogDescription>Tagihan paket kampanye kepada klien.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-4">
            <Field>
              <FieldLabel htmlFor="inv-number">Nomor invoice</FieldLabel>
              <Input
                id="inv-number"
                className="font-mono uppercase"
                aria-invalid={Boolean(errors.invoice_number)}
                {...form.register("invoice_number")}
              />
              <FieldError errors={[errors.invoice_number]} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="inv-amount">Nominal (Rp)</FieldLabel>
                <Input
                  id="inv-amount"
                  inputMode="numeric"
                  placeholder="0"
                  aria-invalid={Boolean(errors.amount)}
                  {...form.register("amount")}
                />
                <FieldError errors={[errors.amount]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="inv-due">Jatuh tempo</FieldLabel>
                <Input
                  id="inv-due"
                  type="date"
                  aria-invalid={Boolean(errors.due_date)}
                  {...form.register("due_date")}
                />
                <FieldError errors={[errors.due_date]} />
              </Field>
            </div>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan invoice"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ReceiptDialog({
  campaignId,
  payment,
  isOwner,
  onClose,
}: {
  campaignId: string;
  payment: PaymentView;
  isOwner: boolean;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClientPaymentReceiptFormInput, unknown, ClientPaymentReceiptInput>({
    resolver: zodResolver(clientPaymentReceiptSchema),
    defaultValues: {
      paid_amount: payment.paid_amount ? formatAmountDigits(payment.paid_amount) : "",
      paid_at: payment.paid_at ?? "",
      proof_path: "",
    },
  });

  function onSubmit(values: ClientPaymentReceiptInput) {
    startTransition(async () => {
      let proofPath: string | null = null;
      if (file && isOwner) {
        const problem = checkProof(file);
        if (problem) {
          setFileError(problem);
          return;
        }
        const upload = await uploadToBucket(FINANCE_PROOF_BUCKET, campaignId, file);
        if (upload.error !== null) {
          setFileError(`Bukti gagal diunggah: ${upload.error}`);
          return;
        }
        proofPath = upload.path;
      }
      const result = await recordClientPaymentAction(campaignId, payment.id, {
        ...values,
        proof_path: proofPath,
      });
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Catat pembayaran · {payment.invoice_number}</DialogTitle>
            <DialogDescription>
              Isi total yang sudah diterima dari tagihan {formatRupiah(payment.amount)}. Status
              invoice menyesuaikan otomatis.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="rc-amount">Total diterima (Rp)</FieldLabel>
                <Input
                  id="rc-amount"
                  inputMode="numeric"
                  placeholder="0"
                  aria-invalid={Boolean(errors.paid_amount)}
                  {...form.register("paid_amount")}
                />
                <FieldError errors={[errors.paid_amount]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="rc-date">Tanggal bayar terakhir</FieldLabel>
                <Input
                  id="rc-date"
                  type="date"
                  aria-invalid={Boolean(errors.paid_at)}
                  {...form.register("paid_at")}
                />
                <FieldError errors={[errors.paid_at]} />
              </Field>
            </div>
            {isOwner ? (
              <Field>
                <FieldLabel htmlFor="rc-proof">Bukti pembayaran (opsional)</FieldLabel>
                <Input
                  id="rc-proof"
                  type="file"
                  accept={FINANCE_PROOF_MIME_TYPES.join(",")}
                  onChange={(e) => {
                    const next = e.target.files?.[0] ?? null;
                    setFileError(checkProof(next));
                    setFile(next);
                  }}
                />
                {fileError ? <FieldError>{fileError}</FieldError> : null}
              </Field>
            ) : (
              <p className="text-sm text-muted-foreground">Bukti pembayaran diunggah oleh owner.</p>
            )}
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
