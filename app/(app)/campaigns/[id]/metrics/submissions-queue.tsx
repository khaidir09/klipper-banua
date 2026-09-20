"use client";

import { useState, useTransition } from "react";
import { Check, FileImage, X } from "lucide-react";
import { toast } from "sonner";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/constants/creators";
import { CHECKPOINT_LABELS } from "@/lib/constants/metrics";
import type { PendingSubmissionView } from "@/lib/data/metrics";
import { formatDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { reviewMetricSubmissionAction } from "../../metric-actions";

/**
 * FR-M13-06: metric numbers a creator sent from the portal. Accepting writes
 * the official snapshot; rejecting always carries a reason back to them.
 */
export function SubmissionsQueue({
  campaignId,
  canEdit,
  timezone,
  submissions,
}: {
  campaignId: string;
  canEdit: boolean;
  timezone: string;
  submissions: PendingSubmissionView[];
}) {
  const [rejecting, setRejecting] = useState<PendingSubmissionView | null>(null);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!submissions.length) return null;

  function verify(submissionId: string, accept: boolean, reason = "") {
    startTransition(async () => {
      const result = await reviewMetricSubmissionAction(campaignId, {
        submission_id: submissionId,
        accept,
        notes: reason,
      });
      if (result.status === "success") {
        toast.success(result.message);
        setRejecting(null);
        setNotes("");
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Kiriman metrik menunggu verifikasi ({submissions.length})</CardTitle>
          <CardDescription>
            Angka dari kreator lewat portal. Angka baru dihitung setelah Anda menerimanya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {submissions.map((submission) => (
              <li key={submission.id} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-medium">
                    {submission.creatorName}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      {SOCIAL_PLATFORM_LABELS[submission.platform]} ·{" "}
                      {CHECKPOINT_LABELS[submission.checkpoint]}
                    </span>
                  </p>
                  <p className="text-sm">
                    {formatNumber(submission.views)} views · {formatNumber(submission.likes)} suka ·{" "}
                    {formatNumber(submission.comments)} komentar · {formatNumber(submission.shares)}{" "}
                    dibagikan · {formatNumber(submission.saves)} disimpan
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Diambil {formatDateTime(submission.captured_at, timezone)} · dikirim{" "}
                    {formatDateTime(submission.created_at, timezone)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {submission.proofUrl ? (
                    <a
                      href={submission.proofUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm hover:underline"
                    >
                      <FileImage className="size-4" aria-hidden />
                      Bukti
                    </a>
                  ) : null}
                  {canEdit ? (
                    <>
                      <Button
                        size="sm"
                        disabled={isPending}
                        onClick={() => verify(submission.id, true)}
                      >
                        <Check aria-hidden />
                        Terima
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => {
                          setNotes("");
                          setRejecting(submission);
                        }}
                      >
                        <X aria-hidden />
                        Tolak
                      </Button>
                    </>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {rejecting ? (
        <Dialog open onOpenChange={(open) => !open && setRejecting(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Tolak kiriman metrik</DialogTitle>
              <DialogDescription>
                Alasan ini muncul di portal {rejecting.creatorName}, jadi tulis yang perlu
                diperbaiki.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup className="my-4">
              <Field>
                <FieldLabel htmlFor="sub-notes">Alasan penolakan</FieldLabel>
                <Textarea
                  id="sub-notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Contoh: tangkapan layar terpotong, angka views tidak terlihat."
                />
              </Field>
            </FieldGroup>

            <DialogFooter>
              <Button variant="outline" onClick={() => setRejecting(null)} disabled={isPending}>
                Batal
              </Button>
              <Button
                variant="destructive"
                disabled={isPending || notes.trim().length === 0}
                onClick={() => verify(rejecting.id, false, notes)}
              >
                Tolak kiriman
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
