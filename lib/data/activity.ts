import "server-only";
import { addDays, format, parseISO } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { zonedInputToUtc } from "@/lib/format/date";
import type { ActivityListQuery } from "@/lib/validation/activity";
import { pageRange, totalPages, type Paged } from "./pagination";

export type ActivityLogRow = Database["public"]["Tables"]["activity_logs"]["Row"] & {
  actor: { full_name: string; role: Database["public"]["Enums"]["user_role"] } | null;
};

/**
 * FR-M11-02: the audit trail, newest first. Date filters are whole days in the
 * viewer's timezone, converted to UTC bounds. RLS limits reads to the owner.
 */
export async function listActivity(
  supabase: SupabaseClient<Database>,
  query: ActivityListQuery,
  timezone: string,
): Promise<Paged<ActivityLogRow>> {
  const { from, to } = pageRange(query.page);

  let request = supabase
    .from("activity_logs")
    .select("*, actor:profiles(full_name, role)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (query.entity_type) request = request.eq("entity_type", query.entity_type);
  if (query.action) request = request.eq("action", query.action);
  if (query.actor) request = request.eq("actor_id", query.actor);
  if (query.from)
    request = request.gte("created_at", zonedInputToUtc(`${query.from}T00:00`, timezone));
  if (query.to) {
    const nextDay = format(addDays(parseISO(query.to), 1), "yyyy-MM-dd");
    request = request.lt("created_at", zonedInputToUtc(`${nextDay}T00:00`, timezone));
  }

  const { data, count, error } = await request;
  if (error) throw new Error(error.message);

  return {
    rows: data as ActivityLogRow[],
    count: count ?? 0,
    page: query.page,
    totalPages: totalPages(count ?? 0),
  };
}

/** Team members for the actor filter. */
export async function listActivityActors(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name", { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}
