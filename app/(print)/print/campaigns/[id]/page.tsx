import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CampaignReportDocument } from "@/components/reports/campaign-report-document";
import { PrintButton } from "@/components/reports/print-button";
import { Button } from "@/components/ui/button";
import { getCampaignReport } from "@/lib/data/report";
import { loadCampaign } from "@/app/(app)/campaigns/[id]/data";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { campaign } = await loadCampaign(id);
  // Chrome uses the title as the default PDF file name.
  return { title: { absolute: `Laporan ${campaign.code}` } };
}

/** FR-M9-01: the report on its own page, outside the app shell, for printing. */
export default async function PrintCampaignReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, campaign, session } = await loadCampaign(id);
  const report = await getCampaignReport(supabase, campaign);

  return (
    <main className="min-h-full bg-muted/40 px-4 py-6 print:bg-white print:p-0">
      <div className="print-hidden mx-auto mb-4 flex max-w-[210mm] flex-wrap items-center justify-between gap-2">
        <Button variant="outline" asChild>
          <Link href={`/campaigns/${id}/report`}>
            <ArrowLeft aria-hidden />
            Kembali ke kampanye
          </Link>
        </Button>
        <PrintButton />
      </div>
      <div className="mx-auto max-w-[210mm] rounded-md border bg-background p-[12mm] shadow-sm print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
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
          timezone={session.profile.timezone}
          generatedAt={new Date()}
        />
      </div>
    </main>
  );
}
