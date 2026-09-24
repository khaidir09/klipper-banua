"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleAlert, ExternalLink, TrendingUp } from "lucide-react";
import {
  LiveStatusBadge,
  ReviewStatusBadge,
  SubmissionStatusBadge,
} from "@/components/status/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CLIP_REJECTION_REASON_LABELS } from "@/lib/constants/clips";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/constants/creators";
import type { PortalClip } from "@/lib/data/portal";
import { formatRupiah } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { ResubmitClipButton, ViewsUpdateDialog } from "./clip-forms";

/**
 * The klipper's clips with their review, honor and next step (FR-M18-03 …
 * FR-M18-05). `showCampaign` adds the campaign name, for the list across
 * every campaign.
 */
export function ClipList({
  clips,
  timezone,
  showCampaign = false,
}: {
  clips: PortalClip[];
  timezone: string;
  showCampaign?: boolean;
}) {
  const [updating, setUpdating] = useState<PortalClip | null>(null);

  return (
    <>
      <ul className="space-y-4">
        {clips.map((clip) => {
          const decisionNote =
            clip.lastReview && clip.lastReview.decision !== "disetujui" && clip.lastReview.notes
              ? clip.lastReview.notes
              : null;
          return (
            <li key={clip.id} id={`klip-${clip.id}`} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <ReviewStatusBadge status={clip.reviewStatus} />
                {clip.reviewStatus === "disetujui" ? (
                  <LiveStatusBadge status={clip.liveStatus} />
                ) : null}
                <span className="text-sm text-muted-foreground">
                  {SOCIAL_PLATFORM_LABELS[clip.platform]}
                  {showCampaign ? (
                    <>
                      {" · "}
                      <Link
                        href={`/portal/penugasan/${clip.assignmentId}`}
                        className="hover:underline"
                      >
                        {clip.campaignName}
                      </Link>
                    </>
                  ) : null}
                </span>
              </div>

              {clip.url ? (
                <a
                  href={clip.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex max-w-full items-center gap-1 text-sm break-all hover:underline"
                >
                  {clip.url}
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                </a>
              ) : null}

              <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Tayang</dt>
                  <dd>{clip.postedAt ? formatDateTime(clip.postedAt, timezone) : "–"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Views terverifikasi</dt>
                  <dd>
                    {clip.verifiedViews === null ? "Belum" : formatNumber(clip.verifiedViews)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Honor klip</dt>
                  <dd className="font-medium">{formatRupiah(clip.earnedAmount)}</dd>
                </div>
              </dl>

              {clip.reviewStatus === "ditolak" ? (
                <Alert variant="destructive" className="mt-3">
                  <CircleAlert />
                  <AlertDescription>
                    <span className="font-medium">
                      Ditolak
                      {clip.rejectionReason
                        ? `: ${CLIP_REJECTION_REASON_LABELS[clip.rejectionReason]}`
                        : ""}
                      .
                    </span>{" "}
                    {clip.lastReview?.notes}
                  </AlertDescription>
                </Alert>
              ) : decisionNote ? (
                <Alert className="mt-3">
                  <CircleAlert />
                  <AlertDescription>
                    <span className="font-medium">Perlu perbaikan: </span>
                    {decisionNote}
                  </AlertDescription>
                </Alert>
              ) : null}

              {clip.liveStatus === "dihapus" ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Tim mencatat klip ini dihapus
                  {clip.removedAt ? ` pada ${formatDateTime(clip.removedAt, timezone)}` : ""}.
                </p>
              ) : null}

              {clip.submissions.length ? (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {clip.submissions.map((submission) => (
                    <li key={submission.id} className="flex flex-wrap items-center gap-2">
                      <SubmissionStatusBadge status={submission.status} />
                      <span>
                        {formatNumber(submission.views)} views dikirim ·{" "}
                        {formatDateTime(submission.createdAt, timezone)}
                      </span>
                      {submission.status === "diterima" ? (
                        <span className="text-muted-foreground">
                          — {formatNumber(submission.verifiedViews ?? 0)} terverifikasi, +
                          {formatRupiah(submission.creditedAmount ?? 0)}
                          {submission.creditLimited ? " (dibatasi batas kampanye)" : ""}
                        </span>
                      ) : null}
                      {submission.status === "ditolak" && submission.reviewNotes ? (
                        <span className="text-muted-foreground">— {submission.reviewNotes}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {clip.reviewStatus === "revisi" ? <ResubmitClipButton contentId={clip.id} /> : null}
                {clip.viewsUpdate.allowed ? (
                  <Button size="sm" variant="outline" onClick={() => setUpdating(clip)}>
                    <TrendingUp aria-hidden />
                    Perbarui views
                  </Button>
                ) : clip.viewsUpdate.message ? (
                  <p className="text-xs text-muted-foreground">{clip.viewsUpdate.message}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      {updating ? (
        <ViewsUpdateDialog
          contentId={updating.id}
          campaignId={updating.campaignId}
          onClose={() => setUpdating(null)}
        />
      ) : null}
    </>
  );
}
