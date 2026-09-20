import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CreatorListQuery } from "@/lib/validation/creators";
import { escapeLike, pageRange, totalPages, type Paged } from "./pagination";

export type CreatorRow = Database["public"]["Tables"]["creators"]["Row"];
export type SocialAccountRow = Database["public"]["Tables"]["creator_social_accounts"]["Row"];
export type BankAccountRow = Database["public"]["Tables"]["creator_bank_accounts"]["Row"];

export type CreatorListItem = CreatorRow & {
  social_accounts: Pick<
    SocialAccountRow,
    "platform" | "handle" | "followers_count" | "kalimantan_audience_pct"
  >[];
};

export const AUDIENCE_PROOF_BUCKET = "audience-proofs";
const SIGNED_URL_SECONDS = 60;

/** FR-M3-07: server-side filtering and pagination. */
export async function listCreators(
  supabase: SupabaseClient<Database>,
  query: CreatorListQuery,
): Promise<Paged<CreatorListItem>> {
  const { from, to } = pageRange(query.page);

  // Platform and audience filters live on the social accounts, so those two
  // need an inner join; otherwise creators without accounts must still show.
  const needsInner = Boolean(query.platform) || query.min_pct !== undefined;
  const relation = needsInner
    ? "social_accounts:creator_social_accounts!inner(platform, handle, followers_count, kalimantan_audience_pct)"
    : "social_accounts:creator_social_accounts(platform, handle, followers_count, kalimantan_audience_pct)";

  let request = supabase
    .from("creators")
    .select(`*, ${relation}`, { count: "exact" })
    .order("full_name", { ascending: true })
    .range(from, to);

  if (query.q) {
    const term = `%${escapeLike(query.q)}%`;
    request = request.or(`full_name.ilike.${term},stage_name.ilike.${term}`);
  }
  if (query.province) request = request.eq("province", query.province);
  if (query.city) request = request.ilike("city", `%${escapeLike(query.city)}%`);
  if (query.niche) request = request.contains("niches", [query.niche]);
  if (query.tier) request = request.eq("tier", query.tier);
  if (query.status) request = request.eq("status", query.status);
  if (query.platform) request = request.eq("social_accounts.platform", query.platform);
  if (query.min_pct !== undefined) {
    request = request.gte("social_accounts.kalimantan_audience_pct", query.min_pct);
  }

  const { data, count, error } = await request;
  if (error) throw new Error(error.message);

  return {
    rows: data as unknown as CreatorListItem[],
    count: count ?? 0,
    page: query.page,
    totalPages: totalPages(count ?? 0),
  };
}

export type CreatorDetail = CreatorRow & {
  social_accounts: SocialAccountRow[];
};

export async function getCreator(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<CreatorDetail | null> {
  const { data, error } = await supabase
    .from("creators")
    .select("*, social_accounts:creator_social_accounts(*)")
    .eq("id", id)
    .order("platform", { referencedTable: "creator_social_accounts", ascending: true })
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export type PortalAccount = { id: string; email: string; is_active: boolean };

/** FR-M13-01: the portal account linked to a creator, when there is one. */
export async function getPortalAccount(
  supabase: SupabaseClient<Database>,
  profileId: string | null,
): Promise<PortalAccount | null> {
  if (!profileId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, is_active")
    .eq("id", profileId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/** Managers get the masked view through a security-definer function. */
export async function getMaskedBankAccount(supabase: SupabaseClient<Database>, creatorId: string) {
  const { data, error } = await supabase.rpc("get_masked_bank_account", {
    p_creator_id: creatorId,
  });
  if (error) throw new Error(error.message);
  return data[0] ?? null;
}

/** Short-lived URL for a private proof image; null when the file is missing. */
export async function signProofUrl(
  supabase: SupabaseClient<Database>,
  path: string | null,
): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage
    .from(AUDIENCE_PROOF_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  return data?.signedUrl ?? null;
}
