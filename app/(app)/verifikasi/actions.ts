"use server";

import { revalidatePath } from "next/cache";
import { dbRuleMessage, fail, invalid, ok, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireInternal } from "@/lib/auth/guards";
import { isClipChecklistComplete } from "@/lib/constants/clips";
import { computeClipCredit, getClipForVerification, type ClipDetail } from "@/lib/data/clips";
import { notifyClipDecision, notifyViewsUpdate } from "@/lib/email/notify";
import { formatRupiah } from "@/lib/format/currency";
import { zonedInputToUtc } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import {
  clipCancelSchema,
  clipVerifySchema,
  viewsUpdateVerifySchema,
} from "@/lib/validation/clips";

/*
 * Clip verification by the team (PRD M18: FR-M18-04 … FR-M18-07,
 * FR-M19-02). The credit comes from lib/calculations/clip-earning.ts; the
 * database functions lock the campaign row and refuse a credit that no longer
 * fits the budget or the per-klipper cap, e.g. when another verifier approved
 * a clip in the meantime. Then the numbers are read again and the decision
 * retried once.
 */

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;
type ClipRejectionReason = Database["public"]["Enums"]["clip_rejection_reason"];

/** Errors after which fresh ledger numbers give a different, valid credit. */
const STALE_CREDIT = /^(BUDGET_EXCEEDED|CREDIT_ABOVE_CREATOR_CAP)/;

function revalidateClip(clip: Pick<ClipDetail, "id" | "campaign">) {
  revalidatePath("/verifikasi");
  revalidatePath(`/verifikasi/${clip.id}`);
  revalidatePath(`/campaigns/${clip.campaign.id}`, "layout");
  revalidatePath("/dashboard");
}

async function creditFor(supabase: Supabase, clip: ClipDetail, verifiedViews: number) {
  return computeClipCredit(supabase, {
    campaign: clip.campaign,
    contentId: clip.id,
    creatorId: clip.creator.id,
    verifiedViews,
  });
}

function creditMessage(credit: number, limited: boolean) {
  if (credit === 0) return "Tidak ada honor tambahan.";
  return `Honor ${formatRupiah(credit)} masuk ke saldo klipper${limited ? " (dibatasi batas kampanye)" : ""}.`;
}

/** FR-M18-04: approve with verified views, ask for a revision, or reject. */
export async function verifyClipAction(values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const parsed = clipVerifySchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const input = parsed.data;

  const supabase = await createSupabaseServerClient();
  const clip = await getClipForVerification(supabase, input.content_id);
  if (!clip) return fail("Klip tidak ditemukan.");
  if (clip.reviewStatus !== "menunggu_review") {
    return fail("Klip ini sudah diputuskan; tunggu klipper mengirim ulang.");
  }
  if (
    input.decision === "disetujui" &&
    !isClipChecklistComplete(input.checklist, clip.campaign.paidLabelRequired)
  ) {
    return fail("Centang semua butir checklist sebelum menyetujui klip.");
  }

  const decide = async () => {
    const earning =
      input.decision === "disetujui"
        ? await creditFor(supabase, clip, input.verified_views!)
        : null;
    const { error } = await supabase.rpc("verify_clip", {
      p_content_id: clip.id,
      p_decision: input.decision,
      p_checklist: input.checklist,
      p_notes: input.notes,
      p_rejection_reason: input.rejection_reason as ClipRejectionReason,
      p_verified_views: (input.verified_views ?? null) as number,
      p_credit: earning?.credit ?? 0,
      p_credit_limited: earning?.limitedBy !== null && earning?.limitedBy !== undefined,
    });
    return { error, earning };
  };

  let result = await decide();
  if (result.error && STALE_CREDIT.test(result.error.message)) result = await decide();
  if (result.error) return fail(dbRuleMessage(result.error, "Keputusan gagal disimpan."));

  const credit = result.earning?.credit ?? 0;
  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: clip.id,
    action: "verify_clip",
    details: {
      campaign_id: clip.campaign.id,
      decision: input.decision,
      verified_views: input.verified_views ?? undefined,
      credit: input.decision === "disetujui" ? credit : undefined,
      rejection_reason: input.rejection_reason ?? undefined,
    },
  });

  revalidateClip(clip);
  notifyClipDecision(supabase, clip.creator.id, {
    campaignName: clip.campaign.name,
    decision: input.decision,
    verifiedViews: input.verified_views,
    credit,
    creditLimited: Boolean(result.earning?.limitedBy),
    rejectionReason: input.rejection_reason as ClipRejectionReason | null,
    notes: input.notes,
  });
  if (input.decision === "disetujui") {
    return ok(`Klip disetujui. ${creditMessage(credit, Boolean(result.earning?.limitedBy))}`);
  }
  return ok(input.decision === "revisi" ? "Permintaan perbaikan terkirim." : "Klip ditolak.");
}

/** FR-M18-05: accept a views update (crediting the difference) or reject it. */
export async function verifyViewsUpdateAction(values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const parsed = viewsUpdateVerifySchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const input = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: submission } = await supabase
    .from("metric_submissions")
    .select("id, content_id, status")
    .eq("id", input.submission_id)
    .maybeSingle();
  if (!submission) return fail("Kiriman tidak ditemukan.");
  const clip = await getClipForVerification(supabase, submission.content_id);
  if (!clip) return fail("Klip tidak ditemukan.");
  if (submission.status !== "menunggu") return fail("Kiriman ini sudah diverifikasi.");

  const decide = async () => {
    const earning = input.accept ? await creditFor(supabase, clip, input.verified_views!) : null;
    const { error } = await supabase.rpc("verify_views_update", {
      p_submission_id: input.submission_id,
      p_accept: input.accept,
      p_verified_views: (input.verified_views ?? null) as number,
      p_notes: input.notes,
      p_credit: earning?.credit ?? 0,
      p_credit_limited: earning?.limitedBy !== null && earning?.limitedBy !== undefined,
    });
    return { error, earning };
  };

  let result = await decide();
  if (result.error && STALE_CREDIT.test(result.error.message)) result = await decide();
  if (result.error) return fail(dbRuleMessage(result.error, "Keputusan gagal disimpan."));

  const credit = result.earning?.credit ?? 0;
  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "metric_submission",
    entityId: input.submission_id,
    action: "verify_views_update",
    details: {
      campaign_id: clip.campaign.id,
      content_id: clip.id,
      accepted: input.accept,
      verified_views: input.verified_views ?? undefined,
      credit: input.accept ? credit : undefined,
    },
  });

  revalidateClip(clip);
  notifyViewsUpdate(supabase, clip.creator.id, {
    campaignName: clip.campaign.name,
    accepted: input.accept,
    verifiedViews: input.verified_views,
    credit,
    creditLimited: Boolean(result.earning?.limitedBy),
    notes: input.notes,
  });
  return input.accept
    ? ok(`Pembaruan views diterima. ${creditMessage(credit, Boolean(result.earning?.limitedBy))}`)
    : ok("Pembaruan views ditolak.");
}

/**
 * FR-M18-06: record a clip taken down (honor cancelled before
 * `min_live_days`). FR-M18-07: the owner rejects an approved clip for fraud
 * and cancels all its honor.
 */
export async function cancelClipAction(values: unknown): Promise<ActionResult> {
  const session = await requireInternal();
  const parsed = clipCancelSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const input = parsed.data;

  if (input.kind === "kecurangan" && session.profile.role !== "owner") {
    return fail("Hanya owner yang dapat membatalkan klip karena kecurangan.");
  }

  const supabase = await createSupabaseServerClient();
  const clip = await getClipForVerification(supabase, input.content_id);
  if (!clip) return fail("Klip tidak ditemukan.");

  let removedAt: string | undefined;
  if (input.kind === "dihapus") {
    removedAt = zonedInputToUtc(input.removed_at, session.profile.timezone);
    if (clip.postedAt && new Date(removedAt) < new Date(clip.postedAt)) {
      return {
        status: "error",
        message: "Waktu penghapusan tidak boleh sebelum waktu tayang.",
        fieldErrors: { removed_at: "Sebelum waktu tayang." },
      };
    }
  }

  const { data: cancelled, error } = await supabase.rpc("cancel_clip", {
    p_content_id: clip.id,
    p_kind: input.kind,
    p_removed_at: removedAt,
    p_rejection_reason: input.kind === "kecurangan" ? input.rejection_reason : undefined,
    p_notes: input.kind === "kecurangan" ? input.notes : "",
  });
  if (error) return fail(dbRuleMessage(error, "Pembatalan gagal disimpan."));

  const amount = Number(cancelled ?? 0);
  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: clip.id,
    action: "cancel_clip",
    details: {
      campaign_id: clip.campaign.id,
      kind: input.kind,
      cancelled: amount,
      removed_at: removedAt,
    },
  });

  revalidateClip(clip);
  const taken =
    amount > 0 ? ` Honor ${formatRupiah(amount)} dibatalkan.` : " Honor tetap milik klipper.";
  return ok(
    input.kind === "dihapus"
      ? `Klip ditandai dihapus.${taken}`
      : `Klip ditolak karena kecurangan.${taken}`,
  );
}
