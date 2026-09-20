"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleCheck, Loader2, OctagonAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { requestPasswordResetAction } from "../actions";
import type { ActionResult } from "../actions";

export function ForgotPasswordForm() {
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  function onSubmit(values: ForgotPasswordInput) {
    setResult(null);
    startTransition(async () => {
      const actionResult = await requestPasswordResetAction(values);
      setResult(actionResult);
      if (actionResult.status === "success") {
        form.reset();
      }
    });
  }

  const failed = result?.status === "error";

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {result ? (
          <Alert variant={failed ? "destructive" : "default"}>
            {failed ? (
              <OctagonAlert aria-hidden />
            ) : (
              <CircleCheck className="text-success" aria-hidden />
            )}
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoFocus
            className="h-11"
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>

        <Button type="submit" disabled={isPending} className="h-11 w-full">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Mengirim…
            </>
          ) : (
            "Kirim tautan"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
