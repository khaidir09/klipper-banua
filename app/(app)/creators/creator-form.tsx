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
import { ProvinceSelect } from "@/components/forms/province-select";
import {
  CREATOR_STATUSES,
  CREATOR_STATUS_LABELS,
  CREATOR_TIERS,
  CREATOR_TIER_LABELS,
  MINIMUM_CREATOR_AGE,
  NICHES,
  NICHE_LABELS,
} from "@/lib/constants/creators";
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
  province: "Kalimantan Selatan",
  birth_date: "",
  niches: [],
  tier: "nano",
  status: "prospek",
  notes: "",
};

export function CreatorForm({ creatorId, defaultValues }: CreatorFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CreatorFormInput, unknown, CreatorInput>({
    resolver: zodResolver(creatorSchema),
    defaultValues: { ...EMPTY, ...defaultValues },
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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="max-w-2xl">
      <FieldGroup>
        {serverError ? (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="full_name">Nama lengkap</FieldLabel>
            <Input
              id="full_name"
              aria-invalid={Boolean(errors.full_name)}
              {...form.register("full_name")}
            />
            <FieldError errors={[errors.full_name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="stage_name">Nama panggung</FieldLabel>
            <Input id="stage_name" {...form.register("stage_name")} />
            <FieldError errors={[errors.stage_name]} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="phone_wa">Nomor WhatsApp</FieldLabel>
            <Input
              id="phone_wa"
              inputMode="tel"
              placeholder="0812-3456-7890"
              aria-invalid={Boolean(errors.phone_wa)}
              {...form.register("phone_wa")}
            />
            <FieldError errors={[errors.phone_wa]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              aria-invalid={Boolean(errors.email)}
              {...form.register("email")}
            />
            <FieldError errors={[errors.email]} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="province">Provinsi</FieldLabel>
            <ProvinceSelect id="province" {...form.register("province")} />
            <FieldError errors={[errors.province]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="city">Kota / kabupaten</FieldLabel>
            <Input id="city" {...form.register("city")} />
            <FieldError errors={[errors.city]} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="birth_date">Tanggal lahir</FieldLabel>
          <Input
            id="birth_date"
            type="date"
            className="sm:max-w-xs"
            aria-invalid={Boolean(errors.birth_date)}
            {...form.register("birth_date")}
          />
          <FieldDescription>
            Kreator wajib berusia minimal {MINIMUM_CREATOR_AGE} tahun.
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
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
            <NativeSelect id="tier" {...form.register("tier")}>
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
            <NativeSelect id="status" {...form.register("status")}>
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
          <Textarea id="notes" rows={3} {...form.register("notes")} />
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
  );
}
