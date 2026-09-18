"use client";

import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "lucide-react";
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
import {
  CONTENT_DRAFT_BUCKET,
  CONTENT_DRAFT_MAX_BYTES,
  CONTENT_DRAFT_MIME_TYPES,
  type ReviewDecision,
} from "@/lib/constants/contents";
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_LABELS } from "@/lib/constants/creators";
import { checklistItemsFor, isChecklistComplete } from "@/lib/contents/review";
import type { ContentView } from "@/lib/data/contents";
import { formatDateTimeInput } from "@/lib/format/date";
import { applyFieldErrors } from "@/lib/forms";
import { uploadToBucket } from "@/lib/storage/upload";
import {
  contentCreateSchema,
  postedSchema,
  removedSchema,
  reviewSchema,
  type ContentCreateFormInput,
  type ContentCreateInput,
  type PostedFormInput,
  type PostedInput,
  type RemovedFormInput,
  type RemovedInput,
  type ReviewFormInput,
  type ReviewInput,
} from "@/lib/validation/contents";
import {
  createContentAction,
  markPostedAction,
  markRemovedAction,
  reviewContentAction,
  updateDraftAction,
} from "../../content-actions";

export type BriefContext = {
  paidLabelRequired: boolean;
  mustDo: string[];
  mustNot: string[];
  hashtags: string[];
};

type AssignmentOption = { id: string; name: string };

/**
 * Stands in for the storage path while a chosen file is not uploaded yet, so
 * the "link or file" rule passes; the real path replaces it before submit.
 */
const PENDING_UPLOAD = "pending-upload";

/* ------------------------------------------------------------------ */
/* Record / correct / resubmit a draft (FR-M6-01, FR-M6-02)             */
/* ------------------------------------------------------------------ */

type DraftDialogProps =
  | { mode: "create"; campaignId: string; assignments: AssignmentOption[]; onClose: () => void }
  | { mode: "edit" | "new-draft"; campaignId: string; content: ContentView; onClose: () => void };

const TITLES = {
  create: "Catat konten",
  edit: "Ubah draf",
  "new-draft": "Catat draf baru",
} as const;

export function ContentDraftDialog(props: DraftDialogProps) {
  const { mode, campaignId, onClose } = props;
  const content = mode === "create" ? null : props.content;
  const [file, setFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // A new draft starts empty; a correction starts from the current draft.
  const keepCurrent = mode === "edit";
  const form = useForm<ContentCreateFormInput, unknown, ContentCreateInput>({
    resolver: zodResolver(contentCreateSchema),
    defaultValues: {
      campaign_creator_id:
        mode === "create" ? (props.assignments[0]?.id ?? "") : (content?.campaign_creator_id ?? ""),
      platform: (content?.platform as ContentCreateFormInput["platform"]) ?? "tiktok",
      draft_url: keepCurrent ? (content?.draft_url ?? "") : "",
      draft_file_path: keepCurrent ? (content?.draft_file_path ?? "") : "",
      caption_draft: keepCurrent || mode === "new-draft" ? (content?.caption_draft ?? "") : "",
    },
  });

  function onSubmit(values: ContentCreateInput) {
    setServerError(null);
    startTransition(async () => {
      let draftFilePath = values.draft_file_path;
      if (file) {
        const upload = await uploadToBucket(CONTENT_DRAFT_BUCKET, campaignId, file);
        if (upload.error !== null) {
          setServerError(`Berkas gagal diunggah: ${upload.error}`);
          return;
        }
        draftFilePath = upload.path;
      }

      const payload = { ...values, draft_file_path: draftFilePath };
      const result =
        mode === "create"
          ? await createContentAction(campaignId, payload)
          : await updateDraftAction(campaignId, content!.id, {
              platform: payload.platform,
              draft_url: payload.draft_url,
              draft_file_path: payload.draft_file_path,
              caption_draft: payload.caption_draft,
            });

      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        setServerError(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  function chooseFile(next: File | null) {
    setServerError(null);
    if (next && next.size > CONTENT_DRAFT_MAX_BYTES) {
      setServerError("Berkas lebih dari 50 MB. Unggah ke Google Drive lalu tempel tautannya.");
      return;
    }
    if (next && !(CONTENT_DRAFT_MIME_TYPES as readonly string[]).includes(next.type)) {
      setServerError("Format berkas tidak didukung (PNG, JPG, WebP, MP4, MOV, WebM).");
      return;
    }
    setFile(next);
    form.setValue(
      "draft_file_path",
      next ? PENDING_UPLOAD : keepCurrent ? (content?.draft_file_path ?? "") : "",
    );
  }

  const { errors } = form.formState;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{TITLES[mode]}</DialogTitle>
            <DialogDescription>
              {mode === "new-draft"
                ? "Draf baru dari kreator setelah permintaan revisi. Konten kembali menunggu review."
                : "Draf yang dikirim kreator lewat WhatsApp. Tempel tautan atau unggah berkasnya."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            {mode === "create" ? (
              <Field>
                <FieldLabel htmlFor="ct-assignment">Kreator</FieldLabel>
                <NativeSelect id="ct-assignment" {...form.register("campaign_creator_id")}>
                  {props.assignments.map((assignment) => (
                    <NativeSelectOption key={assignment.id} value={assignment.id}>
                      {assignment.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.campaign_creator_id]} />
              </Field>
            ) : null}

            <Field>
              <FieldLabel htmlFor="ct-platform">Platform</FieldLabel>
              <NativeSelect id="ct-platform" {...form.register("platform")}>
                {SOCIAL_PLATFORMS.map((platform) => (
                  <NativeSelectOption key={platform} value={platform}>
                    {SOCIAL_PLATFORM_LABELS[platform]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            <Field>
              <FieldLabel htmlFor="ct-url">Tautan draf</FieldLabel>
              <Input
                id="ct-url"
                type="url"
                placeholder="https://drive.google.com/…"
                aria-invalid={Boolean(errors.draft_url)}
                {...form.register("draft_url")}
              />
              <FieldError errors={[errors.draft_url]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="ct-file">atau unggah berkas draf</FieldLabel>
              <Input
                id="ct-file"
                type="file"
                accept={CONTENT_DRAFT_MIME_TYPES.join(",")}
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              />
              <FieldDescription>
                Maks. 50 MB.
                {keepCurrent && content?.draft_file_path
                  ? " Berkas baru menggantikan berkas lama."
                  : ""}
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="ct-caption">Draf caption</FieldLabel>
              <Textarea id="ct-caption" rows={4} {...form.register("caption_draft")} />
              <FieldError errors={[errors.caption_draft]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Review (FR-M6-02, FR-M6-03)                                          */
/* ------------------------------------------------------------------ */

export function ReviewDialog({
  campaignId,
  content,
  brief,
  onClose,
}: {
  campaignId: string;
  content: ContentView;
  brief: BriefContext;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const items = checklistItemsFor(brief.paidLabelRequired);

  const form = useForm<ReviewFormInput, unknown, ReviewInput>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      decision: "disetujui",
      checklist: {
        sesuai_brief: false,
        tanpa_larangan: false,
        label_berbayar: false,
        info_akurat: false,
      },
      notes: "",
    },
  });

  const checklist = useWatch({ control: form.control, name: "checklist" });
  const complete = isChecklistComplete(checklist, brief.paidLabelRequired);

  function decide(decision: ReviewDecision) {
    form.setValue("decision", decision);
    void form.handleSubmit((values) => {
      startTransition(async () => {
        const result = await reviewContentAction(campaignId, content.id, values);
        if (result.status === "success") {
          toast.success(result.message);
          onClose();
        } else {
          toast.error(result.message);
          applyFieldErrors(form, result);
        }
      });
    })();
  }

  const { errors } = form.formState;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review konten {content.creatorName}</DialogTitle>
          <DialogDescription>
            Periksa draf terhadap brief dan larangan kampanye sebelum memutuskan.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <section className="space-y-2 text-sm" aria-label="Draf">
            <h3 className="font-medium">Draf ke-{content.revision_count + 1}</h3>
            <div className="flex flex-wrap gap-3">
              {content.draft_url ? (
                <a
                  href={content.draft_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  Buka tautan draf
                </a>
              ) : null}
              {content.draftFileUrl ? (
                <a
                  href={content.draftFileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                >
                  <ExternalLink className="size-3.5" aria-hidden />
                  Buka berkas draf
                </a>
              ) : null}
            </div>
            <p className="rounded-md bg-muted p-2 whitespace-pre-line">
              {content.caption_draft || (
                <span className="text-muted-foreground">Tanpa caption.</span>
              )}
            </p>
          </section>

          <section className="space-y-2 text-sm" aria-label="Brief">
            {brief.mustDo.length ? (
              <div>
                <h3 className="font-medium">Wajib</h3>
                <ul className="list-disc pl-5">
                  {brief.mustDo.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {brief.mustNot.length ? (
              <div>
                <h3 className="font-medium">Larangan</h3>
                <ul className="list-disc pl-5">
                  {brief.mustNot.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {brief.hashtags.length ? (
              <p className="text-muted-foreground">{brief.hashtags.join(" ")}</p>
            ) : null}
          </section>
        </div>

        <form onSubmit={(event) => event.preventDefault()} noValidate>
          <FieldGroup className="my-2">
            <FieldSet>
              <FieldLegend variant="label">Checklist (wajib lengkap untuk menyetujui)</FieldLegend>
              {items.map((item) => (
                <Controller
                  key={item.key}
                  control={form.control}
                  name={`checklist.${item.key}`}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id={`ck-${item.key}`}
                        checked={field.value === true}
                        onCheckedChange={(checked) => field.onChange(checked === true)}
                      />
                      <FieldLabel htmlFor={`ck-${item.key}`} className="font-normal">
                        {item.label}
                      </FieldLabel>
                    </Field>
                  )}
                />
              ))}
            </FieldSet>

            <Field>
              <FieldLabel htmlFor="rv-notes">Catatan</FieldLabel>
              <Textarea
                id="rv-notes"
                rows={3}
                placeholder="Wajib diisi untuk permintaan revisi: apa yang perlu diubah."
                aria-invalid={Boolean(errors.notes)}
                {...form.register("notes")}
              />
              <FieldError errors={[errors.notes]} />
            </Field>
          </FieldGroup>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="destructive"
                disabled={isPending}
                onClick={() => decide("ditolak")}
              >
                Tolak
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => decide("revisi")}
              >
                Minta revisi
              </Button>
              <Button
                type="button"
                disabled={isPending || !complete}
                title={complete ? undefined : "Lengkapi checklist untuk menyetujui"}
                onClick={() => decide("disetujui")}
              >
                Setujui
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Posted / removed (FR-M6-04, FR-M6-05)                                */
/* ------------------------------------------------------------------ */

export function PostedDialog({
  campaignId,
  content,
  timezone,
  onClose,
}: {
  campaignId: string;
  content: ContentView;
  timezone: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<PostedFormInput, unknown, PostedInput>({
    resolver: zodResolver(postedSchema),
    defaultValues: {
      posted_url: content.posted_url ?? "",
      posted_at: formatDateTimeInput(content.posted_at ?? new Date(), timezone),
    },
  });

  function onSubmit(values: PostedInput) {
    startTransition(async () => {
      const result = await markPostedAction(campaignId, content.id, values);
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
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Tandai tayang</DialogTitle>
            <DialogDescription>URL postingan dan waktu tayang dari kreator.</DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-4">
            <Field>
              <FieldLabel htmlFor="ps-url">URL tayang</FieldLabel>
              <Input
                id="ps-url"
                type="url"
                placeholder="https://www.tiktok.com/@…/video/…"
                aria-invalid={Boolean(errors.posted_url)}
                {...form.register("posted_url")}
              />
              <FieldError errors={[errors.posted_url]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="ps-at">Waktu tayang</FieldLabel>
              <Input
                id="ps-at"
                type="datetime-local"
                aria-invalid={Boolean(errors.posted_at)}
                {...form.register("posted_at")}
              />
              <FieldDescription>
                Zona waktu Anda ({timezone === "Asia/Jakarta" ? "WIB" : "WITA"}).
              </FieldDescription>
              <FieldError errors={[errors.posted_at]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RemovedDialog({
  campaignId,
  content,
  timezone,
  onClose,
}: {
  campaignId: string;
  content: ContentView;
  timezone: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<RemovedFormInput, unknown, RemovedInput>({
    resolver: zodResolver(removedSchema),
    defaultValues: { removed_at: formatDateTimeInput(new Date(), timezone) },
  });

  function onSubmit(values: RemovedInput) {
    startTransition(async () => {
      const result = await markRemovedAction(campaignId, content.id, values);
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
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Tandai dihapus</DialogTitle>
            <DialogDescription>
              Catat kapan kreator menghapus postingan. Konten yang dihapus sebelum minimal hari
              tayang dapat memengaruhi honor.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-4">
            <Field>
              <FieldLabel htmlFor="rm-at">Waktu penghapusan</FieldLabel>
              <Input
                id="rm-at"
                type="datetime-local"
                aria-invalid={Boolean(errors.removed_at)}
                {...form.register("removed_at")}
              />
              <FieldError errors={[errors.removed_at]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Tandai dihapus"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
