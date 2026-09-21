import Link from "next/link";
import { CalendarRange, Lock, Pencil, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CampaignStatusBadge } from "@/components/status/status-badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { activationBlockers, isCampaignLocked } from "@/lib/campaigns/status";
import { CAMPAIGN_OBJECTIVE_LABELS } from "@/lib/constants/campaigns";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarRange } from "@/lib/format/date";
import { CampaignTabs } from "./campaign-tabs";
import { loadCampaign, loadCampaignPulse } from "./data";
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
  const pulse = await loadCampaignPulse(id);

  const { data: assignments } = await supabase
    .from("campaign_creators")
    .select("status")
    .eq("campaign_id", id);

  const joined = (assignments ?? []).filter((a) => a.status === "bergabung").length;

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

      {/* The facts every tab is reasoned against, so they do not live only on
          the overview tab. */}
      <dl className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CalendarRange className="size-4 shrink-0" aria-hidden />
          <dt className="sr-only">Periode</dt>
          <dd>{formatCalendarRange(campaign.start_date, campaign.end_date)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Wallet className="size-4 shrink-0" aria-hidden />
          <dt className="sr-only">Harga paket</dt>
          <dd className="tabular-nums">{formatRupiah(campaign.package_price)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="size-4 shrink-0" aria-hidden />
          <dt className="sr-only">Kreator bergabung</dt>
          <dd className="tabular-nums">
            {joined} dari {(assignments ?? []).length} kreator bergabung
          </dd>
        </div>
      </dl>

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

      <CampaignTabs campaignId={id} attention={pulse.attention} />

      {children}
    </div>
  );
}
