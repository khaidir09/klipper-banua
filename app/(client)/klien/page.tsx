import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClient } from "@/lib/auth/guards";
import { progressPercent, totalViews } from "@/lib/calculations/campaign-metrics";
import {
  contentsFromMetrics,
  listClientCampaigns,
  listClientCreators,
  listClientMetrics,
} from "@/lib/data/client-portal";
import { formatCalendarRange } from "@/lib/format/date";
import { formatNumber, formatPercent } from "@/lib/format/number";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Beranda" };

function Progress({ label, actual, target }: { label: string; actual: number; target: number }) {
  const percent = progressPercent(actual, target);
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">
        {formatNumber(actual)}
        {target > 0 ? (
          <span className="text-muted-foreground">
            {" "}
            dari {formatNumber(target)}
            {percent === null ? "" : ` (${formatPercent(percent)})`}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

/** FR-M14-03: every campaign of the signed-in client, running ones first. */
export default async function ClientHomePage() {
  const { profile } = await requireClient();
  const supabase = await createSupabaseServerClient();

  const [campaigns, creators, metrics] = await Promise.all([
    listClientCampaigns(supabase),
    listClientCreators(supabase),
    listClientMetrics(supabase),
  ]);

  const greeting = profile.full_name ? `Halo, ${profile.full_name}` : "Halo";

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting}
        description="Pantau kampanye yang sedang berjalan beserta capaiannya di sini."
      />

      {campaigns.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((campaign) => {
            const own = creators.filter((row) => row.campaign_id === campaign.id);
            const contents = contentsFromMetrics(
              metrics.filter((row) => row.campaign_id === campaign.id),
            );
            const clicks = own.reduce((sum, row) => sum + Number(row.clicks_human), 0);
            const registrants = own.reduce((sum, row) => sum + Number(row.registrants), 0);
            const liveContents = own.reduce((sum, row) => sum + Number(row.live_contents), 0);

            return (
              <Card key={campaign.id}>
                <CardHeader className="gap-2">
                  <CampaignStatusBadge status={campaign.status} />
                  <CardTitle className="text-base">
                    <Link href={`/klien/kampanye/${campaign.id}`} className="hover:underline">
                      {campaign.name}
                    </Link>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {campaign.code} · {formatCalendarRange(campaign.start_date, campaign.end_date)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                    <Progress
                      label="Views"
                      actual={totalViews(contents)}
                      target={campaign.target_views}
                    />
                    <Progress
                      label="Pendaftar"
                      actual={registrants}
                      target={campaign.target_registrants}
                    />
                    <Progress
                      label="Konten tayang"
                      actual={liveContents}
                      target={campaign.target_contents}
                    />
                    <div>
                      <dt className="text-muted-foreground">Klik tautan (non-bot)</dt>
                      <dd className="tabular-nums">{formatNumber(clicks)}</dd>
                    </div>
                  </dl>
                  <Link
                    href={`/klien/kampanye/${campaign.id}`}
                    className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                  >
                    Lihat detail
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Belum ada kampanye yang berjalan. Tim akan mengabari Anda saat kampanye dimulai.
        </p>
      )}
    </div>
  );
}
