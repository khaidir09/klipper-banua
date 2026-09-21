import type { Metadata } from "next";
import { Download, ExternalLink } from "lucide-react";
import { CampaignReportDocument } from "@/components/reports/campaign-report-document";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCampaignReport } from "@/lib/data/report";
import { getOpenShareLink } from "@/lib/data/share-links";
import { SHAREABLE_CAMPAIGN_STATUSES } from "@/lib/validation/share-links";
import { loadCampaign } from "../data";
import { ClosingNotesForm } from "./closing-notes-form";
import { ShareLinkCard } from "./share-link-card";

export const metadata: Metadata = { title: "Laporan kampanye" };

export default async function CampaignReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, campaign, session, canEdit } = await loadCampaign(id);
  const [report, shareLink] = await Promise.all([
    getCampaignReport(supabase, campaign),
    getOpenShareLink(supabase, id),
  ]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card className="order-2 lg:order-1">
        <CardHeader>
          <CardTitle>Pratinjau laporan</CardTitle>
          <CardDescription>
            Laporan untuk klien tanpa data keuangan internal (honor kreator, margin).
          </CardDescription>
          <CardAction>
            <Button asChild>
              <a href={`/print/campaigns/${id}`} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden />
                Buka versi cetak
              </a>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="min-w-[36rem] rounded-md border p-4 sm:p-6">
            <CampaignReportDocument
              campaign={{
                code: campaign.code,
                name: campaign.name,
                objective: campaign.objective,
                start_date: campaign.start_date,
                end_date: campaign.end_date,
                closing_notes: campaign.closing_notes,
                clientName: campaign.client?.name ?? null,
              }}
              report={report}
              embedded
              timezone={session.profile.timezone}
              generatedAt={new Date()}
            />
          </div>
        </CardContent>
      </Card>

      <div className="order-1 space-y-6 lg:order-2">
        <ShareLinkCard
          campaignId={id}
          shareable={(SHAREABLE_CAMPAIGN_STATUSES as readonly string[]).includes(campaign.status)}
          link={shareLink}
          timezone={session.profile.timezone}
        />

        <Card>
          <CardHeader>
            <CardTitle>Ekspor</CardTitle>
            <CardDescription>
              CSV UTF-8 dengan pemisah titik koma; langsung terbuka rapi di Excel dan Google Sheets.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <a href={`/campaigns/${id}/report/csv/konten`} download>
                <Download aria-hidden />
                Konten & metrik terbaru
              </a>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <a href={`/campaigns/${id}/report/csv/kreator`} download>
                <Download aria-hidden />
                Rekap per kreator
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <ClosingNotesForm
              campaignId={id}
              initialNotes={campaign.closing_notes}
              canEdit={canEdit}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
