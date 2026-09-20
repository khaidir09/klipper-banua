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

/** The team. `creator` is a portal account (PRD M13), never an internal role. */
export const INTERNAL_ROLES = ["owner", "manager"] as const;
export type InternalRole = (typeof INTERNAL_ROLES)[number];

export function isInternalRole(role: UserRole): role is InternalRole {
  return (INTERNAL_ROLES as readonly UserRole[]).includes(role);
}

/** A signed-in creator, together with the creator record behind the account. */
export type CreatorSession = Session & { creatorId: string };

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

/** Guard for the internal app: creators belong in the portal (FR-M13-02). */
export async function requireInternal(): Promise<Session> {
  const session = await requireSession();

  if (!isInternalRole(session.profile.role)) {
    redirect("/portal");
  }

  return session;
}

/** Server-side role check. UI state alone is never enough (see CLAUDE.md). */
export async function requireRole(...roles: InternalRole[]): Promise<Session> {
  const session = await requireInternal();

  if (!roles.includes(session.profile.role as InternalRole)) {
    redirect("/dashboard?akses=ditolak");
  }

  return session;
}

/**
 * Guard for every route inside the `(portal)` group (FR-M13-02). The creator
 * id comes from `creator_portal_profile`, the same view the portal reads
 * everything else from, so a revoked or blocked account never gets past here.
 */
export async function requireCreator(): Promise<CreatorSession> {
  const session = await requireSession();

  if (isInternalRole(session.profile.role)) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("creator_portal_profile").select("id").maybeSingle();

  if (!data?.id) {
    redirect("/keluar?alasan=portal");
  }

  return { ...session, creatorId: data.id };
}

export function isOwner(profile: Profile): boolean {
  return profile.role === "owner";
}
