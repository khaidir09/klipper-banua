import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/guards";
import { isCampaignLocked } from "@/lib/campaigns/status";
import { getCampaign } from "@/lib/data/campaigns";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Loads the campaign once per request for the layout and every tab page.
 * `canEdit` mirrors the database lock: closed campaigns are owner-only.
 */
export const loadCampaign = cache(async (id: string) => {
  const session = await requireSession();
  const supabase = await createSupabaseServerClient();
  const campaign = await getCampaign(supabase, id);
  if (!campaign) notFound();

  const isOwner = session.profile.role === "owner";
  return {
    session,
    supabase,
    campaign,
    isOwner,
    canEdit: isOwner || !isCampaignLocked(campaign.status),
  };
});
