"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { dbRuleMessage, fail, invalid, ok, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireCreator } from "@/lib/auth/guards";
import { CONTENT_DRAFT_BUCKET } from "@/lib/constants/contents";
import { METRIC_PROOF_BUCKET } from "@/lib/constants/metrics";
import { canCreatorEditDraft, canProposePosted, canSubmitMetric } from "@/lib/contents/review";
import { zonedInputToUtc } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidField } from "@/lib/validation/common";
import {
  contentCreateSchema,
  draftUpdateSchema,
  proposedPostedSchema,
} from "@/lib/validation/contents";
import { metricSubmissionSchema } from "@/lib/validation/metrics";

/*
 * What a creator can send from the portal (PRD M13: FR-M13-05, FR-M13-06,
 * FR-M13-09). Every action checks ownership here for a clear message, and the
 * database checks it again through RLS and the triggers in
 * 20260927000000_creator_submissions.sql.
 */

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const idSchema = z.object({ id: uuidField });

function revalidateAssignment(assignmentId: string) {
  revalidatePath(`/portal/penugasan/${assignmentId}`);
  revalidatePath("/portal");
}

/** Files are uploaded into the campaign folder; reject any other path. */
function isOwnUploadPath(campaignId: string, path: string | null): boolean {
  return !path || (path.startsWith(`${campaignId}/`) && !path.includes(".."));
}

/** The assignment must belong to the signed-in creator and be running. */
async function loadOwnAssignment(supabase: Supabase, assignmentId: string) {
  const { data } = await supabase
    .from("creator_portal_assignments")
    .select("id, campaign_id, campaign_status, status, creator_confirmed_at")
    .eq("id", assignmentId)
    .maybeSingle();
  return data;
}

/** One of the creator's own contents, with the assignment it belongs to. */
async function loadOwnContent(supabase: Supabase, contentId: string) {
  const { data } = await supabase
    .from("creator_portal_contents")
    .select(
      "id, campaign_creator_id, campaign_id, review_status, revision_count, live_status, posted_at, draft_file_path",
    )
    .eq("id", contentId)
    .maybeSingle();
  return data;
}

/**
 * FR-M13-10: the creator accepts the brief for one of their own assignments.
 * This is the gate for everything else the portal can send, so it is the one
 * write the portal has on `campaign_creators`. The database narrows it further:
 * the policy limits it to their own assignment on a running campaign, and
 * `guard_portal_assignment_confirm` limits it to `diundang` -> `bergabung` and
 * stamps the timestamps itself.
 */
export async function confirmAssignmentAction(values: unknown): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = idSchema.safeParse(values);
  if (!parsed.success) return fail("ID penugasan tidak valid.");

  const supabase = await createSupabaseServerClient();
  const assignment = await loadOwnAssignment(supabase, parsed.data.id);
  if (!assignment) return fail("Penugasan tidak ditemukan.");
  if (assignment.campaign_status !== "aktif") {
    return fail("Kampanye ini tidak sedang berjalan, jadi brief belum bisa dikonfirmasi.");
  }
  if (assignment.status !== "diundang") {
    return fail("Penugasan ini sudah dikonfirmasi.");
  }

  const { error } = await supabase
    .from("campaign_creators")
    .update({ status: "bergabung" })
    .eq("id", parsed.data.id);
  if (error) return fail(dbRuleMessage(error, "Konfirmasi gagal disimpan."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "campaign_creator",
    entityId: parsed.data.id,
    action: "confirm_assignment",
    details: { from_portal: true, campaign_id: assignment.campaign_id },
  });

  revalidateAssignment(parsed.data.id);
  return ok("Brief dikonfirmasi. Anda sudah bisa mengirim draf.");
}

/** FR-M13-05: send a draft for an assignment on a running campaign. */
export async function submitDraftAction(values: unknown): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = contentCreateSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const assignment = await loadOwnAssignment(supabase, parsed.data.campaign_creator_id);
  if (!assignment?.campaign_id) return fail("Penugasan tidak ditemukan.");
  if (assignment.campaign_status !== "aktif") {
    return fail("Kampanye ini tidak sedang berjalan, jadi draf belum bisa dikirim.");
  }
  if (assignment.status === "diundang") {
    return fail("Konfirmasi brief penugasan ini dulu sebelum mengirim draf.");
  }
  if (!isOwnUploadPath(assignment.campaign_id, parsed.data.draft_file_path)) {
    return fail("Lokasi berkas draf tidak valid.");
  }

  const { error } = await supabase.from("contents").insert({
    campaign_creator_id: parsed.data.campaign_creator_id,
    platform: parsed.data.platform,
    draft_url: parsed.data.draft_url,
    draft_file_path: parsed.data.draft_file_path,
    caption_draft: parsed.data.caption_draft,
  });
  if (error) {
    if (parsed.data.draft_file_path) {
      await supabase.storage.from(CONTENT_DRAFT_BUCKET).remove([parsed.data.draft_file_path]);
    }
    return fail(dbRuleMessage(error, "Draf gagal dikirim."));
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: null,
    action: "submit_draft",
    details: { assignment_id: parsed.data.campaign_creator_id, platform: parsed.data.platform },
  });

  revalidateAssignment(parsed.data.campaign_creator_id);
  return ok("Draf terkirim dan menunggu review tim.");
}

/**
 * FR-M13-05: correct a draft that is still waiting, or answer a revision
 * request with a new draft (which sends it back to review).
 */
export async function updateOwnDraftAction(
  contentId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireCreator();
  if (!uuidField.safeParse(contentId).success) return fail("ID konten tidak valid.");
  const parsed = draftUpdateSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const content = await loadOwnContent(supabase, contentId);
  if (!content?.review_status) return fail("Konten tidak ditemukan.");
  if (!canCreatorEditDraft(content.review_status)) {
    return fail("Draf ini sudah direview, jadi tidak dapat diubah lagi.");
  }
  if (!isOwnUploadPath(content.campaign_id ?? "", parsed.data.draft_file_path)) {
    return fail("Lokasi berkas draf tidak valid.");
  }

  // A new draft answers a revision request and goes back to review with the
  // revision counter raised (FR-M6-02), exactly like the team's action.
  const answeringRevision = content.review_status === "revisi";
  const revisionCount = content.revision_count ?? 0;

  const { error } = await supabase
    .from("contents")
    .update({
      ...parsed.data,
      ...(answeringRevision
        ? { review_status: "menunggu_review" as const, revision_count: revisionCount + 1 }
        : {}),
    })
    .eq("id", contentId);

  if (error) {
    const uploaded = parsed.data.draft_file_path;
    if (uploaded && uploaded !== content.draft_file_path) {
      await supabase.storage.from(CONTENT_DRAFT_BUCKET).remove([uploaded]);
    }
    return fail(dbRuleMessage(error, "Draf gagal disimpan."));
  }

  // A corrected draft replaces its file; files of reviewed drafts stay,
  // because the review history points at them.
  if (
    !answeringRevision &&
    content.draft_file_path &&
    content.draft_file_path !== parsed.data.draft_file_path
  ) {
    await supabase.storage.from(CONTENT_DRAFT_BUCKET).remove([content.draft_file_path]);
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: contentId,
    action: answeringRevision ? "new_draft" : "update",
    details: {
      from_portal: true,
      revision_count: answeringRevision ? revisionCount + 1 : revisionCount,
    },
  });

  if (content.campaign_creator_id) revalidateAssignment(content.campaign_creator_id);
  return ok(answeringRevision ? "Draf baru terkirim untuk direview." : "Draf diperbarui.");
}

/** FR-M13-09: report the content as live; the team confirms it. */
export async function proposePostedAction(values: unknown): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = proposedPostedSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const content = await loadOwnContent(supabase, parsed.data.content_id);
  if (!content?.review_status || !content.live_status) return fail("Konten tidak ditemukan.");
  if (!canProposePosted(content.review_status, content.live_status)) {
    return fail("Laporan tayang hanya untuk konten yang sudah disetujui dan belum tayang.");
  }

  const { error } = await supabase
    .from("contents")
    .update({
      proposed_posted_url: parsed.data.proposed_posted_url,
      proposed_posted_at: zonedInputToUtc(parsed.data.proposed_posted_at, session.profile.timezone),
      proposed_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.content_id);

  if (error) return fail(dbRuleMessage(error, "Laporan tayang gagal dikirim."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: parsed.data.content_id,
    action: "propose_posted",
    details: { url: parsed.data.proposed_posted_url },
  });

  if (content.campaign_creator_id) revalidateAssignment(content.campaign_creator_id);
  return ok("Laporan tayang terkirim. Tim akan mengonfirmasi.");
}

/** FR-M13-06: send metric numbers with a screenshot, for the team to verify. */
export async function submitMetricAction(values: unknown): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = metricSubmissionSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const content = await loadOwnContent(supabase, parsed.data.content_id);
  if (!content?.review_status || !content.live_status) return fail("Konten tidak ditemukan.");
  if (!canSubmitMetric(content.review_status, content.live_status)) {
    return fail("Bukti metrik hanya untuk konten yang sudah tayang.");
  }
  if (!isOwnUploadPath(content.campaign_id ?? "", parsed.data.proof_path)) {
    return fail("Lokasi berkas bukti tidak valid.");
  }

  const { error } = await supabase.from("metric_submissions").insert({
    content_id: parsed.data.content_id,
    checkpoint: parsed.data.checkpoint,
    captured_at: zonedInputToUtc(parsed.data.captured_at, session.profile.timezone),
    views: parsed.data.views,
    likes: parsed.data.likes,
    comments: parsed.data.comments,
    shares: parsed.data.shares,
    saves: parsed.data.saves,
    proof_path: parsed.data.proof_path,
  });

  if (error) {
    await supabase.storage.from(METRIC_PROOF_BUCKET).remove([parsed.data.proof_path]);
    return fail(dbRuleMessage(error, "Bukti metrik gagal dikirim."));
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "metric_submission",
    entityId: parsed.data.content_id,
    action: "submit_metric",
    details: { checkpoint: parsed.data.checkpoint, views: parsed.data.views },
  });

  if (content.campaign_creator_id) revalidateAssignment(content.campaign_creator_id);
  return ok("Bukti metrik terkirim dan menunggu verifikasi tim.");
}

/** Withdraw a submission the team has not verified yet. */
export async function withdrawSubmissionAction(values: unknown): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = idSchema.safeParse(values);
  if (!parsed.success) return fail("ID kiriman tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: submission } = await supabase
    .from("creator_portal_submissions")
    .select("id, content_id, status")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!submission) return fail("Kiriman tidak ditemukan.");
  if (submission.status !== "menunggu") {
    return fail("Kiriman ini sudah diverifikasi tim, jadi tetap tercatat.");
  }

  const { error } = await supabase.from("metric_submissions").delete().eq("id", parsed.data.id);
  if (error) return fail(dbRuleMessage(error, "Kiriman gagal ditarik."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "metric_submission",
    entityId: submission.content_id,
    action: "delete",
    details: { from_portal: true },
  });

  const content = submission.content_id
    ? await loadOwnContent(supabase, submission.content_id)
    : null;
  if (content?.campaign_creator_id) revalidateAssignment(content.campaign_creator_id);
  return ok("Kiriman ditarik.");
}
