import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { CampaignStatusBadge } from "@/components/status/status-badge";
import { CumulativeViewsChart } from "@/components/charts/cumulative-views-chart";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireClient } from "@/lib/auth/guards";
import {
  cumulativeViewsByCheckpoint,
  progressPercent,
  totalViews,
} from "@/lib/calculations/campaign-metrics";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/constants/creators";
import {
  contentsFromMetrics,
  getClientCampaign,
  listClientContents,
  listClientCreators,
  listClientMetrics,
} from "@/lib/data/client-portal";
import { formatCalendarRange, formatDateTime } from "@/lib/format/date";
import { EMPTY_METRIC, formatNumber, formatPercent } from "@/lib/format/number";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kampanye" };

function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function targetDetail(percent: number | null, target: number): string {
  if (target <= 0) return "Target belum diatur";
  return `${percent === null ? EMPTY_METRIC : formatPercent(percent)} dari target ${formatNumber(target)}`;
}

/** FR-M14-03: one campaign of the client, with its verified numbers. */
export default async function ClientCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireClient();

  const supabase = await createSupabaseServerClient();
  const campaign = await getClientCampaign(supabase, id);
  if (!campaign) notFound();

  const [contents, creators, metrics] = await Promise.all([
    listClientContents(supabase, id),
    listClientCreators(supabase, id),
    listClientMetrics(supabase, id),
  ]);

  const tz = session.profile.timezone;
  const metricContents = contentsFromMetrics(metrics);
  const views = totalViews(metricContents);
  const clicks = creators.reduce((sum, row) => sum + Number(row.clicks_human), 0);
  const registrants = creators.reduce((sum, row) => sum + Number(row.registrants), 0);
  const liveContents = creators.reduce((sum, row) => sum + Number(row.live_contents), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.name}
        description={`${campaign.code} · ${formatCalendarRange(campaign.start_date, campaign.end_date)}`}
        backHref="/klien"
        backLabel="Beranda"
        actions={<CampaignStatusBadge status={campaign.status} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total views"
          value={formatNumber(views)}
          detail={targetDetail(
            progressPercent(views, campaign.target_views),
            campaign.target_views,
          )}
        />
        <StatTile
          label="Klik tautan (non-bot)"
          value={formatNumber(clicks)}
          detail="Klik dari tautan kreator"
        />
        <StatTile
          label="Pendaftar"
          value={formatNumber(registrants)}
          detail={targetDetail(
            progressPercent(registrants, campaign.target_registrants),
            campaign.target_registrants,
          )}
        />
        <StatTile
          label="Konten tayang"
          value={formatNumber(liveContents)}
          detail={
            campaign.target_contents > 0
              ? `dari target ${formatNumber(campaign.target_contents)} konten`
              : "Target belum diatur"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Views kumulatif per checkpoint</CardTitle>
          <CardDescription>
            Angka yang sudah diverifikasi tim dari tangkapan layar analitik kreator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CumulativeViewsChart
            points={cumulativeViewsByCheckpoint(metricContents)}
            target={campaign.target_views}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per kreator</CardTitle>
          <CardDescription>
            Kode referal dipakai untuk mencocokkan pendaftar dengan kreatornya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kreator</TableHead>
                <TableHead>Kode referal</TableHead>
                <TableHead className="text-right">Konten tayang</TableHead>
                <TableHead className="text-right">Klik (non-bot)</TableHead>
                <TableHead className="text-right">Pendaftar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {creators.map((row) => (
                <TableRow key={row.campaign_creator_id}>
                  <TableCell className="font-medium">{row.creator_name ?? EMPTY_METRIC}</TableCell>
                  <TableCell className="font-mono text-sm">{row.referral_code}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.live_contents)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.clicks_human)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(row.registrants)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Konten tayang</CardTitle>
        </CardHeader>
        <CardContent>
          {contents.length ? (
            <ul className="divide-y">
              {contents.map((content) => (
                <li key={content.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {content.creator_name ?? EMPTY_METRIC}
                      <Badge variant="secondary" className="ml-2 align-middle">
                        {SOCIAL_PLATFORM_LABELS[content.platform]}
                      </Badge>
                      {content.live_status === "dihapus" ? (
                        <Badge variant="outline" className="ml-2 align-middle">
                          Sudah dihapus
                        </Badge>
                      ) : null}
                    </p>
                    {content.posted_at ? (
                      <p className="text-xs text-muted-foreground">
                        Tayang {formatDateTime(content.posted_at, tz)}
                      </p>
                    ) : null}
                  </div>
                  {content.posted_url ? (
                    <a
                      href={content.posted_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      <ExternalLink className="size-4" aria-hidden />
                      Buka konten
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada konten yang tayang.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
