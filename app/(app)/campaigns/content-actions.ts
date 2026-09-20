"use server";

import { revalidatePath } from "next/cache";
import { dbRuleMessage, fail, invalid, ok, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireInternal } from "@/lib/auth/guards";
import { CONTENT_DRAFT_BUCKET } from "@/lib/constants/contents";
import {
  canDeleteContent,
  canEditDraft,
  canMarkPosted,
  canMarkRemoved,
  canReview,
  canSubmitNewDraft,
  checklistItemsFor,
  isChecklistComplete,
} from "@/lib/contents/review";
import { zonedInputToUtc } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidField } from "@/lib/validation/common";
import {
  contentCreateSchema,
  draftUpdateSchema,
  postedSchema,
  removedSchema,
  reviewSchema,
} from "@/lib/validation/contents";

/*
 * Content and review actions (PRD M6). Every rule is checked here for a clear
 * message and again by the database triggers in 20260920000000_contents.sql.
 */

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

function revalidateContents(campaignId: string) {
  revalidatePath(`/campaigns/${campaignId}/contents`);
}

/** Draft files are uploaded under the campaign's folder; reject any other path. */
function isOwnDraftPath(campaignId: string, path: string | null): boolean {
  return !path || (path.startsWith(`${campaignId}/`) && !path.includes(".."));
}

/** Loads a content row and confirms it belongs to the campaign in the URL. */
async function loadContent(supabase: Supabase, campaignId: string, contentId: string) {
  const { data } = await supabase
    .from("contents")
    .select(
      "id, review_status, revision_count, live_status, posted_at, draft_file_path, proposed_posted_url, proposed_posted_at, assignment:campaign_creators!inner(campaign_id, campaign:campaigns(paid_label_required))",
    )
    .eq("id", contentId)
    .eq("assignment.campaign_id", campaignId)
    .maybeSingle();
  return data;
}

function validIds(...ids: string[]) {
  return ids.every((id) => uuidField.safeParse(id).success);
}

/** FR-M6-01: record a draft sent by the creator over WhatsApp. */
export async function createContentAction(
  campaignId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireInternal();
  if (!validIds(campaignId)) return fail("ID kampanye tidak valid.");
  const parsed = contentCreateSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  if (!isOwnDraftPath(campaignId, parsed.data.draft_file_path)) {
    return fail("Lokasi berkas draf tidak valid.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: assignment } = await supabase
    .from("campaign_creators")
    .select("id")
    .eq("id", parsed.data.campaign_creator_id)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (!assignment) return fail("Kreator tidak ditugaskan di kampanye ini.");

  const { data, error } = await supabase
    .from("contents")
    .insert({ ...parsed.data, created_by: session.user.id })
    .select("id")
    .single();
  if (error) {
    if (parsed.data.draft_file_path) {
      await supabase.storage.from(CONTENT_DRAFT_BUCKET).remove([parsed.data.draft_file_path]);
    }
    return fail(dbRuleMessage(error, "Konten gagal dicatat."));
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: data.id,
    action: "create",
    details: { campaign_id: campaignId, platform: parsed.data.platform },
  });

  revalidateContents(campaignId);
  return ok("Konten dicatat dan menunggu review.");
}

/**
 * Corrects a draft that is still waiting for review, or records a new draft
 * after a revision request (FR-M6-02: back to review, revision count + 1).
 */
export async function updateDraftAction(
  campaignId: string,
  contentId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireInternal();
  if (!validIds(campaignId, contentId)) return fail("ID tidak valid.");
  const parsed = draftUpdateSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  if (!isOwnDraftPath(campaignId, parsed.data.draft_file_path)) {
    return fail("Lokasi berkas draf tidak valid.");
  }

  const supabase = await createSupabaseServerClient();
  const content = await loadContent(supabase, campaignId, contentId);
  if (!content) return fail("Konten tidak ditemukan.");

  const isNewDraft = canSubmitNewDraft(content.review_status);
  if (!isNewDraft && !canEditDraft(content.review_status)) {
    return fail("Draf yang sudah disetujui atau ditolak tidak dapat diubah.");
  }

  const { error } = await supabase
    .from("contents")
    .update({
      ...parsed.data,
      ...(isNewDraft
        ? { review_status: "menunggu_review" as const, revision_count: content.revision_count + 1 }
        : {}),
    })
    .eq("id", contentId);
  if (error) {
    // Drop a freshly uploaded file that no row points to.
    const uploaded = parsed.data.draft_file_path;
    if (uploaded && uploaded !== content.draft_file_path) {
      await supabase.storage.from(CONTENT_DRAFT_BUCKET).remove([uploaded]);
    }
    return fail(dbRuleMessage(error, "Draf gagal disimpan."));
  }

  // A corrected (not yet reviewed) draft file replaces the old one; files of
  // reviewed drafts stay because the review history points to them.
  if (
    !isNewDraft &&
    content.draft_file_path &&
    content.draft_file_path !== parsed.data.draft_file_path
  ) {
    await supabase.storage.from(CONTENT_DRAFT_BUCKET).remove([content.draft_file_path]);
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: contentId,
    action: isNewDraft ? "new_draft" : "update",
    details: {
      campaign_id: campaignId,
      revision_count: isNewDraft ? content.revision_count + 1 : content.revision_count,
    },
  });

  revalidateContents(campaignId);
  return ok(isNewDraft ? "Draf baru dicatat dan kembali menunggu review." : "Draf diperbarui.");
}

/** FR-M6-02, FR-M6-03: record a review decision; history is append-only. */
export async function reviewContentAction(
  campaignId: string,
  contentId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireInternal();
  if (!validIds(campaignId, contentId)) return fail("ID tidak valid.");
  const parsed = reviewSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const content = await loadContent(supabase, campaignId, contentId);
  if (!content) return fail("Konten tidak ditemukan.");
  if (!canReview(content.review_status)) {
    return fail("Konten ini sudah direview; tunggu draf baru sebelum mereview lagi.");
  }

  const paidLabelRequired = content.assignment.campaign?.paid_label_required ?? true;
  if (
    parsed.data.decision === "disetujui" &&
    !isChecklistComplete(parsed.data.checklist, paidLabelRequired)
  ) {
    return fail("Centang semua item checklist sebelum menyetujui konten.");
  }

  // Store only the items that apply to this campaign.
  const checklist = Object.fromEntries(
    checklistItemsFor(paidLabelRequired).map((item) => [item.key, parsed.data.checklist[item.key]]),
  );

  const { error } = await supabase.from("content_reviews").insert({
    content_id: contentId,
    decision: parsed.data.decision,
    checklist,
    notes: parsed.data.notes,
    reviewer_id: session.user.id,
  });
  if (error) return fail(dbRuleMessage(error, "Keputusan review gagal disimpan."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: contentId,
    action: "review",
    details: {
      campaign_id: campaignId,
      decision: parsed.data.decision,
      revision_count: content.revision_count,
    },
  });

  revalidateContents(campaignId);
  const messages = {
    disetujui: "Konten disetujui.",
    revisi: "Permintaan revisi dicatat.",
    ditolak: "Konten ditolak.",
  } as const;
  return ok(messages[parsed.data.decision]);
}

/** FR-M6-04: live URL and time, only for approved content. */
export async function markPostedAction(
  campaignId: string,
  contentId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireInternal();
  if (!validIds(campaignId, contentId)) return fail("ID tidak valid.");
  const parsed = postedSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const content = await loadContent(supabase, campaignId, contentId);
  if (!content) return fail("Konten tidak ditemukan.");
  if (!canMarkPosted(content.review_status)) {
    return fail("URL tayang hanya dapat diisi untuk konten yang sudah disetujui.");
  }
  if (content.live_status === "dihapus") {
    return fail("Konten sudah ditandai dihapus.");
  }

  const postedAt = zonedInputToUtc(parsed.data.posted_at, session.profile.timezone);
  const { error } = await supabase
    .from("contents")
    .update({
      posted_url: parsed.data.posted_url,
      posted_at: postedAt,
      live_status: "tayang",
      // A creator's live report (FR-M13-09) has served its purpose now.
      proposed_posted_url: null,
      proposed_posted_at: null,
      proposed_at: null,
    })
    .eq("id", contentId);
  if (error) return fail(dbRuleMessage(error, "Status tayang gagal disimpan."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: contentId,
    action: "posted",
    details: { campaign_id: campaignId, posted_url: parsed.data.posted_url, posted_at: postedAt },
  });

  revalidateContents(campaignId);
  return ok("Konten ditandai tayang.");
}

/** FR-M6-05: the creator took the post down. */
export async function markRemovedAction(
  campaignId: string,
  contentId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireInternal();
  if (!validIds(campaignId, contentId)) return fail("ID tidak valid.");
  const parsed = removedSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const content = await loadContent(supabase, campaignId, contentId);
  if (!content) return fail("Konten tidak ditemukan.");
  if (!canMarkRemoved(content.review_status, content.live_status)) {
    return fail("Hanya konten yang sedang tayang yang dapat ditandai dihapus.");
  }

  const removedAt = zonedInputToUtc(parsed.data.removed_at, session.profile.timezone);
  if (content.posted_at && new Date(removedAt) < new Date(content.posted_at)) {
    return {
      status: "error",
      message: "Waktu penghapusan tidak boleh sebelum waktu tayang.",
      fieldErrors: { removed_at: "Sebelum waktu tayang." },
    };
  }

  const { error } = await supabase
    .from("contents")
    .update({ live_status: "dihapus", removed_at: removedAt })
    .eq("id", contentId);
  if (error) return fail(dbRuleMessage(error, "Status dihapus gagal disimpan."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: contentId,
    action: "removed",
    details: { campaign_id: campaignId, removed_at: removedAt },
  });

  revalidateContents(campaignId);
  return ok("Konten ditandai dihapus.");
}

/** Only content that was never reviewed can be deleted (its history must survive). */
export async function deleteContentAction(
  campaignId: string,
  contentId: string,
): Promise<ActionResult> {
  const session = await requireInternal();
  if (!validIds(campaignId, contentId)) return fail("ID tidak valid.");

  const supabase = await createSupabaseServerClient();
  const content = await loadContent(supabase, campaignId, contentId);
  if (!content) return fail("Konten tidak ditemukan.");
  if (!canDeleteContent(content.review_status, content.revision_count)) {
    return fail(
      "Konten yang sudah direview tidak dapat dihapus karena riwayatnya harus tersimpan.",
    );
  }

  const { error } = await supabase.from("contents").delete().eq("id", contentId);
  if (error) return fail(dbRuleMessage(error, "Konten gagal dihapus."));

  if (content.draft_file_path) {
    await supabase.storage.from(CONTENT_DRAFT_BUCKET).remove([content.draft_file_path]);
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: contentId,
    action: "delete",
    details: { campaign_id: campaignId },
  });

  revalidateContents(campaignId);
  return ok("Konten dihapus.");
}

/**
 * FR-M13-09: confirm the live report a creator sent from the portal. The
 * proposal is only data until this runs; from here the normal FR-M6-04 rules
 * apply, so it goes through the same update as `markPostedAction`.
 */
export async function confirmProposedPostedAction(
  campaignId: string,
  contentId: string,
): Promise<ActionResult> {
  const session = await requireInternal();
  if (!validIds(campaignId, contentId)) return fail("ID tidak valid.");

  const supabase = await createSupabaseServerClient();
  const content = await loadContent(supabase, campaignId, contentId);
  if (!content) return fail("Konten tidak ditemukan.");
  if (!content.proposed_posted_url || !content.proposed_posted_at) {
    return fail("Belum ada laporan tayang dari kreator.");
  }
  if (!canMarkPosted(content.review_status)) {
    return fail("URL tayang hanya dapat diisi untuk konten yang sudah disetujui.");
  }
  if (content.live_status !== "belum_tayang") {
    return fail("Konten ini sudah ditandai tayang atau dihapus.");
  }

  const { error } = await supabase
    .from("contents")
    .update({
      posted_url: content.proposed_posted_url,
      posted_at: content.proposed_posted_at,
      live_status: "tayang",
      proposed_posted_url: null,
      proposed_posted_at: null,
      proposed_at: null,
    })
    .eq("id", contentId);
  if (error) return fail(dbRuleMessage(error, "Status tayang gagal disimpan."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "content",
    entityId: contentId,
    action: "posted",
    details: {
      campaign_id: campaignId,
      posted_url: content.proposed_posted_url,
      posted_at: content.proposed_posted_at,
      from_creator: true,
    },
  });

  revalidateContents(campaignId);
  return ok("Laporan tayang kreator dikonfirmasi.");
}
