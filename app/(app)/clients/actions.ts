"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  PG_FOREIGN_KEY_VIOLATION,
  dbRuleMessage,
  fail,
  invalid,
  ok,
  type ActionResult,
} from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireInternal, requireRole } from "@/lib/auth/guards";
import { publicEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  clientContactSchema,
  clientPortalAccessSchema,
  clientSchema,
  inviteClientPortalSchema,
} from "@/lib/validation/clients";
import { uuidField } from "@/lib/validation/common";

const idSchema = z.object({ id: uuidField });
const contactIdSchema = z.object({ client_id: uuidField, contact_id: uuidField });

/** FR-M2-01 */
export async function createClientAction(values: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireInternal();
  const parsed = clientSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clients")
    .insert({ ...parsed.data, created_by: session.user.id })
    .select("id")
    .single();
  if (error) return fail("Klien gagal disimpan.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "client",
    entityId: data.id,
    action: "create",
    details: { name: parsed.data.name },
  });

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClientAction(id: string, values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const idParsed = idSchema.safeParse({ id });
  if (!idParsed.success) return fail("ID klien tidak valid.");
  const parsed = clientSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("clients").update(parsed.data).eq("id", id);
  if (error) return fail("Klien gagal diperbarui.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "client",
    entityId: id,
    action: "update",
    details: { name: parsed.data.name },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}

/** Deleting a client is an owner-only, logged operation. */
export async function deleteClientAction(values: unknown): Promise<ActionResult> {
  const session = await requireRole("owner");
  const parsed = idSchema.safeParse(values);
  if (!parsed.success) return fail("ID klien tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: client } = await supabase
    .from("clients")
    .select("name")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!client) return fail("Klien tidak ditemukan.");

  const { error } = await supabase.from("clients").delete().eq("id", parsed.data.id);
  if (error) {
    return fail(
      error.code === PG_FOREIGN_KEY_VIOLATION
        ? "Klien masih memiliki kampanye sehingga tidak dapat dihapus."
        : "Klien gagal dihapus.",
    );
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "client",
    entityId: parsed.data.id,
    action: "delete",
    details: { name: client.name },
  });

  revalidatePath("/clients");
  redirect("/clients");
}

/** FR-M2-02: create or update a contact; `is_primary` moves between contacts. */
export async function saveContactAction(
  clientId: string,
  contactId: string | null,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireInternal();
  if (!uuidField.safeParse(clientId).success) return fail("ID klien tidak valid.");
  if (contactId && !uuidField.safeParse(contactId).success) return fail("ID kontak tidak valid.");
  const parsed = clientContactSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();

  // Only one primary contact is allowed (partial unique index); clear the
  // previous one first so the constraint never fires.
  if (parsed.data.is_primary) {
    const { error } = await supabase
      .from("client_contacts")
      .update({ is_primary: false })
      .eq("client_id", clientId)
      .eq("is_primary", true);
    if (error) return fail("Kontak utama gagal diperbarui.");
  }

  if (contactId) {
    const { error } = await supabase
      .from("client_contacts")
      .update(parsed.data)
      .eq("id", contactId)
      .eq("client_id", clientId);
    if (error) return fail("Kontak gagal diperbarui.");
  } else {
    const { error } = await supabase
      .from("client_contacts")
      .insert({ ...parsed.data, client_id: clientId });
    if (error) return fail("Kontak gagal disimpan.");
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "client_contact",
    entityId: contactId,
    action: contactId ? "update" : "create",
    details: { client_id: clientId, name: parsed.data.name },
  });

  revalidatePath(`/clients/${clientId}`);
  return ok(contactId ? "Kontak diperbarui." : "Kontak ditambahkan.");
}

export async function deleteContactAction(values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const parsed = contactIdSchema.safeParse(values);
  if (!parsed.success) return fail("ID tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("client_contacts")
    .delete()
    .eq("id", parsed.data.contact_id)
    .eq("client_id", parsed.data.client_id);
  if (error) return fail("Kontak gagal dihapus.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "client_contact",
    entityId: parsed.data.contact_id,
    action: "delete",
    details: { client_id: parsed.data.client_id },
  });

  revalidatePath(`/clients/${parsed.data.client_id}`);
  return ok("Kontak dihapus.");
}

/* ------------------------------------------------------------------ */
/* Client portal access (FR-M14-01)                                    */
/* ------------------------------------------------------------------ */

const PORTAL_REDIRECT = `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/atur-sandi`;

/**
 * Invites a client contact to the portal, or sends a fresh password link when
 * the account already exists. Mirrors `invitePortalAccessAction` for creators.
 */
export async function inviteClientPortalAction(values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const parsed = inviteClientPortalSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const { contact_id: contactId, email } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: contact } = await supabase
    .from("client_contacts")
    .select("id, client_id, name, profile_id")
    .eq("id", contactId)
    .maybeSingle();
  if (!contact) return fail("Kontak klien tidak ditemukan.");

  // The account exists: send a password link instead of a second invitation.
  if (contact.profile_id) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: PORTAL_REDIRECT,
    });
    if (error) return fail("Tautan masuk gagal dikirim. Coba lagi beberapa saat lagi.");

    await supabase
      .from("client_contacts")
      .update({ portal_invited_at: new Date().toISOString() })
      .eq("id", contactId);

    await logActivity(supabase, {
      actorId: session.user.id,
      entityType: "client_contact",
      entityId: contactId,
      action: "portal_invite",
      details: { client_id: contact.client_id, email, resent: true },
    });

    revalidatePath(`/clients/${contact.client_id}`);
    return ok(`Tautan masuk dikirim ulang ke ${email}.`);
  }

  const admin = createSupabaseAdminClient();
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { full_name: contact.name, role: "client" },
    redirectTo: PORTAL_REDIRECT,
  });

  if (inviteError) {
    if (/already|exists|registered/i.test(inviteError.message)) {
      return fail("Email tersebut sudah dipakai akun lain.");
    }
    return fail(`Undangan gagal dikirim: ${inviteError.message}`);
  }

  const { error } = await supabase
    .from("client_contacts")
    .update({ profile_id: invited.user.id, portal_invited_at: new Date().toISOString(), email })
    .eq("id", contactId);
  if (error) {
    // The account exists but the link failed: remove it so a retry is clean.
    await admin.auth.admin.deleteUser(invited.user.id);
    return fail(dbRuleMessage(error, "Akun portal gagal ditautkan ke kontak."));
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "client_contact",
    entityId: contactId,
    action: "portal_invite",
    details: { client_id: contact.client_id, email, resent: false },
  });

  revalidatePath(`/clients/${contact.client_id}`);
  return ok(`Undangan portal dikirim ke ${email}.`);
}

/** FR-M14-01. Owner only, like every other access decision. */
export async function setClientPortalAccessAction(values: unknown): Promise<ActionResult> {
  const session = await requireRole("owner");
  const parsed = clientPortalAccessSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const { contact_id: contactId, is_active: isActive } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: contact } = await supabase
    .from("client_contacts")
    .select("id, client_id, profile_id")
    .eq("id", contactId)
    .maybeSingle();
  if (!contact?.profile_id) return fail("Kontak ini belum punya akun portal.");

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", contact.profile_id);
  if (error) return fail("Akses portal gagal diperbarui.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "client_contact",
    entityId: contactId,
    action: "portal_access",
    details: { client_id: contact.client_id, is_active: isActive },
  });

  revalidatePath(`/clients/${contact.client_id}`);
  return ok(isActive ? "Akses portal diaktifkan." : "Akses portal dicabut.");
}
