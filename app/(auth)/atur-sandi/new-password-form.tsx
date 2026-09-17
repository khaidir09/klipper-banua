"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { newPasswordSchema, type NewPasswordInput } from "@/lib/validation/auth";
import { updatePasswordAction } from "../actions";

export function NewPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<NewPasswordInput>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: "", passwordConfirmation: "" },
  });

  function onSubmit(values: NewPasswordInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await updatePasswordAction(values);
      if (result?.status === "error") {
        setServerError(result.message);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel htmlFor="password">Kata sandi baru</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            autoFocus
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="passwordConfirmation">Ulangi kata sandi baru</FieldLabel>
          <Input
            id="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.passwordConfirmation)}
            {...form.register("passwordConfirmation")}
          />
          <FieldError errors={[form.formState.errors.passwordConfirmation]} />
        </Field>

        <Button type="submit" disabled={isPending}>
          {isPending ? "Menyimpan…" : "Simpan kata sandi"}
        </Button>
      </FieldGroup>
    </form>
  );
}
