"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Plus, Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  CONTENT_DRAFT_BUCKET,
  CONTENT_DRAFT_MAX_BYTES,
  CONTENT_DRAFT_MIME_TYPES,
  LIVE_STATUS_LABELS,
  REVIEW_STATUS_LABELS,
  type LiveStatus,
  type ReviewDecision,
  type ReviewStatus,
} from "@/lib/constants/contents";
import {
  SOCIAL_PLATFORM_LABELS,
  SOCIAL_PLATFORMS,
  type SocialPlatform,
} from "@/lib/constants/creators";
import {
  CHECKPOINT_LABELS,
  CHECKPOINTS,
  METRIC_PROOF_BUCKET,
  METRIC_PROOF_MAX_BYTES,
  METRIC_PROOF_MIME_TYPES,
  SUBMISSION_STATUS_LABELS,
  type MetricCheckpoint,
  type SubmissionStatus,
} from "@/lib/constants/metrics";
import { canCreatorEditDraft, canProposePosted, canSubmitMetric } from "@/lib/contents/review";
import { formatDateTime, formatDateTimeInput } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { applyFieldErrors } from "@/lib/forms";
import { uploadToBucket } from "@/lib/storage/upload";
import {
  contentCreateSchema,
  proposedPostedSchema,
  type ContentCreateFormInput,
  type ContentCreateInput,
  type ProposedPostedFormInput,
  type ProposedPostedInput,
} from "@/lib/validation/contents";
import {
  metricSubmissionSchema,
  type MetricSubmissionFormInput,
  type MetricSubmissionInput,
} from "@/lib/validation/metrics";
import {
  proposePostedAction,
  submitDraftAction,
  submitMetricAction,
  updateOwnDraftAction,
  withdrawSubmissionAction,
} from "../../actions";

/** Stands in for the storage path until the chosen file is uploaded. */
const PENDING_UPLOAD = "pending-upload";

export type PortalReviewView = {
  decision: ReviewDecision;
  notes: string;
  createdAt: string;
};

export type PortalMetricView = {
  id: string;
  checkpoint: MetricCheckpoint;
  capturedAt: string;
  views: number;
};

export type PortalSubmissionView = {
  id: string;
  checkpoint: MetricCheckpoint;
  capturedAt: string;
  views: number;
  status: SubmissionStatus;
  reviewNotes: string;
  createdAt: string;
};

export type PortalContentView = {
  id: string;
  platform: SocialPlatform;
  draftUrl: string | null;
  draftFilePath: string | null;
  captionDraft: string;
  reviewStatus: ReviewStatus;
  liveStatus: LiveStatus;
  postedUrl: string | null;
  postedAt: string | null;
  proposedPostedUrl: string | null;
  proposedPostedAt: string | null;
  lastReview: PortalReviewView | null;
  metrics: PortalMetricView[];
  submissions: PortalSubmissionView[];
  dueCheckpoints: MetricCheckpoint[];
  suggestedCheckpoint: MetricCheckpoint;
};

export type SubmissionsPanelProps = {
  campaignId: string;
  assignmentId: string;
  campaignRunning: boolean;
  contentsCommitted: number;
  timezone: string;
  contents: PortalContentView[];
};

/* ------------------------------------------------------------------ */
/* Draft (FR-M13-05)                                                   */
/* ------------------------------------------------------------------ */

type DraftDialogProps =
  | { mode: "create"; campaignId: string; assignmentId: string; onClose: () => void }
  | {
      mode: "edit" | "new-draft";
      campaignId: string;
      content: PortalContentView;
      onClose: () => void;
    };

const DRAFT_TITLES = {
  create: "Kirim draf",
  edit: "Perbaiki draf",
  "new-draft": "Kirim draf baru",
} as const;

function DraftDialog(props: DraftDialogProps) {
  const { mode, campaignId, onClose } = props;
  const content = mode === "create" ? null : props.content;
  const [file, setFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // A new draft starts empty; a correction starts from what was sent.
  const keepCurrent = mode === "edit";
  const form = useForm<ContentCreateFormInput, unknown, ContentCreateInput>({
    resolver: zodResolver(contentCreateSchema),
    defaultValues: {
      campaign_creator_id: mode === "create" ? props.assignmentId : "",
      platform: content?.platform ?? "tiktok",
      draft_url: keepCurrent ? (content?.draftUrl ?? "") : "",
      draft_file_path: keepCurrent ? (content?.draftFilePath ?? "") : "",
      caption_draft: content?.captionDraft ?? "",
    },
  });

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
      next ? PENDING_UPLOAD : keepCurrent ? (content?.draftFilePath ?? "") : "",
    );
  }

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

      const payload = {
        platform: values.platform,
        draft_url: values.draft_url,
        draft_file_path: draftFilePath,
        caption_draft: values.caption_draft,
      };
      const result =
        mode === "create"
          ? await submitDraftAction({ ...payload, campaign_creator_id: values.campaign_creator_id })
          : await updateOwnDraftAction(content!.id, payload);

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
            <DialogTitle>{DRAFT_TITLES[mode]}</DialogTitle>
            <DialogDescription>
              {mode === "new-draft"
                ? "Kirim perbaikan sesuai catatan tim. Konten kembali menunggu review."
                : "Tempel tautan draf (Google Drive, dsb.) atau unggah berkasnya langsung."}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <Field>
              <FieldLabel htmlFor="pd-platform">Platform</FieldLabel>
              <NativeSelect id="pd-platform" {...form.register("platform")}>
                {SOCIAL_PLATFORMS.map((platform) => (
                  <NativeSelectOption key={platform} value={platform}>
                    {SOCIAL_PLATFORM_LABELS[platform]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.platform]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="pd-url">Tautan draf</FieldLabel>
              <Input
                id="pd-url"
                inputMode="url"
                placeholder="https://drive.google.com/..."
                {...form.register("draft_url")}
              />
              <FieldError errors={[errors.draft_url]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="pd-file">atau unggah berkas</FieldLabel>
              <Input
                id="pd-file"
                type="file"
                accept={CONTENT_DRAFT_MIME_TYPES.join(",")}
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              />
              <FieldDescription>
                Maksimal 50 MB. Video besar sebaiknya lewat tautan.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="pd-caption">Draf caption</FieldLabel>
              <Textarea id="pd-caption" rows={4} {...form.register("caption_draft")} />
              <FieldError errors={[errors.caption_draft]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              <Send aria-hidden />
              {isPending ? "Mengirim…" : "Kirim"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Live report (FR-M13-09)                                             */
/* ------------------------------------------------------------------ */

function PostedDialog({ content, onClose }: { content: PortalContentView; onClose: () => void }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ProposedPostedFormInput, unknown, ProposedPostedInput>({
    resolver: zodResolver(proposedPostedSchema),
    defaultValues: {
      content_id: content.id,
      proposed_posted_url: content.proposedPostedUrl ?? "",
      proposed_posted_at: formatDateTimeInput(content.proposedPostedAt ?? new Date()),
    },
  });

  function onSubmit(values: ProposedPostedInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await proposePostedAction(values);
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
      <DialogContent className="sm:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Laporkan konten tayang</DialogTitle>
            <DialogDescription>
              Kirim tautan konten yang sudah tayang. Tim akan mengonfirmasi, lalu Anda bisa mengirim
              bukti metrik.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <Field>
              <FieldLabel htmlFor="pp-url">URL konten tayang</FieldLabel>
              <Input
                id="pp-url"
                inputMode="url"
                placeholder="https://www.tiktok.com/@akun/video/..."
                {...form.register("proposed_posted_url")}
              />
              <FieldError errors={[errors.proposed_posted_url]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="pp-at">Waktu tayang</FieldLabel>
              <Input id="pp-at" type="datetime-local" {...form.register("proposed_posted_at")} />
              <FieldError errors={[errors.proposed_posted_at]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              <Send aria-hidden />
              {isPending ? "Mengirim…" : "Kirim laporan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Metric submission (FR-M13-06)                                       */
/* ------------------------------------------------------------------ */

function MetricDialog({
  campaignId,
  content,
  onClose,
}: {
  campaignId: string;
  content: PortalContentView;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<MetricSubmissionFormInput, unknown, MetricSubmissionInput>({
    resolver: zodResolver(metricSubmissionSchema),
    defaultValues: {
      content_id: content.id,
      checkpoint: content.suggestedCheckpoint,
      captured_at: formatDateTimeInput(new Date()),
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      proof_path: "",
    },
  });

  function chooseFile(next: File | null) {
    setServerError(null);
    if (next && next.size > METRIC_PROOF_MAX_BYTES) {
      setServerError("Berkas lebih dari 10 MB.");
      return;
    }
    if (next && !(METRIC_PROOF_MIME_TYPES as readonly string[]).includes(next.type)) {
      setServerError("Format bukti tidak didukung (PNG, JPG, WebP, PDF).");
      return;
    }
    setFile(next);
    form.setValue("proof_path", next ? PENDING_UPLOAD : "");
  }

  function onSubmit(values: MetricSubmissionInput) {
    setServerError(null);
    startTransition(async () => {
      if (!file) {
        setServerError("Unggah tangkapan layar bukti metrik.");
        return;
      }
      const upload = await uploadToBucket(METRIC_PROOF_BUCKET, campaignId, file);
      if (upload.error !== null) {
        setServerError(`Bukti gagal diunggah: ${upload.error}`);
        return;
      }

      const result = await submitMetricAction({ ...values, proof_path: upload.path });
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
  const counts = [
    { name: "views", label: "Views" },
    { name: "likes", label: "Suka" },
    { name: "comments", label: "Komentar" },
    { name: "shares", label: "Dibagikan" },
    { name: "saves", label: "Disimpan" },
  ] as const;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Kirim bukti metrik</DialogTitle>
            <DialogDescription>
              Isi angka sesuai tangkapan layar analitik Anda. Tim memverifikasi sebelum angka ini
              dipakai.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <Field>
              <FieldLabel htmlFor="ms-checkpoint">Checkpoint</FieldLabel>
              <NativeSelect id="ms-checkpoint" {...form.register("checkpoint")}>
                {CHECKPOINTS.map((checkpoint) => (
                  <NativeSelectOption key={checkpoint} value={checkpoint}>
                    {CHECKPOINT_LABELS[checkpoint]}
                    {content.dueCheckpoints.includes(checkpoint) ? " — jatuh tempo" : ""}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.checkpoint]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="ms-captured">Waktu pengambilan</FieldLabel>
              <Input id="ms-captured" type="datetime-local" {...form.register("captured_at")} />
              <FieldError errors={[errors.captured_at]} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              {counts.map((count) => (
                <Field key={count.name}>
                  <FieldLabel htmlFor={`ms-${count.name}`}>{count.label}</FieldLabel>
                  <Input
                    id={`ms-${count.name}`}
                    inputMode="numeric"
                    {...form.register(count.name)}
                  />
                  <FieldError errors={[errors[count.name]]} />
                </Field>
              ))}
            </div>

            <Field>
              <FieldLabel htmlFor="ms-proof">Tangkapan layar bukti</FieldLabel>
              <Input
                id="ms-proof"
                type="file"
                accept={METRIC_PROOF_MIME_TYPES.join(",")}
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
              />
              <FieldDescription>Wajib. Maksimal 10 MB.</FieldDescription>
              <FieldError errors={[errors.proof_path]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              <Upload aria-hidden />
              {isPending ? "Mengirim…" : "Kirim bukti"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

const REVIEW_VARIANTS: Record<ReviewStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  menunggu_review: "outline",
  disetujui: "default",
  revisi: "secondary",
  ditolak: "destructive",
};

const SUBMISSION_VARIANTS: Record<SubmissionStatus, React.ComponentProps<typeof Badge>["variant"]> =
  {
    menunggu: "outline",
    diterima: "default",
    ditolak: "destructive",
  };

type DialogState =
  | { kind: "create" }
  | { kind: "edit" | "new-draft" | "posted" | "metric"; content: PortalContentView }
  | null;

export function SubmissionsPanel({
  campaignId,
  assignmentId,
  campaignRunning,
  contentsCommitted,
  timezone,
  contents,
}: SubmissionsPanelProps) {
  const [dialog, setDialog] = useState<DialogState>(null);
  const [isPending, startTransition] = useTransition();

  function withdraw(submissionId: string) {
    startTransition(async () => {
      const result = await withdrawSubmissionAction({ id: submissionId });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>Konten saya</CardTitle>
            <CardDescription>
              {contents.length} dari {contentsCommitted} konten yang disepakati.{" "}
              {campaignRunning
                ? "Kirim draf, laporkan saat tayang, lalu kirim bukti metrik."
                : "Kampanye ini tidak sedang berjalan, jadi draf baru tidak dapat dikirim."}
            </CardDescription>
          </div>
          {campaignRunning ? (
            <Button onClick={() => setDialog({ kind: "create" })}>
              <Plus aria-hidden />
              Kirim draf
            </Button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          {contents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada konten. Mulai dengan mengirim draf pertama Anda.
            </p>
          ) : (
            contents.map((content) => {
              const waitingConfirmation = Boolean(content.proposedPostedUrl);
              const pendingSubmission = content.submissions.find((s) => s.status === "menunggu");

              return (
                <div key={content.id} id={`konten-${content.id}`} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={REVIEW_VARIANTS[content.reviewStatus]}>
                      {REVIEW_STATUS_LABELS[content.reviewStatus]}
                    </Badge>
                    <Badge variant="outline">{LIVE_STATUS_LABELS[content.liveStatus]}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {SOCIAL_PLATFORM_LABELS[content.platform]}
                    </span>
                  </div>

                  {content.captionDraft ? (
                    <p className="mt-2 line-clamp-3 text-sm whitespace-pre-line">
                      {content.captionDraft}
                    </p>
                  ) : null}

                  {content.lastReview && content.lastReview.notes ? (
                    <Alert className="mt-3">
                      <CircleAlert />
                      <AlertDescription>
                        <span className="font-medium">Catatan tim: </span>
                        {content.lastReview.notes}
                      </AlertDescription>
                    </Alert>
                  ) : null}

                  {waitingConfirmation ? (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Laporan tayang terkirim, menunggu konfirmasi tim.
                    </p>
                  ) : null}

                  {content.postedUrl ? (
                    <p className="mt-3 text-sm">
                      Tayang sejak {formatDateTime(content.postedAt!, timezone)} ·{" "}
                      <a
                        href={content.postedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        buka konten
                      </a>
                    </p>
                  ) : null}

                  {content.metrics.length ? (
                    <div className="mt-3 text-sm">
                      <p className="text-muted-foreground">Metrik terverifikasi</p>
                      <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                        {content.metrics.map((metric) => (
                          <li key={metric.id}>
                            {CHECKPOINT_LABELS[metric.checkpoint]}: {formatNumber(metric.views)}{" "}
                            views
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {content.submissions.length ? (
                    <ul className="mt-3 space-y-2 text-sm">
                      {content.submissions.map((submission) => (
                        <li key={submission.id} className="flex flex-wrap items-center gap-2">
                          <Badge variant={SUBMISSION_VARIANTS[submission.status]}>
                            {SUBMISSION_STATUS_LABELS[submission.status]}
                          </Badge>
                          <span>
                            {CHECKPOINT_LABELS[submission.checkpoint]} ·{" "}
                            {formatNumber(submission.views)} views ·{" "}
                            {formatDateTime(submission.createdAt, timezone)}
                          </span>
                          {submission.reviewNotes ? (
                            <span className="text-muted-foreground">
                              — {submission.reviewNotes}
                            </span>
                          ) : null}
                          {submission.status === "menunggu" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={isPending}
                              onClick={() => withdraw(submission.id)}
                            >
                              Tarik
                            </Button>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {campaignRunning && canCreatorEditDraft(content.reviewStatus) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setDialog({
                            kind: content.reviewStatus === "revisi" ? "new-draft" : "edit",
                            content,
                          })
                        }
                      >
                        {content.reviewStatus === "revisi" ? "Kirim draf baru" : "Perbaiki draf"}
                      </Button>
                    ) : null}

                    {campaignRunning &&
                    canProposePosted(content.reviewStatus, content.liveStatus) ? (
                      <Button
                        size="sm"
                        variant={waitingConfirmation ? "outline" : "default"}
                        onClick={() => setDialog({ kind: "posted", content })}
                      >
                        {waitingConfirmation ? "Ubah laporan tayang" : "Laporkan tayang"}
                      </Button>
                    ) : null}

                    {campaignRunning &&
                    canSubmitMetric(content.reviewStatus, content.liveStatus) &&
                    !pendingSubmission ? (
                      <Button
                        size="sm"
                        variant={content.dueCheckpoints.length ? "default" : "outline"}
                        onClick={() => setDialog({ kind: "metric", content })}
                      >
                        Kirim bukti metrik
                        {content.dueCheckpoints.length
                          ? ` (${CHECKPOINT_LABELS[content.dueCheckpoints[0]!]} jatuh tempo)`
                          : ""}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {dialog?.kind === "create" ? (
        <DraftDialog
          mode="create"
          campaignId={campaignId}
          assignmentId={assignmentId}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.kind === "edit" || dialog?.kind === "new-draft" ? (
        <DraftDialog
          mode={dialog.kind}
          campaignId={campaignId}
          content={dialog.content}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.kind === "posted" ? (
        <PostedDialog content={dialog.content} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.kind === "metric" ? (
        <MetricDialog
          campaignId={campaignId}
          content={dialog.content}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </>
  );
}
