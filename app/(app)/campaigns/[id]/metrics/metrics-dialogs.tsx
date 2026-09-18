"use client";

import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { viewsWarnings, type ViewsWarning } from "@/lib/calculations/campaign-metrics";
import {
  CHECKPOINTS,
  CHECKPOINT_LABELS,
  METRIC_PROOF_BUCKET,
  METRIC_PROOF_MAX_BYTES,
  METRIC_PROOF_MIME_TYPES,
} from "@/lib/constants/metrics";
import { formatDateTimeInput, zonedInputToUtc } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { applyFieldErrors } from "@/lib/forms";
import { uploadToBucket } from "@/lib/storage/upload";
import { parseRupiah } from "@/lib/validation/money";
import {
  NO_PERSONAL_DATA_MESSAGE,
  registrantReportSchema,
  snapshotSchema,
  type RegistrantReportFormInput,
  type RegistrantReportInput,
  type SnapshotFormInput,
  type SnapshotInput,
} from "@/lib/validation/metrics";
import { addRegistrantReportAction, addSnapshotAction } from "../../metric-actions";
import type { AssignmentOption, MetricsContent } from "./metrics-panel";

/** Placeholder while the chosen file is not uploaded yet; replaced before submit. */
const PENDING_UPLOAD = "pending-upload";

function checkProofFile(file: File | null): string | null {
  if (!file) return null;
  if (file.size > METRIC_PROOF_MAX_BYTES) return "Berkas bukti maksimal 10 MB.";
  if (!(METRIC_PROOF_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Bukti harus berupa gambar (PNG, JPG, WebP) atau PDF.";
  }
  return null;
}

function describeWarning(warning: ViewsWarning): string {
  return warning.kind === "lower_than_previous"
    ? `Views lebih kecil dari snapshot ${CHECKPOINT_LABELS[warning.previousCheckpoint]} (${formatNumber(warning.previousViews)}).`
    : `Views lebih besar dari snapshot ${CHECKPOINT_LABELS[warning.nextCheckpoint]} setelahnya (${formatNumber(warning.nextViews)}).`;
}

/* ------------------------------------------------------------------ */
/* Snapshot (FR-M7-01, FR-M7-02)                                        */
/* ------------------------------------------------------------------ */

export function SnapshotDialog({
  campaignId,
  content,
  timezone,
  onClose,
}: {
  campaignId: string;
  content: MetricsContent;
  timezone: string;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<SnapshotFormInput, unknown, SnapshotInput>({
    resolver: zodResolver(snapshotSchema),
    defaultValues: {
      content_id: content.id,
      checkpoint: content.suggestedCheckpoint,
      captured_at: formatDateTimeInput(new Date(), timezone),
      views: "",
      likes: "",
      comments: "",
      shares: "",
      saves: "",
      proof_path: "",
    },
  });

  // Live FR-M7-02 warning while typing; saving is still allowed.
  const [viewsInput, capturedAtInput] = useWatch({
    control: form.control,
    name: ["views", "captured_at"],
  });
  const typedViews = parseRupiah(viewsInput);
  let liveWarnings: ViewsWarning[] = [];
  try {
    if (typedViews !== null && capturedAtInput) {
      liveWarnings = viewsWarnings(content.snapshots, {
        captured_at: zonedInputToUtc(capturedAtInput, timezone),
        views: typedViews,
      });
    }
  } catch {
    liveWarnings = [];
  }

  function chooseFile(next: File | null) {
    const problem = checkProofFile(next);
    setFileError(problem);
    setFile(problem ? null : next);
    form.setValue("proof_path", next && !problem ? PENDING_UPLOAD : "", { shouldValidate: true });
  }

  function onSubmit(values: SnapshotInput) {
    if (!file) {
      setFileError("Unggah tangkapan layar bukti metrik.");
      return;
    }
    startTransition(async () => {
      const upload = await uploadToBucket(METRIC_PROOF_BUCKET, campaignId, file);
      if (upload.error !== null) {
        setFileError(`Bukti gagal diunggah: ${upload.error}`);
        return;
      }
      const result = await addSnapshotAction(campaignId, { ...values, proof_path: upload.path });
      if (result.status === "success") {
        const warnings = result.data?.warnings ?? [];
        if (warnings.length) {
          toast.warning(`Snapshot disimpan, tetapi ${describeWarning(warnings[0]!).toLowerCase()}`);
        } else {
          toast.success(result.message);
        }
        onClose();
      } else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;
  const count = (name: "views" | "likes" | "comments" | "shares" | "saves", label: string) => (
    <Field>
      <FieldLabel htmlFor={`sn-${name}`}>{label}</FieldLabel>
      <Input
        id={`sn-${name}`}
        inputMode="numeric"
        placeholder="0"
        aria-invalid={Boolean(errors[name])}
        {...form.register(name)}
      />
      <FieldError errors={[errors[name]]} />
    </Field>
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Tambah snapshot · {content.creatorName}</DialogTitle>
            <DialogDescription>
              Angka dari tangkapan layar insight yang dikirim kreator.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="sn-checkpoint">Checkpoint</FieldLabel>
                <NativeSelect
                  id="sn-checkpoint"
                  aria-invalid={Boolean(errors.checkpoint)}
                  {...form.register("checkpoint")}
                >
                  {CHECKPOINTS.map((checkpoint) => (
                    <NativeSelectOption key={checkpoint} value={checkpoint}>
                      {CHECKPOINT_LABELS[checkpoint]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.checkpoint]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="sn-captured">Waktu pengambilan</FieldLabel>
                <Input
                  id="sn-captured"
                  type="datetime-local"
                  aria-invalid={Boolean(errors.captured_at)}
                  {...form.register("captured_at")}
                />
                <FieldError errors={[errors.captured_at]} />
              </Field>
            </div>

            {count("views", "Views")}
            {liveWarnings.length ? (
              <Alert className="border-amber-500/60">
                <AlertTriangle className="text-amber-600" />
                <AlertDescription>
                  {liveWarnings.map(describeWarning).join(" ")} Periksa kembali angkanya; snapshot
                  tetap bisa disimpan.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              {count("likes", "Suka")}
              {count("comments", "Komentar")}
              {count("shares", "Bagikan")}
              {count("saves", "Simpan")}
            </div>

            <Field>
              <FieldLabel htmlFor="sn-proof">Tangkapan layar bukti (wajib)</FieldLabel>
              <Input
                id="sn-proof"
                type="file"
                accept={METRIC_PROOF_MIME_TYPES.join(",")}
                aria-invalid={Boolean(fileError || errors.proof_path)}
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              />
              <FieldDescription>Gambar atau PDF, maks. 10 MB.</FieldDescription>
              {fileError ? (
                <FieldError>{fileError}</FieldError>
              ) : (
                <FieldError errors={[errors.proof_path]} />
              )}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan snapshot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Registrant report (FR-M7-04)                                         */
/* ------------------------------------------------------------------ */

export function RegistrantReportDialog({
  campaignId,
  assignments,
  onClose,
}: {
  campaignId: string;
  assignments: AssignmentOption[];
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<RegistrantReportFormInput, unknown, RegistrantReportInput>({
    resolver: zodResolver(registrantReportSchema),
    defaultValues: {
      campaign_creator_id: assignments[0]?.id ?? "",
      period_start: "",
      period_end: "",
      registrant_count: "",
      proof_path: "",
      proof_confirmed_no_personal_data: false,
      notes: "",
    },
  });

  function chooseFile(next: File | null) {
    const problem = checkProofFile(next);
    setFileError(problem);
    setFile(problem ? null : next);
    form.setValue("proof_path", next && !problem ? PENDING_UPLOAD : "");
  }

  function onSubmit(values: RegistrantReportInput) {
    startTransition(async () => {
      let proofPath: string | null = null;
      if (file) {
        const upload = await uploadToBucket(METRIC_PROOF_BUCKET, campaignId, file);
        if (upload.error !== null) {
          setFileError(`Bukti gagal diunggah: ${upload.error}`);
          return;
        }
        proofPath = upload.path;
      }
      const result = await addRegistrantReportAction(campaignId, {
        ...values,
        proof_path: proofPath,
      });
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Catat laporan pendaftar</DialogTitle>
            <DialogDescription>
              Masukkan angka rekap dari klien saja. Jangan mencatat nama atau data pribadi
              pendaftar.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            <Field>
              <FieldLabel htmlFor="rr-code">Kode kreator</FieldLabel>
              <NativeSelect id="rr-code" {...form.register("campaign_creator_id")}>
                {assignments.map((assignment) => (
                  <NativeSelectOption key={assignment.id} value={assignment.id}>
                    {assignment.referralCode} · {assignment.name}
                  </NativeSelectOption>
                ))}
                <NativeSelectOption value="">Tanpa kode</NativeSelectOption>
              </NativeSelect>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="rr-start">Awal periode</FieldLabel>
                <Input
                  id="rr-start"
                  type="date"
                  aria-invalid={Boolean(errors.period_start)}
                  {...form.register("period_start")}
                />
                <FieldError errors={[errors.period_start]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="rr-end">Akhir periode</FieldLabel>
                <Input
                  id="rr-end"
                  type="date"
                  aria-invalid={Boolean(errors.period_end)}
                  {...form.register("period_end")}
                />
                <FieldError errors={[errors.period_end]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="rr-count">Jumlah pendaftar</FieldLabel>
              <Input
                id="rr-count"
                inputMode="numeric"
                placeholder="0"
                aria-invalid={Boolean(errors.registrant_count)}
                {...form.register("registrant_count")}
              />
              <FieldError errors={[errors.registrant_count]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="rr-proof">Bukti (opsional)</FieldLabel>
              <Input
                id="rr-proof"
                type="file"
                accept={METRIC_PROOF_MIME_TYPES.join(",")}
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              />
              <FieldDescription>
                Rekap angka dari klien, gambar atau PDF, maks. 10 MB.
              </FieldDescription>
              {fileError ? <FieldError>{fileError}</FieldError> : null}
            </Field>

            {file ? (
              <Controller
                control={form.control}
                name="proof_confirmed_no_personal_data"
                render={({ field }) => (
                  <Field orientation="horizontal">
                    <Checkbox
                      id="rr-confirm"
                      checked={field.value === true}
                      onCheckedChange={(checked) => field.onChange(checked === true)}
                      aria-invalid={Boolean(errors.proof_confirmed_no_personal_data)}
                    />
                    <div>
                      <FieldLabel htmlFor="rr-confirm" className="font-normal">
                        Bukti hanya berisi angka rekap, tanpa nama, NIK, atau nomor HP pendaftar.
                      </FieldLabel>
                      {errors.proof_confirmed_no_personal_data ? (
                        <FieldError>{NO_PERSONAL_DATA_MESSAGE}</FieldError>
                      ) : null}
                    </div>
                  </Field>
                )}
              />
            ) : null}

            <Field>
              <FieldLabel htmlFor="rr-notes">Catatan</FieldLabel>
              <Textarea id="rr-notes" rows={2} {...form.register("notes")} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan laporan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
