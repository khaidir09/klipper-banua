import { NextResponse } from "next/server";
import { getSession, isInternalRole } from "@/lib/auth/guards";
import { getCampaign } from "@/lib/data/campaigns";
import { getCampaignReport } from "@/lib/data/report";
import { csvFileName } from "@/lib/export/csv";
import { contentsCsv, creatorsCsv } from "@/lib/export/report-csv";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * FR-M9-04: CSV downloads for signed-in members, built from the same finance-
 * free report model as the printout. `kind` is `konten` or `kreator`.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; kind: string }> },
) {
  const { id, kind } = await params;
  if (kind !== "konten" && kind !== "kreator") {
    return new NextResponse("Not found", { status: 404 });
  }

  const session = await getSession();
  if (!session?.profile.is_active || !isInternalRole(session.profile.role)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = await createSupabaseServerClient();
  const campaign = await getCampaign(supabase, id);
  if (!campaign) return new NextResponse("Not found", { status: 404 });

  const report = await getCampaignReport(supabase, campaign);
  const body =
    kind === "konten" ? contentsCsv(report, session.profile.timezone) : creatorsCsv(report);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${csvFileName(campaign.code, kind)}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
