"use server";

import { revalidatePath } from "next/cache";
import { dbRuleMessage, fail, invalid, ok, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { isOwner, requireInternal } from "@/lib/auth/guards";
import { isCampaignLocked } from "@/lib/campaigns/status";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { closingNotesSchema } from "@/lib/validation/campaigns";
import { uuidField } from "@/lib/validation/common";
import { opsTimeLogSchema } from "@/lib/validation/ops";

/*
 * Report closing notes (FR-M9-02) and operational time logs (PRD M12).
 * The campaign lock is checked here for a clear message and again by the
 * campaigns trigger; time-log ownership is enforced by RLS.
 */

/** FR-M9-02: the editable closing notes printed at the end of the report. */
export async function updateClosingNotesAction(values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const parsed = closingNotesSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const { id, closing_notes } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("status, code")
    .eq("id", id)
    .maybeSingle();
  if (!campaign) return fail("Kampanye tidak ditemukan.");
  if (isCampaignLocked(campaign.status) && !isOwner(session.profile)) {
    return fail("Kampanye sudah ditutup; hanya owner yang dapat mengubah catatan penutup.");
  }

  const { error } = await supabase.from("campaigns").update({ closing_notes }).eq("id", id);
  if (error) return fail(dbRuleMessage(error, "Catatan penutup gagal disimpan."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign",
    entityId: id,
    action: "update",
    details: { code: campaign.code, field: "closing_notes" },
  });

  revalidatePath(`/campaigns/${id}/report`);
  return ok("Catatan penutup disimpan.");
}

/** FR-M12-01: logs the signed-in member's own time; closed campaigns included. */
export async function createOpsTimeLogAction(
  campaignId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireInternal();
  if (!uuidField.safeParse(campaignId).success) return fail("ID kampanye tidak valid.");
  const parsed = opsTimeLogSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ops_time_logs").insert({
    ...parsed.data,
    campaign_id: campaignId,
    user_id: session.user.id,
  });
  if (error) return fail(dbRuleMessage(error, "Catatan waktu gagal disimpan."));

  revalidatePath(`/campaigns/${campaignId}/overview`);
  return ok("Catatan waktu disimpan.");
}

/** Own entries, or any entry for the owner (RLS decides; 0 rows means no access). */
export async function deleteOpsTimeLogAction(
  campaignId: string,
  logId: string,
): Promise<ActionResult> {
  await requireInternal();
  if (!uuidField.safeParse(campaignId).success || !uuidField.safeParse(logId).success) {
    return fail("Permintaan tidak valid.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("ops_time_logs")
    .delete()
    .eq("id", logId)
    .eq("campaign_id", campaignId)
    .select("id");
  if (error) return fail(dbRuleMessage(error, "Catatan waktu gagal dihapus."));
  if (!data.length) return fail("Anda hanya dapat menghapus catatan waktu milik sendiri.");

  revalidatePath(`/campaigns/${campaignId}/overview`);
  return ok("Catatan waktu dihapus.");
}
