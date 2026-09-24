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
import { requireCreator } from "@/lib/auth/guards";
import {
  CLIP_BLOCKER_MESSAGES,
  clipDetailProblems,
  clipPeriod,
  clipSubmissionBlockers,
  viewsUpdateState,
} from "@/lib/campaigns/clips";
import { campaignToday } from "@/lib/campaigns/open";
import { CREATOR_TERMS_VERSION } from "@/lib/constants/creators";
import { METRIC_PROOF_BUCKET } from "@/lib/constants/metrics";
import { getPortalProfile } from "@/lib/data/portal";
import { formatDateTime, zonedInputToUtc } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clipResubmitSchema, clipSubmitSchema, viewsUpdateSchema } from "@/lib/validation/clips";

/*
 * Clips of `per_views` campaigns from the portal (PRD M18: FR-M18-01,
 * FR-M18-03, FR-M18-05). The checks here explain; RLS, `guard_clip_change`
 * and `guard_metric_submission_change` decide again in the database.
 */

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function revalidateClips(assignmentId: string | null) {
  if (assignmentId) revalidatePath(`/portal/penugasan/${assignmentId}`);
  revalidatePath("/portal/klip");
  revalidatePath("/portal");
}

/** Proofs are uploaded into the campaign folder; reject any other path. */
function isOwnUploadPath(campaignId: string, path: string): boolean {
  return path.startsWith(`${campaignId}/`) && !path.includes("..");
}

async function removeProof(supabase: Supabase, path: string) {
  await supabase.storage.from(METRIC_PROOF_BUCKET).remove([path]);
}

const DUPLICATE_URL_MESSAGE =
  "Klip dengan tautan ini sudah pernah dikirim, oleh Anda atau klipper lain.";

/** FR-M18-01: a clip and its first views proof, in one transaction. */
export async function submitClipAction(values: unknown): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = clipSubmitSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const input = parsed.data;

  const supabase = await createSupabaseServerClient();
  const [profile, { data: assignment }, { data: accounts }] = await Promise.all([
    getPortalProfile(supabase),
    supabase
      .from("creator_portal_assignments")
      .select(
        "id, campaign_id, status, campaign_status, payout_model, start_date, end_date, joined_at, allowed_platforms, max_clips_per_creator",
      )
      .eq("id", input.assignment_id)
      .maybeSingle(),
    supabase.from("creator_portal_social_accounts").select("platform"),
  ]);
  if (!profile) return fail("Data klipper tidak ditemukan.");
  if (!assignment?.campaign_id || assignment.payout_model !== "per_views") {
    return fail("Penugasan tidak ditemukan.");
  }
  if (!isOwnUploadPath(assignment.campaign_id, input.proof_path)) {
    return fail("Lokasi berkas bukti tidak valid.");
  }

  const [{ count: activeClipCount }, { data: budgetExhausted }] = await Promise.all([
    supabase
      .from("creator_portal_contents")
      .select("id", { count: "exact", head: true })
      .eq("campaign_creator_id", assignment.id!)
      .neq("review_status", "ditolak"),
    supabase.rpc("campaign_budget_exhausted", { target_campaign_id: assignment.campaign_id }),
  ]);

  const blockers = clipSubmissionBlockers({
    creatorStatus: profile.status,
    termsVersion: profile.terms_version,
    currentTermsVersion: CREATOR_TERMS_VERSION,
    assignmentStatus: assignment.status ?? "",
    campaignStatus: assignment.campaign_status!,
    endDate: assignment.end_date!,
    today: campaignToday(),
    budgetExhausted: budgetExhausted === true,
    maxClipsPerCreator: assignment.max_clips_per_creator ?? 0,
    activeClipCount: activeClipCount ?? 0,
  });
  if (blockers[0]) {
    await removeProof(supabase, input.proof_path);
    return fail(CLIP_BLOCKER_MESSAGES[blockers[0]]);
  }

  const postedAt = zonedInputToUtc(input.posted_at, session.profile.timezone);
  const problems = clipDetailProblems({
    platform: input.platform,
    postedAt: new Date(postedAt),
    now: new Date(),
    allowedPlatforms: assignment.allowed_platforms ?? [],
    registeredPlatforms: (accounts ?? []).flatMap((account) =>
      account.platform ? [account.platform] : [],
    ),
    period: clipPeriod({
      joinedAt: assignment.joined_at,
      startDate: assignment.start_date!,
      endDate: assignment.end_date!,
    }),
  });
  const firstProblem = problems.platform ?? problems.posted_at;
  if (firstProblem) {
    await removeProof(supabase, input.proof_path);
    return { status: "error", message: firstProblem, fieldErrors: problems };
  }

  const { data: contentId, error } = await supabase.rpc("submit_clip", {
    p_assignment_id: assignment.id!,
    p_platform: input.platform,
    p_posted_url: input.posted_url!,
    p_posted_at: postedAt,
    p_views: input.views,
    p_likes: input.likes,
    p_comments: input.comments,
    p_shares: input.shares,
    p_proof_path: input.proof_path,
  });

  if (error) {
    await removeProof(supabase, input.proof_path);
    if (error.code === PG_UNIQUE_VIOLATION && error.message.includes("posted_url_normalized")) {
      return {
        status: "error",
        message: DUPLICATE_URL_MESSAGE,
        fieldErrors: { posted_url: DUPLICATE_URL_MESSAGE },
      };
    }
    return fail(dbRuleMessage(error, "Klip gagal dikirim. Coba lagi."));
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: contentId,
    action: "submit_clip",
    details: {
      campaign_id: assignment.campaign_id,
      platform: input.platform,
      url: input.posted_url,
      views: input.views,
    },
  });

  revalidateClips(assignment.id);
  return ok("Klip terkirim dan menunggu verifikasi tim.");
}

/** FR-M18-03: after a revision request, send the same clip back for review. */
export async function resubmitClipAction(values: unknown): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = clipResubmitSchema.safeParse(values);
  if (!parsed.success) return fail("ID klip tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: content } = await supabase
    .from("creator_portal_contents")
    .select("id, campaign_creator_id, campaign_id, review_status, revision_count")
    .eq("id", parsed.data.content_id)
    .maybeSingle();
  if (!content?.review_status) return fail("Klip tidak ditemukan.");
  if (content.review_status !== "revisi") {
    return fail("Klip hanya dapat dikirim ulang setelah tim meminta perbaikan.");
  }

  const { error } = await supabase
    .from("contents")
    .update({
      review_status: "menunggu_review",
      revision_count: (content.revision_count ?? 0) + 1,
    })
    .eq("id", parsed.data.content_id);
  if (error) return fail(dbRuleMessage(error, "Klip gagal dikirim ulang."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: parsed.data.content_id,
    action: "resubmit_clip",
    details: { campaign_id: content.campaign_id, revision: (content.revision_count ?? 0) + 1 },
  });

  revalidateClips(content.campaign_creator_id);
  return ok("Klip dikirim ulang dan menunggu verifikasi tim.");
}

/** FR-M18-05: new views for an approved clip, at most every 24 hours. */
export async function submitViewsUpdateAction(values: unknown): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = viewsUpdateSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const input = parsed.data;

  const supabase = await createSupabaseServerClient();
  const [{ data: content }, { data: submissions }] = await Promise.all([
    supabase
      .from("creator_portal_contents")
      .select("id, campaign_creator_id, campaign_id, review_status, live_status")
      .eq("id", input.content_id)
      .maybeSingle(),
    supabase
      .from("creator_portal_submissions")
      .select("status, created_at")
      .eq("content_id", input.content_id)
      .order("created_at", { ascending: false }),
  ]);
  if (!content?.campaign_id || !content.campaign_creator_id) return fail("Klip tidak ditemukan.");
  if (!isOwnUploadPath(content.campaign_id, input.proof_path)) {
    return fail("Lokasi berkas bukti tidak valid.");
  }

  const { data: assignment } = await supabase
    .from("creator_portal_assignments")
    .select("campaign_status, end_date, claim_grace_days")
    .eq("id", content.campaign_creator_id)
    .maybeSingle();
  if (!assignment?.campaign_status) return fail("Klip tidak ditemukan.");

  const state = viewsUpdateState({
    reviewStatus: content.review_status!,
    liveStatus: content.live_status!,
    campaignStatus: assignment.campaign_status,
    endDate: assignment.end_date!,
    claimGraceDays: assignment.claim_grace_days ?? 0,
    today: campaignToday(),
    lastSubmittedAt: submissions?.[0]?.created_at ?? null,
    hasPendingSubmission: (submissions ?? []).some((row) => row.status === "menunggu"),
    now: new Date(),
  });
  if (!state.allowed) {
    await removeProof(supabase, input.proof_path);
    const messages = {
      not_approved: "Pembaruan views hanya untuk klip yang sudah disetujui.",
      not_live: "Klip ini tidak lagi tayang.",
      closed: "Masa klaim pembaruan views kampanye ini sudah berakhir.",
      pending: "Pembaruan views sebelumnya masih menunggu verifikasi tim.",
      too_soon: "",
    } as const;
    return fail(
      state.reason === "too_soon"
        ? `Pembaruan views berikutnya bisa dikirim mulai ${formatDateTime(state.nextAt, session.profile.timezone)}.`
        : messages[state.reason],
    );
  }

  const { error } = await supabase.from("metric_submissions").insert({
    content_id: input.content_id,
    checkpoint: "lainnya",
    captured_at: new Date().toISOString(),
    views: input.views,
    likes: input.likes,
    comments: input.comments,
    shares: input.shares,
    saves: 0,
    proof_path: input.proof_path,
  });
  if (error) {
    await removeProof(supabase, input.proof_path);
    return fail(dbRuleMessage(error, "Pembaruan views gagal dikirim."));
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "metric_submission",
    entityId: input.content_id,
    action: "submit_views_update",
    details: { campaign_id: content.campaign_id, views: input.views },
  });

  revalidateClips(content.campaign_creator_id);
  return ok("Pembaruan views terkirim dan menunggu verifikasi tim.");
}
