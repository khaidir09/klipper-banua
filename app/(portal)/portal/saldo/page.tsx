import type { Metadata } from "next";
import Link from "next/link";
import { Ban } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WithdrawalStatusBadge } from "@/components/status/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreatorAccount } from "@/lib/auth/guards";
import { withdrawalBlockers, type WithdrawalBlocker } from "@/lib/calculations/balance";
import { LEDGER_ENTRY_TYPE_LABELS } from "@/lib/constants/withdrawals";
import {
  getPortalBalance,
  getPortalBankAccount,
  listPortalLedger,
  listPortalWithdrawals,
} from "@/lib/data/portal";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarDate, formatDateTime } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { BankAccountCard } from "./bank-account-card";
import { WithdrawForm } from "./withdraw-form";

export const metadata: Metadata = { title: "Saldo" };

/**
 * FR-M19-03 … FR-M19-07. A blocked klipper lands here too (FR-M3-09): they
 * read their frozen balance and history, and cannot withdraw.
 */
export default async function PortalBalancePage() {
  const session = await requireCreatorAccount();
  const tz = session.profile.timezone;
  const supabase = await createSupabaseServerClient();
  const [balance, bank, ledger, withdrawals] = await Promise.all([
    getPortalBalance(supabase),
    getPortalBankAccount(supabase),
    listPortalLedger(supabase),
    listPortalWithdrawals(supabase),
  ]);

  const available = balance?.available ?? 0;
  const minWithdrawal = balance?.min_withdrawal ?? 0;
  const now = new Date();
  const holdUntil = bank?.hold_until ? new Date(bank.hold_until) : null;
  const open = withdrawals.find((row) => row.status === "diajukan" || row.status === "diproses");
  const inProgress = open?.amount ?? 0;

  // Explain the first thing in the way before any amount is typed.
  const [first] = withdrawalBlockers({
    creatorBlocked: session.blocked,
    hasBankAccount: bank !== null,
    bankHoldUntil: holdUntil,
    openWithdrawalStatuses: withdrawals.map((row) => row.status),
    amount: Math.max(available, minWithdrawal),
    available,
    minWithdrawal,
    now,
  });
  const blockerMessages: Record<WithdrawalBlocker, string> = {
    creator_blocked: "Akun Anda diblokir; saldo dibekukan sampai owner memutuskan.",
    no_bank_account: "Isi rekening atau e-wallet di bawah untuk mulai menarik saldo.",
    bank_recently_changed: holdUntil
      ? `Rekening baru diubah. Penarikan dapat diajukan mulai ${formatDateTime(holdUntil, tz)}.`
      : "Rekening baru diubah.",
    withdrawal_in_progress: "Penarikan Anda sedang diproses; tunggu sampai selesai.",
    below_minimum: `Saldo belum mencapai minimum penarikan ${formatRupiah(minWithdrawal)}.`,
    above_balance: `Saldo belum mencapai minimum penarikan ${formatRupiah(minWithdrawal)}.`,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saldo"
        description="Honor dari klip yang disetujui masuk ke sini. Tarik ke rekening Anda setelah mencapai minimum."
      />

      {session.blocked ? (
        <Alert variant="destructive">
          <Ban />
          <AlertTitle>Akun Anda diblokir</AlertTitle>
          <AlertDescription>
            {session.blockedReason ? `Alasan: ${session.blockedReason}. ` : ""}
            Anda tidak dapat bergabung, mengirim klip, atau menarik saldo. Saldo dibekukan sampai
            owner memutuskan. Hubungi tim bila ada pertanyaan.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Saldo tersedia", value: available, strong: true },
          { label: "Total diterima", value: balance?.total_earned ?? 0 },
          { label: "Sedang ditarik", value: inProgress },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p
                className={cn(
                  "text-2xl font-semibold tabular-nums",
                  item.strong && item.value < 0 && "text-destructive",
                )}
              >
                {formatRupiah(item.value)}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
      {available < 0 ? (
        <p className="text-sm text-muted-foreground">
          Saldo negatif karena ada honor yang dibatalkan setelah ditarik. Honor berikutnya menutup
          kekurangan ini lebih dahulu.
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <WithdrawForm
          available={available}
          minWithdrawal={minWithdrawal}
          blocker={first ? blockerMessages[first] : null}
        />
        <BankAccountCard
          fullName={session.profile.full_name}
          readOnly={session.blocked}
          account={
            bank
              ? {
                  bankName: bank.bank_name,
                  numberMasked: bank.account_number_masked,
                  holder: bank.account_holder,
                  holderMatchesName: bank.holder_matches_name,
                  holdUntilLabel:
                    holdUntil && holdUntil > now ? formatDateTime(holdUntil, tz) : null,
                }
              : null
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Penarikan</h2>
          </CardTitle>
          <CardDescription>Status setiap penarikan dan tanggal transfernya.</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada penarikan.</p>
          ) : (
            <ul className="divide-y text-sm">
              {withdrawals.map((row) => (
                <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span>
                    <span className="font-medium tabular-nums">{formatRupiah(row.amount)}</span>
                    <span className="block text-muted-foreground">
                      {row.bank_name} {row.account_number_masked} · diajukan{" "}
                      {formatDateTime(row.requested_at, tz)}
                      {row.paid_at ? ` · dibayar ${formatCalendarDate(row.paid_at)}` : ""}
                    </span>
                    {row.status === "dibayar" && row.transfer_fee > 0 ? (
                      <span className="block text-muted-foreground">
                        Biaya transfer {formatRupiah(row.transfer_fee)} · diterima{" "}
                        {formatRupiah(row.net_amount)}
                      </span>
                    ) : null}
                    {row.rejection_reason ? (
                      <span className="block text-destructive">
                        Ditolak: {row.rejection_reason}. Saldo sudah dikembalikan.
                      </span>
                    ) : null}
                  </span>
                  <WithdrawalStatusBadge status={row.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Riwayat saldo</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ledger.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada honor. Kirim klip dari{" "}
              <Link href="/portal/penugasan" className="font-medium underline">
                Kampanye Saya
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y text-sm">
              {ledger.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="font-medium">
                      {LEDGER_ENTRY_TYPE_LABELS[entry.entry_type]}
                    </span>
                    <span className="block text-muted-foreground">
                      {formatDateTime(entry.created_at, tz)}
                      {entry.campaign_name ? ` · ${entry.campaign_name}` : ""}
                    </span>
                    {entry.notes ? (
                      <span className="block text-muted-foreground">{entry.notes}</span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      "shrink-0 font-medium tabular-nums",
                      entry.amount < 0 ? "text-destructive" : "text-success-soft-foreground",
                    )}
                  >
                    {entry.amount > 0 ? "+" : ""}
                    {formatRupiah(entry.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
