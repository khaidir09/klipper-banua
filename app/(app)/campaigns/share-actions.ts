"use server";

import { addDays, format, parseISO } from "date-fns";
import { revalidatePath } from "next/cache";
import { dbRuleMessage, fail, invalid, ok, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireSession } from "@/lib/auth/guards";
import { appUrl } from "@/lib/app-url";
import { zonedInputToUtc } from "@/lib/format/date";
import { generateShareToken, hashShareToken } from "@/lib/share/token";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  SHAREABLE_CAMPAIGN_STATUSES,
  createShareLinkSchema,
  revokeShareLinkSchema,
} from "@/lib/validation/share-links";

/*
 * Client report links (FR-M9-05). Owner and manager alike; RLS allows only
 * active members and the trigger keeps a link's campaign, token and expiry
 * fixed. The raw token is returned once and never stored.
 */

/** Creates the campaign's link, revoking the previous one ("Buat ulang"). */
export async function createReportShareLinkAction(
  values: unknown,
): Promise<ActionResult<{ url: string }>> {
  const session = await requireSession();
  const parsed = createShareLinkSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const { campaign_id, expires_on } = parsed.data;

  // The link works through the end of the chosen day in the member's timezone.
  let expiresAt: string | null = null;
  if (expires_on) {
    const nextDay = format(addDays(parseISO(expires_on), 1), "yyyy-MM-dd");
    expiresAt = zonedInputToUtc(`${nextDay}T00:00`, session.profile.timezone);
    if (new Date(expiresAt) <= new Date()) {
      return fail("Tanggal kedaluwarsa harus hari ini atau setelahnya.");
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("status, code")
    .eq("id", campaign_id)
    .maybeSingle();
  if (!campaign) return fail("Kampanye tidak ditemukan.");
  if (!(SHAREABLE_CAMPAIGN_STATUSES as readonly string[]).includes(campaign.status)) {
    return fail("Tautan laporan hanya dapat dibuat untuk kampanye berstatus aktif atau selesai.");
  }

  const { data: replaced, error: revokeError } = await supabase
    .from("report_share_links")
    .update({ revoked_at: new Date().toISOString(), revoked_by: session.user.id })
    .eq("campaign_id", campaign_id)
    .is("revoked_at", null)
    .select("id");
  if (revokeError) return fail(dbRuleMessage(revokeError, "Tautan lama gagal dicabut."));

  const token = generateShareToken();
  const { data: link, error } = await supabase
    .from("report_share_links")
    .insert({
      campaign_id,
      token_hash: hashShareToken(token),
      expires_at: expiresAt,
      created_by: session.user.id,
    })
    .select("id")
    .single();
  if (error) return fail(dbRuleMessage(error, "Tautan laporan gagal dibuat."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign",
    entityId: campaign_id,
    action: "share_link_create",
    details: {
      code: campaign.code,
      link_id: link.id,
      expires_at: expiresAt,
      replaced: replaced.length > 0,
    },
  });

  revalidatePath(`/campaigns/${campaign_id}/report`);
  return ok(
    replaced.length > 0
      ? "Tautan baru dibuat; tautan lama tidak berlaku lagi."
      : "Tautan laporan dibuat.",
    { url: appUrl(`/laporan/${token}`).toString() },
  );
}

/** Revokes a link at once; the public page then answers "not found". */
export async function revokeReportShareLinkAction(values: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = revokeShareLinkSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const { campaign_id, link_id } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("report_share_links")
    .update({ revoked_at: new Date().toISOString(), revoked_by: session.user.id })
    .eq("id", link_id)
    .eq("campaign_id", campaign_id)
    .is("revoked_at", null)
    .select("id, campaign:campaigns(code)");
  if (error) return fail(dbRuleMessage(error, "Tautan gagal dicabut."));
  if (!data.length) return fail("Tautan tidak ditemukan atau sudah dicabut.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign",
    entityId: campaign_id,
    action: "share_link_revoke",
    details: { code: data[0].campaign?.code, link_id },
  });

  revalidatePath(`/campaigns/${campaign_id}/report`);
  return ok("Tautan dicabut; klien tidak dapat membukanya lagi.");
}
