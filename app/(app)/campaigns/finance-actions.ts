"use server";

import { revalidatePath } from "next/cache";
import { dbRuleMessage, fail, invalid, ok, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireRole, requireSession } from "@/lib/auth/guards";
import { effectiveFeeScheme } from "@/lib/calculations/fee-scheme";
import { payoutTotal } from "@/lib/calculations/payout";
import { FINANCE_PROOF_BUCKET } from "@/lib/constants/finance";
import { calculationSnapshot, computeAssignmentPayout, loadPayoutInputs } from "@/lib/data/finance";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { uuidField } from "@/lib/validation/common";
import {
  adjustmentSchema,
  clientPaymentReceiptSchema,
  clientPaymentSchema,
  markPaidSchema,
} from "@/lib/validation/finance";

/*
 * Payouts and client payments (PRD M8). Checked here for clear messages and
 * again by the triggers in 20260922000000_finance.sql.
 */

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const validIds = (...ids: string[]) => ids.every((id) => uuidField.safeParse(id).success);

function revalidateFinance(campaignId: string) {
  revalidatePath(`/campaigns/${campaignId}/finance`);
  revalidatePath("/dashboard");
}

function isOwnProofPath(campaignId: string, path: string | null) {
  return !path || (path.startsWith(`${campaignId}/`) && !path.includes(".."));
}

async function removeProof(supabase: Supabase, path: string | null) {
  if (path) await supabase.storage.from(FINANCE_PROOF_BUCKET).remove([path]);
}

async function loadCampaign(supabase: Supabase, campaignId: string) {
  const { data } = await supabase.from("campaigns").select("*").eq("id", campaignId).maybeSingle();
  return data;
}

async function loadPayout(supabase: Supabase, campaignId: string, payoutId: string) {
  const { data } = await supabase
    .from("payouts")
    .select("*, assignment:campaign_creators!inner(campaign_id)")
    .eq("id", payoutId)
    .eq("assignment.campaign_id", campaignId)
    .maybeSingle();
  return data;
}

/* ------------------------------------------------------------------ */
/* Payouts                                                              */
/* ------------------------------------------------------------------ */

/**
 * FR-M8-01, FR-M8-04: creates or recalculates the draft payout of each given
 * assignment. Approved or paid payouts are skipped, never overwritten.
 */
async function calculate(campaignId: string, assignmentIds: string[] | "all") {
  const session = await requireSession();
  const supabase = await createSupabaseServerClient();
  const campaign = await loadCampaign(supabase, campaignId);
  if (!campaign) return fail("Kampanye tidak ditemukan.");
  if (campaign.status !== "selesai") {
    return fail("Honor baru dapat dihitung setelah kampanye berstatus selesai.");
  }

  const inputs = await loadPayoutInputs(supabase, campaignId);
  const targets = inputs.assignments.filter(
    (a) => assignmentIds === "all" || assignmentIds.includes(a.id),
  );
  if (!targets.length) return fail("Penugasan tidak ditemukan.");

  const { data: existing } = await supabase
    .from("payouts")
    .select("id, campaign_creator_id, status, adjustment_amount")
    .in(
      "campaign_creator_id",
      targets.map((t) => t.id),
    );

  let saved = 0;
  let skipped = 0;
  for (const assignment of targets) {
    const current = existing?.find((p) => p.campaign_creator_id === assignment.id);
    if (current && current.status !== "draf") {
      skipped += 1;
      continue;
    }

    const calculation = computeAssignmentPayout(
      campaign,
      inputs,
      assignment,
      current?.adjustment_amount ?? 0,
    );
    const values = {
      base_amount: calculation.baseAmount,
      views_bonus: calculation.viewsBonus,
      registrant_bonus: calculation.registrantBonus,
      total_amount: calculation.totalAmount,
      calculation_snapshot: calculationSnapshot(
        campaign,
        assignment,
        effectiveFeeScheme(assignment.overrides, campaign),
        calculation,
      ),
      calculated_at: new Date().toISOString(),
    };

    const { data, error } = current
      ? await supabase.from("payouts").update(values).eq("id", current.id).select("id").single()
      : await supabase
          .from("payouts")
          .insert({ ...values, campaign_creator_id: assignment.id })
          .select("id")
          .single();
    if (error) return fail(dbRuleMessage(error, "Honor gagal dihitung."));

    saved += 1;
    await logActivity(supabase, {
      actorId: session.user.id,
      entityType: "payout",
      entityId: data.id,
      action: "calculate",
      details: {
        campaign_id: campaignId,
        creator: assignment.name,
        recalculated: Boolean(current),
        total_amount: calculation.totalAmount,
      },
    });
  }

  revalidateFinance(campaignId);
  if (!saved)
    return fail("Semua honor sudah disetujui atau dibayar; tidak ada yang dihitung ulang.");
  return ok(
    skipped
      ? `${saved} honor dihitung; ${skipped} dilewati karena sudah disetujui/dibayar.`
      : `${saved} honor dihitung.`,
  );
}

export async function calculatePayoutAction(campaignId: string, assignmentId: string) {
  if (!validIds(campaignId, assignmentId)) return fail("ID tidak valid.");
  return calculate(campaignId, [assignmentId]);
}

export async function calculateAllPayoutsAction(campaignId: string) {
  if (!validIds(campaignId)) return fail("ID kampanye tidak valid.");
  return calculate(campaignId, "all");
}

/** FR-M8-02: adjustment on a draft; the total follows via PRD 8.3. */
export async function adjustPayoutAction(
  campaignId: string,
  payoutId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireSession();
  if (!validIds(campaignId, payoutId)) return fail("ID tidak valid.");
  const parsed = adjustmentSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const payout = await loadPayout(supabase, campaignId, payoutId);
  if (!payout) return fail("Honor tidak ditemukan.");
  if (payout.status !== "draf") return fail("Hanya honor berstatus draf yang dapat disesuaikan.");

  const totalAmount = payoutTotal({
    baseAmount: payout.base_amount,
    viewsBonus: payout.views_bonus,
    registrantBonus: payout.registrant_bonus,
    adjustmentAmount: parsed.data.adjustment_amount,
  });

  const { error } = await supabase
    .from("payouts")
    .update({ ...parsed.data, total_amount: totalAmount })
    .eq("id", payoutId);
  if (error) return fail(dbRuleMessage(error, "Penyesuaian gagal disimpan."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "payout",
    entityId: payoutId,
    action: "adjust",
    details: {
      campaign_id: campaignId,
      from: payout.adjustment_amount,
      to: parsed.data.adjustment_amount,
      reason: parsed.data.adjustment_reason,
      total_amount: totalAmount,
    },
  });

  revalidateFinance(campaignId);
  return ok("Penyesuaian disimpan.");
}

/** FR-M8-03: owner-only status changes. */
async function changePayoutStatus(
  campaignId: string,
  payoutId: string,
  to: "disetujui" | "draf",
): Promise<ActionResult> {
  const session = await requireRole("owner");
  if (!validIds(campaignId, payoutId)) return fail("ID tidak valid.");

  const supabase = await createSupabaseServerClient();
  const payout = await loadPayout(supabase, campaignId, payoutId);
  if (!payout) return fail("Honor tidak ditemukan.");
  const expected = to === "disetujui" ? "draf" : "disetujui";
  if (payout.status !== expected) {
    return fail(
      to === "disetujui"
        ? "Hanya honor berstatus draf yang dapat disetujui."
        : "Hanya honor berstatus disetujui yang dapat dibatalkan persetujuannya.",
    );
  }

  const { error } = await supabase.from("payouts").update({ status: to }).eq("id", payoutId);
  if (error) return fail(dbRuleMessage(error, "Status honor gagal diubah."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "payout",
    entityId: payoutId,
    action: to === "disetujui" ? "approve" : "revoke_approval",
    details: { campaign_id: campaignId, total_amount: payout.total_amount },
  });

  revalidateFinance(campaignId);
  return ok(
    to === "disetujui" ? "Honor disetujui." : "Persetujuan dibatalkan; honor kembali draf.",
  );
}

export async function approvePayoutAction(campaignId: string, payoutId: string) {
  return changePayoutStatus(campaignId, payoutId, "disetujui");
}

export async function revokePayoutApprovalAction(campaignId: string, payoutId: string) {
  return changePayoutStatus(campaignId, payoutId, "draf");
}

/** FR-M8-03: `dibayar` with payment date and transfer proof (owner only). */
export async function markPayoutPaidAction(
  campaignId: string,
  payoutId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireRole("owner");
  if (!validIds(campaignId, payoutId)) return fail("ID tidak valid.");
  const parsed = markPaidSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  if (!isOwnProofPath(campaignId, parsed.data.transfer_proof_path)) {
    return fail("Lokasi bukti transfer tidak valid.");
  }
  const payout = await loadPayout(supabase, campaignId, payoutId);
  if (!payout) {
    await removeProof(supabase, parsed.data.transfer_proof_path);
    return fail("Honor tidak ditemukan.");
  }
  if (payout.status !== "disetujui") {
    await removeProof(supabase, parsed.data.transfer_proof_path);
    return fail("Honor harus disetujui sebelum ditandai dibayar.");
  }

  const { error } = await supabase
    .from("payouts")
    .update({ status: "dibayar", ...parsed.data })
    .eq("id", payoutId);
  if (error) {
    await removeProof(supabase, parsed.data.transfer_proof_path);
    return fail(dbRuleMessage(error, "Status dibayar gagal disimpan."));
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "payout",
    entityId: payoutId,
    action: "paid",
    details: {
      campaign_id: campaignId,
      total_amount: payout.total_amount,
      paid_at: parsed.data.paid_at,
    },
  });

  revalidateFinance(campaignId);
  return ok("Honor ditandai dibayar.");
}

/* ------------------------------------------------------------------ */
/* Client payments (FR-M8-05)                                           */
/* ------------------------------------------------------------------ */

export async function createClientPaymentAction(
  campaignId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireSession();
  if (!validIds(campaignId)) return fail("ID kampanye tidak valid.");
  const parsed = clientPaymentSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("client_payments")
    .insert({ ...parsed.data, campaign_id: campaignId })
    .select("id")
    .single();
  if (error) {
    const message = dbRuleMessage(error, "Invoice gagal disimpan.");
    return message === "Nomor invoice sudah dipakai."
      ? { status: "error", message, fieldErrors: { invoice_number: message } }
      : fail(message);
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "client_payment",
    entityId: data.id,
    action: "create",
    details: { campaign_id: campaignId, ...parsed.data },
  });

  revalidateFinance(campaignId);
  return ok("Invoice dicatat.");
}

/**
 * Records money received on an invoice. The status (belum dibayar / sebagian /
 * lunas) is derived by the database from the paid amount. Proofs are owner-only.
 */
export async function recordClientPaymentAction(
  campaignId: string,
  paymentId: string,
  values: unknown,
): Promise<ActionResult> {
  const session = await requireSession();
  if (!validIds(campaignId, paymentId)) return fail("ID tidak valid.");
  const parsed = clientPaymentReceiptSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data: payment } = await supabase
    .from("client_payments")
    .select("id, proof_path, paid_amount")
    .eq("id", paymentId)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (!payment) return fail("Invoice tidak ditemukan.");

  const isOwner = session.profile.role === "owner";
  const newProof = parsed.data.proof_path;
  if (newProof && newProof !== payment.proof_path) {
    if (!isOwner) return fail("Bukti keuangan hanya dapat dikelola owner.");
    if (!isOwnProofPath(campaignId, newProof)) return fail("Lokasi bukti tidak valid.");
  }

  const { error } = await supabase
    .from("client_payments")
    .update({
      paid_amount: parsed.data.paid_amount,
      paid_at: parsed.data.paid_at,
      // Managers never touch the proof column.
      ...(isOwner ? { proof_path: newProof ?? payment.proof_path } : {}),
    })
    .eq("id", paymentId);
  if (error) {
    if (newProof !== payment.proof_path) await removeProof(supabase, newProof);
    return fail(dbRuleMessage(error, "Pembayaran gagal dicatat."));
  }
  if (isOwner && newProof && payment.proof_path && newProof !== payment.proof_path) {
    await removeProof(supabase, payment.proof_path);
  }

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "client_payment",
    entityId: paymentId,
    action: "payment_recorded",
    details: {
      campaign_id: campaignId,
      from: payment.paid_amount,
      to: parsed.data.paid_amount,
      paid_at: parsed.data.paid_at,
      proof_attached: Boolean(newProof),
    },
  });

  revalidateFinance(campaignId);
  return ok("Pembayaran dicatat.");
}

/** Owner-only; the database refuses anyone else. */
export async function deleteClientPaymentAction(
  campaignId: string,
  paymentId: string,
): Promise<ActionResult> {
  const session = await requireRole("owner");
  if (!validIds(campaignId, paymentId)) return fail("ID tidak valid.");

  const supabase = await createSupabaseServerClient();
  const { data: payment } = await supabase
    .from("client_payments")
    .select("invoice_number, proof_path")
    .eq("id", paymentId)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (!payment) return fail("Invoice tidak ditemukan.");

  const { error } = await supabase.from("client_payments").delete().eq("id", paymentId);
  if (error) return fail(dbRuleMessage(error, "Invoice gagal dihapus."));
  await removeProof(supabase, payment.proof_path);

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "client_payment",
    entityId: paymentId,
    action: "delete",
    details: { campaign_id: campaignId, invoice_number: payment.invoice_number },
  });

  revalidateFinance(campaignId);
  return ok("Invoice dihapus.");
}
