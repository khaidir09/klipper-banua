import { NextResponse, type NextRequest } from "next/server";
import { logActivity } from "@/lib/activity/log";
import { getSession } from "@/lib/auth/guards";
import { listWithdrawals } from "@/lib/data/withdrawals";
import { withdrawalsCsv } from "@/lib/export/withdrawals-csv";
import { resolveTimezone } from "@/lib/format/timezone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { withdrawalListQuerySchema } from "@/lib/validation/withdrawals";
import { periodBounds } from "../period";

/**
 * FR-M19-08: the filtered withdrawals as CSV for a manual bulk transfer.
 * Owner only; the file carries full account numbers.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session?.profile.is_active || session.profile.role !== "owner") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const query = withdrawalListQuerySchema.parse(Object.fromEntries(request.nextUrl.searchParams));
  const timezone = resolveTimezone(session.profile.timezone);
  const supabase = await createSupabaseServerClient();
  const rows = await listWithdrawals(supabase, query, periodBounds(query, timezone));
  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "withdrawal",
    entityId: null,
    action: "bank_account_viewed",
    details: { export: "csv", status: query.status, rows: rows.length },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(withdrawalsCsv(rows, timezone), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="penarikan-${query.status}-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
