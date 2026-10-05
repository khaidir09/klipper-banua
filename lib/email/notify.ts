import "server-only";
import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { appUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email/send";
import {
  clipDecisionEmail,
  viewsUpdateEmail,
  withdrawalPaidEmail,
  type ClipDecisionEmail,
  type EmailMessage,
  type ViewsUpdateEmail,
} from "@/lib/email/templates";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/*
 * Kliper notification emails (FR-M18-09, FR-M19-09), sent after the
 * response so the team never waits on SMTP. Callers pass the session client
 * of the internal member who made the decision; it can read `creators`.
 */

type Supabase = SupabaseClient<Database>;
type Recipient = { email: string; name: string };
type Details<T> = Omit<T, "appName" | "recipientName" | "actionUrl">;

async function loadRecipient(supabase: Supabase, creatorId: string): Promise<Recipient | null> {
  const { data, error } = await supabase
    .from("creators")
    .select("email, full_name, stage_name, anonymized_at")
    .eq("id", creatorId)
    .maybeSingle();
  if (error) {
    console.error("notification email: creator lookup failed:", error.message);
    return null;
  }
  if (!data || data.anonymized_at || !data.email.trim()) return null;
  return { email: data.email.trim(), name: data.stage_name.trim() || data.full_name };
}

function notifyCreator(
  supabase: Supabase,
  creatorId: string,
  path: string,
  build: (common: { appName: string; recipientName: string; actionUrl: string }) => EmailMessage,
) {
  after(async () => {
    const recipient = await loadRecipient(supabase, creatorId);
    if (!recipient) return;
    const message = build({
      appName: publicEnv.NEXT_PUBLIC_APP_NAME,
      recipientName: recipient.name,
      actionUrl: appUrl(path).toString(),
    });
    await sendEmail(recipient.email, message);
  });
}

export function notifyClipDecision(
  supabase: Supabase,
  creatorId: string,
  details: Details<ClipDecisionEmail>,
) {
  notifyCreator(supabase, creatorId, "/portal/klip", (common) =>
    clipDecisionEmail({ ...common, ...details }),
  );
}

export function notifyViewsUpdate(
  supabase: Supabase,
  creatorId: string,
  details: Details<ViewsUpdateEmail>,
) {
  notifyCreator(supabase, creatorId, "/portal/klip", (common) =>
    viewsUpdateEmail({ ...common, ...details }),
  );
}

/** FR-M19-09: reads the paid withdrawal itself, so only its id is needed. */
export function notifyWithdrawalPaid(supabase: Supabase, withdrawalId: string) {
  after(async () => {
    const { data, error } = await supabase
      .from("withdrawals")
      .select("creator_id, amount, transfer_fee, paid_at, status")
      .eq("id", withdrawalId)
      .maybeSingle();
    if (error) {
      console.error("notification email: withdrawal lookup failed:", error.message);
      return;
    }
    if (!data || data.status !== "dibayar" || !data.paid_at) return;

    const recipient = await loadRecipient(supabase, data.creator_id);
    if (!recipient) return;
    await sendEmail(
      recipient.email,
      withdrawalPaidEmail({
        appName: publicEnv.NEXT_PUBLIC_APP_NAME,
        recipientName: recipient.name,
        actionUrl: appUrl("/portal/saldo").toString(),
        amount: Number(data.amount),
        transferFee: Number(data.transfer_fee),
        paidAt: data.paid_at,
      }),
    );
  });
}
