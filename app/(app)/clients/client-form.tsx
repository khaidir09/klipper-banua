"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ProvinceSelect } from "@/components/forms/province-select";
import { CLIENT_TYPES, CLIENT_TYPE_LABELS } from "@/lib/constants/clients";
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
  province: "Kalimantan Selatan",
  address: "",
  notes: "",
};

export function ClientForm({ clientId, defaultValues }: ClientFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClientFormInput, unknown, ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-2xl">
      <FieldGroup>
        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        <Field>
          <FieldLabel htmlFor="name">Nama klien</FieldLabel>
          <Input id="name" aria-invalid={Boolean(errors.name)} {...form.register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="type">Jenis</FieldLabel>
            <NativeSelect id="type" {...form.register("type")}>
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
            <ProvinceSelect id="province" {...form.register("province")} />
            <FieldError errors={[errors.province]} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="city">Kota / kabupaten</FieldLabel>
          <Input id="city" aria-invalid={Boolean(errors.city)} {...form.register("city")} />
          <FieldError errors={[errors.city]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="address">Alamat</FieldLabel>
          <Textarea id="address" rows={3} {...form.register("address")} />
          <FieldError errors={[errors.address]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="notes">Catatan</FieldLabel>
          <Textarea id="notes" rows={3} {...form.register("notes")} />
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
  );
}
