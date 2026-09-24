"use server";

import { revalidatePath } from "next/cache";
import { dbRuleMessage, fail, invalid, ok, type ActionResult } from "@/lib/actions";
import { requireRole } from "@/lib/auth/guards";
import { formatRupiah } from "@/lib/format/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  balanceAdjustmentSchema,
  minWithdrawalSchema,
  withdrawalProcessSchema,
} from "@/lib/validation/withdrawals";
import { logActivity } from "@/lib/activity/log";
import { notifyWithdrawalPaid } from "@/lib/email/notify";

/*
 * Owner-only money actions (PRD M19: FR-M19-06, FR-M19-08). The role is
 * checked here and again inside `process_withdrawal()` / `adjust_balance()`,
 * which also write the audit entries (FR-M11-01).
 */

/** Proofs are uploaded into the `withdrawals/` folder; reject any other path. */
function isWithdrawalProofPath(path: string): boolean {
  return path.startsWith("withdrawals/") && !path.includes("..");
}

/** FR-M19-06: diajukan → diproses → dibayar, or ditolak (balance refunded). */
export async function processWithdrawalAction(values: unknown): Promise<ActionResult> {
  await requireRole("owner");
  const parsed = withdrawalProcessSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const input = parsed.data;

  if (input.status === "dibayar" && !isWithdrawalProofPath(input.proof_path)) {
    return fail("Lokasi berkas bukti tidak valid.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("process_withdrawal", {
    p_id: input.withdrawal_id,
    p_status: input.status,
    p_paid_at: input.status === "dibayar" ? input.paid_at : undefined,
    p_proof_path: input.status === "dibayar" ? input.proof_path : undefined,
    p_reason: input.status === "ditolak" ? input.reason : undefined,
    p_transfer_fee: input.status === "dibayar" ? input.transfer_fee : undefined,
  });
  if (error) return fail(dbRuleMessage(error, "Status penarikan gagal disimpan."));

  revalidatePath("/penarikan");
  revalidatePath("/dashboard");
  if (input.status === "dibayar") notifyWithdrawalPaid(supabase, input.withdrawal_id);
  const messages = {
    diproses: "Penarikan ditandai diproses.",
    dibayar:
      input.status === "dibayar" && input.transfer_fee > 0
        ? `Penarikan ditandai dibayar; biaya transfer ${formatRupiah(input.transfer_fee)} ditanggung klipper.`
        : "Penarikan ditandai dibayar.",
    ditolak: "Penarikan ditolak; saldo klipper dikembalikan.",
  } as const;
  return ok(messages[input.status]);
}

/** FR-M19-06: the owner's signed correction of a klipper balance. */
export async function adjustBalanceAction(values: unknown): Promise<ActionResult> {
  await requireRole("owner");
  const parsed = balanceAdjustmentSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("adjust_balance", {
    p_creator_id: parsed.data.creator_id,
    p_amount: parsed.data.amount,
    p_reason: parsed.data.reason,
  });
  if (error) return fail(dbRuleMessage(error, "Penyesuaian gagal disimpan."));

  revalidatePath(`/creators/${parsed.data.creator_id}`);
  const sign = parsed.data.amount > 0 ? "+" : "";
  return ok(`Penyesuaian ${sign}${formatRupiah(parsed.data.amount)} tercatat.`);
}

/** Pengaturan → Penarikan: the minimum withdrawal (owner decision). */
export async function updateMinWithdrawalAction(values: unknown): Promise<ActionResult> {
  const session = await requireRole("owner");
  const parsed = minWithdrawalSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const { data: before } = await supabase
    .from("platform_settings")
    .select("min_withdrawal")
    .maybeSingle();
  const { error } = await supabase
    .from("platform_settings")
    .update({ min_withdrawal: parsed.data.min_withdrawal, updated_by: session.user.id })
    .eq("id", true);
  if (error) return fail(dbRuleMessage(error, "Minimum penarikan gagal disimpan."));

  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "platform_settings",
    entityId: null,
    action: "min_withdrawal_change",
    details: { from: before?.min_withdrawal ?? null, to: parsed.data.min_withdrawal },
  });

  revalidatePath("/settings/penarikan");
  revalidatePath("/portal", "layout");
  return ok(`Minimum penarikan kini ${formatRupiah(parsed.data.min_withdrawal)}.`);
}
