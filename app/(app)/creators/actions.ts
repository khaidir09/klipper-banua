"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  PG_FOREIGN_KEY_VIOLATION,
  dbRuleMessage,
  PG_UNIQUE_VIOLATION,
  fail,
  invalid,
  ok,
  type ActionResult,
} from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireInternal, requireRole } from "@/lib/auth/guards";
import { assignInvitedRole } from "@/lib/auth/invite-role";
import { AUDIENCE_PROOF_BUCKET } from "@/lib/data/creators";
import { publicEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidField } from "@/lib/validation/common";
import { LOCAL_BADGE_MIN_PCT } from "@/lib/constants/creators";
import {
  anonymizeCreatorSchema,
  badgeDecisionSchema,
  bankAccountSchema,
  blockCreatorSchema,
  creatorSchema,
  invitePortalSchema,
  portalAccessSchema,
  socialAccountSchema,
  termsSchema,
  verificationBlockers,
} from "@/lib/validation/creators";

const idSchema = z.object({ id: uuidField });
const accountIdSchema = z.object({ creator_id: uuidField, account_id: uuidField });

const PROOF_MAX_BYTES = 5 * 1024 * 1024;
const PROOF_MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/* ------------------------------------------------------------------ */
/* Creator                                                             */
/* ------------------------------------------------------------------ */

/** FR-M3-01, FR-M3-02 (age is validated inside `creatorSchema`). */
export async function createCreatorAction(values: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireInternal();
  const parsed = creatorSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("creators")
    .insert({ ...parsed.data, created_by: session.user.id })
    .select("id")
    .single();
  if (error) return fail(dbRuleMessage(error, "Kreator gagal disimpan."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: data.id,
    action: "create",
    details: { full_name: parsed.data.full_name },
  });

  revalidatePath("/creators");
  redirect(`/creators/${data.id}`);
}

export async function updateCreatorAction(id: string, values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  if (!uuidField.safeParse(id).success) return fail("ID kreator tidak valid.");
  const parsed = creatorSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();

  // Blocked creators cannot be assigned anywhere (PRD 8.5); status changes
  // away from `terverifikasi` keep the verification stamp for the audit trail.
  const { error } = await supabase.from("creators").update(parsed.data).eq("id", id);
  if (error) return fail(dbRuleMessage(error, "Kreator gagal diperbarui."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: id,
    action: "update",
    details: { full_name: parsed.data.full_name, status: parsed.data.status },
  });

  revalidatePath("/creators");
  revalidatePath(`/creators/${id}`);
  redirect(`/creators/${id}`);
}

/** Owner-only. Also removes the creator's proof files (UU PDP erasure). */
export async function deleteCreatorAction(values: unknown): Promise<ActionResult> {
  const session = await requireRole("owner");
  const parsed = idSchema.safeParse(values);
  if (!parsed.success) return fail("ID kreator tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("full_name, social_accounts:creator_social_accounts(audience_proof_path)")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!creator) return fail("Kreator tidak ditemukan.");

  const paths = creator.social_accounts
    .map((account) => account.audience_proof_path)
    .filter((path): path is string => Boolean(path));

  // Delete the row first: assignments restrict the delete, and the proof
  // files must survive if the creator cannot actually be removed.
  const { error } = await supabase.from("creators").delete().eq("id", parsed.data.id);
  if (error) {
    return fail(
      error.code === PG_FOREIGN_KEY_VIOLATION
        ? "Kreator sudah pernah ditugaskan di kampanye sehingga datanya tidak dapat dihapus."
        : "Kreator gagal dihapus.",
    );
  }

  if (paths.length) {
    await supabase.storage.from(AUDIENCE_PROOF_BUCKET).remove(paths);
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: parsed.data.id,
    action: "delete",
    details: { full_name: creator.full_name, proof_files_removed: paths.length },
  });

  revalidatePath("/creators");
  redirect("/creators");
}

/**
 * PRD section 9 (UU PDP): erases a creator's personal data on request when the
 * row cannot be deleted because campaign and payout history refer to it. The
 * database function does the erasure atomically and returns the proof files.
 */
export async function anonymizeCreatorAction(values: unknown): Promise<ActionResult> {
  const session = await requireRole("owner");
  const parsed = anonymizeCreatorSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const { id } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: proofPaths, error } = await supabase.rpc("anonymize_creator", { target_id: id });
  if (error) return fail(dbRuleMessage(error, "Data kreator gagal dianonimkan."));

  if (proofPaths?.length) {
    const { error: storageError } = await supabase.storage
      .from(AUDIENCE_PROOF_BUCKET)
      .remove(proofPaths);
    if (storageError) console.error("audience proof removal failed:", storageError.message);
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: id,
    action: "anonymize",
    details: { proof_files_removed: proofPaths?.length ?? 0 },
  });

  revalidatePath("/creators");
  revalidatePath(`/creators/${id}`);
  return ok("Data pribadi kreator sudah dianonimkan.");
}

/* ------------------------------------------------------------------ */
/* Social accounts (FR-M3-03)                                          */
/* ------------------------------------------------------------------ */

/**
 * Creates or updates a social account. Receives FormData because the
 * audience proof screenshot travels with the fields.
 */
export async function saveSocialAccountAction(
  creatorId: string,
  accountId: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await requireInternal();
  if (!uuidField.safeParse(creatorId).success) return fail("ID kreator tidak valid.");
  if (accountId && !uuidField.safeParse(accountId).success) return fail("ID akun tidak valid.");

  const parsed = socialAccountSchema.safeParse({
    platform: formData.get("platform"),
    handle: formData.get("handle"),
    profile_url: formData.get("profile_url") ?? "",
    followers_count: formData.get("followers_count") ?? 0,
    kalimantan_audience_pct: formData.get("kalimantan_audience_pct") ?? "",
    top_cities: formData.get("top_cities") ?? "",
    last_verified_at: formData.get("last_verified_at") ?? "",
  });
  if (!parsed.success) return invalid(parsed.error);

  const proof = formData.get("audience_proof");
  const file = proof instanceof File && proof.size > 0 ? proof : null;
  if (file) {
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
  }

  const supabase = await createSupabaseServerClient();

  const values = {
    ...parsed.data,
    last_verified_at: parsed.data.last_verified_at
      ? new Date(`${parsed.data.last_verified_at}T00:00:00Z`).toISOString()
      : null,
  };

  let savedId = accountId;
  if (accountId) {
    const { error } = await supabase
      .from("creator_social_accounts")
      .update(values)
      .eq("id", accountId)
      .eq("creator_id", creatorId);
    if (error) return uniqueOrFail(error.code, "Akun gagal diperbarui.");
  } else {
    const { data, error } = await supabase
      .from("creator_social_accounts")
      .insert({ ...values, creator_id: creatorId })
      .select("id")
      .single();
    if (error) return uniqueOrFail(error.code, "Akun gagal disimpan.");
    savedId = data.id;
  }

  if (file && savedId) {
    const path = `${creatorId}/${savedId}-${Date.now()}.${PROOF_MIME_EXT[file.type]}`;
    const { error: uploadError } = await supabase.storage
      .from(AUDIENCE_PROOF_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) return fail("Bukti audiens gagal diunggah. Data akun tersimpan tanpa bukti.");

    const { data: previous } = await supabase
      .from("creator_social_accounts")
      .select("audience_proof_path")
      .eq("id", savedId)
      .maybeSingle();

    const { error } = await supabase
      .from("creator_social_accounts")
      .update({ audience_proof_path: path })
      .eq("id", savedId);
    if (error) return fail("Bukti audiens gagal dicatat.");

    if (previous?.audience_proof_path) {
      await supabase.storage.from(AUDIENCE_PROOF_BUCKET).remove([previous.audience_proof_path]);
    }
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator_social_account",
    entityId: savedId,
    action: accountId ? "update" : "create",
    details: {
      creator_id: creatorId,
      platform: parsed.data.platform,
      handle: parsed.data.handle,
      proof_uploaded: Boolean(file),
    },
  });

  revalidatePath(`/creators/${creatorId}`);
  return ok(accountId ? "Akun diperbarui." : "Akun ditambahkan.");
}

function uniqueOrFail(code: string | undefined, fallback: string): ActionResult {
  if (code === PG_UNIQUE_VIOLATION) {
    return {
      status: "error",
      message: "Handle tersebut sudah terdaftar pada platform yang sama.",
      fieldErrors: { handle: "Sudah dipakai kreator lain." },
    };
  }
  return fail(fallback);
}

export async function deleteSocialAccountAction(values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const parsed = accountIdSchema.safeParse(values);
  if (!parsed.success) return fail("ID tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: account } = await supabase
    .from("creator_social_accounts")
    .select("audience_proof_path, platform, handle")
    .eq("id", parsed.data.account_id)
    .eq("creator_id", parsed.data.creator_id)
    .maybeSingle();
  if (!account) return fail("Akun tidak ditemukan.");

  const { error } = await supabase
    .from("creator_social_accounts")
    .delete()
    .eq("id", parsed.data.account_id);
  if (error) return fail("Akun gagal dihapus.");

  if (account.audience_proof_path) {
    await supabase.storage.from(AUDIENCE_PROOF_BUCKET).remove([account.audience_proof_path]);
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator_social_account",
    entityId: parsed.data.account_id,
    action: "delete",
    details: {
      creator_id: parsed.data.creator_id,
      platform: account.platform,
      handle: account.handle,
    },
  });

  revalidatePath(`/creators/${parsed.data.creator_id}`);
  return ok("Akun dihapus.");
}

/* ------------------------------------------------------------------ */
/* Terms and verification (FR-M3-04, FR-M3-05)                         */
/* ------------------------------------------------------------------ */

export async function recordTermsAction(creatorId: string, values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  if (!uuidField.safeParse(creatorId).success) return fail("ID kreator tidak valid.");
  const parsed = termsSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("creators")
    .update({
      terms_version: parsed.data.terms_version,
      terms_agreed_at: new Date(`${parsed.data.terms_agreed_at}T00:00:00Z`).toISOString(),
    })
    .eq("id", creatorId);
  if (error) return fail("Persetujuan gagal dicatat.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: creatorId,
    action: "terms_recorded",
    details: { terms_version: parsed.data.terms_version, agreed_on: parsed.data.terms_agreed_at },
  });

  revalidatePath(`/creators/${creatorId}`);
  return ok("Persetujuan syarat dicatat.");
}

/** The prerequisites are re-checked here, never trusted from the UI. */
export async function verifyCreatorAction(values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const parsed = idSchema.safeParse(values);
  if (!parsed.success) return fail("ID kreator tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: creator } = await supabase
    .from("creators")
    .select(
      "status, terms_agreed_at, social_accounts:creator_social_accounts(audience_proof_path, kalimantan_audience_pct)",
    )
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!creator) return fail("Kreator tidak ditemukan.");

  if (creator.status === "diblokir") {
    return fail("Kreator yang diblokir tidak dapat diverifikasi.");
  }

  const blockers = verificationBlockers({
    hasProofAccount: creator.social_accounts.some((a) => Boolean(a.audience_proof_path)),
    hasLocalAudience: creator.social_accounts.some(
      (a) =>
        Boolean(a.audience_proof_path) && (a.kalimantan_audience_pct ?? 0) >= LOCAL_BADGE_MIN_PCT,
    ),
    termsAgreedAt: creator.terms_agreed_at,
  });
  if (blockers.length) {
    return fail(`Belum bisa diverifikasi: ${blockers.join(" ")}`);
  }

  // v4.0: the stamp is the local badge. A prospect the team registered also
  // becomes assignable, as before; an active klipper keeps their status.
  const { error } = await supabase
    .from("creators")
    .update({
      ...(creator.status === "prospek" ? { status: "terverifikasi" as const } : {}),
      verified_at: new Date().toISOString(),
      verified_by: session.user.id,
    })
    .eq("id", parsed.data.id);
  if (error) return fail("Verifikasi gagal disimpan.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: parsed.data.id,
    action: "verify",
    details: { previous_status: creator.status },
  });

  revalidatePath("/creators");
  revalidatePath(`/creators/${parsed.data.id}`);
  return ok("Lencana Klipper Lokal diberikan.");
}

/* ------------------------------------------------------------------ */
/* Local badge (FR-M3-05, FR-M16-08) and blocking (FR-M3-09), v4.0     */
/* ------------------------------------------------------------------ */

/**
 * The team's answer to a badge request from the portal. Granting stamps the
 * account and gives the creator the badge (`verified_at`) if they had none;
 * the threshold and the screenshot are checked here, never trusted from the UI.
 */
export async function decideBadgeRequestAction(values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const parsed = badgeDecisionSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const { account_id: accountId, decision, notes } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: account } = await supabase
    .from("creator_social_accounts")
    .select(
      "id, creator_id, platform, handle, kalimantan_audience_pct, audience_proof_path, badge_requested_at, creator:creators(status, verified_at)",
    )
    .eq("id", accountId)
    .maybeSingle();
  if (!account) return fail("Akun tidak ditemukan.");
  if (!account.badge_requested_at) return fail("Pengajuan ini sudah diputuskan.");

  const now = new Date().toISOString();

  if (decision === "tolak") {
    const { error } = await supabase
      .from("creator_social_accounts")
      .update({ badge_requested_at: null, badge_review_notes: notes })
      .eq("id", accountId);
    if (error) return fail(dbRuleMessage(error, "Keputusan gagal disimpan."));
  } else {
    if (!account.audience_proof_path) return fail("Pengajuan ini belum memuat bukti analitik.");
    if ((account.kalimantan_audience_pct ?? 0) < LOCAL_BADGE_MIN_PCT) {
      return fail(
        `Audiens Kalimantan di bawah ${LOCAL_BADGE_MIN_PCT}%. Tolak pengajuan dengan alasan.`,
      );
    }
    if (account.creator?.status === "diblokir") {
      return fail("Klipper yang diblokir tidak dapat diberi lencana.");
    }

    const { error } = await supabase
      .from("creator_social_accounts")
      .update({ last_verified_at: now, badge_requested_at: null, badge_review_notes: null })
      .eq("id", accountId);
    if (error) return fail(dbRuleMessage(error, "Keputusan gagal disimpan."));

    if (!account.creator?.verified_at) {
      const { error: creatorError } = await supabase
        .from("creators")
        .update({ verified_at: now, verified_by: session.user.id })
        .eq("id", account.creator_id);
      if (creatorError) return fail(dbRuleMessage(creatorError, "Lencana gagal diberikan."));
    }
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: account.creator_id,
    action: decision === "beri" ? "badge_grant" : "badge_reject",
    details: {
      account_id: accountId,
      platform: account.platform,
      handle: account.handle,
      kalimantan_audience_pct: account.kalimantan_audience_pct,
      notes: decision === "tolak" ? notes : undefined,
    },
  });

  revalidatePath("/creators/lencana");
  revalidatePath(`/creators/${account.creator_id}`);
  revalidatePath("/dashboard");
  return ok(decision === "beri" ? "Lencana Klipper Lokal diberikan." : "Pengajuan ditolak.");
}

export async function revokeLocalBadgeAction(values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const parsed = idSchema.safeParse(values);
  if (!parsed.success) return fail("ID kreator tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("creators")
    .update({ verified_at: null, verified_by: null })
    .eq("id", parsed.data.id);
  if (error) return fail(dbRuleMessage(error, "Lencana gagal dicabut."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: parsed.data.id,
    action: "badge_revoke",
  });

  revalidatePath(`/creators/${parsed.data.id}`);
  return ok("Lencana Klipper Lokal dicabut.");
}

/** FR-M3-09. The trigger stamps `blocked_at`; the reason is required. */
export async function blockCreatorAction(values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const parsed = blockCreatorSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("creators")
    .update({ status: "diblokir", blocked_reason: parsed.data.reason })
    .eq("id", parsed.data.creator_id);
  if (error) return fail(dbRuleMessage(error, "Klipper gagal diblokir."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: parsed.data.creator_id,
    action: "block",
    details: { reason: parsed.data.reason },
  });

  revalidatePath("/creators");
  revalidatePath(`/creators/${parsed.data.creator_id}`);
  return ok("Klipper diblokir.");
}

/** Owner only, here and in `guard_creator_block`. */
export async function unblockCreatorAction(values: unknown): Promise<ActionResult> {
  const session = await requireRole("owner");
  const parsed = idSchema.safeParse(values);
  if (!parsed.success) return fail("ID kreator tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("creators")
    .update({ status: "aktif" })
    .eq("id", parsed.data.id)
    .eq("status", "diblokir");
  if (error) return fail(dbRuleMessage(error, "Blokir gagal dibuka."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: parsed.data.id,
    action: "unblock",
  });

  revalidatePath("/creators");
  revalidatePath(`/creators/${parsed.data.id}`);
  return ok("Blokir dibuka. Status klipper kembali aktif.");
}

/* ------------------------------------------------------------------ */
/* Bank account (FR-M3-06, owner only)                                 */
/* ------------------------------------------------------------------ */

export type BankAccountData = {
  bank_name: string;
  account_number: string;
  account_holder: string;
} | null;

/** Reveals the full account. Every call is logged (FR-M11-01). */
export async function revealBankAccountAction(
  values: unknown,
): Promise<ActionResult<BankAccountData>> {
  const session = await requireRole("owner");
  const parsed = idSchema.safeParse(values);
  if (!parsed.success) return fail("ID kreator tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("creator_bank_accounts")
    .select("bank_name, account_number, account_holder")
    .eq("creator_id", parsed.data.id)
    .maybeSingle();
  if (error) return fail("Rekening gagal dimuat.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator_bank_account",
    entityId: parsed.data.id,
    action: "bank_account_viewed",
    details: { creator_id: parsed.data.id, exists: Boolean(data) },
  });

  return ok("Rekening ditampilkan.", data);
}

export async function saveBankAccountAction(
  creatorId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireRole("owner");
  if (!uuidField.safeParse(creatorId).success) return fail("ID kreator tidak valid.");
  const parsed = bankAccountSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("creator_bank_accounts")
    .upsert({ ...parsed.data, creator_id: creatorId }, { onConflict: "creator_id" });
  if (error) return fail("Rekening gagal disimpan.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator_bank_account",
    entityId: creatorId,
    action: "update",
    details: { creator_id: creatorId, bank_name: parsed.data.bank_name },
  });

  revalidatePath(`/creators/${creatorId}`);
  return ok("Rekening disimpan.");
}

export async function deleteBankAccountAction(values: unknown): Promise<ActionResult> {
  const session = await requireRole("owner");
  const parsed = idSchema.safeParse(values);
  if (!parsed.success) return fail("ID kreator tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("creator_bank_accounts")
    .delete()
    .eq("creator_id", parsed.data.id);
  if (error) return fail("Rekening gagal dihapus.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator_bank_account",
    entityId: parsed.data.id,
    action: "delete",
    details: { creator_id: parsed.data.id },
  });

  revalidatePath(`/creators/${parsed.data.id}`);
  return ok("Rekening dihapus.");
}

/* ------------------------------------------------------------------ */
/* Creator portal access (FR-M13-01, FR-M13-08)                        */
/* ------------------------------------------------------------------ */

const PORTAL_REDIRECT = `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/atur-sandi`;

/**
 * Invites a creator to the portal, or sends a fresh password link when the
 * account already exists. Mirrors `inviteUserAction` for internal members.
 */
export async function invitePortalAccessAction(values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const parsed = invitePortalSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const { creator_id: creatorId, email } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("id, status, anonymized_at, profile_id")
    .eq("id", creatorId)
    .maybeSingle();
  if (!creator) return fail("Kreator tidak ditemukan.");
  if (creator.anonymized_at) return fail("Data kreator ini sudah dianonimkan.");
  if (!["terverifikasi", "aktif"].includes(creator.status)) {
    return fail("Hanya kreator terverifikasi atau aktif yang dapat diundang ke portal.");
  }

  // The account exists: send a password link instead of a second invitation.
  if (creator.profile_id) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: PORTAL_REDIRECT,
    });
    if (error) return fail("Tautan masuk gagal dikirim. Coba lagi beberapa saat lagi.");

    await supabase
      .from("creators")
      .update({ portal_invited_at: new Date().toISOString() })
      .eq("id", creatorId);

    await logActivity(supabase, {
      actorId: session.user.id,
      entityType: "creator",
      entityId: creatorId,
      action: "portal_invite",
      details: { email, resent: true },
    });

    revalidatePath(`/creators/${creatorId}`);
    return ok(`Tautan masuk dikirim ulang ke ${email}.`);
  }

  const admin = createSupabaseAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: "" },
    redirectTo: PORTAL_REDIRECT,
  });

  if (inviteError) {
    if (/already|exists|registered/i.test(inviteError.message)) {
      return fail("Email tersebut sudah dipakai akun lain.");
    }
    return fail(`Undangan gagal dikirim: ${inviteError.message}`);
  }

  const { error: roleError } = await assignInvitedRole(admin, invited.user.id, "creator");
  if (roleError) {
    await admin.auth.admin.deleteUser(invited.user.id);
    return fail("Undangan gagal disiapkan. Coba lagi.");
  }

  const { error } = await supabase
    .from("creators")
    .update({
      profile_id: invited.user.id,
      portal_invited_at: new Date().toISOString(),
      email,
    })
    .eq("id", creatorId);
  if (error) {
    // The account exists but the link failed: remove it so a retry is clean.
    await admin.auth.admin.deleteUser(invited.user.id);
    return fail(dbRuleMessage(error, "Akun portal gagal ditautkan ke kreator."));
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: creatorId,
    action: "portal_invite",
    details: { email, resent: false },
  });

  revalidatePath(`/creators/${creatorId}`);
  return ok(`Undangan portal dikirim ke ${email}.`);
}

/** FR-M13-08. Owner only, like every other access decision. */
export async function setPortalAccessAction(values: unknown): Promise<ActionResult> {
  const session = await requireRole("owner");
  const parsed = portalAccessSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const { creator_id: creatorId, is_active: isActive } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: creator } = await supabase
    .from("creators")
    .select("profile_id")
    .eq("id", creatorId)
    .maybeSingle();
  if (!creator?.profile_id) return fail("Kreator ini belum punya akun portal.");

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", creator.profile_id);
  if (error) return fail("Akses portal gagal diperbarui.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "creator",
    entityId: creatorId,
    action: "portal_access",
    details: { is_active: isActive },
  });

  revalidatePath(`/creators/${creatorId}`);
  return ok(isActive ? "Akses portal diaktifkan." : "Akses portal dicabut.");
}
