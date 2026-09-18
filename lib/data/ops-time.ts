import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/** FR-M12-01: time entries of a campaign, newest work day first. */
export async function listOpsTimeLogs(supabase: SupabaseClient<Database>, campaignId: string) {
  const { data, error } = await supabase
    .from("ops_time_logs")
    .select("id, user_id, activity, minutes, log_date, notes, created_at, user:profiles(full_name)")
    .eq("campaign_id", campaignId)
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data.map(({ user, ...entry }) => ({ ...entry, userName: user?.full_name ?? null }));
}

export type OpsTimeLogView = Awaited<ReturnType<typeof listOpsTimeLogs>>[number];
