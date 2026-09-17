"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {result ? (
          <Alert variant={result.status === "error" ? "destructive" : "default"}>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            aria-invalid={Boolean(form.formState.errors.email)}
            {...form.register("email")}
          />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Mengirim…" : "Kirim tautan"}
        </Button>
      </FieldGroup>
    </form>
  );
}
