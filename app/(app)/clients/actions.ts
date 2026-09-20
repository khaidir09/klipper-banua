"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { PG_FOREIGN_KEY_VIOLATION, fail, invalid, ok, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireInternal, requireRole } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientContactSchema, clientSchema } from "@/lib/validation/clients";
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
