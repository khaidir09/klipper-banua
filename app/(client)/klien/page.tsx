import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Megaphone } from "lucide-react";
import { CampaignStatusBadge } from "@/components/status/status-badge";
import { PageHeader } from "@/components/layout/page-header";
import { TargetProgress } from "@/components/metrics/target-progress";
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
import { formatNumber } from "@/lib/format/number";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Beranda" };

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
              <Card key={campaign.id} className="relative">
                <CardHeader className="gap-2">
                  <CampaignStatusBadge status={campaign.status} />
                  <CardTitle className="text-base">
                    <h2>
                      {/* Stretched link: the whole card opens the campaign. */}
                      <Link
                        href={`/klien/kampanye/${campaign.id}`}
                        className="after:absolute after:inset-0 hover:underline focus-visible:underline"
                      >
                        {campaign.name}
                      </Link>
                    </h2>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {campaign.code} · {formatCalendarRange(campaign.start_date, campaign.end_date)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TargetProgress
                      size="sm"
                      label="Views"
                      actual={totalViews(contents)}
                      target={campaign.target_views}
                      percent={progressPercent(totalViews(contents), campaign.target_views)}
                    />
                    <TargetProgress
                      size="sm"
                      label="Pendaftar"
                      actual={registrants}
                      target={campaign.target_registrants}
                      percent={progressPercent(registrants, campaign.target_registrants)}
                    />
                    <TargetProgress
                      size="sm"
                      label="Konten tayang"
                      actual={liveContents}
                      target={campaign.target_contents}
                      percent={progressPercent(liveContents, campaign.target_contents)}
                    />
                    <div>
                      <p className="text-sm text-muted-foreground">Klik tautan (non-bot)</p>
                      <p className="mt-0.5 text-lg font-semibold tracking-tight tabular-nums">
                        {formatNumber(clicks)}
                      </p>
                    </div>
                  </div>
                  {/* Affordance only; the card itself carries the link. */}
                  <p className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    Lihat detail
                    <ArrowRight className="size-4" aria-hidden />
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <span
              aria-hidden
              className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground"
            >
              <Megaphone className="size-4" />
            </span>
            <p className="text-sm font-medium">Belum ada kampanye</p>
            <p className="max-w-sm text-sm text-balance text-muted-foreground">
              Begitu tim memulai kampanye untuk Anda, capaiannya akan muncul di halaman ini
              dan dapat dipantau kapan saja.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
