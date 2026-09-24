"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Landmark, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { PAYOUT_BANKS } from "@/lib/constants/withdrawals";
import { applyFieldErrors } from "@/lib/forms";
import {
  portalBankAccountSchema,
  type PortalBankAccountFormInput,
  type PortalBankAccountInput,
} from "@/lib/validation/withdrawals";
import { saveOwnBankAccountAction } from "./actions";

export type BankAccountSummary = {
  bankName: string;
  numberMasked: string;
  holder: string;
  holderMatchesName: boolean;
  /** Formatted end of the 24-hour hold, when one is running. */
  holdUntilLabel: string | null;
};

/**
 * FR-M19-04: the klipper fills in their own account. The full number is
 * never sent back to the browser; only the last four digits are shown.
 */
export function BankAccountCard({
  account,
  fullName,
  readOnly = false,
}: {
  account: BankAccountSummary | null;
  fullName: string;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(account === null && !readOnly);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<PortalBankAccountFormInput, unknown, PortalBankAccountInput>({
    resolver: zodResolver(portalBankAccountSchema),
    defaultValues: {
      bank_name: (account?.bankName as PortalBankAccountFormInput["bank_name"]) ?? PAYOUT_BANKS[0],
      account_number: "",
      account_holder: account?.holder ?? fullName,
    },
  });

  function onSubmit(values: PortalBankAccountInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await saveOwnBankAccountAction(values);
      if (result.status === "success") {
        toast.success(result.message);
        setEditing(false);
        form.resetField("account_number");
      } else {
        setServerError(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2 className="flex items-center gap-2">
            <Landmark className="size-5" aria-hidden />
            Rekening penarikan
          </h2>
        </CardTitle>
        <CardDescription>
          Bank atau e-wallet atas nama Anda sendiri. Nama pemilik harus sama dengan nama lengkap
          akun ({fullName}).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {account && !editing ? (
          <>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted-foreground">Bank / e-wallet</dt>
                <dd className="font-medium">{account.bankName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Nomor</dt>
                <dd className="font-mono">{account.numberMasked}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Nama pemilik</dt>
                <dd>{account.holder}</dd>
              </div>
            </dl>
            {!account.holderMatchesName ? (
              <Alert>
                <CircleAlert />
                <AlertDescription>
                  Nama pemilik berbeda dengan nama lengkap akun. Owner memeriksanya sebelum
                  mentransfer.
                </AlertDescription>
              </Alert>
            ) : null}
            {account.holdUntilLabel ? (
              <p className="text-sm text-muted-foreground">
                Rekening baru diubah. Penarikan dapat diajukan mulai {account.holdUntilLabel}.
              </p>
            ) : null}
            {readOnly ? null : (
              <Button variant="outline" onClick={() => setEditing(true)}>
                <Pencil aria-hidden />
                Ubah rekening
              </Button>
            )}
          </>
        ) : null}

        {editing ? (
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {serverError ? (
                <Alert variant="destructive">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              ) : null}
              <Field>
                <FieldLabel htmlFor="bank-name">Bank / e-wallet</FieldLabel>
                <NativeSelect id="bank-name" {...form.register("bank_name")}>
                  {PAYOUT_BANKS.map((bank) => (
                    <NativeSelectOption key={bank} value={bank}>
                      {bank}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.bank_name]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="bank-number">Nomor rekening / nomor HP e-wallet</FieldLabel>
                <Input
                  id="bank-number"
                  inputMode="numeric"
                  autoComplete="off"
                  {...form.register("account_number")}
                />
                <FieldError errors={[errors.account_number]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="bank-holder">Nama pemilik</FieldLabel>
                <Input id="bank-holder" {...form.register("account_holder")} />
                {account ? (
                  <FieldDescription>
                    Mengubah rekening menahan penarikan baru selama 24 jam.
                  </FieldDescription>
                ) : null}
                <FieldError errors={[errors.account_holder]} />
              </Field>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" className="h-11" disabled={isPending}>
                  {isPending ? "Menyimpan…" : "Simpan rekening"}
                </Button>
                {account ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11"
                    onClick={() => setEditing(false)}
                  >
                    Batal
                  </Button>
                ) : null}
              </div>
            </FieldGroup>
          </form>
        ) : null}

        {!account && readOnly ? (
          <p className="text-sm text-muted-foreground">Belum ada rekening.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
