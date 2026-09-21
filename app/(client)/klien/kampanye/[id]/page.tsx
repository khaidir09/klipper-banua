import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { CampaignStatusBadge } from "@/components/status/status-badge";
import { CumulativeViewsChart } from "@/components/charts/cumulative-views-chart";
import { PageHeader } from "@/components/layout/page-header";
import { TargetProgress } from "@/components/metrics/target-progress";
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
import { EMPTY_METRIC, formatNumber } from "@/lib/format/number";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Kampanye" };

function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
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

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Capaian terhadap target</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <TargetProgress
            label="Total views"
            actual={views}
            target={campaign.target_views}
            percent={progressPercent(views, campaign.target_views)}
          />
          <TargetProgress
            label="Pendaftar"
            actual={registrants}
            target={campaign.target_registrants}
            percent={progressPercent(registrants, campaign.target_registrants)}
          />
          <TargetProgress
            label="Konten tayang"
            actual={liveContents}
            target={campaign.target_contents}
            percent={progressPercent(liveContents, campaign.target_contents)}
          />
          <StatTile
            label="Klik tautan (non-bot)"
            value={formatNumber(clicks)}
            detail="Klik dari tautan kreator"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Views kumulatif per checkpoint</h2>
          </CardTitle>
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
          <CardTitle>
            <h2>Per kreator</h2>
          </CardTitle>
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
          <CardTitle>
            <h2>Konten tayang</h2>
          </CardTitle>
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
                      data-cta
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
