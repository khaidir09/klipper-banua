"use server";

import { revalidatePath } from "next/cache";
import { dbRuleMessage, fail, invalid, ok, type ActionResult } from "@/lib/actions";
import { logActivity } from "@/lib/activity/log";
import { requireCreator } from "@/lib/auth/guards";
import { withdrawalBlockers, type WithdrawalBlocker } from "@/lib/calculations/balance";
import { getPortalBalance, getPortalBankAccount, listPortalWithdrawals } from "@/lib/data/portal";
import { formatRupiah } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { portalBankAccountSchema, withdrawalRequestSchema } from "@/lib/validation/withdrawals";

/*
 * The klipper's bank account and withdrawals (PRD M19: FR-M19-04,
 * FR-M19-05). The checks here explain; `save_creator_bank_account()` and
 * `request_withdrawal()` decide again under a row lock. `requireCreator`
 * already keeps a blocked klipper out of both (FR-M3-09).
 */

function revalidateBalance() {
  revalidatePath("/portal/saldo");
  revalidatePath("/portal/profil");
  revalidatePath("/portal");
}

/** FR-M19-04: save or change the klipper's own account. */
export async function saveOwnBankAccountAction(values: unknown): Promise<ActionResult> {
  await requireCreator();
  const parsed = portalBankAccountSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);

  const supabase = await createSupabaseServerClient();
  const before = await getPortalBankAccount(supabase);
  const { error } = await supabase.rpc("save_creator_bank_account", {
    p_bank_name: parsed.data.bank_name,
    p_account_number: parsed.data.account_number,
    p_account_holder: parsed.data.account_holder,
  });
  if (error) return fail(dbRuleMessage(error, "Rekening gagal disimpan."));

  const after = await getPortalBankAccount(supabase);
  revalidateBalance();
  if (after && !after.holder_matches_name) {
    return ok(
      "Rekening tersimpan. Nama pemiliknya beda dengan nama lengkap akunmu, jadi owner bakal cek dulu sebelum transfer.",
    );
  }
  return ok(
    before
      ? "Rekening diperbarui. Kamu bisa tarik saldo lagi 24 jam dari sekarang."
      : "Rekening tersimpan.",
  );
}

/** FR-M19-05: ask for a withdrawal of part or all of the balance. */
export async function requestWithdrawalAction(values: unknown): Promise<ActionResult> {
  const session = await requireCreator();
  const parsed = withdrawalRequestSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const { amount } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const [balance, bank, withdrawals] = await Promise.all([
    getPortalBalance(supabase),
    getPortalBankAccount(supabase),
    listPortalWithdrawals(supabase),
  ]);
  if (!balance) return fail("Data saldo tidak ditemukan.");

  const blockers = withdrawalBlockers({
    creatorBlocked: false,
    hasBankAccount: bank !== null,
    bankHoldUntil: bank?.hold_until ? new Date(bank.hold_until) : null,
    openWithdrawalStatuses: withdrawals.map((row) => row.status),
    amount,
    available: balance.available,
    minWithdrawal: balance.min_withdrawal,
    now: new Date(),
  });
  if (blockers[0]) {
    const tz = session.profile.timezone;
    const messages: Record<WithdrawalBlocker, string> = {
      creator_blocked: "Akunmu diblokir, jadi saldo belum bisa ditarik.",
      no_bank_account: "Isi rekening atau e-wallet dulu, ya.",
      bank_recently_changed: bank?.hold_until
        ? `Rekeningmu baru diubah. Kamu bisa tarik saldo lagi mulai ${formatDateTime(bank.hold_until, tz)}.`
        : "Rekeningmu baru diubah. Tunggu 24 jam, ya.",
      withdrawal_in_progress: "Masih ada penarikan yang lagi diproses.",
      below_minimum: `Minimum penarikan ${formatRupiah(balance.min_withdrawal)}.`,
      above_balance: `Nominalnya lebih besar dari saldomu (${formatRupiah(balance.available)}).`,
    };
    const message = messages[blockers[0]];
    return { status: "error", message, fieldErrors: { amount: message } };
  }

  const { data: withdrawalId, error } = await supabase.rpc("request_withdrawal", {
    p_amount: amount,
  });
  if (error) return fail(dbRuleMessage(error, "Penarikan gagal diajukan."));

  // The database already wrote the audit entry; this one ties it to the portal.
  await logActivity(supabase, {
    actorId: session.user.id,
    entityType: "withdrawal",
    entityId: withdrawalId,
    action: "withdrawal_request",
    details: { amount, from_portal: true },
  });

  revalidateBalance();
  return ok(`Penarikan ${formatRupiah(amount)} diajukan! Tim transfer paling lambat 1 hari kerja.`);
}
