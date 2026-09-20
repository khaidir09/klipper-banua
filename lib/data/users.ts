import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { INTERNAL_ROLES } from "@/lib/auth/guards";
import type { Database } from "@/types/database";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Every internal member, owners first. Visible to owners only through RLS.
 * Creator portal accounts are managed on the creator page, not here (M13).
 */
export async function listProfiles(supabase: SupabaseClient<Database>): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", INTERNAL_ROLES)
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function countActiveOwners(supabase: SupabaseClient<Database>): Promise<number> {
  const { count, error } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner")
    .eq("is_active", true);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
