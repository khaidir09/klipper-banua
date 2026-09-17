import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type UserRole = Database["public"]["Enums"]["user_role"];

export type Session = {
  user: User;
  profile: Profile;
};

/** Returns the signed-in member, or null. Does not redirect. */
export async function getSession(): Promise<Session | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) return null;

  return { user, profile };
}

/**
 * Guard for every route inside the `(app)` group (FR-M1-03). Deactivated
 * members are signed out through `/keluar`, which can clear the auth cookies.
 */
export async function requireSession(): Promise<Session> {
  const session = await getSession();

  if (!session) {
    redirect("/keluar?alasan=sesi");
  }

  if (!session.profile.is_active) {
    redirect("/keluar?alasan=nonaktif");
  }

  return session;
}

/** Server-side role check. UI state alone is never enough (see CLAUDE.md). */
export async function requireRole(...roles: UserRole[]): Promise<Session> {
  const session = await requireSession();

  if (!roles.includes(session.profile.role)) {
    redirect("/dashboard?akses=ditolak");
  }

  return session;
}

export function isOwner(profile: Profile): boolean {
  return profile.role === "owner";
}
