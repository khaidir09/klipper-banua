"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MailCheck, OctagonAlert } from "lucide-react";
import { ProvinceSelect } from "@/components/forms/province-select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { MINIMUM_CREATOR_AGE } from "@/lib/constants/creators";
import { DEFAULT_PROVINCE } from "@/lib/constants/regions";
import { signupSchema, type SignupFormInput, type SignupInput } from "@/lib/validation/signup";
import { signUpCreatorAction } from "./actions";

type TextFieldName = "email" | "full_name" | "stage_name" | "phone_wa" | "city" | "birth_date";

const CONSENTS = [
  {
    name: "agree_terms",
    label: (
      <>
        Saya menyetujui{" "}
        <Link href="/syarat" target="_blank" className="underline underline-offset-4">
          Syarat Klipper
        </Link>
        , termasuk larangan views palsu dan kewajiban kode verifikasi di setiap klip.
      </>
    ),
  },
  {
    name: "agree_privacy",
    label: (
      <>
        Saya menyetujui{" "}
        <Link href="/privasi" target="_blank" className="underline underline-offset-4">
          Kebijakan Privasi
        </Link>
        .
      </>
    ),
  },
  {
    name: "confirm_adult",
    label: <>Saya berusia minimal {MINIMUM_CREATOR_AGE} tahun.</>,
  },
] as const;

/** FR-M16-01. The server repeats every check; this form only helps earlier. */
export function SignupForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SignupFormInput, unknown, SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
      full_name: "",
      stage_name: "",
      birth_date: "",
      phone_wa: "",
      city: "",
      province: DEFAULT_PROVINCE,
      agree_terms: false,
      agree_privacy: false,
      confirm_adult: false,
    },
  });
  const { errors } = form.formState;

  function onSubmit(values: SignupInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await signUpCreatorAction(values);
      if (result.status === "success") {
        setSentTo(result.data?.email ?? values.email);
        return;
      }
      setServerError(result.message);
      for (const [key, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(key as keyof SignupFormInput, { message });
      }
    });
  }

  if (sentTo) {
    return (
      <Alert>
        <MailCheck className="text-success" aria-hidden />
        <AlertTitle>Cek email Anda</AlertTitle>
        <AlertDescription>
          <p>
            Kami mengirim tautan konfirmasi ke <strong>{sentTo}</strong>. Buka tautan itu untuk
            mengaktifkan akun, lalu tambahkan akun media sosial Anda.
          </p>
          <p className="mt-2">
            Tidak ada email dalam beberapa menit? Periksa folder spam, atau{" "}
            <Link href="/login" className="underline underline-offset-4">
              masuk
            </Link>{" "}
            bila akun Anda sudah aktif.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  function textField(
    name: TextFieldName,
    label: string,
    props: React.ComponentProps<typeof Input> = {},
    description?: string,
  ) {
    return (
      <Field>
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        <Input
          id={name}
          className="h-11"
          aria-invalid={Boolean(errors[name])}
          {...props}
          {...form.register(name)}
        />
        {description ? <FieldDescription>{description}</FieldDescription> : null}
        <FieldError errors={[errors[name]]} />
      </Field>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {serverError ? (
          <Alert variant="destructive">
            <OctagonAlert aria-hidden />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        {textField("email", "Email", { type: "email", inputMode: "email", autoComplete: "email" })}

        <Field>
          <FieldLabel htmlFor="password">Kata sandi</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            className="h-11"
            aria-invalid={Boolean(errors.password)}
            {...form.register("password")}
          />
          <FieldDescription>
            Minimal 8 karakter, dengan huruf besar, huruf kecil, dan angka.
          </FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="passwordConfirmation">Ulangi kata sandi</FieldLabel>
          <Input
            id="passwordConfirmation"
            type="password"
            autoComplete="new-password"
            className="h-11"
            aria-invalid={Boolean(errors.passwordConfirmation)}
            {...form.register("passwordConfirmation")}
          />
          <FieldError errors={[errors.passwordConfirmation]} />
        </Field>

        {textField(
          "full_name",
          "Nama lengkap",
          { autoComplete: "name" },
          "Sesuai rekening bank atau e-wallet, agar honor bisa ditransfer.",
        )}
        {textField(
          "stage_name",
          "Nama panggung",
          { autoComplete: "nickname" },
          "Nama yang dilihat klien di laporan kampanye.",
        )}
        {textField("birth_date", "Tanggal lahir", { type: "date", autoComplete: "bday" })}
        {textField(
          "phone_wa",
          "Nomor WhatsApp",
          { type: "tel", inputMode: "tel", autoComplete: "tel", placeholder: "0812-3456-7890" },
          "Untuk koordinasi kampanye. Satu nomor hanya untuk satu akun.",
        )}
        {textField("city", "Kota/kabupaten", { autoComplete: "address-level2" })}

        <Field>
          <FieldLabel htmlFor="province">Provinsi</FieldLabel>
          <ProvinceSelect
            id="province"
            className="h-11 w-full"
            defaultValue={DEFAULT_PROVINCE}
            aria-invalid={Boolean(errors.province)}
            {...form.register("province")}
          />
          <FieldError errors={[errors.province]} />
        </Field>

        {CONSENTS.map((consent) => (
          <Controller
            key={consent.name}
            control={form.control}
            name={consent.name}
            render={({ field, fieldState }) => (
              <Field orientation="horizontal" data-invalid={Boolean(fieldState.error)}>
                <Checkbox
                  id={consent.name}
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-invalid={Boolean(fieldState.error)}
                />
                <FieldContent>
                  <FieldLabel htmlFor={consent.name} className="font-normal">
                    {consent.label}
                  </FieldLabel>
                  <FieldError errors={[fieldState.error]} />
                </FieldContent>
              </Field>
            )}
          />
        ))}

        <Button type="submit" disabled={isPending} className="h-11 w-full">
          {isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden />
              Mendaftarkan…
            </>
          ) : (
            "Daftar jadi Klipper"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-foreground underline underline-offset-4">
            Masuk
          </Link>
        </p>
      </FieldGroup>
    </form>
  );
}
