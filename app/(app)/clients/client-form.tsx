"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormAsideCard, FormHints, FormLayout } from "@/components/layout/form-layout";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ProvinceSelect } from "@/components/forms/province-select";
import { CLIENT_TYPES, CLIENT_TYPE_LABELS } from "@/lib/constants/clients";
import { DEFAULT_PROVINCE } from "@/lib/constants/regions";
import { applyFieldErrors } from "@/lib/forms";
import { clientSchema, type ClientFormInput, type ClientInput } from "@/lib/validation/clients";
import { createClientAction, updateClientAction } from "./actions";

type ClientFormProps = {
  clientId?: string;
  defaultValues?: Partial<ClientFormInput>;
};

const EMPTY: ClientFormInput = {
  name: "",
  type: "kampus_swasta",
  city: "",
  province: DEFAULT_PROVINCE,
  address: "",
  notes: "",
};

export function ClientForm({ clientId, defaultValues }: ClientFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Held separately so the fields below can render the initial selection in
  // the markup, not only through React Hook Form's ref (see ProvinceSelect).
  const initial: ClientFormInput = { ...EMPTY, ...defaultValues };

  const form = useForm<ClientFormInput, unknown, ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: initial,
  });

  function onSubmit(values: ClientInput) {
    setServerError(null);
    startTransition(async () => {
      // A successful save redirects to the detail page and never returns.
      const result = clientId
        ? await updateClientAction(clientId, values)
        : await createClientAction(values);
      if (result?.status === "error") {
        setServerError(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;

  // Every registered field renders its initial value in the markup. React Hook
  // Form otherwise assigns it through a ref after mount, which a
  // server-rendered page loses during hydration, leaving the field blank while
  // the form state holds the stored value.
  const field = (name: keyof ClientFormInput) => {
    const value = initial[name];
    return {
      id: name,
      "aria-invalid": Boolean(errors[name]),
      ...(typeof value === "string" ? { defaultValue: value } : {}),
      ...form.register(name),
    };
  };

  const aside = (
    <FormAsideCard title={clientId ? "Yang perlu diingat" : "Sebelum menyimpan"}>
      <FormHints
        items={[
          "Nama klien dipakai apa adanya pada laporan dan tautan berbagi, jadi tulis nama resmi instansi.",
          "Provinsi dan kota dipakai untuk menyaring daftar klien; isi sesuai lokasi kantor utama.",
          "Catatan hanya terlihat tim internal dan tidak pernah ikut ke laporan klien.",
          clientId
            ? "Narahubung dikelola terpisah di halaman detail klien."
            : "Setelah tersimpan, tambahkan narahubung dan buat kampanye dari halaman detail klien.",
        ]}
      />
    </FormAsideCard>
  );

  return (
    <FormLayout aside={aside}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
        <FieldGroup>
          {serverError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <Field>
            <FieldLabel htmlFor="name">Nama klien</FieldLabel>
            <Input {...field("name")} />
            <FieldError errors={[errors.name]} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="type">Jenis</FieldLabel>
              <NativeSelect {...field("type")}>
                {CLIENT_TYPES.map((type) => (
                  <NativeSelectOption key={type} value={type}>
                    {CLIENT_TYPE_LABELS[type]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.type]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="province">Provinsi</FieldLabel>
              <ProvinceSelect {...field("province")} />
              <FieldError errors={[errors.province]} />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="city">Kota / kabupaten</FieldLabel>
            <Input {...field("city")} />
            <FieldError errors={[errors.city]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="address">Alamat</FieldLabel>
            <Textarea {...field("address")} rows={3} />
            <FieldError errors={[errors.address]} />
          </Field>

          <Field>
            <FieldLabel htmlFor="notes">Catatan</FieldLabel>
            <Textarea {...field("notes")} rows={3} />
            <FieldError errors={[errors.notes]} />
          </Field>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : clientId ? "Simpan perubahan" : "Simpan klien"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={clientId ? `/clients/${clientId}` : "/clients"}>Batal</Link>
            </Button>
          </div>
        </FieldGroup>
      </form>
    </FormLayout>
  );
}
