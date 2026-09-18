"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CheckCircle2,
  ExternalLink,
  FileVideo,
  History,
  PencilLine,
  Plus,
  Radio,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  LIVE_STATUS_LABELS,
  REVIEW_DECISION_LABELS,
  REVIEW_STATUSES,
  REVIEW_STATUS_LABELS,
  type LiveStatus,
  type ReviewDecision,
  type ReviewStatus,
} from "@/lib/constants/contents";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/constants/creators";
import type { AssignmentStatus } from "@/lib/constants/campaigns";
import {
  CHECKLIST_ITEMS,
  canDeleteContent,
  canEditDraft,
  canMarkPosted,
  canMarkRemoved,
  canReview,
  canSubmitNewDraft,
} from "@/lib/contents/review";
import type { ContentView } from "@/lib/data/contents";
import { formatDateTime } from "@/lib/format/date";
import { deleteContentAction } from "../../content-actions";
import {
  ContentDraftDialog,
  PostedDialog,
  RemovedDialog,
  ReviewDialog,
  type BriefContext,
} from "./content-dialogs";

type AssignmentOption = { id: string; name: string; status: AssignmentStatus };

type DialogState =
  | { kind: "create" }
  | { kind: "edit-draft" | "new-draft" | "review" | "posted" | "removed"; content: ContentView }
  | null;

const REVIEW_VARIANTS: Record<ReviewStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  menunggu_review: "outline",
  disetujui: "default",
  revisi: "secondary",
  ditolak: "destructive",
};

const LIVE_VARIANTS: Record<LiveStatus, React.ComponentProps<typeof Badge>["variant"]> = {
  belum_tayang: "outline",
  tayang: "default",
  dihapus: "destructive",
};

const DECISION_ICONS: Record<ReviewDecision, React.ReactNode> = {
  disetujui: <CheckCircle2 className="size-4 text-primary" aria-hidden />,
  revisi: <PencilLine className="size-4 text-muted-foreground" aria-hidden />,
  ditolak: <XCircle className="size-4 text-destructive" aria-hidden />,
};

export function ContentsPanel({
  campaignId,
  canEdit,
  timezone,
  contents,
  assignments,
  brief,
}: {
  campaignId: string;
  canEdit: boolean;
  timezone: string;
  contents: ContentView[];
  assignments: AssignmentOption[];
  brief: BriefContext;
}) {
  const [creatorFilter, setCreatorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "">("");
  const [dialog, setDialog] = useState<DialogState>(null);

  const visible = useMemo(
    () =>
      contents.filter(
        (content) =>
          (!creatorFilter || content.campaign_creator_id === creatorFilter) &&
          (!statusFilter || content.review_status === statusFilter),
      ),
    [contents, creatorFilter, statusFilter],
  );

  const waiting = contents.filter((content) => content.review_status === "menunggu_review").length;
  const close = () => setDialog(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Konten</CardTitle>
        <CardDescription>
          {contents.length} konten · {waiting} menunggu review. Konten hanya boleh tayang setelah
          disetujui.
        </CardDescription>
        {canEdit ? (
          <CardAction>
            <Button
              size="sm"
              onClick={() => setDialog({ kind: "create" })}
              disabled={!assignments.length}
            >
              <Plus aria-hidden />
              Catat konten
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tugaskan kreator di tab Kreator sebelum mencatat konten.
          </p>
        ) : null}

        {contents.length ? (
          <div className="flex flex-wrap gap-2">
            <NativeSelect
              size="sm"
              aria-label="Filter kreator"
              value={creatorFilter}
              onChange={(event) => setCreatorFilter(event.target.value)}
            >
              <NativeSelectOption value="">Semua kreator</NativeSelectOption>
              {assignments.map((assignment) => (
                <NativeSelectOption key={assignment.id} value={assignment.id}>
                  {assignment.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              size="sm"
              aria-label="Filter status review"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ReviewStatus | "")}
            >
              <NativeSelectOption value="">Semua status</NativeSelectOption>
              {REVIEW_STATUSES.map((status) => (
                <NativeSelectOption key={status} value={status}>
                  {REVIEW_STATUS_LABELS[status]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        ) : null}

        {contents.length === 0 && assignments.length ? (
          <p className="text-sm text-muted-foreground">Belum ada konten yang dicatat.</p>
        ) : null}
        {contents.length > 0 && visible.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Tidak ada konten yang cocok dengan filter.
          </p>
        ) : null}

        <ul className="space-y-3">
          {visible.map((content) => (
            <ContentItem
              key={content.id}
              campaignId={campaignId}
              content={content}
              canEdit={canEdit}
              timezone={timezone}
              onOpen={(kind) => setDialog({ kind, content })}
            />
          ))}
        </ul>
      </CardContent>

      {dialog?.kind === "create" ? (
        <ContentDraftDialog
          mode="create"
          campaignId={campaignId}
          assignments={assignments.filter((a) => a.status !== "mundur")}
          onClose={close}
        />
      ) : null}
      {dialog?.kind === "edit-draft" || dialog?.kind === "new-draft" ? (
        <ContentDraftDialog
          mode={dialog.kind === "new-draft" ? "new-draft" : "edit"}
          campaignId={campaignId}
          content={dialog.content}
          onClose={close}
        />
      ) : null}
      {dialog?.kind === "review" ? (
        <ReviewDialog
          campaignId={campaignId}
          content={dialog.content}
          brief={brief}
          onClose={close}
        />
      ) : null}
      {dialog?.kind === "posted" ? (
        <PostedDialog
          campaignId={campaignId}
          content={dialog.content}
          timezone={timezone}
          onClose={close}
        />
      ) : null}
      {dialog?.kind === "removed" ? (
        <RemovedDialog
          campaignId={campaignId}
          content={dialog.content}
          timezone={timezone}
          onClose={close}
        />
      ) : null}
    </Card>
  );
}

function DraftLinks({
  url,
  fileUrl,
  hasFile,
}: {
  url: string | null;
  fileUrl: string | null;
  hasFile: boolean;
}) {
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Tautan draf
        </a>
      ) : null}
      {hasFile ? (
        fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
          >
            <FileVideo className="size-3.5" aria-hidden />
            Berkas draf
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">Berkas draf tidak tersedia</span>
        )
      ) : null}
    </span>
  );
}

function ContentItem({
  campaignId,
  content,
  canEdit,
  timezone,
  onOpen,
}: {
  campaignId: string;
  content: ContentView;
  canEdit: boolean;
  timezone: string;
  onOpen: (kind: "edit-draft" | "new-draft" | "review" | "posted" | "removed") => void;
}) {
  const [showHistory, setShowHistory] = useState(false);
  const [isPending, startTransition] = useTransition();
  const platform = content.platform as SocialPlatform;

  function remove() {
    if (!window.confirm("Hapus konten yang belum direview ini?")) return;
    startTransition(async () => {
      const result = await deleteContentAction(campaignId, content.id);
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <li className="rounded-lg border p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="font-medium">
            {content.creatorName}
            <Badge variant="secondary" className="ml-2 align-middle">
              {SOCIAL_PLATFORM_LABELS[platform] ?? content.platform}
            </Badge>
            {content.revision_count > 0 ? (
              <span className="ml-2 text-xs text-muted-foreground">
                Draf ke-{content.revision_count + 1}
              </span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant={REVIEW_VARIANTS[content.review_status]}>
              {REVIEW_STATUS_LABELS[content.review_status]}
            </Badge>
            {content.review_status === "disetujui" ? (
              <Badge variant={LIVE_VARIANTS[content.live_status]}>
                {LIVE_STATUS_LABELS[content.live_status]}
              </Badge>
            ) : null}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Dicatat {formatDateTime(content.created_at, timezone)}
        </p>
      </div>

      <div className="mt-3 space-y-2 text-sm">
        <DraftLinks
          url={content.draft_url}
          fileUrl={content.draftFileUrl}
          hasFile={Boolean(content.draft_file_path)}
        />
        {content.caption_draft ? (
          <p className="line-clamp-3 whitespace-pre-line text-muted-foreground">
            {content.caption_draft}
          </p>
        ) : null}
        {content.posted_url ? (
          <p>
            Tayang:{" "}
            <a
              href={content.posted_url}
              target="_blank"
              rel="noreferrer"
              className="break-all underline-offset-4 hover:underline"
            >
              {content.posted_url}
            </a>
            {content.posted_at ? (
              <span className="text-muted-foreground">
                {" "}
                · {formatDateTime(content.posted_at, timezone)}
              </span>
            ) : null}
          </p>
        ) : null}
        {content.removed_at ? (
          <p className="text-destructive">Dihapus {formatDateTime(content.removed_at, timezone)}</p>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {canEdit && canReview(content.review_status) ? (
          <Button size="sm" onClick={() => onOpen("review")}>
            Review
          </Button>
        ) : null}
        {canEdit && canEditDraft(content.review_status) ? (
          <Button size="sm" variant="outline" onClick={() => onOpen("edit-draft")}>
            <PencilLine aria-hidden />
            Ubah draf
          </Button>
        ) : null}
        {canEdit && canSubmitNewDraft(content.review_status) ? (
          <Button size="sm" onClick={() => onOpen("new-draft")}>
            <Upload aria-hidden />
            Catat draf baru
          </Button>
        ) : null}
        {canEdit && canMarkPosted(content.review_status) && content.live_status !== "dihapus" ? (
          <Button
            size="sm"
            variant={content.live_status === "tayang" ? "outline" : "default"}
            onClick={() => onOpen("posted")}
          >
            <Radio aria-hidden />
            {content.live_status === "tayang" ? "Ubah data tayang" : "Tandai tayang"}
          </Button>
        ) : null}
        {canEdit && canMarkRemoved(content.review_status, content.live_status) ? (
          <Button size="sm" variant="outline" onClick={() => onOpen("removed")}>
            Tandai dihapus
          </Button>
        ) : null}
        {content.reviews.length ? (
          <Button size="sm" variant="ghost" onClick={() => setShowHistory((value) => !value)}>
            <History aria-hidden />
            Riwayat review ({content.reviews.length})
          </Button>
        ) : null}
        {canEdit && canDeleteContent(content.review_status, content.revision_count) ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={remove}
            disabled={isPending}
            aria-label="Hapus konten"
          >
            <Trash2 aria-hidden />
          </Button>
        ) : null}
      </div>

      {showHistory ? <ReviewHistory content={content} timezone={timezone} /> : null}
    </li>
  );
}

/** FR-M6-06: read-only, oldest first. */
function ReviewHistory({ content, timezone }: { content: ContentView; timezone: string }) {
  return (
    <ol className="mt-3 space-y-3 border-t pt-3" aria-label="Riwayat review">
      {content.reviews.map((review) => (
        <li key={review.id} className="flex gap-3 text-sm">
          <span className="mt-0.5">{DECISION_ICONS[review.decision]}</span>
          <div className="min-w-0 space-y-1">
            <p>
              <span className="font-medium">{REVIEW_DECISION_LABELS[review.decision]}</span>
              {" · "}
              {review.reviewerName ?? "Pengguna dihapus"}
              <span className="text-muted-foreground">
                {" "}
                · {formatDateTime(review.created_at, timezone)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Draf ke-{review.snapshot.revision_count + 1}:{" "}
              <DraftLinks
                url={review.snapshot.draft_url}
                fileUrl={review.snapshotFileUrl}
                hasFile={Boolean(review.snapshot.draft_file_path)}
              />
            </p>
            {review.notes ? <p className="whitespace-pre-line">{review.notes}</p> : null}
            {Object.keys(review.checklist).length ? (
              <ul className="flex flex-wrap gap-1.5">
                {CHECKLIST_ITEMS.filter((item) => item.key in review.checklist).map((item) => (
                  <li key={item.key}>
                    <Badge variant={review.checklist[item.key] ? "secondary" : "outline"}>
                      {review.checklist[item.key] ? "✓" : "✗"} {item.label}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
