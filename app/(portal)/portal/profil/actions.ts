"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  PG_UNIQUE_VIOLATION,
  dbRuleMessage,
  fail,
  invalid,
  ok,
  type ActionResult,
} from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireCreator } from "@/lib/auth/guards";
import { AUDIENCE_PROOF_BUCKET } from "@/lib/data/creators";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidField } from "@/lib/validation/common";
import { badgeRequestSchema, portalSocialAccountSchema } from "@/lib/validation/creators";

/*
 * What a klipper manages about themselves (PRD M16: FR-M3-03, FR-M16-05,
 * FR-M16-08, FR-M16-09). Ownership is checked here for a clear message, and
 * again by the `*_own` policies and `guard_portal_social_account` in
 * 20261001000000_creator_self_signup.sql.
 */

const idSchema = z.object({ id: uuidField });

const PROOF_MAX_BYTES = 5 * 1024 * 1024;
const PROOF_MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

function revalidatePortalProfile() {
  revalidatePath("/portal/profil");
  revalidatePath("/portal/mulai");
  revalidatePath("/portal");
}

function handleTaken(): ActionResult {
  return {
    status: "error",
    message: "Akun tersebut sudah terdaftar di platform yang sama.",
    fieldErrors: { handle: "Sudah dipakai klipper lain. Hubungi tim bila ini akun Anda." },
  };
}

/** FR-M3-03. Adding the first account also activates a new klipper (trigger). */
export async function savePortalSocialAccountAction(
  accountId: string | null,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireCreator();
  if (accountId && !uuidField.safeParse(accountId).success) return fail("ID akun tidak valid.");
  const parsed = portalSocialAccountSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  let savedId = accountId;

  if (accountId) {
    const { data, error } = await supabase
      .from("creator_social_accounts")
      .update(parsed.data)
      .eq("id", accountId)
      .eq("creator_id", session.creatorId)
      .select("id");
    if (error) {
      return error.code === PG_UNIQUE_VIOLATION
        ? handleTaken()
        : fail(dbRuleMessage(error, "Akun gagal diperbarui."));
    }
    if (!data?.length) return fail("Akun tidak ditemukan.");
  } else {
    const { data, error } = await supabase
      .from("creator_social_accounts")
      .insert({ ...parsed.data, creator_id: session.creatorId })
      .select("id")
      .single();
    if (error) {
      return error.code === PG_UNIQUE_VIOLATION
        ? handleTaken()
        : fail(dbRuleMessage(error, "Akun gagal disimpan."));
    }
    savedId = data.id;
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator_social_account",
    entityId: savedId,
    action: accountId ? "update" : "create",
    details: {
      creator_id: session.creatorId,
      platform: parsed.data.platform,
      handle: parsed.data.handle,
      source: "portal",
    },
  });

  revalidatePortalProfile();
  return ok(accountId ? "Akun diperbarui." : "Akun ditambahkan.");
}

export async function deletePortalSocialAccountAction(values: unknown): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = idSchema.safeParse(values);
  if (!parsed.success) return fail("ID akun tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: account } = await supabase
    .from("creator_portal_social_accounts")
    .select("id, platform, handle, audience_proof_path")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!account) return fail("Akun tidak ditemukan.");

  const { error } = await supabase
    .from("creator_social_accounts")
    .delete()
    .eq("id", parsed.data.id)
    .eq("creator_id", session.creatorId);
  if (error) return fail(dbRuleMessage(error, "Akun gagal dihapus."));

  if (account.audience_proof_path) {
    await supabase.storage.from(AUDIENCE_PROOF_BUCKET).remove([account.audience_proof_path]);
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator_social_account",
    entityId: parsed.data.id,
    action: "delete",
    details: {
      creator_id: session.creatorId,
      platform: account.platform,
      handle: account.handle,
      source: "portal",
    },
  });

  revalidatePortalProfile();
  return ok("Akun dihapus.");
}

/**
 * FR-M16-08. The screenshot goes into the klipper's own folder of the private
 * `audience-proofs` bucket; the claim waits for the team (FR-M3-05). A new
 * claim withdraws an earlier verification of that account (trigger).
 */
export async function requestLocalBadgeAction(formData: FormData): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = badgeRequestSchema.safeParse({
    account_id: formData.get("account_id"),
    kalimantan_audience_pct: formData.get("kalimantan_audience_pct"),
    top_cities: formData.get("top_cities"),
  });
  if (!parsed.success) return invalid(parsed.error);

  const proof = formData.get("audience_proof");
  const file = proof instanceof File && proof.size > 0 ? proof : null;
  if (!file) {
    return {
      status: "error",
      message: "Unggah tangkapan layar analitik audiens.",
      fieldErrors: { audience_proof: "Bukti wajib diunggah." },
    };
  }
  if (!PROOF_MIME_EXT[file.type]) {
    return {
      status: "error",
      message: "Bukti harus berupa gambar PNG, JPG, atau WebP.",
      fieldErrors: { audience_proof: "Format berkas tidak didukung." },
    };
  }
  if (file.size > PROOF_MAX_BYTES) {
    return {
      status: "error",
      message: "Ukuran bukti maksimal 5 MB.",
      fieldErrors: { audience_proof: "Ukuran berkas melebihi 5 MB." },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: account } = await supabase
    .from("creator_portal_social_accounts")
    .select("id, platform, audience_proof_path")
    .eq("id", parsed.data.account_id)
    .maybeSingle();
  if (!account) return fail("Akun tidak ditemukan.");

  const accountId = parsed.data.account_id;
  const path = `${session.creatorId}/${accountId}-${Date.now()}.${PROOF_MIME_EXT[file.type]}`;
  const { error: uploadError } = await supabase.storage
    .from(AUDIENCE_PROOF_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return fail("Bukti gagal diunggah. Coba lagi.");

  const { error } = await supabase
    .from("creator_social_accounts")
    .update({
      kalimantan_audience_pct: parsed.data.kalimantan_audience_pct,
      top_cities: parsed.data.top_cities,
      audience_proof_path: path,
      badge_requested_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .eq("creator_id", session.creatorId);
  if (error) {
    await supabase.storage.from(AUDIENCE_PROOF_BUCKET).remove([path]);
    return fail(dbRuleMessage(error, "Pengajuan lencana gagal disimpan."));
  }

  if (account.audience_proof_path) {
    await supabase.storage.from(AUDIENCE_PROOF_BUCKET).remove([account.audience_proof_path]);
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator_social_account",
    entityId: accountId,
    action: "badge_request",
    details: {
      creator_id: session.creatorId,
      platform: account.platform,
      kalimantan_audience_pct: parsed.data.kalimantan_audience_pct,
    },
  });

  revalidatePortalProfile();
  return ok("Pengajuan lencana terkirim. Tim akan memeriksanya.");
}

/** FR-M16-09. The owner erases the data; saldo must be settled first (Phase 18). */
export async function requestAccountDeletionAction(): Promise<ActionResult> {
  const session = await requireCreator();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.rpc("request_creator_account_deletion");
  if (error) return fail(dbRuleMessage(error, "Permintaan gagal dikirim."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: session.creatorId,
    action: "deletion_request",
  });

  revalidatePortalProfile();
  return ok("Permintaan penghapusan akun terkirim. Tim akan menghubungi Anda.");
}
