"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { FormAsideCard, FormHints, FormLayout } from "@/components/layout/form-layout";
import { ProvinceSelect } from "@/components/forms/province-select";
import {
  CREATOR_STATUSES,
  CREATOR_STATUS_LABELS,
  CREATOR_TIERS,
  CREATOR_TIER_LABELS,
  NICHES,
  NICHE_LABELS,
} from "@/lib/constants/creators";
import { DEFAULT_PROVINCE } from "@/lib/constants/regions";
import { applyFieldErrors } from "@/lib/forms";
import { creatorSchema, type CreatorFormInput, type CreatorInput } from "@/lib/validation/creators";
import { createCreatorAction, updateCreatorAction } from "./actions";

type CreatorFormProps = {
  creatorId?: string;
  defaultValues?: Partial<CreatorFormInput>;
};

const EMPTY: CreatorFormInput = {
  full_name: "",
  stage_name: "",
  phone_wa: "",
  email: "",
  city: "",
  province: DEFAULT_PROVINCE,
  birth_date: "",
  niches: [],
  tier: "nano",
  status: "prospek",
  notes: "",
};

export function CreatorForm({ creatorId, defaultValues }: CreatorFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Held separately so the fields below can render the initial selection in
  // the markup, not only through React Hook Form's ref (see ProvinceSelect).
  const initial: CreatorFormInput = { ...EMPTY, ...defaultValues };

  const form = useForm<CreatorFormInput, unknown, CreatorInput>({
    resolver: zodResolver(creatorSchema),
    defaultValues: initial,
  });

  function onSubmit(values: CreatorInput) {
    setServerError(null);
    startTransition(async () => {
      // A successful save redirects to the detail page and never returns.
      const result = creatorId
        ? await updateCreatorAction(creatorId, values)
        : await createCreatorAction(values);
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
  const field = (name: keyof CreatorFormInput) => {
    const value = initial[name];
    return {
      id: name,
      "aria-invalid": Boolean(errors[name]),
      ...(typeof value === "string" ? { defaultValue: value } : {}),
      ...form.register(name),
    };
  };

  const aside = (
    <FormAsideCard title={creatorId ? "Yang perlu diingat" : "Sebelum menyimpan"}>
      <FormHints
        items={[
          "Tanggal lahir boleh dikosongkan. Kreator wajib melengkapinya sendiri dari portal sebelum menarik saldo.",
          "Nama panggung dipakai sebagai nama tampil di laporan, keuangan, dan dasbor. Bila kosong, nama lengkap yang dipakai.",
          "Nomor WhatsApp muncul di halaman kreator kampanye untuk koordinasi penugasan.",
          "Niche dan tier dipakai saat menyaring kandidat untuk sebuah kampanye.",
          "Status Terverifikasi diberikan lewat tombol Verifikasi di halaman detail, bukan dari formulir ini.",
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

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="full_name">Nama lengkap</FieldLabel>
              <Input {...field("full_name")} />
              <FieldError errors={[errors.full_name]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="stage_name">Nama panggung</FieldLabel>
              <Input {...field("stage_name")} />
              <FieldError errors={[errors.stage_name]} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="phone_wa">Nomor WhatsApp</FieldLabel>
              <Input {...field("phone_wa")} inputMode="tel" placeholder="0812-3456-7890" />
              <FieldError errors={[errors.phone_wa]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input {...field("email")} type="email" />
              <FieldError errors={[errors.email]} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="province">Provinsi</FieldLabel>
              <ProvinceSelect {...field("province")} />
              <FieldError errors={[errors.province]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="city">Kota / kabupaten</FieldLabel>
              <Input {...field("city")} />
              <FieldError errors={[errors.city]} />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="birth_date">Tanggal lahir</FieldLabel>
            <Input {...field("birth_date")} type="date" className="sm:max-w-xs" />
            <FieldDescription>
              Opsional. Usia bukan syarat; tanggal lahir baru wajib sebelum penarikan saldo.
            </FieldDescription>
            <FieldError errors={[errors.birth_date]} />
          </Field>

          <FieldSet>
            <FieldLegend>Niche</FieldLegend>
            <Controller
              control={form.control}
              name="niches"
              render={({ field }) => {
                const selected = field.value ?? [];
                return (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                    {NICHES.map((niche) => {
                      const id = `niche-${niche}`;
                      const checked = selected.includes(niche);
                      return (
                        <Field key={niche} orientation="horizontal">
                          <Checkbox
                            id={id}
                            checked={checked}
                            onCheckedChange={(value) =>
                              field.onChange(
                                value === true
                                  ? [...selected, niche]
                                  : selected.filter((item) => item !== niche),
                              )
                            }
                          />
                          <FieldLabel htmlFor={id} className="font-normal">
                            {NICHE_LABELS[niche]}
                          </FieldLabel>
                        </Field>
                      );
                    })}
                  </div>
                );
              }}
            />
            <FieldError errors={[errors.niches]} />
          </FieldSet>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="tier">Tier</FieldLabel>
              <NativeSelect {...field("tier")}>
                {CREATOR_TIERS.map((tier) => (
                  <NativeSelectOption key={tier} value={tier}>
                    {CREATOR_TIER_LABELS[tier]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.tier]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <NativeSelect {...field("status")}>
                {CREATOR_STATUSES.map((status) => (
                  <NativeSelectOption key={status} value={status}>
                    {CREATOR_STATUS_LABELS[status]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>
                Status Terverifikasi sebaiknya diberikan lewat tombol Verifikasi di halaman detail.
              </FieldDescription>
              <FieldError errors={[errors.status]} />
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="notes">Catatan</FieldLabel>
            <Textarea {...field("notes")} rows={3} />
            <FieldError errors={[errors.notes]} />
          </Field>

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : creatorId ? "Simpan perubahan" : "Simpan kreator"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href={creatorId ? `/creators/${creatorId}` : "/creators"}>Batal</Link>
            </Button>
          </div>
        </FieldGroup>
      </form>
    </FormLayout>
  );
}
