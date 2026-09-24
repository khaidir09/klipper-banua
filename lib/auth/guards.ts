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

/**
 * A creator account that may be blocked (FR-M3-09): it can still open the
 * portal to read its status and frozen balance, and nothing else.
 */
export type CreatorAccountSession = Session & {
  creatorId: string;
  blocked: boolean;
  blockedReason: string | null;
};

/** The only portal page a blocked klipper can open. */
export const BLOCKED_CREATOR_HOME = "/portal/saldo";

/** A signed-in client contact, together with the institution behind them. */
export type ClientSession = Session & { clientId: string };

/** Where a signed-in account belongs (FR-M13-02, FR-M14-02). */
export function homePathFor(role: UserRole): string {
  if (role === "creator") return "/portal";
  if (role === "client") return "/klien";
  return "/dashboard";
}

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

/** Guard for the internal app: portal accounts belong in their own area. */
export async function requireInternal(): Promise<Session> {
  const session = await requireSession();

  if (!isInternalRole(session.profile.role)) {
    redirect(homePathFor(session.profile.role));
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

  if (session.profile.role !== "creator") {
    redirect(homePathFor(session.profile.role));
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("creator_portal_profile").select("id").maybeSingle();

  if (!data?.id) {
    // A blocked klipper keeps read access to their balance (FR-M3-09).
    const { data: account } = await supabase
      .from("creator_portal_account")
      .select("status")
      .maybeSingle();
    if (account?.status === "diblokir") redirect(BLOCKED_CREATOR_HOME);
    redirect("/keluar?alasan=portal");
  }

  return { ...session, creatorId: data.id };
}

/**
 * Guard for the portal shell and the balance page: lets a blocked klipper in
 * (FR-M3-09). Every other portal page keeps `requireCreator`, and every write
 * path in the database still refuses a blocked account.
 */
export async function requireCreatorAccount(): Promise<CreatorAccountSession> {
  const session = await requireSession();

  if (session.profile.role !== "creator") {
    redirect(homePathFor(session.profile.role));
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("creator_portal_account")
    .select("id, status, blocked_reason")
    .maybeSingle();

  if (!data?.id) {
    redirect("/keluar?alasan=portal");
  }

  return {
    ...session,
    creatorId: data.id,
    blocked: data.status === "diblokir",
    blockedReason: data.blocked_reason,
  };
}

/**
 * Guard for every route inside the `(client)` group (FR-M14-02). The client
 * id comes from `current_client_id()`, the same helper the portal views
 * filter on, so a revoked account never gets past here.
 */
export async function requireClient(): Promise<ClientSession> {
  const session = await requireSession();

  if (session.profile.role !== "client") {
    redirect(homePathFor(session.profile.role));
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("current_client_id");

  if (!data) {
    redirect("/keluar?alasan=portal");
  }

  return { ...session, clientId: data };
}

export function isOwner(profile: Profile): boolean {
  return profile.role === "owner";
}
