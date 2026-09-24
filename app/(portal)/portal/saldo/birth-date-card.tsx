"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { applyFieldErrors } from "@/lib/forms";
import { ownBirthDateSchema } from "@/lib/validation/creators";
import { saveOwnBirthDateAction } from "./actions";

type BirthDateFormInput = z.input<typeof ownBirthDateSchema>;
type BirthDateInput = z.output<typeof ownBirthDateSchema>;

/**
 * FR-M3-02: age is not a requirement, but the birth date is filled in once
 * before the first withdrawal. Later changes go through the team.
 */
export function BirthDateCard() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<BirthDateFormInput, unknown, BirthDateInput>({
    resolver: zodResolver(ownBirthDateSchema),
    defaultValues: { birth_date: "" },
  });

  function onSubmit(values: BirthDateInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await saveOwnBirthDateAction(values);
      if (result.status === "success") {
        toast.success(result.message);
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
          <h2 className="flex items-center gap-2">
            <CalendarDays className="size-5" aria-hidden />
            Lengkapi tanggal lahir
          </h2>
        </CardTitle>
        <CardDescription>
          Sebelum tarik saldo pertama kali, isi tanggal lahirmu buat mencocokkan data penerima
          transfer. Cukup sekali. Kalau nanti salah, hubungi tim buat mengubahnya.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor="birth_date">Tanggal lahir</FieldLabel>
              <Input
                id="birth_date"
                type="date"
                autoComplete="bday"
                className="sm:max-w-xs"
                {...form.register("birth_date")}
              />
              <FieldDescription>Pastikan sudah benar sebelum disimpan.</FieldDescription>
              <FieldError errors={[form.formState.errors.birth_date]} />
            </Field>
            <Button type="submit" className="h-11 sm:w-fit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan tanggal lahir"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
