import Link from "next/link";
import { Lock, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CampaignStatusBadge } from "@/components/campaigns/campaign-status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { activationBlockers, isCampaignLocked } from "@/lib/campaigns/status";
import { CAMPAIGN_OBJECTIVE_LABELS } from "@/lib/constants/campaigns";
import { CampaignTabs } from "./campaign-tabs";
import { loadCampaign } from "./data";
import { DeleteCampaignButton } from "./delete-campaign-button";
import { StatusActions } from "./status-actions";

export default async function CampaignLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, campaign, isOwner, canEdit } = await loadCampaign(id);

  const { data: assignments } = await supabase
    .from("campaign_creators")
    .select("status")
    .eq("campaign_id", id);

  const blockers = activationBlockers({
    objective: campaign.objective,
    landingUrl: campaign.landing_url,
    assignmentStatuses: (assignments ?? []).map((a) => a.status),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.name}
        description={`${campaign.code} · ${campaign.client?.name ?? "Tanpa klien"}`}
        backHref="/campaigns"
        backLabel="Daftar kampanye"
        actions={
          <>
            {canEdit ? (
              <Button variant="outline" asChild>
                <Link href={`/campaigns/${id}/edit`}>
                  <Pencil aria-hidden />
                  Ubah
                </Link>
              </Button>
            ) : null}
            {isOwner ? <DeleteCampaignButton campaignId={id} code={campaign.code} /> : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <CampaignStatusBadge status={campaign.status} />
        <Badge variant="outline">Tujuan: {CAMPAIGN_OBJECTIVE_LABELS[campaign.objective]}</Badge>
        <div className="ml-auto">
          <StatusActions
            campaignId={id}
            status={campaign.status}
            activationBlockers={blockers}
            canEdit={canEdit}
          />
        </div>
      </div>

      {isCampaignLocked(campaign.status) ? (
        <Alert>
          <Lock />
          <AlertDescription>
            {isOwner
              ? "Kampanye sudah ditutup. Sebagai owner Anda masih dapat mengubahnya; setiap perubahan dicatat di log."
              : "Kampanye sudah ditutup; hanya owner yang dapat mengubahnya."}
          </AlertDescription>
        </Alert>
      ) : null}

      <CampaignTabs campaignId={id} />

      {children}
    </div>
  );
}
