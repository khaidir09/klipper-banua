"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowDownToLine } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/format/currency";
import { applyFieldErrors } from "@/lib/forms";
import {
  withdrawalRequestSchema,
  type WithdrawalRequestFormInput,
  type WithdrawalRequestInput,
} from "@/lib/validation/withdrawals";
import { requestWithdrawalAction } from "./actions";

/**
 * FR-M19-05. `blocker` explains why the form is off (no account, hold after
 * a change, one already in progress, balance under the minimum); the server
 * checks everything again under a row lock.
 */
export function WithdrawForm({
  available,
  minWithdrawal,
  blocker,
}: {
  available: number;
  minWithdrawal: number;
  blocker: string | null;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<WithdrawalRequestFormInput, unknown, WithdrawalRequestInput>({
    resolver: zodResolver(withdrawalRequestSchema),
    defaultValues: { amount: available > 0 ? String(available) : "" },
  });

  function onSubmit(values: WithdrawalRequestInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await requestWithdrawalAction(values);
      if (result.status === "success") {
        toast.success(result.message);
        form.reset({ amount: "" });
      } else {
        setServerError(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Tarik saldo</h2>
        </CardTitle>
        <CardDescription>
          Minimum {formatRupiah(minWithdrawal)}. Ditransfer manual oleh tim ke rekening Anda,
          biasanya paling lambat 1 hari kerja. Biaya transfer antarbank/e-wallet ditanggung klipper
          dan dipotong dari nominal yang ditransfer.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {blocker ? (
          <p className="text-sm font-medium text-muted-foreground">{blocker}</p>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              {serverError ? (
                <Alert variant="destructive">
                  <AlertDescription>{serverError}</AlertDescription>
                </Alert>
              ) : null}
              <Field>
                <FieldLabel htmlFor="withdraw-amount">Nominal (Rp)</FieldLabel>
                <Input id="withdraw-amount" inputMode="numeric" {...form.register("amount")} />
                <FieldDescription>Saldo tersedia {formatRupiah(available)}.</FieldDescription>
                <FieldError errors={[form.formState.errors.amount]} />
              </Field>
              <Button type="submit" className="h-11" disabled={isPending}>
                <ArrowDownToLine aria-hidden />
                {isPending ? "Mengajukan…" : "Ajukan penarikan"}
              </Button>
            </FieldGroup>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
