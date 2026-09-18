"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { applyFieldErrors } from "@/lib/forms";
import { closingNotesSchema } from "@/lib/validation/campaigns";
import type { z } from "zod";
import { updateClosingNotesAction } from "../../report-actions";

type Schema = typeof closingNotesSchema;

/** FR-M9-02: closing notes printed at the end of the client report. */
export function ClosingNotesForm({
  campaignId,
  initialNotes,
  canEdit,
}: {
  campaignId: string;
  initialNotes: string;
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.input<Schema>, unknown, z.output<Schema>>({
    resolver: zodResolver(closingNotesSchema),
    defaultValues: { id: campaignId, closing_notes: initialNotes },
  });

  function onSubmit(values: z.output<Schema>) {
    startTransition(async () => {
      const result = await updateClosingNotesAction(values);
      if (result.status === "success") {
        toast.success(result.message);
        form.reset(values);
      } else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors, isDirty } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-3">
      <Field>
        <FieldLabel htmlFor="closing-notes">Catatan penutup</FieldLabel>
        <Textarea
          id="closing-notes"
          rows={6}
          disabled={!canEdit}
          placeholder="Ringkasan hasil, pembelajaran, dan rekomendasi untuk kampanye berikutnya."
          aria-invalid={Boolean(errors.closing_notes)}
          {...form.register("closing_notes")}
        />
        <FieldDescription>
          {canEdit
            ? "Tampil di bagian akhir laporan untuk klien. Jangan cantumkan honor atau margin."
            : "Kampanye sudah ditutup; hanya owner yang dapat mengubah catatan penutup."}
        </FieldDescription>
        <FieldError errors={[errors.closing_notes]} />
      </Field>
      {canEdit ? (
        <Button type="submit" disabled={isPending || !isDirty}>
          {isPending ? "Menyimpan…" : "Simpan catatan"}
        </Button>
      ) : null}
    </form>
  );
}
