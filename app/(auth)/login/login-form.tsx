"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Info, Loader2, OctagonAlert } from "lucide-react";
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
          // The icon carries the same meaning as the colour, so the state still
          // reads for anyone who cannot tell the two variants apart.
          <Alert variant={serverError ? "destructive" : "default"}>
            {serverError ? (
              <OctagonAlert aria-hidden />
            ) : (
              <Info className="text-info" aria-hidden />
            )}
            <AlertDescription>{message}</AlertDescription>
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

        <Field>
          <div className="flex items-baseline justify-between gap-3">
            <FieldLabel htmlFor="password">Kata sandi</FieldLabel>
            <Link
              href="/lupa-sandi"
              className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Lupa kata sandi?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-11"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>

        <input type="hidden" {...form.register("next")} />

        {/* h-11 clears the 44px touch target that the default h-8 misses. */}
        <Button type="submit" disabled={isPending} className="h-11 w-full">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Memproses…
            </>
          ) : (
            "Masuk"
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
