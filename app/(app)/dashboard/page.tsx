import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/guards";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/constants/creators";
import { CHECKPOINT_LABELS } from "@/lib/constants/metrics";
import { getDashboard } from "@/lib/data/dashboard";
import { formatRupiah } from "@/lib/format/currency";
import { formatDate, formatDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dasbor" };

const LIST_LIMIT = 8;

function SummaryCard({
  label,
  value,
  href,
  detail,
}: {
  label: string;
  value: number;
  href?: string;
  detail?: string;
}) {
  const body = (
    <div className="h-full rounded-lg border bg-card p-4 transition-colors hover:bg-accent/40">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">
        {formatNumber(value)}
      </p>
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
  children,
}: {
  id: string;
  title: string;
  description: string;
  empty: string;
  total: number;
  children: React.ReactNode;
}) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader>
        <CardTitle>
          {title} <span className="text-muted-foreground">({formatNumber(total)})</span>
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
        <span className="min-w-0">{children}</span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

export default async function DashboardPage() {
  const { profile } = await requireSession();
  const tz = profile.timezone;
  const supabase = await createSupabaseServerClient();
  const data = await getDashboard(supabase, new Date(), tz);
  const platform = (value: string) => SOCIAL_PLATFORM_LABELS[value as SocialPlatform] ?? value;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dasbor</h1>
        <p className="text-sm text-muted-foreground">
          Halo, {profile.full_name || "tim"}. Hari ini {formatDate(new Date(), tz)}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          label="Kampanye aktif"
          value={data.activeCampaigns}
          href="/campaigns?status=aktif"
        />
        <SummaryCard
          label="Konten menunggu review"
          value={data.pending.length}
          href="#menunggu-review"
        />
        <SummaryCard
          label="Snapshot jatuh tempo"
          value={data.due.length}
          href="#snapshot-jatuh-tempo"
        />
        <SummaryCard
          label="Honor belum dibayar"
          value={data.unpaidPayouts.count}
          detail={formatRupiah(data.unpaidPayouts.amount)}
        />
        <SummaryCard
          label="Invoice klien belum lunas"
          value={data.openInvoices.count}
          detail={`Sisa ${formatRupiah(data.openInvoices.outstanding)}`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
      </div>

      <ListCard
        id="dihapus-lebih-awal"
        title="Dihapus sebelum minimal hari tayang"
        description="Konten yang dihapus kreator sebelum masa tayang minimum kampanye. Konten ini tidak memenuhi syarat honor (PRD 8.2)."
        empty="Tidak ada konten yang dihapus lebih awal."
        total={data.earlyRemovals.length}
      >
        {data.earlyRemovals.slice(0, LIST_LIMIT).map((item) => (
          <Row key={item.contentId} href={`/campaigns/${item.campaign.id}/contents`}>
            <span className="flex flex-wrap items-center gap-1.5">
              <AlertTriangle className="size-4 text-destructive" aria-hidden />
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
  );
}
