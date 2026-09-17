"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { signInAction } from "../actions";

export function LoginForm({ next, notice }: { next?: string; notice?: string | null }) {
  const [serverError, setServerError] = useState<string | null>(null);

  // The action result replaces the notice carried in the URL, so the same
  // sentence is never shown twice.
  const message = serverError ?? notice ?? null;
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", next },
  });

  function onSubmit(values: LoginInput) {
    setServerError(null);
    startTransition(async () => {
      // A successful sign-in redirects server-side and never returns.
      const result = await signInAction(values);
      if (result?.status === "error") {
        setServerError(result.message);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {message ? (
          <Alert variant={serverError ? "destructive" : "default"}>
            <AlertDescription>{message}</AlertDescription>
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

        <Field>
          <FieldLabel htmlFor="password">Kata sandi</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>

        <input type="hidden" {...form.register("next")} />

        <Button type="submit" disabled={isPending}>
          {isPending ? "Memproses…" : "Masuk"}
        </Button>

        <Link
          href="/lupa-sandi"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          Lupa kata sandi?
        </Link>
      </FieldGroup>
    </form>
  );
}
