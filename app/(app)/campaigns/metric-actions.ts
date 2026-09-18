"use server";

import { revalidatePath } from "next/cache";
import {
  PG_UNIQUE_VIOLATION,
  dbRuleMessage,
  fail,
  invalid,
  ok,
  type ActionResult,
} from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireSession } from "@/lib/auth/guards";
import { viewsWarnings, type ViewsWarning } from "@/lib/calculations/campaign-metrics";
import { METRIC_PROOF_BUCKET } from "@/lib/constants/metrics";
import { zonedInputToUtc } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidField } from "@/lib/validation/common";
import { registrantReportSchema, snapshotSchema } from "@/lib/validation/metrics";

/*
 * Metric snapshots and registrant reports (PRD M7). Rules are checked here for
 * clear messages and again by the triggers in 20260921000000_metrics.sql.
 */

function revalidateMetrics(campaignId: string) {
  revalidatePath(`/campaigns/${campaignId}/metrics`);
  revalidatePath("/dashboard");
}

/** Proof files are uploaded under the campaign's folder; reject any other path. */
function isOwnProofPath(campaignId: string, path: string | null): boolean {
  return !path || (path.startsWith(`${campaignId}/`) && !path.includes(".."));
}

const validIds = (...ids: string[]) => ids.every((id) => uuidField.safeParse(id).success);

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

async function removeProof(supabase: Supabase, path: string | null) {
  if (path) await supabase.storage.from(METRIC_PROOF_BUCKET).remove([path]);
}

/**
 * FR-M7-01, FR-M7-02. Saves the snapshot and returns any "views went down"
 * warnings; a drop is allowed (it can be real) but the team should look.
 */
export async function addSnapshotAction(
  campaignId: string,
  values: unknown,
): Promise<ActionResult<{ warnings: ViewsWarning[] }>> {
  const session = await requireSession();
  if (!validIds(campaignId)) return fail("ID kampanye tidak valid.");
  const parsed = snapshotSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  if (!isOwnProofPath(campaignId, parsed.data.proof_path)) return fail("Lokasi bukti tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: content } = await supabase
    .from("contents")
    .select(
      "id, posted_at, live_status, assignment:campaign_creators!inner(campaign_id), snapshots:metric_snapshots(id, checkpoint, captured_at, views, created_at)",
    )
    .eq("id", parsed.data.content_id)
    .eq("assignment.campaign_id", campaignId)
    .maybeSingle();
  if (!content) {
    await removeProof(supabase, parsed.data.proof_path);
    return fail("Konten tidak ditemukan di kampanye ini.");
  }
  if (!content.posted_at || content.live_status === "belum_tayang") {
    await removeProof(supabase, parsed.data.proof_path);
    return fail("Snapshot metrik hanya untuk konten yang sudah tayang.");
  }

  const capturedAt = zonedInputToUtc(parsed.data.captured_at, session.profile.timezone);
  if (new Date(capturedAt) < new Date(content.posted_at)) {
    await removeProof(supabase, parsed.data.proof_path);
    return {
      status: "error",
      message: "Waktu pengambilan snapshot tidak boleh sebelum waktu tayang.",
      fieldErrors: { captured_at: "Sebelum waktu tayang." },
    };
  }

  const { data: saved, error } = await supabase
    .from("metric_snapshots")
    .insert({ ...parsed.data, captured_at: capturedAt, entered_by: session.user.id })
    .select("id")
    .single();
  if (error) {
    await removeProof(supabase, parsed.data.proof_path);
    if (error.code === PG_UNIQUE_VIOLATION) {
      return {
        status: "error",
        message: "Checkpoint ini sudah memiliki snapshot. Pilih checkpoint lain atau Lainnya.",
        fieldErrors: { checkpoint: "Sudah ada snapshot." },
      };
    }
    return fail(dbRuleMessage(error, "Snapshot gagal disimpan."));
  }

  const warnings = viewsWarnings(content.snapshots, {
    captured_at: capturedAt,
    views: parsed.data.views,
  });

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "metric_snapshot",
    entityId: saved.id,
    action: "create",
    details: {
      campaign_id: campaignId,
      content_id: parsed.data.content_id,
      checkpoint: parsed.data.checkpoint,
      views: parsed.data.views,
      views_warning: warnings.length > 0,
    },
  });

  revalidateMetrics(campaignId);
  return ok("Snapshot disimpan.", { warnings });
}

/** Wrong entries are deleted and entered again; every delete is logged. */
export async function deleteSnapshotAction(
  campaignId: string,
  snapshotId: string,
): Promise<ActionResult> {
  const session = await requireSession();
  if (!validIds(campaignId, snapshotId)) return fail("ID tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: snapshot } = await supabase
    .from("metric_snapshots")
    .select(
      "id, checkpoint, views, proof_path, content:contents!inner(id, assignment:campaign_creators!inner(campaign_id))",
    )
    .eq("id", snapshotId)
    .eq("content.assignment.campaign_id", campaignId)
    .maybeSingle();
  if (!snapshot) return fail("Snapshot tidak ditemukan.");

  const { error } = await supabase.from("metric_snapshots").delete().eq("id", snapshotId);
  if (error) return fail(dbRuleMessage(error, "Snapshot gagal dihapus."));
  await removeProof(supabase, snapshot.proof_path);

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "metric_snapshot",
    entityId: snapshotId,
    action: "delete",
    details: {
      campaign_id: campaignId,
      content_id: snapshot.content.id,
      checkpoint: snapshot.checkpoint,
      views: snapshot.views,
    },
  });

  revalidateMetrics(campaignId);
  return ok("Snapshot dihapus.");
}

/** FR-M7-04: aggregate registrant numbers reported by the client. */
export async function addRegistrantReportAction(
  campaignId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireSession();
  if (!validIds(campaignId)) return fail("ID kampanye tidak valid.");
  const parsed = registrantReportSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  if (!isOwnProofPath(campaignId, parsed.data.proof_path)) return fail("Lokasi bukti tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: saved, error } = await supabase
    .from("registrant_reports")
    .insert({ ...parsed.data, campaign_id: campaignId, entered_by: session.user.id })
    .select("id")
    .single();
  if (error) {
    await removeProof(supabase, parsed.data.proof_path);
    return fail(dbRuleMessage(error, "Laporan pendaftar gagal disimpan."));
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "registrant_report",
    entityId: saved.id,
    action: "create",
    details: {
      campaign_id: campaignId,
      campaign_creator_id: parsed.data.campaign_creator_id,
      registrant_count: parsed.data.registrant_count,
      period: `${parsed.data.period_start}..${parsed.data.period_end}`,
    },
  });

  revalidateMetrics(campaignId);
  return ok("Laporan pendaftar disimpan.");
}

export async function deleteRegistrantReportAction(
  campaignId: string,
  reportId: string,
): Promise<ActionResult> {
  const session = await requireSession();
  if (!validIds(campaignId, reportId)) return fail("ID tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: report } = await supabase
    .from("registrant_reports")
    .select("id, registrant_count, proof_path")
    .eq("id", reportId)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (!report) return fail("Laporan tidak ditemukan.");

  const { error } = await supabase.from("registrant_reports").delete().eq("id", reportId);
  if (error) return fail(dbRuleMessage(error, "Laporan gagal dihapus."));
  await removeProof(supabase, report.proof_path);

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "registrant_report",
    entityId: reportId,
    action: "delete",
    details: { campaign_id: campaignId, registrant_count: report.registrant_count },
  });

  revalidateMetrics(campaignId);
  return ok("Laporan dihapus.");
}
