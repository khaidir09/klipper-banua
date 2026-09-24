"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PG_UNIQUE_VIOLATION, dbRuleMessage, fail, ok, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireCreator } from "@/lib/auth/guards";
import {
  JOIN_BLOCKER_MESSAGES,
  campaignToday,
  canWithdraw,
  joinBlockers,
} from "@/lib/campaigns/open";
import { CREATOR_TERMS_VERSION } from "@/lib/constants/creators";
import { getPortalCatalogCampaign, getPortalProfile } from "@/lib/data/portal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidField } from "@/lib/validation/common";

/*
 * Joining and leaving open campaigns from the portal (PRD M17: FR-M17-04,
 * FR-M17-05) and accepting a new version of the Syarat Klipper (FR-M3-04).
 * The checks here explain; RLS and `guard_campaign_creator_change` /
 * `guard_portal_assignment_confirm` decide again in the database.
 */

const joinSchema = z.object({
  campaign_id: uuidField,
  agreed: z.literal(true, {
    message: "Centang dulu pernyataan bahwa kamu sudah baca brief, yang wajib, dan yang dilarang.",
  }),
});

const idSchema = z.object({ id: uuidField });

function revalidatePortal() {
  revalidatePath("/portal", "layout");
}

/**
 * FR-M17-04: one action that records the klipper read the brief, the must-do
 * points and the prohibitions, and joins them. The database fills in the
 * status, both timestamps, the referral code and the tracking slug.
 */
export async function joinCampaignAction(values: unknown): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = joinSchema.safeParse(values);
  if (!parsed.success) {
    return fail(parsed.error.issues[0]?.message ?? "Permintaan tidak valid.");
  }
  const campaignId = parsed.data.campaign_id;

  const supabase = await createSupabaseServerClient();
  const [creator, campaign] = await Promise.all([
    getPortalProfile(supabase),
    getPortalCatalogCampaign(supabase, campaignId),
  ]);
  if (!creator) return fail("Data klipper tidak ditemukan.");
  if (!campaign) return fail("Kampanye tidak ditemukan atau tidak lagi terbuka.");

  const blockers = joinBlockers({
    creator: {
      status: creator.status,
      termsVersion: creator.terms_version,
      hasLocalBadge: creator.local_badge_at !== null,
    },
    campaign: {
      // The catalog only lists running open per_views campaigns.
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
  if (blockers[0]) return fail(JOIN_BLOCKER_MESSAGES[blockers[0]]);

  // No `.select()` here: the new row is read back through the portal view.
  const { error } = await supabase
    .from("campaign_creators")
    .insert({ campaign_id: campaignId, creator_id: creator.id });
  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION && error.message.includes("campaign_creator_key")) {
      return fail(JOIN_BLOCKER_MESSAGES.already_joined);
    }
    return fail(dbRuleMessage(error, "Gagal gabung kampanye. Coba lagi, ya."));
  }

  const { data: assignment } = await supabase
    .from("creator_portal_assignments")
    .select("id")
    .eq("campaign_id", campaignId)
    .maybeSingle();

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign_creator",
    entityId: assignment?.id ?? null,
    action: "join_campaign",
    details: { campaign_id: campaignId, from_portal: true },
  });

  revalidatePortal();
  redirect(assignment?.id ? `/portal/penugasan/${assignment.id}` : "/portal/penugasan");
}

/** FR-M17-05: leave a per_views campaign before any clip was approved. */
export async function withdrawAssignmentAction(values: unknown): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = idSchema.safeParse(values);
  if (!parsed.success) return fail("ID penugasan tidak valid.");
  const assignmentId = parsed.data.id;

  const supabase = await createSupabaseServerClient();
  const [{ data: assignment }, { count: approved }] = await Promise.all([
    supabase
      .from("creator_portal_assignments")
      .select("id, campaign_id, status, campaign_status, payout_model")
      .eq("id", assignmentId)
      .maybeSingle(),
    supabase
      .from("creator_portal_contents")
      .select("id", { count: "exact", head: true })
      .eq("campaign_creator_id", assignmentId)
      .eq("review_status", "disetujui"),
  ]);
  if (!assignment?.status || !assignment.campaign_status || !assignment.payout_model) {
    return fail("Penugasan tidak ditemukan.");
  }

  if (
    !canWithdraw({
      assignmentStatus: assignment.status,
      campaignStatus: assignment.campaign_status,
      payoutModel: assignment.payout_model,
      approvedClipCount: approved ?? 0,
    })
  ) {
    return fail(
      (approved ?? 0) > 0
        ? "Kamu nggak bisa mundur karena sudah ada klipmu yang disetujui."
        : "Penugasan ini tidak dapat ditinggalkan dari portal.",
    );
  }

  const { error } = await supabase
    .from("campaign_creators")
    .update({ status: "mundur" })
    .eq("id", assignmentId);
  if (error) return fail(dbRuleMessage(error, "Gagal mundur dari kampanye."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign_creator",
    entityId: assignmentId,
    action: "withdraw_campaign",
    details: { campaign_id: assignment.campaign_id, from_portal: true },
  });

  revalidatePortal();
  return ok("Kamu sudah mundur dari kampanye ini.");
}

/** FR-M3-04: accept the current Syarat Klipper; the database logs it. */
export async function acceptTermsAction(): Promise<ActionResult> {
  await requireCreator();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("accept_creator_terms");
  if (error) return fail(dbRuleMessage(error, "Persetujuan gagal disimpan."));

  revalidatePortal();
  return ok(`Makasih! Syarat Klipper versi ${CREATOR_TERMS_VERSION} sudah kamu setujui.`);
}
