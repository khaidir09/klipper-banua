import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { totalRegistrants, totalViews } from "@/lib/calculations/campaign-metrics";
import type { CampaignListQuery } from "@/lib/validation/campaigns";
import { escapeLike, pageRange, totalPages, type Paged } from "./pagination";

export type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
export type CampaignAssetRow = Database["public"]["Tables"]["campaign_assets"]["Row"];
export type AssignmentRow = Database["public"]["Tables"]["campaign_creators"]["Row"];
type CreatorRow = Database["public"]["Tables"]["creators"]["Row"];

export const CAMPAIGN_ASSET_BUCKET = "campaign-assets";
const SIGNED_URL_SECONDS = 60;

export type CampaignListItem = CampaignRow & {
  client: { id: string; name: string } | null;
  assignments: { count: number }[];
};

export async function listCampaigns(
  supabase: SupabaseClient<Database>,
  query: CampaignListQuery,
): Promise<Paged<CampaignListItem>> {
  const { from, to } = pageRange(query.page);

  let request = supabase
    .from("campaigns")
    .select("*, client:clients(id, name), assignments:campaign_creators(count)", {
      count: "exact",
    })
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query.q) {
    const term = `%${escapeLike(query.q)}%`;
    request = request.or(`name.ilike.${term},code.ilike.${term}`);
  }
  if (query.status) request = request.eq("status", query.status);
  if (query.client_id) request = request.eq("client_id", query.client_id);

  const { data, count, error } = await request;
  if (error) throw new Error(error.message);

  return {
    rows: data as unknown as CampaignListItem[],
    count: count ?? 0,
    page: query.page,
    totalPages: totalPages(count ?? 0),
  };
}

export type CampaignDetail = CampaignRow & {
  client: { id: string; name: string; type: Database["public"]["Enums"]["client_type"] } | null;
};

export async function getCampaign(
  supabase: SupabaseClient<Database>,
  id: string,
): Promise<CampaignDetail | null> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*, client:clients(id, name, type)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    // An invalid UUID in the URL is a "not found", not a crash.
    if (error.code === "22P02") return null;
    throw new Error(error.message);
  }
  return data as CampaignDetail | null;
}

export type AssignmentWithCreator = AssignmentRow & {
  creator: Pick<CreatorRow, "id" | "full_name" | "stage_name" | "phone_wa" | "status"> | null;
};

export async function listAssignments(
  supabase: SupabaseClient<Database>,
  campaignId: string,
): Promise<AssignmentWithCreator[]> {
  const { data, error } = await supabase
    .from("campaign_creators")
    .select("*, creator:creators(id, full_name, stage_name, phone_wa, status)")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data as AssignmentWithCreator[];
}

/** Creators that may be added (FR-M5-01): verified or active, not yet assigned. */
export async function listAssignableCreators(
  supabase: SupabaseClient<Database>,
  campaignId: string,
) {
  const [{ data: creators, error }, { data: assigned, error: assignedError }] = await Promise.all([
    supabase
      .from("creators")
      .select("id, full_name, stage_name, city, tier")
      .in("status", ["terverifikasi", "aktif"])
      .order("full_name", { ascending: true }),
    supabase.from("campaign_creators").select("creator_id").eq("campaign_id", campaignId),
  ]);

  if (error) throw new Error(error.message);
  if (assignedError) throw new Error(assignedError.message);

  const taken = new Set(assigned.map((row) => row.creator_id));
  return creators.filter((creator) => !taken.has(creator.id));
}

export async function listAssets(
  supabase: SupabaseClient<Database>,
  campaignId: string,
): Promise<(CampaignAssetRow & { signed_url: string | null })[]> {
  const { data, error } = await supabase
    .from("campaign_assets")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);

  return Promise.all(
    data.map(async (asset) => {
      if (!asset.file_path) return { ...asset, signed_url: null };
      const { data: signed } = await supabase.storage
        .from(CAMPAIGN_ASSET_BUCKET)
        .createSignedUrl(asset.file_path, SIGNED_URL_SECONDS, { download: true });
      return { ...asset, signed_url: signed?.signedUrl ?? null };
    }),
  );
}

/** FR-M2-03: campaign history on the client page. */
export async function listClientCampaigns(supabase: SupabaseClient<Database>, clientId: string) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, code, name, status, start_date, end_date, package_price")
    .eq("client_id", clientId)
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/** Campaign history on the creator page (FR-M3-08; totals arrive in later phases). */
export async function listCreatorAssignments(
  supabase: SupabaseClient<Database>,
  creatorId: string,
) {
  const { data, error } = await supabase
    .from("campaign_creators")
    .select(
      `id, status, contents_committed, referral_code,
       campaign:campaigns(id, code, name, status, start_date, end_date),
       contents(posted_at, snapshots:metric_snapshots(checkpoint, captured_at, created_at, views)),
       reports:registrant_reports(registrant_count),
       payout:payouts(status, total_amount)`,
    )
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  // FR-M3-08 totals per assignment, using the same rules as the Metrics tab.
  return data.map(({ contents, reports, payout, ...assignment }) => ({
    ...assignment,
    views: totalViews(
      contents.map((c) => ({ posted: c.posted_at !== null, snapshots: c.snapshots })),
    ),
    registrants: totalRegistrants(reports),
    payout: payout ? { status: payout.status, total_amount: payout.total_amount } : null,
  }));
}

/** Active clients for the campaign form's select box. */
export async function listClientOptions(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name")
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}
