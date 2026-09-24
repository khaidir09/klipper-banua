import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { AssignmentStatusBadge, CampaignStatusBadge } from "@/components/status/status-badge";
import { CopyButton } from "@/components/forms/copy-button";
import { DetailList } from "@/components/layout/detail-list";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreator } from "@/lib/auth/guards";
import { dueSnapshots, suggestCheckpoint } from "@/lib/calculations/checkpoints";
import { CLIP_BLOCKER_MESSAGES, clipSubmissionBlockers } from "@/lib/campaigns/clips";
import { campaignToday, canWithdraw } from "@/lib/campaigns/open";
import { CREATOR_TERMS_VERSION } from "@/lib/constants/creators";
import { PAYOUT_STATUS_LABELS } from "@/lib/constants/finance";
import {
  getPortalAssignment,
  getPortalPayout,
  getPortalProfile,
  listPortalAssets,
  listPortalClips,
  listPortalContents,
  listPortalMetrics,
  listPortalReviews,
  listPortalSocialAccounts,
  listPortalSubmissions,
} from "@/lib/data/portal";
import { publicEnv } from "@/lib/env";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarDate, formatCalendarRange, formatDate } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AssetListCard, BriefCards, PerViewsTermsCard } from "../../campaign-parts";
import { TermsNotice } from "../../kampanye/terms-notice";
import { SubmitClipCard } from "../../klip/submit-clip-card";
import { ConfirmBriefCard } from "./confirm-brief-card";
import { SubmissionsPanel, type PortalContentView } from "./submissions-panel";
import { WithdrawCard } from "./withdraw-card";

export const metadata: Metadata = { title: "Brief penugasan" };

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

  const perViews = assignment.payout_model === "per_views";
  const tz = session.profile.timezone;

  const [assets, contents, payout, clipContext] = await Promise.all([
    listPortalAssets(supabase, assignment.campaign_id),
    listPortalContents(supabase, id),
    perViews ? null : getPortalPayout(supabase, id),
    perViews ? loadClipContext(supabase, assignment.campaign_id, id, tz) : null,
  ]);

  const contentIds = contents.map((content) => content.id);
  const [reviews, metrics, submissions] = await Promise.all([
    listPortalReviews(supabase, contentIds),
    listPortalMetrics(supabase, contentIds),
    listPortalSubmissions(supabase, contentIds),
  ]);

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
  // FR-M13-10: the brief has to be accepted before anything can be sent.
  const awaitingConfirmation =
    assignment.status === "diundang" && assignment.campaign_status === "aktif";
  // FR-M17-05: leaving is possible until a clip of theirs is approved.
  const mayWithdraw = canWithdraw({
    assignmentStatus: assignment.status,
    campaignStatus: assignment.campaign_status,
    payoutModel: assignment.payout_model,
    approvedClipCount: contents.filter((content) => content.review_status === "disetujui").length,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={assignment.campaign_name}
        description={`${assignment.client_name} · ${formatCalendarRange(assignment.start_date, assignment.end_date)}`}
        backHref="/portal/penugasan"
        backLabel="Kampanye Saya"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <CampaignStatusBadge status={assignment.campaign_status} />
            <AssignmentStatusBadge status={assignment.status} />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {awaitingConfirmation ? (
          <ConfirmBriefCard
            assignmentId={assignment.id}
            paidLabelRequired={assignment.paid_label_required}
            contentsCommitted={assignment.contents_committed}
            minLiveDays={assignment.min_live_days}
          />
        ) : null}

        {assignment.status === "mundur" ? (
          <Alert className="lg:col-span-2">
            <CircleAlert />
            <AlertDescription>
              {assignment.withdrawn_at
                ? `Anda mundur dari kampanye ini pada ${formatDate(assignment.withdrawn_at, tz)}.`
                : "Anda sudah mundur dari kampanye ini."}
            </AlertDescription>
          </Alert>
        ) : null}

        <BriefCards
          brief={assignment.brief}
          hashtags={assignment.hashtags}
          paidLabelRequired={assignment.paid_label_required}
          mustDo={assignment.must_do}
          mustNot={assignment.must_not}
        />

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Kode referal dan tautan</h2>
            </CardTitle>
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

        {perViews ? (
          <>
            <PerViewsTermsCard terms={assignment} />
            {clipContext && clipContext.termsVersion !== CREATOR_TERMS_VERSION ? (
              <div className="lg:col-span-2">
                <TermsNotice version={CREATOR_TERMS_VERSION} />
              </div>
            ) : null}
            {assignment.status === "mundur" || !clipContext ? null : (
              <SubmitClipCard
                assignmentId={assignment.id}
                campaignId={assignment.campaign_id}
                platforms={assignment.allowed_platforms.filter((platform) =>
                  clipContext.registeredPlatforms.includes(platform),
                )}
                verificationCode={clipContext.verificationCode}
                maxClips={assignment.max_clips_per_creator}
                activeClipCount={clipContext.activeClipCount}
                blocker={(() => {
                  const [first] = clipSubmissionBlockers({
                    creatorStatus: clipContext.creatorStatus,
                    termsVersion: clipContext.termsVersion,
                    currentTermsVersion: CREATOR_TERMS_VERSION,
                    assignmentStatus: assignment.status,
                    campaignStatus: assignment.campaign_status,
                    endDate: assignment.end_date,
                    today: campaignToday(),
                    budgetExhausted: clipContext.budgetExhausted,
                    maxClipsPerCreator: assignment.max_clips_per_creator,
                    activeClipCount: clipContext.activeClipCount,
                  });
                  return first ? CLIP_BLOCKER_MESSAGES[first] : null;
                })()}
                clips={clipContext.clips}
                timezone={tz}
              />
            )}
            {mayWithdraw ? <WithdrawCard assignmentId={assignment.id} /> : null}
          </>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>Kesepakatan honor</h2>
                </CardTitle>
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
                    {
                      label: "Konten disepakati",
                      value: `${assignment.contents_committed} konten`,
                    },
                    { label: "Minimal hari tayang", value: `${assignment.min_live_days} hari` },
                  ]}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <h2>Honor saya</h2>
                </CardTitle>
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
              confirmed={assignment.status !== "diundang"}
              contentsCommitted={assignment.contents_committed}
              timezone={tz}
              contents={contentViews}
            />
          </>
        )}

        <AssetListCard assets={assets} />
      </div>
    </div>
  );
}

/** What the clip card needs (FR-M18-01): the klipper, their accounts and clips. */
async function loadClipContext(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  campaignId: string,
  assignmentId: string,
  timezone: string,
) {
  const [profile, accounts, clips, { data: budgetExhausted }] = await Promise.all([
    getPortalProfile(supabase),
    listPortalSocialAccounts(supabase),
    listPortalClips(supabase, { assignmentId, timezone }),
    supabase.rpc("campaign_budget_exhausted", { target_campaign_id: campaignId }),
  ]);
  return {
    verificationCode: profile?.verification_code ?? "",
    creatorStatus: profile?.status ?? "prospek",
    termsVersion: profile?.terms_version ?? null,
    registeredPlatforms: accounts.map((account) => account.platform),
    clips,
    activeClipCount: clips.filter((clip) => clip.reviewStatus !== "ditolak").length,
    budgetExhausted: budgetExhausted === true,
  };
}
