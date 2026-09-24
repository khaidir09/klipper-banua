"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applyFieldErrors } from "@/lib/forms";
import {
  balanceAdjustmentSchema,
  type BalanceAdjustmentFormInput,
  type BalanceAdjustmentInput,
} from "@/lib/validation/withdrawals";
import { adjustBalanceAction } from "../../penarikan/actions";

/**
 * FR-M19-06: the owner's signed correction, e.g. paying out or cancelling the
 * frozen balance of a blocked klipper (FR-M3-09). Always with a reason.
 */
export function AdjustBalanceForm({ creatorId }: { creatorId: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<BalanceAdjustmentFormInput, unknown, BalanceAdjustmentInput>({
    resolver: zodResolver(balanceAdjustmentSchema),
    defaultValues: { creator_id: creatorId, amount: "", reason: "" },
  });

  function onSubmit(values: BalanceAdjustmentInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await adjustBalanceAction(values);
      if (result.status === "success") {
        toast.success(result.message);
        form.reset({ creator_id: creatorId, amount: "", reason: "" });
      } else {
        setServerError(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}
        <Field>
          <FieldLabel htmlFor="adjust-amount">Nominal (Rp)</FieldLabel>
          <Input
            id="adjust-amount"
            placeholder="-50.000 atau 25.000"
            {...form.register("amount")}
          />
          <FieldDescription>Negatif mengurangi saldo, positif menambah.</FieldDescription>
          <FieldError errors={[errors.amount]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="adjust-reason">Alasan (dibaca klipper)</FieldLabel>
          <Textarea id="adjust-reason" rows={2} {...form.register("reason")} />
          <FieldError errors={[errors.reason]} />
        </Field>
        <Button type="submit" variant="outline" className="w-fit" disabled={isPending}>
          {isPending ? "Menyimpan…" : "Catat penyesuaian"}
        </Button>
      </FieldGroup>
    </form>
  );
}
