import type { Metadata } from "next";
import { getCampaignFinance } from "@/lib/data/finance";
import { loadCampaign } from "../data";
import { FinancePanel } from "./finance-panel";

export const metadata: Metadata = { title: "Keuangan kampanye" };

export default async function CampaignFinancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, campaign, isOwner } = await loadCampaign(id);
  const finance = await getCampaignFinance(supabase, campaign, isOwner);

  return (
    <FinancePanel
      campaignId={id}
      campaignStatus={campaign.status}
      isOwner={isOwner}
      summary={finance.summary}
      rows={finance.rows}
      payments={finance.payments}
      contentInfo={finance.contentInfo}
    />
  );
}
