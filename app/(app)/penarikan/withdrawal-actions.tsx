"use client";

import { useState, useTransition } from "react";
import { Check, Loader, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FINANCE_PROOF_BUCKET,
  FINANCE_PROOF_MAX_BYTES,
  FINANCE_PROOF_MIME_TYPES,
} from "@/lib/constants/finance";
import type { WithdrawalStatus } from "@/lib/constants/withdrawals";
import { formatRupiah } from "@/lib/format/currency";
import { uploadToBucket } from "@/lib/storage/upload";
import { processWithdrawalAction } from "./actions";

type Mode = "dibayar" | "ditolak" | null;

/**
 * FR-M19-06: the owner's next step on one withdrawal. Paying needs the
 * transfer date and the receipt, uploaded straight to the owner-only bucket;
 * rejecting needs a reason the klipper will read.
 */
export function WithdrawalActions({
  id,
  status,
  amount,
  accountLabel,
  today,
}: {
  id: string;
  status: WithdrawalStatus;
  amount: number;
  accountLabel: string;
  today: string;
}) {
  const [mode, setMode] = useState<Mode>(null);
  const [paidAt, setPaidAt] = useState(today);
  const [fee, setFee] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(values: Record<string, unknown>) {
    setError(null);
    startTransition(async () => {
      const result = await processWithdrawalAction({ withdrawal_id: id, ...values });
      if (result.status === "success") {
        toast.success(result.message);
        setMode(null);
      } else {
        setError(result.message);
        if (!mode) toast.error(result.message);
      }
    });
  }

  function pay() {
    if (!file) {
      setError("Unggah bukti transfer.");
      return;
    }
    if (file.size > FINANCE_PROOF_MAX_BYTES) {
      setError("Berkas lebih dari 10 MB.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const upload = await uploadToBucket(FINANCE_PROOF_BUCKET, "withdrawals", file);
      if (upload.error !== null) {
        setError(`Bukti gagal diunggah: ${upload.error}`);
        return;
      }
      const result = await processWithdrawalAction({
        withdrawal_id: id,
        status: "dibayar",
        paid_at: paidAt,
        proof_path: upload.path,
        transfer_fee: fee,
      });
      if (result.status === "success") {
        toast.success(result.message);
        setMode(null);
      } else setError(result.message);
    });
  }

  if (status === "dibayar" || status === "ditolak") return null;

  return (
    <>
      <div className="flex flex-wrap justify-end gap-2">
        {status === "diajukan" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => run({ status: "diproses" })}
          >
            <Loader aria-hidden />
            Proses
          </Button>
        ) : (
          <Button size="sm" disabled={isPending} onClick={() => setMode("dibayar")}>
            <Check aria-hidden />
            Tandai dibayar
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={isPending} onClick={() => setMode("ditolak")}>
          <X aria-hidden />
          Tolak
        </Button>
      </div>

      {mode ? (
        <Dialog open onOpenChange={(open) => !open && setMode(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{mode === "dibayar" ? "Tandai dibayar" : "Tolak penarikan"}</DialogTitle>
              <DialogDescription>
                {formatRupiah(amount)} ke {accountLabel}.
                {mode === "ditolak" ? " Saldo klipper dikembalikan otomatis." : ""}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="my-2">
              {error ? (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}
              {mode === "dibayar" ? (
                <>
                  <Field>
                    <FieldLabel htmlFor={`paid-${id}`}>Tanggal transfer</FieldLabel>
                    <Input
                      id={`paid-${id}`}
                      type="date"
                      value={paidAt}
                      max={today}
                      onChange={(event) => setPaidAt(event.target.value)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`fee-${id}`}>Biaya transfer (Rp)</FieldLabel>
                    <Input
                      id={`fee-${id}`}
                      inputMode="numeric"
                      placeholder="0"
                      value={fee}
                      onChange={(event) => setFee(event.target.value)}
                    />
                    <FieldDescription>
                      Ditanggung klipper: transfer {formatRupiah(amount)} dikurangi biaya ini.
                    </FieldDescription>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`proof-${id}`}>Bukti transfer</FieldLabel>
                    <Input
                      id={`proof-${id}`}
                      type="file"
                      accept={FINANCE_PROOF_MIME_TYPES.join(",")}
                      onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                    />
                    <FieldDescription>Wajib. Hanya owner yang dapat melihatnya.</FieldDescription>
                  </Field>
                </>
              ) : (
                <Field>
                  <FieldLabel htmlFor={`reason-${id}`}>Alasan (dibaca klipper)</FieldLabel>
                  <Textarea
                    id={`reason-${id}`}
                    rows={3}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                </Field>
              )}
            </FieldGroup>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMode(null)} disabled={isPending}>
                Batal
              </Button>
              {mode === "dibayar" ? (
                <Button onClick={pay} disabled={isPending}>
                  <Upload aria-hidden />
                  {isPending ? "Menyimpan…" : "Simpan pembayaran"}
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={() => run({ status: "ditolak", reason })}
                  disabled={isPending}
                >
                  {isPending ? "Menyimpan…" : "Tolak dan kembalikan saldo"}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
