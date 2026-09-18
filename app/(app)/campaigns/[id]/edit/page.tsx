import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { listClientOptions } from "@/lib/data/campaigns";
import { CampaignForm } from "../../campaign-form";
import { campaignToFormValues } from "../../form-values";
import { loadCampaign } from "../data";

export const metadata: Metadata = { title: "Ubah kampanye" };

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, campaign, canEdit } = await loadCampaign(id);
  if (!canEdit) redirect(`/campaigns/${id}/overview`);

  const clients = await listClientOptions(supabase);

  return (
    <Card>
      <CardContent className="pt-6">
        <CampaignForm
          campaignId={id}
          clients={clients}
          defaultValues={campaignToFormValues(campaign)}
        />
      </CardContent>
    </Card>
  );
}
