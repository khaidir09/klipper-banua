import type { Metadata } from "next";
import { effectiveFeeScheme } from "@/lib/calculations/fee-scheme";
import { listAssignableCreators, listAssignments } from "@/lib/data/campaigns";
import { publicEnv } from "@/lib/env";
import { formatCalendarDate } from "@/lib/format/date";
import { loadCampaign } from "../data";
import { AssignmentsPanel, type AssignmentView } from "./assignments-panel";

export const metadata: Metadata = { title: "Kreator kampanye" };

export default async function CampaignCreatorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { session, supabase, campaign, canEdit } = await loadCampaign(id);

  const [assignments, assignable] = await Promise.all([
    listAssignments(supabase, id),
    canEdit ? listAssignableCreators(supabase, id) : Promise.resolve([]),
  ]);

  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL.replace(/\/+$/, "");

  const rows: AssignmentView[] = assignments.map((assignment) => ({
    id: assignment.id,
    status: assignment.status,
    confirmedAt: assignment.creator_confirmed_at,
    joinSource: assignment.join_source,
    contentsCommitted: assignment.contents_committed,
    referralCode: assignment.referral_code,
    trackingSlug: assignment.tracking_slug,
    trackingUrl: `${baseUrl}/r/${assignment.tracking_slug}`,
    overrides: {
      base_fee: assignment.base_fee,
      bonus_per_1000_views: assignment.bonus_per_1000_views,
      bonus_per_registrant: assignment.bonus_per_registrant,
      views_bonus_cap: assignment.views_bonus_cap,
    },
    fees: effectiveFeeScheme(assignment, campaign),
    creator: assignment.creator
      ? {
          id: assignment.creator.id,
          name: assignment.creator.stage_name || assignment.creator.full_name,
          fullName: assignment.creator.full_name,
          phoneWa: assignment.creator.phone_wa,
        }
      : null,
  }));

  return (
    <AssignmentsPanel
      campaignId={id}
      canEdit={canEdit}
      timezone={session.profile.timezone}
      perViews={campaign.payout_model === "per_views"}
      assignments={rows}
      assignable={assignable.map((creator) => ({
        id: creator.id,
        label: creator.stage_name
          ? `${creator.stage_name} (${creator.full_name})`
          : creator.full_name,
        city: creator.city,
      }))}
      brief={{
        campaignName: campaign.name,
        campaignCode: campaign.code,
        clientName: campaign.client?.name ?? "",
        startDate: formatCalendarDate(campaign.start_date),
        endDate: formatCalendarDate(campaign.end_date),
        brief: campaign.brief,
        mustDo: campaign.must_do,
        mustNot: campaign.must_not,
        hashtags: campaign.hashtags,
        paidLabelRequired: campaign.paid_label_required,
        minLiveDays: campaign.min_live_days,
      }}
    />
  );
}
