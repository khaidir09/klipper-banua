import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireCreator } from "@/lib/auth/guards";
import { JOIN_BLOCKER_MESSAGES, campaignToday, joinBlockers } from "@/lib/campaigns/open";
import { CREATOR_TERMS_VERSION } from "@/lib/constants/creators";
import { getPortalCatalogCampaign, getPortalProfile, listPortalAssets } from "@/lib/data/portal";
import { formatCalendarRange } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidField } from "@/lib/validation/common";
import { AssetListCard, BriefCards, PerViewsTermsCard } from "../../campaign-parts";
import { BudgetMeter } from "@/components/campaigns/budget-meter";
import { TermsNotice } from "../terms-notice";
import { JoinCard } from "./join-card";

export const metadata: Metadata = { title: "Detail kampanye" };

/**
 * FR-M17-03: the whole brief and the material before joining, then the Gabung
 * action (FR-M17-04).
 */
export default async function PortalCatalogCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireCreator();
  if (!uuidField.safeParse(id).success) notFound();

  const supabase = await createSupabaseServerClient();
  const [creator, campaign] = await Promise.all([
    getPortalProfile(supabase),
    getPortalCatalogCampaign(supabase, id),
  ]);
  if (!creator || !campaign) notFound();

  // Empty for a prospect: material opens once the account is active (PRD 7.4).
  const assets = await listPortalAssets(supabase, id);

  const blockers = joinBlockers({
    creator: {
      status: creator.status,
      termsVersion: creator.terms_version,
      hasLocalBadge: creator.local_badge_at !== null,
    },
    campaign: {
      status: "aktif",
      access: "terbuka",
      payoutModel: "per_views",
      endDate: campaign.end_date,
      localOnly: campaign.local_only,
      budgetExhausted: campaign.budget_exhausted,
    },
    alreadyJoined: campaign.assignment_id !== null,
    currentTermsVersion: CREATOR_TERMS_VERSION,
    today: campaignToday(),
  });
  const firstBlocker = blockers[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={campaign.name}
        description={`${campaign.client_name} · ${formatCalendarRange(campaign.start_date, campaign.end_date)}`}
        backHref="/portal/kampanye"
        backLabel="Katalog kampanye"
        actions={campaign.local_only ? <Badge>Khusus Klipper Lokal</Badge> : undefined}
      />

      {blockers.includes("terms_outdated") ? <TermsNotice version={CREATOR_TERMS_VERSION} /> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        {campaign.assignment_id ? (
          <Alert className="lg:col-span-2">
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>Kamu sudah ikut kampanye ini.</span>
              <Button asChild size="sm" variant="outline">
                <Link href={`/portal/penugasan/${campaign.assignment_id}`}>
                  Buka Kampanye Saya
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <JoinCard
            campaignId={campaign.id}
            maxClips={campaign.max_clips_per_creator}
            minLiveDays={campaign.min_live_days}
            paidLabelRequired={campaign.paid_label_required}
            blocker={firstBlocker ? JOIN_BLOCKER_MESSAGES[firstBlocker] : null}
          />
        )}

        <PerViewsTermsCard terms={campaign} />

        <Card>
          <CardContent className="pt-6">
            <BudgetMeter
              pct={campaign.budget_remaining_pct}
              exhausted={campaign.budget_exhausted}
              total={campaign.budget_total}
              used={campaign.budget_used}
              remaining={campaign.budget_remaining}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Honor dibayar selama anggarannya masih ada. Kalau anggaran habis, kampanye ditutup
              untuk klipper dan klip baru, jadi jangan kelamaan.
            </p>
          </CardContent>
        </Card>

        <BriefCards
          brief={campaign.brief}
          hashtags={campaign.hashtags}
          paidLabelRequired={campaign.paid_label_required}
          mustDo={campaign.must_do}
          mustNot={campaign.must_not}
        />

        <AssetListCard
          assets={assets}
          emptyMessage={
            creator.status === "prospek" && campaign.asset_count > 0
              ? `Ada ${campaign.asset_count} materi. Tambahkan akun medsos di Profil dulu biar bisa diunduh.`
              : "Kampanye ini belum punya materi."
          }
        />
      </div>
    </div>
  );
}
