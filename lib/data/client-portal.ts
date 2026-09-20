import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Reads for the client portal (PRD M14). Everything goes through the
 * `client_portal_*` views, which filter on the signed-in client and carry
 * whitelisted columns only: no package price, no fee scheme, no payouts, and
 * creators by stage name.
 */

/**
 * Postgres cannot prove nullability through a view, so every generated view
 * column is `T | null`. The base columns are NOT NULL, so this narrows them
 * back and keeps `K` — the ones that really are optional — nullable.
 */
type NonNullableExcept<T, K extends keyof T> = {
  [P in Exclude<keyof T, K>]-?: NonNullable<T[P]>;
} & { [P in K]: T[P] };

type CampaignView = Database["public"]["Views"]["client_portal_campaigns"]["Row"];
type ContentView = Database["public"]["Views"]["client_portal_contents"]["Row"];
type CreatorView = Database["public"]["Views"]["client_portal_creators"]["Row"];
type MetricView = Database["public"]["Views"]["client_portal_metrics"]["Row"];

export type ClientCampaign = NonNullableExcept<CampaignView, never>;
export type ClientContent = NonNullableExcept<
  ContentView,
  "posted_url" | "posted_at" | "removed_at" | "creator_name"
>;
export type ClientCreator = NonNullableExcept<CreatorView, "creator_name">;
export type ClientMetric = NonNullableExcept<MetricView, never>;

/** FR-M14-03: the campaigns of the signed-in client, running ones first. */
export async function listClientCampaigns(
  supabase: SupabaseClient<Database>,
): Promise<ClientCampaign[]> {
  const { data, error } = await supabase
    .from("client_portal_campaigns")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data as ClientCampaign[];
  const running = rows.filter((row) => row.status === "aktif");
  const finished = rows.filter((row) => row.status !== "aktif");
  return [...running, ...finished];
}

export async function getClientCampaign(
  supabase: SupabaseClient<Database>,
  campaignId: string,
): Promise<ClientCampaign | null> {
  const { data, error } = await supabase
    .from("client_portal_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? (data as ClientCampaign) : null;
}

/** Live content of one campaign, newest first. */
export async function listClientContents(
  supabase: SupabaseClient<Database>,
  campaignId: string,
): Promise<ClientContent[]> {
  const { data, error } = await supabase
    .from("client_portal_contents")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("posted_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as ClientContent[];
}

/**
 * Per-creator recap (stage name and referral code). Without a campaign id it
 * returns every campaign of the client, which the overview page sums up.
 */
export async function listClientCreators(
  supabase: SupabaseClient<Database>,
  campaignId?: string,
): Promise<ClientCreator[]> {
  let request = supabase.from("client_portal_creators").select("*");
  if (campaignId) request = request.eq("campaign_id", campaignId);

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data as ClientCreator[];
}

/** Verified snapshots behind the chart and the totals. */
export async function listClientMetrics(
  supabase: SupabaseClient<Database>,
  campaignId?: string,
): Promise<ClientMetric[]> {
  let request = supabase
    .from("client_portal_metrics")
    .select("*")
    .order("captured_at", { ascending: true });
  if (campaignId) request = request.eq("campaign_id", campaignId);

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data as ClientMetric[];
}

/**
 * Turns snapshot rows into the shape `lib/calculations/campaign-metrics.ts`
 * expects: one entry per content, so `totalViews` can take the latest
 * snapshot of each.
 */
export function contentsFromMetrics(metrics: ClientMetric[]) {
  const byContent = new Map<string, { posted: true; snapshots: ClientMetric[] }>();
  for (const metric of metrics) {
    const entry = byContent.get(metric.content_id);
    if (entry) entry.snapshots.push(metric);
    else byContent.set(metric.content_id, { posted: true, snapshots: [metric] });
  }
  return [...byContent.values()];
}
