import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/app-url";
import { listClipQueue } from "@/lib/data/clips";
import { getDueSnapshotItems } from "@/lib/data/dashboard";
import { countOpenWithdrawals } from "@/lib/data/withdrawals";
import { serverEnv } from "@/lib/env.server";
import { buildDueSnapshotReminder } from "@/lib/reminders/due-snapshots";
import { secretsEqual } from "@/lib/share/token";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Daily due-snapshot reminder for n8n (FR-M10-05).
 *
 * n8n calls this over the internal Docker network with
 * `Authorization: Bearer <REMINDER_API_TOKEN>` and forwards `text` to the
 * owner's Telegram chat when `count` > 0. The reverse proxy blocks the path
 * from the internet; the token is the second line of defence. There is no
 * user session, so the query runs with the service role and returns only the
 * fields the message needs.
 */
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };

export async function GET(request: NextRequest) {
  const env = serverEnv();
  if (!env.REMINDER_API_TOKEN) {
    return NextResponse.json({ error: "reminder disabled" }, { status: 503, headers: NO_STORE });
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
  if (!token || !secretsEqual(token, env.REMINDER_API_TOKEN)) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { ...NO_STORE, "WWW-Authenticate": "Bearer" } },
    );
  }

  const now = new Date();
  const timezone = env.DEFAULT_TIMEZONE;
  const admin = createSupabaseAdminClient();
  // FR-M10-05 (v4.0): clips waiting > 24 hours and open withdrawals, as counts only.
  const [due, clipQueue, openWithdrawals] = await Promise.all([
    getDueSnapshotItems(admin, now, timezone),
    listClipQueue(admin, now),
    countOpenWithdrawals(admin),
  ]);
  const queues = {
    overdueClips: clipQueue.clips.filter((item) => item.overdue).length,
    openWithdrawals,
  };

  const items = due.map((item) => ({
    campaignCode: item.campaign.code,
    campaignName: item.campaign.name,
    stageName: item.stageName,
    platform: item.platform,
    checkpoint: item.checkpoint,
    dueDate: item.dueDate,
    daysOverdue: item.daysOverdue,
  }));
  const reminder = buildDueSnapshotReminder(items, {
    now,
    timezone,
    dashboardUrl: appUrl("/dashboard").toString(),
    queues,
  });

  return NextResponse.json(
    {
      generatedAt: now.toISOString(),
      timezone,
      count: reminder.count,
      text: reminder.text,
      items,
      queues,
    },
    { headers: NO_STORE },
  );
}
