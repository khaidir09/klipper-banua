import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Download, ExternalLink } from "lucide-react";
import { AssignmentStatusBadge, CampaignStatusBadge } from "@/components/status/status-badge";
import { CopyButton } from "@/components/forms/copy-button";
import { DetailList } from "@/components/layout/detail-list";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreator } from "@/lib/auth/guards";
import { dueSnapshots, suggestCheckpoint } from "@/lib/calculations/checkpoints";
import { ASSET_TYPE_LABELS } from "@/lib/constants/campaigns";
import { PAYOUT_STATUS_LABELS } from "@/lib/constants/finance";
import {
  getPortalAssignment,
  getPortalPayout,
  listPortalAssets,
  listPortalContents,
  listPortalMetrics,
  listPortalReviews,
  listPortalSubmissions,
} from "@/lib/data/portal";
import { publicEnv } from "@/lib/env";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarDate, formatCalendarRange } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SubmissionsPanel, type PortalContentView } from "./submissions-panel";

export const metadata: Metadata = { title: "Brief penugasan" };

function List({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default async function PortalAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireCreator();

  const supabase = await createSupabaseServerClient();
  const assignment = await getPortalAssignment(supabase, id);
  if (!assignment) notFound();

  const [assets, contents, payout] = await Promise.all([
    listPortalAssets(supabase, assignment.campaign_id),
    listPortalContents(supabase, id),
    getPortalPayout(supabase, id),
  ]);

  const contentIds = contents.map((content) => content.id);
  const [reviews, metrics, submissions] = await Promise.all([
    listPortalReviews(supabase, contentIds),
    listPortalMetrics(supabase, contentIds),
    listPortalSubmissions(supabase, contentIds),
  ]);

  const tz = session.profile.timezone;
  const now = new Date();
  const due = dueSnapshots(
    contents.map((content) => ({
      id: content.id,
      posted_at: content.posted_at,
      live_status: content.live_status,
      checkpoints: metrics.filter((m) => m.content_id === content.id).map((m) => m.checkpoint),
    })),
    now,
    tz,
  );

  const contentViews: PortalContentView[] = contents.map((content) => {
    const ownMetrics = metrics.filter((metric) => metric.content_id === content.id);
    return {
      id: content.id,
      platform: content.platform,
      draftUrl: content.draft_url,
      draftFilePath: content.draft_file_path,
      captionDraft: content.caption_draft,
      reviewStatus: content.review_status,
      liveStatus: content.live_status,
      postedUrl: content.posted_url,
      postedAt: content.posted_at,
      proposedPostedUrl: content.proposed_posted_url,
      proposedPostedAt: content.proposed_posted_at,
      lastReview:
        reviews
          .filter((review) => review.content_id === content.id)
          .map((review) => ({
            decision: review.decision,
            notes: review.notes,
            createdAt: review.created_at,
          }))[0] ?? null,
      metrics: ownMetrics.map((metric) => ({
        id: metric.id,
        checkpoint: metric.checkpoint,
        capturedAt: metric.captured_at,
        views: Number(metric.views),
      })),
      submissions: submissions
        .filter((submission) => submission.content_id === content.id)
        .map((submission) => ({
          id: submission.id,
          checkpoint: submission.checkpoint,
          capturedAt: submission.captured_at,
          views: Number(submission.views),
          status: submission.status,
          reviewNotes: submission.review_notes,
          createdAt: submission.created_at,
        })),
      dueCheckpoints: due.filter((d) => d.contentId === content.id).map((d) => d.checkpoint),
      suggestedCheckpoint: suggestCheckpoint(
        { posted_at: content.posted_at, checkpoints: ownMetrics.map((m) => m.checkpoint) },
        now,
        tz,
      ),
    };
  });
  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");
  const trackingUrl = `${baseUrl}/r/${assignment.tracking_slug}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={assignment.campaign_name}
        description={`${assignment.client_name} · ${formatCalendarRange(assignment.start_date, assignment.end_date)}`}
        backHref="/portal/penugasan"
        backLabel="Penugasan saya"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CampaignStatusBadge status={assignment.campaign_status} />
            <AssignmentStatusBadge status={assignment.status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm whitespace-pre-line">
              {assignment.brief || (
                <span className="text-muted-foreground">Belum ada deskripsi brief.</span>
              )}
            </p>
            <div className="flex flex-wrap gap-2">
              {assignment.hashtags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
              <Badge variant={assignment.paid_label_required ? "default" : "outline"}>
                {assignment.paid_label_required
                  ? "Label berbayar wajib"
                  : "Label berbayar tidak wajib"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yang wajib</CardTitle>
          </CardHeader>
          <CardContent>
            <List items={assignment.must_do} empty="Belum ada poin wajib." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Larangan</CardTitle>
          </CardHeader>
          <CardContent>
            <List items={assignment.must_not} empty="Belum ada larangan." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kode referal dan tautan</CardTitle>
            <CardDescription>
              Cantumkan tautan ini di bio atau keterangan, dan minta audiens memakai kode referal
              saat mendaftar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md border bg-muted px-2 py-1 font-mono text-sm">
                {assignment.referral_code}
              </span>
              <CopyButton value={assignment.referral_code} label="Salin kode" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 truncate rounded-md border bg-muted px-2 py-1 font-mono text-sm">
                {trackingUrl}
              </span>
              <CopyButton
                value={trackingUrl}
                label="Salin tautan"
                successMessage="Tautan disalin."
              />
            </div>
            {assignment.landing_url ? (
              <p className="text-xs text-muted-foreground">
                Tautan mengarah ke halaman pendaftaran klien.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kesepakatan honor</CardTitle>
            <CardDescription>
              Honor dihitung setelah kampanye selesai dan konten memenuhi minimal hari tayang.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                { label: "Honor dasar", value: formatRupiah(assignment.base_fee) },
                {
                  label: "Bonus per 1.000 views",
                  value: formatRupiah(assignment.bonus_per_1000_views),
                },
                {
                  label: "Bonus per pendaftar",
                  value: formatRupiah(assignment.bonus_per_registrant),
                },
                {
                  label: "Batas bonus views",
                  value:
                    assignment.views_bonus_cap === null
                      ? "Tanpa batas"
                      : formatRupiah(assignment.views_bonus_cap),
                },
                { label: "Konten disepakati", value: `${assignment.contents_committed} konten` },
                { label: "Minimal hari tayang", value: `${assignment.min_live_days} hari` },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Honor saya</CardTitle>
            <CardDescription>
              {payout
                ? payout.status === "draf"
                  ? "Masih dihitung tim dan bisa berubah sampai disetujui."
                  : "Sudah diperiksa tim."
                : "Honor dihitung setelah kampanye selesai."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payout ? (
              <DetailList
                items={[
                  { label: "Honor dasar", value: formatRupiah(payout.base_amount) },
                  { label: "Bonus views", value: formatRupiah(payout.views_bonus) },
                  { label: "Bonus pendaftar", value: formatRupiah(payout.registrant_bonus) },
                  {
                    label: "Penyesuaian",
                    value: payout.adjustment_amount
                      ? `${formatRupiah(payout.adjustment_amount)}${payout.adjustment_reason ? ` — ${payout.adjustment_reason}` : ""}`
                      : "–",
                    wide: true,
                  },
                  { label: "Total", value: formatRupiah(payout.total_amount) },
                  {
                    label: "Status",
                    value:
                      payout.status === "draf"
                        ? "Sedang dihitung"
                        : PAYOUT_STATUS_LABELS[payout.status],
                  },
                  ...(payout.paid_at
                    ? [{ label: "Dibayar pada", value: formatCalendarDate(payout.paid_at) }]
                    : []),
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada perhitungan honor untuk penugasan ini.
              </p>
            )}
          </CardContent>
        </Card>

        <SubmissionsPanel
          campaignId={assignment.campaign_id}
          assignmentId={assignment.id}
          campaignRunning={assignment.campaign_status === "aktif"}
          contentsCommitted={assignment.contents_committed}
          timezone={tz}
          contents={contentViews}
        />

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Materi kampanye</CardTitle>
          </CardHeader>
          <CardContent>
            {assets.length ? (
              <ul className="divide-y">
                {assets.map((asset) => {
                  const href = asset.signed_url ?? asset.external_url;
                  return (
                    <li key={asset.id} className="flex flex-wrap items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{asset.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {ASSET_TYPE_LABELS[asset.type]}
                          {asset.notes ? ` · ${asset.notes}` : ""}
                        </p>
                      </div>
                      {href ? (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                        >
                          {asset.file_path ? (
                            <Download className="size-4" aria-hidden />
                          ) : (
                            <ExternalLink className="size-4" aria-hidden />
                          )}
                          {asset.file_path ? "Unduh" : "Buka"}
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Berkas tidak tersedia</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Belum ada materi untuk kampanye ini.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
