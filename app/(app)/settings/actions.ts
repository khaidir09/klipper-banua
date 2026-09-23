"use server";

import { revalidatePath } from "next/cache";
import { fail, invalid, ok, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireRole, requireSession } from "@/lib/auth/guards";
import { assignInvitedRole } from "@/lib/auth/invite-role";
import { countActiveOwners } from "@/lib/data/users";
import { publicEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  inviteUserSchema,
  profileSchema,
  setUserActiveSchema,
  updateUserRoleSchema,
} from "@/lib/validation/users";

/** FR-M1-02: owner invites a member by email; Supabase sends the link. */
export async function inviteUserAction(values: unknown): Promise<ActionResult> {
  const session = await requireRole("owner");
  const parsed = inviteUserSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { full_name: parsed.data.full_name },
    redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/atur-sandi`,
  });

  if (error) {
    if (/already|exists|registered/i.test(error.message)) {
      return fail("Email tersebut sudah terdaftar sebagai pengguna.");
    }
    return fail(`Undangan gagal dikirim: ${error.message}`);
  }

  const { error: roleError } = await assignInvitedRole(admin, data.user.id, parsed.data.role);
  if (roleError) {
    // Never leave an account behind with a role nobody chose.
    await admin.auth.admin.deleteUser(data.user.id);
    return fail("Undangan gagal disiapkan. Coba lagi.");
  }

  const supabase = await createSupabaseServerClient();
  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "profile",
    entityId: data.user.id,
    action: "invite",
    details: { email: parsed.data.email, role: parsed.data.role },
  });

  revalidatePath("/settings/users");
  return ok(`Undangan dikirim ke ${parsed.data.email}.`);
}

export async function updateUserRoleAction(values: unknown): Promise<ActionResult> {
  const session = await requireRole("owner");
  const parsed = updateUserRoleSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  if (parsed.data.user_id === session.user.id) {
    return fail("Anda tidak dapat mengubah peran sendiri.");
  }

  const supabase = await createSupabaseServerClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("role, is_active")
    .eq("id", parsed.data.user_id)
    .maybeSingle();
  if (!target) return fail("Pengguna tidak ditemukan.");

  if (target.role === "owner" && parsed.data.role !== "owner" && target.is_active) {
    if ((await countActiveOwners(supabase)) <= 1) {
      return fail("Harus tersisa minimal satu owner aktif.");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.user_id);
  if (error) return fail("Peran gagal diperbarui.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "profile",
    entityId: parsed.data.user_id,
    action: "role_change",
    details: { from: target.role, to: parsed.data.role },
  });

  revalidatePath("/settings/users");
  return ok("Peran diperbarui.");
}

export async function setUserActiveAction(values: unknown): Promise<ActionResult> {
  const session = await requireRole("owner");
  const parsed = setUserActiveSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  if (parsed.data.user_id === session.user.id) {
    return fail("Anda tidak dapat menonaktifkan akun sendiri.");
  }

  const supabase = await createSupabaseServerClient();

  const { data: target } = await supabase
    .from("profiles")
    .select("role, is_active, email")
    .eq("id", parsed.data.user_id)
    .maybeSingle();
  if (!target) return fail("Pengguna tidak ditemukan.");

  if (!parsed.data.is_active && target.role === "owner" && target.is_active) {
    if ((await countActiveOwners(supabase)) <= 1) {
      return fail("Harus tersisa minimal satu owner aktif.");
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: parsed.data.is_active })
    .eq("id", parsed.data.user_id);
  if (error) return fail("Status pengguna gagal diperbarui.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "profile",
    entityId: parsed.data.user_id,
    action: parsed.data.is_active ? "activate" : "deactivate",
    details: { email: target.email },
  });

  revalidatePath("/settings/users");
  return ok(parsed.data.is_active ? "Pengguna diaktifkan." : "Pengguna dinonaktifkan.");
}

/** Members edit their own name and display timezone. */
export async function updateProfileAction(values: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, timezone: parsed.data.timezone })
    .eq("id", session.user.id);
  if (error) return fail("Profil gagal disimpan.");

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "profile",
    entityId: session.user.id,
    action: "update",
    details: { fields: ["full_name", "timezone"] },
  });

  revalidatePath("/", "layout");
  return ok("Profil disimpan.");
}
