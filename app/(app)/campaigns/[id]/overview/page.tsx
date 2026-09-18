import type { Metadata } from "next";
import Link from "next/link";
import { DetailList } from "@/components/layout/detail-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CAMPAIGN_OBJECTIVE_LABELS } from "@/lib/constants/campaigns";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarDate, formatDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { loadCampaign } from "../data";

export const metadata: Metadata = { title: "Ringkasan kampanye" };

export default async function CampaignOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { campaign, session } = await loadCampaign(id);
  const tz = session.profile.timezone;
  const rp = (value: number | null) => (value === null ? "Tanpa batas" : formatRupiah(value));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Identitas & periode</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailList
            items={[
              {
                label: "Klien",
                value: campaign.client ? (
                  <Link href={`/clients/${campaign.client.id}`} className="hover:underline">
                    {campaign.client.name}
                  </Link>
                ) : null,
              },
              { label: "Kode", value: <span className="font-mono">{campaign.code}</span> },
              { label: "Tujuan", value: CAMPAIGN_OBJECTIVE_LABELS[campaign.objective] },
              {
                label: "URL tujuan",
                value: campaign.landing_url ? (
                  <a
                    href={campaign.landing_url}
                    target="_blank"
                    rel="noreferrer"
                    className="break-all hover:underline"
                  >
                    {campaign.landing_url}
                  </a>
                ) : null,
                wide: true,
              },
              { label: "Mulai", value: formatCalendarDate(campaign.start_date) },
              { label: "Selesai", value: formatCalendarDate(campaign.end_date) },
              { label: "Minimal hari tayang", value: `${campaign.min_live_days} hari` },
              { label: "Terakhir diperbarui", value: formatDateTime(campaign.updated_at, tz) },
            ]}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Komersial & target</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailList
            items={[
              { label: "Harga paket", value: formatRupiah(campaign.package_price) },
              { label: "Target konten", value: formatNumber(campaign.target_contents) },
              { label: "Target views", value: formatNumber(campaign.target_views) },
              { label: "Target pendaftar", value: formatNumber(campaign.target_registrants) },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Skema honor default</CardTitle>
        </CardHeader>
        <CardContent>
          <DetailList
            className="lg:grid-cols-4"
            items={[
              { label: "Honor dasar per konten", value: formatRupiah(campaign.default_base_fee) },
              {
                label: "Bonus per 1.000 views",
                value: formatRupiah(campaign.default_bonus_per_1000_views),
              },
              {
                label: "Bonus per pendaftar",
                value: formatRupiah(campaign.default_bonus_per_registrant),
              },
              { label: "Batas bonus views", value: rp(campaign.default_views_bonus_cap) },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
