"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { TIMEZONES } from "@/lib/format/timezone";
import { profileSchema, type ProfileInput } from "@/lib/validation/users";
import { updateProfileAction } from "@/app/(app)/settings/actions";

/** Name and timezone form, shared by the internal settings page and the creator portal. */
export function ProfileForm({ defaultValues }: { defaultValues: ProfileInput }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues });

  function onSubmit(values: ProfileInput) {
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (result.status === "success") {
        toast.success(result.message);
        form.reset(values);
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="full_name">Nama lengkap</FieldLabel>
          <Input
            id="full_name"
            autoComplete="name"
            aria-invalid={Boolean(form.formState.errors.full_name)}
            {...form.register("full_name")}
          />
          <FieldError errors={[form.formState.errors.full_name]} />
        </Field>

        <Field>
          <FieldLabel htmlFor="timezone">Zona waktu tampilan</FieldLabel>
          <NativeSelect id="timezone" {...form.register("timezone")}>
            {Object.entries(TIMEZONES).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label} ({value})
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <FieldDescription>
            Kalimantan Barat dan Tengah memakai WIB; provinsi lain memakai WITA.
          </FieldDescription>
          <FieldError errors={[form.formState.errors.timezone]} />
        </Field>

        <div>
          <Button type="submit" disabled={isPending || !form.formState.isDirty}>
            {isPending ? "Menyimpan…" : "Simpan"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
}
