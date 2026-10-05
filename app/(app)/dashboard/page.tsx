import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronRight,
  Clapperboard,
  ClipboardCheck,
  Inbox,
  Timer,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternal } from "@/lib/auth/guards";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/constants/creators";
import { CHECKPOINT_LABELS } from "@/lib/constants/metrics";
import { listClipQueue, listLowBudgetCampaigns, type LowBudgetCampaign } from "@/lib/data/clips";
import { countKliperQueues } from "@/lib/data/creators";
import { countOpenWithdrawals } from "@/lib/data/withdrawals";
import { getDashboard } from "@/lib/data/dashboard";
import { formatRupiah } from "@/lib/format/currency";
import { formatDate, formatDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dasbor" };

const LIST_LIMIT = 8;

/**
 * A queue that should read zero. Non-zero is tinted and carries an icon, so the
 * "something is waiting for me" state survives for anyone who cannot separate
 * the two tints by colour alone.
 */
function ActionCard({
  label,
  count,
  href,
  icon: Icon,
  waiting,
}: {
  label: string;
  count: number;
  href: string;
  icon: LucideIcon;
  /** What the number means while it is above zero. */
  waiting: string;
}) {
  const needsAction = count > 0;

  return (
    <Link
      href={href}
      className={cn(
        "block rounded-lg border p-4 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
        needsAction
          ? "border-warning-soft-foreground/25 bg-warning-soft hover:border-warning-soft-foreground/40"
          : "bg-card hover:bg-accent/50",
      )}
    >
      <div className="flex items-center gap-2">
        {needsAction ? (
          <Icon className="size-4 shrink-0 text-warning-soft-foreground" aria-hidden />
        ) : (
          <Check className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <p
          className={cn(
            "truncate text-sm",
            needsAction ? "font-medium text-warning-soft-foreground" : "text-muted-foreground",
          )}
        >
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-1 text-3xl font-semibold tracking-tight tabular-nums",
          needsAction && "text-warning-soft-foreground",
        )}
      >
        {formatNumber(count)}
      </p>
      {/* Full-strength ink, not an /80 blend: fading it to 80% drops this line
          to 4.22:1 on the tint. Size alone carries the hierarchy. */}
      <p
        className={cn(
          "mt-1 text-xs",
          needsAction ? "text-warning-soft-foreground" : "text-muted-foreground",
        )}
      >
        {needsAction ? waiting : "Tidak ada yang menunggu"}
      </p>
    </Link>
  );
}

/** A standing figure, not a queue: never tinted, because nothing is owed. */
function SummaryCard({
  label,
  value,
  href,
  detail,
}: {
  label: string;
  value: string;
  href?: string;
  detail?: string;
}) {
  const body = (
    <div
      className={cn(
        "h-full rounded-lg border bg-card p-4",
        href && "transition-colors hover:bg-accent/50",
      )}
    >
      <p className="truncate text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );

  return href ? (
    <Link
      href={href}
      className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {body}
    </Link>
  ) : (
    body
  );
}

function ListCard({
  id,
  title,
  description,
  empty,
  total,
  tone = "default",
  children,
}: {
  id: string;
  title: string;
  description: string;
  empty: string;
  total: number;
  tone?: "default" | "danger";
  children: React.ReactNode;
}) {
  const flagged = tone === "danger" && total > 0;

  return (
    <Card id={id} className={cn("scroll-mt-20", flagged && "border-destructive/30")}>
      <CardHeader>
        <CardTitle>
          {/* CardTitle renders a div; the h3 keeps the page's heading order intact. */}
          <h3 className="flex items-center gap-2">
            {flagged ? (
              <AlertTriangle className="size-4 shrink-0 text-destructive" aria-hidden />
            ) : null}
            <span>
              {title} <span className="text-muted-foreground">({formatNumber(total)})</span>
            </span>
          </h3>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <>
            <ul className="divide-y">{children}</ul>
            {total > LIST_LIMIT ? (
              <p className="mt-2 text-xs text-muted-foreground">
                dan {formatNumber(total - LIST_LIMIT)} lainnya.
              </p>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        href={href}
        className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-accent/60"
      >
        <span className="min-w-0 flex-1">{children}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

/** Spent vs. left of the kliper budget, in Rupiah and as a bar (FR-M8-06). */
function BudgetUsage({ campaign }: { campaign: LowBudgetCampaign }) {
  const usedPct = 100 - campaign.remainingPct;
  return (
    <span className="mt-1.5 block space-y-1">
      <span
        role="meter"
        aria-label={`Anggaran terpakai ${campaign.name}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={usedPct}
        aria-valuetext={`${usedPct}% terpakai, sisa ${formatRupiah(campaign.remaining)}`}
        className="block h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <span
          className="block h-full rounded-full bg-destructive"
          style={{ width: `${usedPct}%` }}
        />
      </span>
      <span className="flex flex-wrap justify-between gap-x-3 text-xs text-muted-foreground tabular-nums">
        <span>
          Dipakai <span className="text-foreground">{formatRupiah(campaign.used)}</span> dari{" "}
          {formatRupiah(campaign.budget)}
        </span>
        <span>
          Sisa{" "}
          <span className="font-medium text-destructive">{formatRupiah(campaign.remaining)}</span> (
          {campaign.remainingPct}%)
        </span>
      </span>
    </span>
  );
}

function SectionHeading({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-sm font-medium tracking-tight">
      {children}
    </h2>
  );
}

export default async function DashboardPage() {
  const { profile } = await requireInternal();
  const tz = profile.timezone;
  const supabase = await createSupabaseServerClient();
  const isOwner = profile.role === "owner";
  const [data, kliper, clipQueue, lowBudget, openWithdrawals] = await Promise.all([
    getDashboard(supabase, new Date(), tz),
    countKliperQueues(supabase),
    listClipQueue(supabase),
    listLowBudgetCampaigns(supabase),
    isOwner ? countOpenWithdrawals(supabase) : Promise.resolve(0),
  ]);
  const overdueClips = clipQueue.clips.filter((item) => item.overdue).length;
  const platform = (value: string) => SOCIAL_PLATFORM_LABELS[value as SocialPlatform] ?? value;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dasbor"
        description={`Halo, ${profile.full_name || "tim"}. Hari ini ${formatDate(new Date(), tz)}.`}
      />

      {/* Queues first: PRD 2.2 measures this product on how fast the team clears
          them, so they outrank the standing figures below. */}
      <section aria-labelledby="butuh-tindakan" className="space-y-3">
        <SectionHeading id="butuh-tindakan">Butuh tindakan</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* v4.0 (FR-M10-01, FR-M10-03): clips of per_views campaigns. */}
          <ActionCard
            label="Klip menunggu verifikasi"
            count={clipQueue.clips.length}
            href="/verifikasi#klip"
            icon={Clapperboard}
            waiting={
              overdueClips
                ? `${formatNumber(overdueClips)} lewat 24 jam`
                : "Kliper menunggu keputusan"
            }
          />
          <ActionCard
            label="Pembaruan views menunggu"
            count={clipQueue.viewsUpdates.length}
            href="/verifikasi#views"
            icon={TrendingUp}
            waiting="Selisih honor belum dikreditkan"
          />
          <ActionCard
            label="Konten menunggu review"
            count={data.pending.length}
            href="#menunggu-review"
            icon={ClipboardCheck}
            waiting="Draf belum diputuskan"
          />
          <ActionCard
            label="Snapshot jatuh tempo"
            count={data.due.length}
            href="#snapshot-jatuh-tempo"
            icon={Timer}
            waiting="Checkpoint terlewat"
          />
          <ActionCard
            label="Kiriman kreator"
            count={data.creatorSubmissions.length}
            href="#kiriman-kreator"
            icon={Inbox}
            waiting="Menunggu verifikasi tim"
          />
          {/* v4.0 (FR-M10-01): local badge requests sent from the portal. */}
          <ActionCard
            label="Pengajuan lencana"
            count={kliper.badgeRequests}
            href="/creators/lencana"
            icon={BadgeCheck}
            waiting="Bukti audiens menunggu diperiksa"
          />
          {/* FR-M10-01 (v4.0): withdrawals are the owner's alone. */}
          {isOwner ? (
            <ActionCard
              label="Penarikan menunggu"
              count={openWithdrawals}
              href="/penarikan?status=diajukan"
              icon={Wallet}
              waiting="Transfer ke kliper belum selesai"
            />
          ) : null}
          <ActionCard
            label="Anggaran kliper < 10%"
            count={lowBudget.length}
            href="#anggaran-menipis"
            icon={AlertTriangle}
            waiting="Kampanye hampir tidak menerima klip baru"
          />
        </div>
      </section>

      <section aria-labelledby="ringkasan" className="space-y-3">
        <SectionHeading id="ringkasan">Ringkasan</SectionHeading>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label="Kampanye aktif"
            value={formatNumber(data.activeCampaigns)}
            href="/campaigns?status=aktif"
          />
          <SummaryCard
            label="Honor belum dibayar"
            value={formatRupiah(data.unpaidPayouts.amount)}
            detail={`${formatNumber(data.unpaidPayouts.count)} penugasan`}
          />
          <SummaryCard
            label="Invoice klien belum lunas"
            value={formatRupiah(data.openInvoices.outstanding)}
            detail={`${formatNumber(data.openInvoices.count)} invoice`}
          />
          <SummaryCard
            label="Kliper baru (7 hari)"
            value={formatNumber(kliper.newSignups)}
            href="/creators?source=mandiri"
            detail="Mendaftar sendiri lewat /daftar"
          />
        </div>
      </section>

      <section aria-labelledby="antrean" className="space-y-3">
        <SectionHeading id="antrean">Antrean kerja</SectionHeading>
        <div className="grid gap-4 lg:grid-cols-2">
          <ListCard
            id="anggaran-menipis"
            title="Sisa anggaran kliper di bawah 10%"
            description="Kampanye per views yang anggaran honornya hampir habis. Naikkan anggaran atau siapkan penutupan."
            empty="Semua kampanye per views masih punya anggaran cukup."
            total={lowBudget.length}
          >
            {lowBudget.slice(0, LIST_LIMIT).map((campaign) => (
              <Row key={campaign.id} href={`/campaigns/${campaign.id}/overview`}>
                <span className="font-medium">{campaign.name}</span>{" "}
                <span className="text-muted-foreground">{campaign.code}</span>
                <BudgetUsage campaign={campaign} />
              </Row>
            ))}
          </ListCard>
          <ListCard
            id="snapshot-jatuh-tempo"
            title="Snapshot jatuh tempo"
            description="Konten tayang yang melewati H+1, H+3, atau H+7 tanpa snapshot. Paling lama terlambat di atas."
            empty="Semua snapshot sudah diisi."
            total={data.due.length}
          >
            {data.due.slice(0, LIST_LIMIT).map((item) => (
              <Row
                key={`${item.contentId}-${item.checkpoint}`}
                href={`/campaigns/${item.campaign.id}/metrics#content-${item.contentId}`}
              >
                <span className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">{CHECKPOINT_LABELS[item.checkpoint]}</Badge>
                  <span className="font-medium">{item.creatorName}</span>
                  <span className="text-muted-foreground">· {platform(item.platform)}</span>
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.campaign.code} ·{" "}
                  {item.daysOverdue === 0
                    ? "jatuh tempo hari ini"
                    : `terlambat ${item.daysOverdue} hari`}
                </span>
              </Row>
            ))}
          </ListCard>

          <ListCard
            id="menunggu-review"
            title="Menunggu review"
            description="Draf konten yang belum diputuskan. Paling lama menunggu di atas."
            empty="Tidak ada konten yang menunggu review."
            total={data.pending.length}
          >
            {data.pending.slice(0, LIST_LIMIT).map((item) => (
              <Row key={item.contentId} href={`/campaigns/${item.campaign.id}/contents`}>
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{item.creatorName}</span>
                  <span className="text-muted-foreground">· {platform(item.platform)}</span>
                  {item.revisionCount > 0 ? (
                    <Badge variant="secondary">Draf ke-{item.revisionCount + 1}</Badge>
                  ) : null}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.campaign.code} · menunggu sejak {formatDateTime(item.waitingSince, tz)}
                </span>
              </Row>
            ))}
          </ListCard>

          <ListCard
            id="kiriman-kreator"
            title="Kiriman kreator menunggu verifikasi"
            description="Laporan tayang dan bukti metrik yang dikirim kreator lewat portal. Paling lama menunggu di atas."
            empty="Tidak ada kiriman yang menunggu."
            total={data.creatorSubmissions.length}
          >
            {data.creatorSubmissions.slice(0, LIST_LIMIT).map((item) => (
              <Row
                key={`${item.kind}-${item.id}`}
                href={`/campaigns/${item.campaign.id}/${item.kind === "metrik" ? "metrics" : "contents"}`}
              >
                <span className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">{item.kind === "metrik" ? "Metrik" : "Tayang"}</Badge>
                  <span className="font-medium">{item.creatorName}</span>
                  <span className="text-muted-foreground">· {item.detail}</span>
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.campaign.code}
                  {item.sentAt ? ` · dikirim ${formatDateTime(item.sentAt, tz)}` : ""}
                </span>
              </Row>
            ))}
          </ListCard>

          <ListCard
            id="dihapus-lebih-awal"
            title="Dihapus sebelum minimal hari tayang"
            description="Konten yang dihapus kreator sebelum masa tayang minimum kampanye. Konten ini tidak memenuhi syarat honor (PRD 8.2)."
            empty="Tidak ada konten yang dihapus lebih awal."
            total={data.earlyRemovals.length}
            tone="danger"
          >
            {data.earlyRemovals.slice(0, LIST_LIMIT).map((item) => (
              <Row key={item.contentId} href={`/campaigns/${item.campaign.id}/contents`}>
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{item.creatorName}</span>
                  <span className="text-muted-foreground">
                    · tayang {item.liveDays} dari minimal {item.minLiveDays} hari
                  </span>
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.campaign.code} · dihapus {formatDateTime(item.removedAt, tz)}
                </span>
              </Row>
            ))}
          </ListCard>
        </div>
      </section>
    </div>
  );
}
