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
  getPortalProfile,
  listPortalLedger,
  listPortalWithdrawals,
} from "@/lib/data/portal";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarDate, formatDateTime } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { BankAccountCard } from "./bank-account-card";
import { BirthDateCard } from "./birth-date-card";
import { WithdrawForm } from "./withdraw-form";

export const metadata: Metadata = { title: "Saldo" };

/**
 * FR-M19-03 … FR-M19-07. A blocked kliper lands here too (FR-M3-09): they
 * read their frozen balance and history, and cannot withdraw.
 */
export default async function PortalBalancePage() {
  const session = await requireCreatorAccount();
  const tz = session.profile.timezone;
  const supabase = await createSupabaseServerClient();
  const [balance, bank, ledger, withdrawals, profile] = await Promise.all([
    getPortalBalance(supabase),
    getPortalBankAccount(supabase),
    listPortalLedger(supabase),
    listPortalWithdrawals(supabase),
    getPortalProfile(supabase),
  ]);
  // A blocked kliper has no profile row here; their first blocker is the block.
  const needsBirthDate = !session.blocked && profile !== null && !profile.birth_date;

  const available = balance?.available ?? 0;
  const minWithdrawal = balance?.min_withdrawal ?? 0;
  const now = new Date();
  const holdUntil = bank?.hold_until ? new Date(bank.hold_until) : null;
  const open = withdrawals.find((row) => row.status === "diajukan" || row.status === "diproses");
  const inProgress = open?.amount ?? 0;

  // Explain the first thing in the way before any amount is typed.
  const [first] = withdrawalBlockers({
    creatorBlocked: session.blocked,
    hasBirthDate: !needsBirthDate,
    hasBankAccount: bank !== null,
    bankHoldUntil: holdUntil,
    openWithdrawalStatuses: withdrawals.map((row) => row.status),
    amount: Math.max(available, minWithdrawal),
    available,
    minWithdrawal,
    now,
  });
  const blockerMessages: Record<WithdrawalBlocker, string> = {
    creator_blocked: "Akunmu diblokir, jadi saldo dibekukan sampai owner memutuskan.",
    no_birth_date: "Lengkapi tanggal lahirmu dulu, baru kamu bisa tarik saldo.",
    no_bank_account: "Isi rekening atau e-wallet di bawah dulu, baru kamu bisa tarik saldo.",
    bank_recently_changed: holdUntil
      ? `Rekeningmu baru diubah. Kamu bisa tarik saldo lagi mulai ${formatDateTime(holdUntil, tz)}.`
      : "Rekening baru diubah.",
    withdrawal_in_progress: "Penarikanmu lagi diproses. Tunggu sampai selesai, ya.",
    below_minimum: `Saldomu belum sampai minimum penarikan ${formatRupiah(minWithdrawal)}. Kirim klip lagi, yuk!`,
    above_balance: `Saldomu belum sampai minimum penarikan ${formatRupiah(minWithdrawal)}. Kirim klip lagi, yuk!`,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Saldo"
        description="Honor dari klip yang disetujui masuk ke sini. Sudah sampai minimum? Tarik ke rekeningmu."
      />

      {session.blocked ? (
        <Alert variant="destructive">
          <Ban />
          <AlertTitle>Akunmu diblokir</AlertTitle>
          <AlertDescription>
            {session.blockedReason ? `Alasan: ${session.blockedReason}. ` : ""}
            Untuk sementara kamu nggak bisa gabung kampanye, kirim klip, atau tarik saldo. Saldomu
            dibekukan sampai owner memutuskan. Ada pertanyaan? Hubungi tim.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Saldo tersedia", value: available, strong: true },
          { label: "Total diterima", value: balance?.total_earned ?? 0 },
          { label: "Lagi ditarik", value: inProgress },
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
          Saldomu minus karena ada honor yang dibatalkan setelah sempat ditarik. Honor berikutnya
          dipakai untuk menutup kekurangan ini dulu.
        </p>
      ) : null}

      {needsBirthDate ? <BirthDateCard /> : null}

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
          <CardDescription>
            Pantau status setiap penarikan dan kapan uangnya ditransfer.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Kamu belum pernah tarik saldo.</p>
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
                        Ditolak: {row.rejection_reason}. Tenang, saldonya sudah dikembalikan.
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
              Belum ada honor. Kirim klip pertamamu dari{" "}
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
