import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";

export type ActivityEntityType =
  | "profile"
  | "client"
  | "client_contact"
  | "creator"
  | "creator_social_account"
  | "creator_bank_account"
  | "campaign"
  | "campaign_asset"
  | "campaign_creator";

export type ActivityAction =
  | "create"
  | "update"
  | "delete"
  | "invite"
  | "role_change"
  | "activate"
  | "deactivate"
  | "verify"
  | "terms_recorded"
  | "bank_account_viewed"
  | "status_change";

type LogInput = {
  actorId: string;
  entityType: ActivityEntityType;
  entityId: string | null;
  action: ActivityAction;
  details?: Record<string, Json | undefined>;
};

/**
 * Appends one audit entry (FR-M11-01). Runs with the caller's session so
 * RLS guarantees `actor_id` is the signed-in member. Failures are reported to
 * the server log but never break the user's action.
 */
export async function logActivity(supabase: SupabaseClient<Database>, input: LogInput) {
  const details: Record<string, Json> = {};
  for (const [key, value] of Object.entries(input.details ?? {})) {
    if (value !== undefined) details[key] = value;
  }

  const { error } = await supabase.from("activity_logs").insert({
    actor_id: input.actorId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    details,
  });

  if (error) {
    console.error(`activity log failed (${input.entityType}/${input.action}):`, error.message);
  }
}
