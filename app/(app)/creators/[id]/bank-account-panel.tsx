"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, Landmark, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { applyFieldErrors } from "@/lib/forms";
import {
  bankAccountSchema,
  type BankAccountFormInput,
  type BankAccountInput,
} from "@/lib/validation/creators";
import {
  deleteBankAccountAction,
  revealBankAccountAction,
  saveBankAccountAction,
  type BankAccountData,
} from "../actions";

type MaskedAccount = {
  bank_name: string;
  account_number_masked: string;
  /** FR-M19-04: the holder name differs from the kliper's full name. */
  holder_matches_name?: boolean;
} | null;

type BankAccountPanelProps = {
  creatorId: string;
  isOwner: boolean;
  masked: MaskedAccount;
};

/**
 * Managers only ever receive the masked view rendered by the server. Owners
 * must explicitly reveal the account; that request is written to the audit log.
 */
export function BankAccountPanel({ creatorId, isOwner, masked }: BankAccountPanelProps) {
  const [revealed, setRevealed] = useState<BankAccountData | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  function reveal() {
    startTransition(async () => {
      const result = await revealBankAccountAction({ id: creatorId });
      if (result.status === "success") setRevealed(result.data ?? null);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rekening pembayaran</CardTitle>
        <CardDescription>
          {isOwner
            ? "Hanya owner yang dapat melihat dan mengubah rekening. Setiap kali ditampilkan, aksesnya dicatat di log."
            : "Nomor rekening lengkap hanya dapat dilihat owner."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {masked ? (
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Bank</dt>
              <dd>{masked.bank_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Nomor rekening</dt>
              <dd className="font-mono">{masked.account_number_masked}</dd>
            </div>
            {masked.holder_matches_name === false ? (
              <p className="text-sm font-medium text-warning-soft-foreground sm:col-span-2">
                Nama pemilik rekening berbeda dengan nama lengkap kliper; periksa sebelum
                mentransfer.
              </p>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada data rekening.</p>
        )}

        {isOwner && revealed === undefined ? (
          <Button variant="outline" onClick={reveal} disabled={isPending}>
            <Eye aria-hidden />
            {masked ? "Tampilkan & ubah rekening" : "Isi rekening"}
          </Button>
        ) : null}

        {isOwner && revealed !== undefined ? (
          <BankAccountForm
            creatorId={creatorId}
            existing={revealed}
            onDone={() => setRevealed(undefined)}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}

function BankAccountForm({
  creatorId,
  existing,
  onDone,
}: {
  creatorId: string;
  existing: BankAccountData;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<BankAccountFormInput, unknown, BankAccountInput>({
    resolver: zodResolver(bankAccountSchema),
    defaultValues: {
      bank_name: existing?.bank_name ?? "",
      account_number: existing?.account_number ?? "",
      account_holder: existing?.account_holder ?? "",
    },
  });

  function onSubmit(values: BankAccountInput) {
    startTransition(async () => {
      const result = await saveBankAccountAction(creatorId, values);
      if (result.status === "success") {
        toast.success(result.message);
        onDone();
      } else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  function remove() {
    if (!window.confirm("Hapus data rekening kreator ini?")) return;
    startTransition(async () => {
      const result = await deleteBankAccountAction({ id: creatorId });
      if (result.status === "success") {
        toast.success(result.message);
        onDone();
      } else {
        toast.error(result.message);
      }
    });
  }

  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="rounded-lg border p-4">
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="bank_name">Nama bank</FieldLabel>
            <Input
              id="bank_name"
              aria-invalid={Boolean(errors.bank_name)}
              {...form.register("bank_name")}
            />
            <FieldError errors={[errors.bank_name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="account_number">Nomor rekening</FieldLabel>
            <Input
              id="account_number"
              inputMode="numeric"
              autoComplete="off"
              aria-invalid={Boolean(errors.account_number)}
              {...form.register("account_number")}
            />
            <FieldError errors={[errors.account_number]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="account_holder">Nama pemilik</FieldLabel>
            <Input
              id="account_holder"
              aria-invalid={Boolean(errors.account_holder)}
              {...form.register("account_holder")}
            />
            <FieldError errors={[errors.account_holder]} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={isPending}>
            <Landmark aria-hidden />
            {isPending ? "Menyimpan…" : "Simpan rekening"}
          </Button>
          <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
            Tutup
          </Button>
          {existing ? (
            <Button type="button" variant="ghost" onClick={remove} disabled={isPending}>
              <Trash2 aria-hidden />
              Hapus rekening
            </Button>
          ) : null}
        </div>
      </FieldGroup>
    </form>
  );
}
