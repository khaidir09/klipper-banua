import type { Metadata } from "next";
import { listAssignments } from "@/lib/data/campaigns";
import { listCampaignClips } from "@/lib/data/clips";
import { listCampaignContents } from "@/lib/data/contents";
import { loadCampaign } from "../data";
import { ClipsPanel } from "./clips-panel";
import { ContentsPanel } from "./contents-panel";

export const metadata: Metadata = { title: "Konten kampanye" };

export default async function CampaignContentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, campaign, canEdit, session } = await loadCampaign(id);

  // FR-M18-08: clips of per_views campaigns are verified after posting.
  if (campaign.payout_model === "per_views") {
    const clips = await listCampaignClips(supabase, id);
    return <ClipsPanel clips={clips} timezone={session.profile.timezone} />;
  }

  const [contents, assignments] = await Promise.all([
    listCampaignContents(supabase, id),
    listAssignments(supabase, id),
  ]);

  return (
    <ContentsPanel
      campaignId={id}
      canEdit={canEdit}
      timezone={session.profile.timezone}
      contents={contents}
      assignments={assignments.map((assignment) => ({
        id: assignment.id,
        name: assignment.creator?.stage_name || assignment.creator?.full_name || "–",
        status: assignment.status,
      }))}
      brief={{
        paidLabelRequired: campaign.paid_label_required,
        mustDo: campaign.must_do,
        mustNot: campaign.must_not,
        hashtags: campaign.hashtags,
      }}
    />
  );
}
