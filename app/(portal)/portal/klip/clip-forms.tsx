"use client";

import { useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Send, Upload } from "lucide-react";
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
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/constants/creators";
import {
  METRIC_PROOF_BUCKET,
  METRIC_PROOF_MAX_BYTES,
  METRIC_PROOF_MIME_TYPES,
} from "@/lib/constants/metrics";
import { formatDateTimeInput } from "@/lib/format/date";
import { applyFieldErrors } from "@/lib/forms";
import { uploadToBucket } from "@/lib/storage/upload";
import {
  clipSubmitSchema,
  viewsUpdateSchema,
  type ClipSubmitFormInput,
  type ClipSubmitInput,
  type ViewsUpdateFormInput,
  type ViewsUpdateInput,
} from "@/lib/validation/clips";
import { resubmitClipAction, submitClipAction, submitViewsUpdateAction } from "./actions";

/** Stands in for the storage path until the chosen file is uploaded. */
const PENDING_UPLOAD = "pending-upload";

function proofFileProblem(file: File | null): string | null {
  if (!file) return null;
  if (file.size > METRIC_PROOF_MAX_BYTES) return "Berkasnya lebih dari 10 MB. Coba kecilkan dulu.";
  if (!(METRIC_PROOF_MIME_TYPES as readonly string[]).includes(file.type)) {
    return "Format berkas ini nggak didukung. Pakai PNG, JPG, WebP, atau PDF.";
  }
  return null;
}

const INTERACTION_FIELDS = [
  { name: "likes", label: "Suka" },
  { name: "comments", label: "Komentar" },
  { name: "shares", label: "Dibagikan" },
] as const;

/* ------------------------------------------------------------------ */
/* Send a clip (FR-M18-01)                                             */
/* ------------------------------------------------------------------ */

export function SubmitClipDialog({
  assignmentId,
  campaignId,
  platforms,
  verificationCode,
  onClose,
}: {
  assignmentId: string;
  campaignId: string;
  /** Allowed by the campaign and registered by the klipper. */
  platforms: SocialPlatform[];
  verificationCode: string;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClipSubmitFormInput, unknown, ClipSubmitInput>({
    resolver: zodResolver(clipSubmitSchema),
    defaultValues: {
      assignment_id: assignmentId,
      platform: platforms[0],
      posted_url: "",
      posted_at: formatDateTimeInput(new Date()),
      views: "",
      likes: "",
      comments: "",
      shares: "",
      proof_path: "",
      code_in_caption: false as unknown as true,
    },
  });

  function chooseFile(next: File | null) {
    const problem = proofFileProblem(next);
    setServerError(problem);
    if (problem) return;
    setFile(next);
    form.setValue("proof_path", next ? PENDING_UPLOAD : "", { shouldValidate: true });
  }

  function onSubmit(values: ClipSubmitInput) {
    setServerError(null);
    startTransition(async () => {
      if (!file) {
        setServerError("Unggah screenshot views-nya dulu.");
        return;
      }
      const upload = await uploadToBucket(METRIC_PROOF_BUCKET, campaignId, file);
      if (upload.error !== null) {
        setServerError(`Screenshot gagal diunggah: ${upload.error}`);
        return;
      }
      const result = await submitClipAction({ ...values, proof_path: upload.path });
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        setServerError(result.message);
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
            <DialogTitle>Kirim klip</DialogTitle>
            <DialogDescription>
              Kirim klip yang sudah tayang di akunmu. Tim cek kode verifikasi, isi, dan views-nya
              dulu, habis itu honornya masuk ke saldomu.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <Field>
              <FieldLabel htmlFor="clip-platform">Platform</FieldLabel>
              <NativeSelect id="clip-platform" {...form.register("platform")}>
                {platforms.map((platform) => (
                  <NativeSelectOption key={platform} value={platform}>
                    {SOCIAL_PLATFORM_LABELS[platform]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.platform]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="clip-url">Tautan klip</FieldLabel>
              <Input
                id="clip-url"
                type="url"
                inputMode="url"
                placeholder="https://www.tiktok.com/@akun/video/…"
                {...form.register("posted_url")}
              />
              <FieldDescription>Satu video cuma bisa dikirim sekali.</FieldDescription>
              <FieldError errors={[errors.posted_url]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="clip-posted-at">Waktu tayang</FieldLabel>
              <Input id="clip-posted-at" type="datetime-local" {...form.register("posted_at")} />
              <FieldError errors={[errors.posted_at]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="clip-views">Views saat ini</FieldLabel>
              <Input id="clip-views" inputMode="numeric" {...form.register("views")} />
              <FieldError errors={[errors.views]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              {INTERACTION_FIELDS.map((item) => (
                <Field key={item.name}>
                  <FieldLabel htmlFor={`clip-${item.name}`}>{item.label}</FieldLabel>
                  <Input
                    id={`clip-${item.name}`}
                    inputMode="numeric"
                    placeholder="Opsional"
                    {...form.register(item.name)}
                  />
                  <FieldError errors={[errors[item.name]]} />
                </Field>
              ))}
            </div>

            <Field>
              <FieldLabel htmlFor="clip-proof">Tangkapan layar views</FieldLabel>
              <Input
                id="clip-proof"
                type="file"
                accept={METRIC_PROOF_MIME_TYPES.join(",")}
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              />
              <FieldDescription>Wajib diisi. Ukuran maksimal 10 MB.</FieldDescription>
              <FieldError errors={[errors.proof_path]} />
            </Field>

            <Controller
              control={form.control}
              name="code_in_caption"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <Checkbox
                    id="clip-code"
                    checked={field.value === true}
                    onCheckedChange={(checked) => field.onChange(checked === true)}
                  />
                  <div>
                    <FieldLabel htmlFor="clip-code" className="font-normal">
                      Kode verifikasi{" "}
                      <span className="font-mono font-semibold">{verificationCode}</span> sudah ada
                      di caption klip ini.
                    </FieldLabel>
                    <FieldError errors={[errors.code_in_caption]} />
                  </div>
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              <Send aria-hidden />
              {isPending ? "Mengirim…" : "Kirim klip"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Views update (FR-M18-05)                                            */
/* ------------------------------------------------------------------ */

export function ViewsUpdateDialog({
  contentId,
  campaignId,
  onClose,
}: {
  contentId: string;
  campaignId: string;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ViewsUpdateFormInput, unknown, ViewsUpdateInput>({
    resolver: zodResolver(viewsUpdateSchema),
    defaultValues: {
      content_id: contentId,
      views: "",
      likes: "",
      comments: "",
      shares: "",
      proof_path: "",
    },
  });

  function chooseFile(next: File | null) {
    const problem = proofFileProblem(next);
    setServerError(problem);
    if (problem) return;
    setFile(next);
    form.setValue("proof_path", next ? PENDING_UPLOAD : "", { shouldValidate: true });
  }

  function onSubmit(values: ViewsUpdateInput) {
    setServerError(null);
    startTransition(async () => {
      if (!file) {
        setServerError("Unggah screenshot views-nya dulu.");
        return;
      }
      const upload = await uploadToBucket(METRIC_PROOF_BUCKET, campaignId, file);
      if (upload.error !== null) {
        setServerError(`Screenshot gagal diunggah: ${upload.error}`);
        return;
      }
      const result = await submitViewsUpdateAction({ ...values, proof_path: upload.path });
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        setServerError(result.message);
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
            <DialogTitle>Perbarui views</DialogTitle>
            <DialogDescription>
              Views klipmu naik? Kirim angka terbaru plus screenshot-nya. Setelah dicek tim,
              tambahan honornya masuk ke saldomu.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <Field>
              <FieldLabel htmlFor="vu-views">Views saat ini</FieldLabel>
              <Input id="vu-views" inputMode="numeric" {...form.register("views")} />
              <FieldError errors={[errors.views]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              {INTERACTION_FIELDS.map((item) => (
                <Field key={item.name}>
                  <FieldLabel htmlFor={`vu-${item.name}`}>{item.label}</FieldLabel>
                  <Input
                    id={`vu-${item.name}`}
                    inputMode="numeric"
                    placeholder="Opsional"
                    {...form.register(item.name)}
                  />
                  <FieldError errors={[errors[item.name]]} />
                </Field>
              ))}
            </div>

            <Field>
              <FieldLabel htmlFor="vu-proof">Tangkapan layar views</FieldLabel>
              <Input
                id="vu-proof"
                type="file"
                accept={METRIC_PROOF_MIME_TYPES.join(",")}
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              />
              <FieldDescription>Wajib diisi. Ukuran maksimal 10 MB.</FieldDescription>
              <FieldError errors={[errors.proof_path]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              <Upload aria-hidden />
              {isPending ? "Mengirim…" : "Kirim pembaruan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Send again after a revision request (FR-M18-03)                     */
/* ------------------------------------------------------------------ */

export function ResubmitClipButton({ contentId }: { contentId: string }) {
  const [isPending, startTransition] = useTransition();

  function resubmit() {
    startTransition(async () => {
      const result = await resubmitClipAction({ content_id: contentId });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Button size="sm" onClick={resubmit} disabled={isPending}>
      <Send aria-hidden />
      {isPending ? "Mengirim…" : "Sudah diperbaiki, kirim ulang"}
    </Button>
  );
}
