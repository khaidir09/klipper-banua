import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { CAMPAIGN_ASSET_BUCKET } from "./campaigns";

/**
 * Reads for the creator portal (PRD M13). Everything here goes through the
 * `creator_portal_*` views, which filter on the signed-in creator and carry
 * whitelisted columns only: no package price, no targets, no margin, no data
 * belonging to another creator.
 */

/**
 * Postgres cannot prove nullability through a view, so every generated view
 * column is `T | null`. The base columns are NOT NULL, so this narrows them
 * back and keeps `K` — the ones that really are optional — nullable.
 */
type NonNullableExcept<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]-?: NonNullable<T[P]>;
} & { [P in K]: T[P] };

type ProfileView = Database["public"]["Views"]["creator_portal_profile"]["Row"];
type AssignmentView = Database["public"]["Views"]["creator_portal_assignments"]["Row"];
type AssetView = Database["public"]["Views"]["creator_portal_assets"]["Row"];

export type PortalProfile = NonNullableExcept<
  ProfileView,
  "terms_version" | "terms_agreed_at" | "portal_invited_at"
>;
export type PortalAssignment = NonNullableExcept<
  AssignmentView,
  "landing_url" | "joined_at" | "views_bonus_cap"
>;
export type PortalAsset = NonNullableExcept<AssetView, "file_path" | "external_url">;

const SIGNED_URL_SECONDS = 60;

export async function getPortalProfile(
  supabase: SupabaseClient<Database>,
): Promise<PortalProfile | null> {
  const { data, error } = await supabase.from("creator_portal_profile").select("*").maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data as PortalProfile) : null;
}

/** FR-M13-03. Running campaigns first, then the finished ones. */
export async function listPortalAssignments(
  supabase: SupabaseClient<Database>,
): Promise<PortalAssignment[]> {
  const { data, error } = await supabase
    .from("creator_portal_assignments")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data as PortalAssignment[];
  const running = rows.filter((row) => row.campaign_status === "aktif");
  const finished = rows.filter((row) => row.campaign_status !== "aktif");
  return [...running, ...finished];
}

export async function getPortalAssignment(
  supabase: SupabaseClient<Database>,
  assignmentId: string,
): Promise<PortalAssignment | null> {
  const { data, error } = await supabase
    .from("creator_portal_assignments")
    .select("*")
    .eq("id", assignmentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? (data as PortalAssignment) : null;
}

/** FR-M13-04. Signed URLs are short-lived and only work for assigned campaigns. */
export async function listPortalAssets(
  supabase: SupabaseClient<Database>,
  campaignId: string,
): Promise<(PortalAsset & { signed_url: string | null })[]> {
  const { data, error } = await supabase
    .from("creator_portal_assets")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return Promise.all(
    (data as PortalAsset[]).map(async (asset) => {
      if (!asset.file_path) return { ...asset, signed_url: null };
      const { data: signed } = await supabase.storage
        .from(CAMPAIGN_ASSET_BUCKET)
        .createSignedUrl(asset.file_path, SIGNED_URL_SECONDS, { download: true });
      return { ...asset, signed_url: signed?.signedUrl ?? null };
    }),
  );
}
