import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Role = Database["public"]["Enums"]["user_role"];

/**
 * Gives an invited account its real role (FR-M16-03).
 *
 * `inviteUserByEmail` can only write `user_metadata`, which the caller of a
 * public sign-up controls too, so `handle_new_user` ignores it and creates
 * every account as a `creator`. Right after the invitation the server stamps
 * the role into `app_metadata` (writable by the service role only) and onto
 * the profile. Callers delete the account when this fails, so a half-done
 * invitation never outlives the request.
 */
export async function assignInvitedRole(
  admin: SupabaseClient<Database>,
  userId: string,
  role: Role,
): Promise<{ error: string | null }> {
  const { error: authError } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role },
  });
  if (authError) return { error: authError.message };

  const { error: profileError } = await admin.from("profiles").update({ role }).eq("id", userId);
  if (profileError) return { error: profileError.message };

  return { error: null };
}
