import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { DetailList } from "@/components/layout/detail-list";
import { PageHeader } from "@/components/layout/page-header";
import {
  LiveStatusBadge,
  ReviewStatusBadge,
  SubmissionStatusBadge,
} from "@/components/status/status-badge";
import { CopyButton } from "@/components/forms/copy-button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternal } from "@/lib/auth/guards";
import { budgetRemaining } from "@/lib/calculations/campaign-budget";
import { CLIP_REJECTION_REASON_LABELS } from "@/lib/constants/clips";
import { REVIEW_DECISION_LABELS } from "@/lib/constants/contents";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/constants/creators";
import { getClipForVerification } from "@/lib/data/clips";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarRange, formatDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CancelClipCard, ClipDecisionForm, ViewsUpdateDecisionForm } from "./verify-forms";

export const metadata: Metadata = { title: "Verifikasi klip" };

/** FR-M18-04 … FR-M18-07: everything the verifier needs on one page. */
export default async function ClipVerificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireInternal();
  const tz = session.profile.timezone;
  const supabase = await createSupabaseServerClient();
  const clip = await getClipForVerification(supabase, id);
  if (!clip) notFound();

  const { campaign, creator, pendingSubmission } = clip;
  const account = creator.socialAccounts.find((row) => row.platform === clip.platform);
  const awaitingClip = clip.reviewStatus === "menunggu_review" && pendingSubmission;
  const awaitingUpdate = clip.reviewStatus === "disetujui" && pendingSubmission;
  const campaignOpen = campaign.status === "aktif" || session.profile.role === "owner";
  const budgetLeft = budgetRemaining({
    creatorBudget: campaign.creatorBudget,
    creatorCost: clip.ledger.campaignCost,
    ratePer1000Views: campaign.ratePer1000Views,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Klip ${creator.stageName || creator.name}`}
        description={`${campaign.code} · ${campaign.name}`}
        backHref="/verifikasi"
        backLabel="Antrean verifikasi"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ReviewStatusBadge status={clip.reviewStatus} />
            {clip.reviewStatus === "disetujui" ? (
              <LiveStatusBadge status={clip.liveStatus} />
            ) : null}
          </div>
        }
      />

      {clip.flags.length ? (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Penanda risiko — periksa sebelum memutuskan</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {clip.flags.map((flag) => (
                <li key={flag.code}>{flag.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,26rem)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Klip</h2>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {clip.url ? (
                <a
                  href={clip.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1 text-sm font-medium break-all hover:underline"
                >
                  {clip.url}
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                </a>
              ) : null}
              <DetailList
                items={[
                  { label: "Platform", value: SOCIAL_PLATFORM_LABELS[clip.platform] },
                  {
                    label: "Waktu tayang (klaim)",
                    value: clip.postedAt ? formatDateTime(clip.postedAt, tz) : null,
                  },
                  {
                    label: "Bergabung",
                    value: clip.assignment.joinedAt
                      ? formatDateTime(clip.assignment.joinedAt, tz)
                      : null,
                  },
                  {
                    label: "Periode kampanye",
                    value: formatCalendarRange(campaign.startDate, campaign.endDate),
                  },
                  {
                    label: "Views terverifikasi",
                    value: clip.verifiedViews === null ? null : formatNumber(clip.verifiedViews),
                  },
                  {
                    label: "Honor klip saat ini",
                    value: formatRupiah(clip.ledger.alreadyCreditedForClip),
                  },
                  ...(clip.rejectionReason
                    ? [
                        {
                          label: "Alasan penolakan",
                          value: CLIP_REJECTION_REASON_LABELS[clip.rejectionReason],
                        },
                      ]
                    : []),
                  ...(clip.removedAt
                    ? [{ label: "Dihapus pada", value: formatDateTime(clip.removedAt, tz) }]
                    : []),
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Klipper</h2>
              </CardTitle>
              <CardDescription>
                Kode verifikasi ini wajib ada di caption klip (FR-M18-03).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border bg-muted px-3 py-1.5 font-mono text-lg font-semibold">
                  {creator.verificationCode ?? "–"}
                </span>
                {creator.verificationCode ? (
                  <CopyButton value={creator.verificationCode} label="Salin kode" />
                ) : null}
              </div>
              <DetailList
                items={[
                  {
                    label: "Nama",
                    value: (
                      <Link href={`/creators/${creator.id}`} className="hover:underline">
                        {creator.name}
                        {creator.stageName ? ` (${creator.stageName})` : ""}
                      </Link>
                    ),
                  },
                  {
                    label: `Akun ${SOCIAL_PLATFORM_LABELS[clip.platform]} terdaftar`,
                    value: account ? (
                      account.profileUrl ? (
                        <a
                          href={account.profileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          @{account.handle} · {formatNumber(account.followers)} pengikut
                        </a>
                      ) : (
                        `@${account.handle} · ${formatNumber(account.followers)} pengikut`
                      )
                    ) : (
                      <span className="text-destructive">
                        Tidak ada akun terdaftar di platform ini
                      </span>
                    ),
                    wide: true,
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Aturan kampanye</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  {
                    label: "Tarif per 1.000 views",
                    value: formatRupiah(campaign.ratePer1000Views),
                  },
                  { label: "Minimum views berhonor", value: formatNumber(campaign.minViewsToEarn) },
                  {
                    label: "Batas per klip",
                    value:
                      campaign.maxPayoutPerClip === null
                        ? "Tanpa batas"
                        : formatRupiah(campaign.maxPayoutPerClip),
                  },
                  {
                    label: "Batas per klipper",
                    value:
                      campaign.maxPayoutPerCreator === null
                        ? "Tanpa batas"
                        : formatRupiah(campaign.maxPayoutPerCreator),
                  },
                  {
                    label: "Sisa anggaran",
                    value: `${formatRupiah(budgetLeft)} dari ${formatRupiah(campaign.creatorBudget)}`,
                  },
                  { label: "Minimal hari tayang", value: `${campaign.minLiveDays} hari` },
                  { label: "Hashtag wajib", value: campaign.hashtags.join(" "), wide: true },
                  { label: "Poin wajib", value: campaign.mustDo.join("\n"), wide: true },
                  { label: "Larangan", value: campaign.mustNot.join("\n"), wide: true },
                  {
                    label: "Label konten berbayar",
                    value: campaign.paidLabelRequired ? "Wajib" : "Tidak diwajibkan",
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                <h2>Riwayat kiriman views</h2>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {clip.submissions.map((submission) => (
                  <li key={submission.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <SubmissionStatusBadge status={submission.status} />
                      <span>{formatDateTime(submission.createdAt, tz)}</span>
                      {submission.proofUrl ? (
                        <a
                          href={submission.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-medium hover:underline"
                        >
                          Lihat tangkapan layar
                          <ExternalLink className="size-3.5" aria-hidden />
                        </a>
                      ) : null}
                    </div>
                    <p className="mt-1">
                      Klaim {formatNumber(submission.views)} views ·{" "}
                      {formatNumber(submission.likes)} suka · {formatNumber(submission.comments)}{" "}
                      komentar · {formatNumber(submission.shares)} dibagikan
                    </p>
                    {submission.status === "diterima" ? (
                      <p className="text-muted-foreground">
                        Terverifikasi {formatNumber(submission.verifiedViews ?? 0)} views · kredit{" "}
                        {formatRupiah(submission.creditedAmount ?? 0)}
                        {submission.creditLimited ? " (dibatasi batas kampanye)" : ""}
                      </p>
                    ) : null}
                    {submission.reviewNotes ? (
                      <p className="text-muted-foreground">Catatan: {submission.reviewNotes}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {clip.reviews.length ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>Riwayat keputusan</h2>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  {clip.reviews.map((review) => (
                    <li key={review.id}>
                      <span className="font-medium">{REVIEW_DECISION_LABELS[review.decision]}</span>{" "}
                      · {formatDateTime(review.createdAt, tz)}
                      {review.reviewerName ? ` · ${review.reviewerName}` : ""}
                      {review.notes ? (
                        <span className="block text-muted-foreground">{review.notes}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          {!campaignOpen ? (
            <Alert>
              <AlertDescription>
                Kampanye sudah ditutup; hanya owner yang dapat memutuskan.
              </AlertDescription>
            </Alert>
          ) : awaitingClip ? (
            <ClipDecisionForm
              contentId={clip.id}
              claimedViews={pendingSubmission.views}
              paidLabelRequired={campaign.paidLabelRequired}
              terms={campaign}
              ledger={clip.ledger}
            />
          ) : awaitingUpdate ? (
            <ViewsUpdateDecisionForm
              submissionId={pendingSubmission.id}
              claimedViews={pendingSubmission.views}
              terms={campaign}
              ledger={clip.ledger}
            />
          ) : (
            <Alert>
              <AlertDescription>
                {clip.reviewStatus === "revisi"
                  ? "Menunggu klipper memperbaiki dan mengirim ulang klip."
                  : "Tidak ada kiriman yang menunggu keputusan untuk klip ini."}
              </AlertDescription>
            </Alert>
          )}

          {campaignOpen && clip.reviewStatus === "disetujui" ? (
            <CancelClipCard
              contentId={clip.id}
              isOwner={session.profile.role === "owner"}
              minLiveDays={campaign.minLiveDays}
              isLive={clip.liveStatus === "tayang"}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
