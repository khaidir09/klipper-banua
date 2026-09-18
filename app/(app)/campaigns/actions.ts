"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
  dbRuleMessage,
  fail,
  invalid,
  ok,
  type ActionResult,
} from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireRole, requireSession } from "@/lib/auth/guards";
import { activationBlockers, canTransition } from "@/lib/campaigns/status";
import { CAMPAIGN_STATUS_LABELS } from "@/lib/constants/campaigns";
import { CAMPAIGN_ASSET_BUCKET } from "@/lib/data/campaigns";
import { generateReferralCode, generateTrackingSlug } from "@/lib/referral/generate";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  assetSchema,
  assignmentCreateSchema,
  assignmentUpdateSchema,
  campaignSchema,
  campaignStatusChangeSchema,
} from "@/lib/validation/campaigns";
import { uuidField } from "@/lib/validation/common";

const idSchema = z.object({ id: uuidField });

function revalidateCampaign(id: string) {
  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`, "layout");
}

/* ------------------------------------------------------------------ */
/* Campaign (FR-M4-01, FR-M4-02)                                        */
/* ------------------------------------------------------------------ */

function duplicateCode<T>(): ActionResult<T> {
  return {
    status: "error",
    message: "Kode kampanye sudah dipakai.",
    fieldErrors: { code: "Kode kampanye sudah dipakai." },
  };
}

export async function createCampaignAction(values: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = campaignSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaigns")
    .insert({ ...parsed.data, status: "draft", created_by: session.user.id })
    .select("id")
    .single();
  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) return duplicateCode();
    return fail("Kampanye gagal disimpan.");
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign",
    entityId: data.id,
    action: "create",
    details: { code: parsed.data.code, name: parsed.data.name },
  });

  revalidatePath("/campaigns");
  redirect(`/campaigns/${data.id}/overview`);
}

export async function updateCampaignAction(id: string, values: unknown): Promise<ActionResult> {
  const session = await requireSession();
  if (!uuidField.safeParse(id).success) return fail("ID kampanye tidak valid.");
  const parsed = campaignSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("campaigns").update(parsed.data).eq("id", id);
  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) return duplicateCode();
    return fail(dbRuleMessage(error, "Kampanye gagal diperbarui."));
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign",
    entityId: id,
    action: "update",
    details: { code: parsed.data.code },
  });

  revalidateCampaign(id);
  redirect(`/campaigns/${id}/overview`);
}

/** Status changes are validated here and again by the database trigger. */
export async function changeCampaignStatusAction(values: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = campaignStatusChangeSchema.safeParse(values);
  if (!parsed.success) return fail("Permintaan tidak valid.");
  const { id, status } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("status, objective, landing_url, assignments:campaign_creators(status)")
    .eq("id", id)
    .maybeSingle();
  if (!campaign) return fail("Kampanye tidak ditemukan.");

  if (!canTransition(campaign.status, status)) {
    return fail(
      `Status tidak dapat diubah dari ${CAMPAIGN_STATUS_LABELS[campaign.status]} ke ${CAMPAIGN_STATUS_LABELS[status]}.`,
    );
  }

  if (status === "aktif") {
    const blockers = activationBlockers({
      objective: campaign.objective,
      landingUrl: campaign.landing_url,
      assignmentStatuses: campaign.assignments.map((a) => a.status),
    });
    if (blockers.length) return fail(`Belum bisa diaktifkan: ${blockers.join(" ")}`);
  }

  const { error } = await supabase.from("campaigns").update({ status }).eq("id", id);
  if (error) return fail(dbRuleMessage(error, "Status kampanye gagal diubah."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign",
    entityId: id,
    action: "status_change",
    details: { from: campaign.status, to: status },
  });

  revalidateCampaign(id);
  return ok(`Status kampanye menjadi ${CAMPAIGN_STATUS_LABELS[status]}.`);
}

/** Owner-only. Campaigns with recorded clicks keep their history and cannot be deleted. */
export async function deleteCampaignAction(values: unknown): Promise<ActionResult> {
  const session = await requireRole("owner");
  const parsed = idSchema.safeParse(values);
  if (!parsed.success) return fail("ID kampanye tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("code, assets:campaign_assets(file_path)")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!campaign) return fail("Kampanye tidak ditemukan.");

  const { error } = await supabase.from("campaigns").delete().eq("id", parsed.data.id);
  if (error) {
    return fail(
      error.code === PG_FOREIGN_KEY_VIOLATION
        ? "Kampanye sudah memiliki klik tercatat; batalkan kampanye alih-alih menghapusnya."
        : dbRuleMessage(error, "Kampanye gagal dihapus."),
    );
  }

  const paths = campaign.assets
    .map((asset) => asset.file_path)
    .filter((path): path is string => Boolean(path));
  if (paths.length) await supabase.storage.from(CAMPAIGN_ASSET_BUCKET).remove(paths);

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign",
    entityId: parsed.data.id,
    action: "delete",
    details: { code: campaign.code },
  });

  revalidatePath("/campaigns");
  redirect("/campaigns");
}

/* ------------------------------------------------------------------ */
/* Assets (FR-M4-03)                                                    */
/* ------------------------------------------------------------------ */

const assetRecordSchema = assetSchema.extend({
  campaign_id: uuidField,
  file_path: z
    .string()
    .trim()
    .max(500)
    .transform((value) => value || null)
    .nullable(),
});

/**
 * Records an asset. Files are uploaded by the browser straight to the private
 * `campaign-assets` bucket (RLS + bucket size/type limits apply); only the
 * resulting path reaches this action, so large videos never pass through the
 * Next.js server.
 */
export async function addAssetAction(values: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = assetRecordSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const { campaign_id, file_path, external_url, ...rest } = parsed.data;

  if (Boolean(file_path) === Boolean(external_url)) {
    return fail("Isi salah satu: unggah berkas atau tempel tautan eksternal.");
  }
  // The path must live under this campaign's folder; reject anything else.
  if (file_path && (!file_path.startsWith(`${campaign_id}/`) || file_path.includes(".."))) {
    return fail("Lokasi berkas tidak valid.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("campaign_assets")
    .insert({ ...rest, campaign_id, file_path, external_url, created_by: session.user.id })
    .select("id")
    .single();
  if (error) {
    if (file_path) await supabase.storage.from(CAMPAIGN_ASSET_BUCKET).remove([file_path]);
    return fail(dbRuleMessage(error, "Materi gagal disimpan."));
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign_asset",
    entityId: data.id,
    action: "create",
    details: { campaign_id, title: rest.title, uploaded: Boolean(file_path) },
  });

  revalidateCampaign(campaign_id);
  return ok("Materi ditambahkan.");
}

export async function deleteAssetAction(values: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = z.object({ campaign_id: uuidField, asset_id: uuidField }).safeParse(values);
  if (!parsed.success) return fail("ID tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: asset } = await supabase
    .from("campaign_assets")
    .select("title, file_path")
    .eq("id", parsed.data.asset_id)
    .eq("campaign_id", parsed.data.campaign_id)
    .maybeSingle();
  if (!asset) return fail("Materi tidak ditemukan.");

  const { error } = await supabase.from("campaign_assets").delete().eq("id", parsed.data.asset_id);
  if (error) return fail(dbRuleMessage(error, "Materi gagal dihapus."));

  if (asset.file_path) await supabase.storage.from(CAMPAIGN_ASSET_BUCKET).remove([asset.file_path]);

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign_asset",
    entityId: parsed.data.asset_id,
    action: "delete",
    details: { campaign_id: parsed.data.campaign_id, title: asset.title },
  });

  revalidateCampaign(parsed.data.campaign_id);
  return ok("Materi dihapus.");
}

/* ------------------------------------------------------------------ */
/* Assignments (FR-M5-01 … FR-M5-04)                                    */
/* ------------------------------------------------------------------ */

const MAX_GENERATION_ATTEMPTS = 5;

function uniqueField(message: string): string | null {
  if (message.includes("referral_code")) return "referral_code";
  if (message.includes("tracking_slug")) return "tracking_slug";
  if (message.includes("campaign_creator_key")) return "creator_id";
  return null;
}

export async function addAssignmentAction(
  campaignId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireSession();
  if (!uuidField.safeParse(campaignId).success) return fail("ID kampanye tidak valid.");
  const parsed = assignmentCreateSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("stage_name, full_name, status")
    .eq("id", parsed.data.creator_id)
    .maybeSingle();
  if (!creator) return fail("Kreator tidak ditemukan.");
  if (creator.status !== "terverifikasi" && creator.status !== "aktif") {
    return fail("Hanya kreator terverifikasi atau aktif yang dapat ditugaskan.");
  }

  // Generated values may collide with existing ones; retry a few times.
  // A value typed by the user is never silently replaced.
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const referral_code = parsed.data.referral_code ?? generateReferralCode();
    const tracking_slug = parsed.data.tracking_slug ?? generateTrackingSlug(creator.stage_name);

    const { data, error } = await supabase
      .from("campaign_creators")
      .insert({
        ...parsed.data,
        campaign_id: campaignId,
        referral_code,
        tracking_slug,
        joined_at: parsed.data.status === "bergabung" ? new Date().toISOString() : null,
        created_by: session.user.id,
      })
      .select("id")
      .single();

    if (!error) {
      await logActivity(supabase, {
        actorId: session.user.id,
        entityType: "campaign_creator",
        entityId: data.id,
        action: "create",
        details: {
          campaign_id: campaignId,
          creator: creator.stage_name || creator.full_name,
          referral_code,
          tracking_slug,
        },
      });
      revalidateCampaign(campaignId);
      return ok("Kreator ditugaskan.");
    }

    if (error.code !== PG_UNIQUE_VIOLATION) {
      return fail(dbRuleMessage(error, "Penugasan gagal disimpan."));
    }

    const field = uniqueField(error.message);
    if (field === "creator_id") return fail("Kreator ini sudah ditugaskan di kampanye ini.");
    if (field === "referral_code" && parsed.data.referral_code) {
      return {
        status: "error",
        message: "Kode referal sudah dipakai.",
        fieldErrors: { referral_code: "Sudah dipakai." },
      };
    }
    if (field === "tracking_slug" && parsed.data.tracking_slug) {
      return {
        status: "error",
        message: "Slug sudah dipakai.",
        fieldErrors: { tracking_slug: "Sudah dipakai." },
      };
    }
  }

  return fail("Gagal membuat kode unik. Coba lagi.");
}

export async function updateAssignmentAction(
  campaignId: string,
  assignmentId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireSession();
  if (!uuidField.safeParse(campaignId).success || !uuidField.safeParse(assignmentId).success) {
    return fail("ID tidak valid.");
  }
  const parsed = assignmentUpdateSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data: current } = await supabase
    .from("campaign_creators")
    .select("status, referral_code, tracking_slug, joined_at")
    .eq("id", assignmentId)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (!current) return fail("Penugasan tidak ditemukan.");

  const { referral_code, tracking_slug, ...rest } = parsed.data;
  const { error } = await supabase
    .from("campaign_creators")
    .update({
      ...rest,
      // Empty code/slug in the edit form means "keep the current one".
      referral_code: referral_code ?? current.referral_code,
      tracking_slug: tracking_slug ?? current.tracking_slug,
      joined_at:
        rest.status === "bergabung" && !current.joined_at
          ? new Date().toISOString()
          : current.joined_at,
    })
    .eq("id", assignmentId);

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      const field = uniqueField(error.message) ?? "referral_code";
      return {
        status: "error",
        message: field === "tracking_slug" ? "Slug sudah dipakai." : "Kode referal sudah dipakai.",
        fieldErrors: { [field]: "Sudah dipakai." },
      };
    }
    return fail(dbRuleMessage(error, "Penugasan gagal diperbarui."));
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign_creator",
    entityId: assignmentId,
    action: "update",
    details: {
      campaign_id: campaignId,
      status: rest.status,
      referral_code_changed: Boolean(referral_code && referral_code !== current.referral_code),
      tracking_slug_changed: Boolean(tracking_slug && tracking_slug !== current.tracking_slug),
    },
  });

  revalidateCampaign(campaignId);
  return ok("Penugasan diperbarui.");
}

/** Removing is only possible before any click exists (FK restrict on link_clicks). */
export async function removeAssignmentAction(values: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = z.object({ campaign_id: uuidField, assignment_id: uuidField }).safeParse(values);
  if (!parsed.success) return fail("ID tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("campaign_creators")
    .delete()
    .eq("id", parsed.data.assignment_id)
    .eq("campaign_id", parsed.data.campaign_id);
  if (error) {
    return fail(
      error.code === PG_FOREIGN_KEY_VIOLATION
        ? "Penugasan sudah memiliki klik tercatat; ubah statusnya menjadi Mundur."
        : dbRuleMessage(error, "Penugasan gagal dihapus."),
    );
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign_creator",
    entityId: parsed.data.assignment_id,
    action: "delete",
    details: { campaign_id: parsed.data.campaign_id },
  });

  revalidateCampaign(parsed.data.campaign_id);
  return ok("Penugasan dihapus.");
}
