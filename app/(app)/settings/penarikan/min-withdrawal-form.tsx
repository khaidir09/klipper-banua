"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/format/currency";
import { applyFieldErrors } from "@/lib/forms";
import { parseRupiah } from "@/lib/validation/money";
import {
  minWithdrawalSchema,
  type MinWithdrawalFormInput,
  type MinWithdrawalInput,
} from "@/lib/validation/withdrawals";
import { updateMinWithdrawalAction } from "../../penarikan/actions";

/** Views needed to earn the amount at a rate, for the hint under the input. */
function viewsAt(amount: number, ratePer1000Views: number) {
  return Math.ceil((amount * 1000) / ratePer1000Views);
}

/** The owner changes the minimum withdrawal (FR-M19-05) without a release. */
export function MinWithdrawalForm({
  current,
  referenceRate,
}: {
  current: number;
  /** A typical rate per 1.000 views, only to explain the amount in views. */
  referenceRate: number;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<MinWithdrawalFormInput, unknown, MinWithdrawalInput>({
    resolver: zodResolver(minWithdrawalSchema),
    defaultValues: { min_withdrawal: String(current) },
  });
  const typed = parseRupiah(useWatch({ control: form.control, name: "min_withdrawal" }));

  function onSubmit(values: MinWithdrawalInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await updateMinWithdrawalAction(values);
      if (result.status === "success") toast.success(result.message);
      else {
        setServerError(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-md">
      <FieldGroup>
        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="min-withdrawal">Minimum penarikan (Rp)</FieldLabel>
          <Input id="min-withdrawal" inputMode="numeric" {...form.register("min_withdrawal")} />
          <FieldDescription>
            {typed
              ? `${formatRupiah(typed)} ≈ ${viewsAt(typed, referenceRate).toLocaleString("id-ID")} views pada tarif ${formatRupiah(referenceRate)} per 1.000 views.`
              : "Isi nominal Rupiah utuh."}
          </FieldDescription>
          <FieldError errors={[form.formState.errors.min_withdrawal]} />
        </Field>
        <Button type="submit" className="w-fit" disabled={isPending}>
          {isPending ? "Menyimpan…" : "Simpan"}
        </Button>
      </FieldGroup>
    </form>
  );
}
