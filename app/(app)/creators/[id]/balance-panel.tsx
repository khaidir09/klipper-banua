import { WithdrawalStatusBadge } from "@/components/status/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { BalanceSummary } from "@/lib/calculations/balance";
import { LEDGER_ENTRY_TYPE_LABELS, type WithdrawalStatus } from "@/lib/constants/withdrawals";
import type { CreatorClipStats, CreatorLedgerLine } from "@/lib/data/withdrawals";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarDate, formatDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { cn } from "@/lib/utils";
import { AdjustBalanceForm } from "./adjust-balance-form";

type CreatorWithdrawal = {
  id: string;
  amount: number;
  bank_name: string;
  status: WithdrawalStatus;
  requested_at: string;
  paid_at: string | null;
  rejection_reason: string | null;
};

/** FR-M3-08, FR-M19-03: the klipper's clips, balance and money history. */
export function BalancePanel({
  creatorId,
  isOwner,
  stats,
  summary,
  lines,
  withdrawals,
  timezone,
}: {
  creatorId: string;
  isOwner: boolean;
  stats: CreatorClipStats;
  summary: BalanceSummary;
  lines: CreatorLedgerLine[];
  withdrawals: CreatorWithdrawal[];
  timezone: string;
}) {
  const figures = [
    { label: "Klip disetujui", value: formatNumber(stats.approved) },
    { label: "Klip ditolak", value: formatNumber(stats.rejected) },
    { label: "Views terverifikasi", value: formatNumber(stats.verifiedViews) },
    { label: "Total honor", value: formatRupiah(summary.totalEarned) },
    { label: "Saldo saat ini", value: formatRupiah(summary.available) },
    { label: "Total ditarik", value: formatRupiah(summary.totalWithdrawn) },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {figures.map((item) => (
          <div key={item.label} className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Riwayat saldo</CardTitle>
            <CardDescription>
              Buku besar tidak dapat diubah; koreksi lewat penyesuaian.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lines.length === 0 ? (
              <p className="text-sm text-muted-foreground">Belum ada entri.</p>
            ) : (
              <ul className="divide-y text-sm">
                {lines.map((line) => (
                  <li key={line.id} className="flex items-start justify-between gap-3 py-2.5">
                    <span className="min-w-0">
                      <span className="font-medium">
                        {LEDGER_ENTRY_TYPE_LABELS[line.entryType]}
                      </span>
                      <span className="block text-muted-foreground">
                        {formatDateTime(line.createdAt, timezone)}
                        {line.campaignName ? ` · ${line.campaignName}` : ""}
                      </span>
                      {line.notes ? (
                        <span className="block text-muted-foreground">{line.notes}</span>
                      ) : null}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 tabular-nums",
                        line.amount < 0 ? "text-destructive" : "text-success-soft-foreground",
                      )}
                    >
                      {line.amount > 0 ? "+" : ""}
                      {formatRupiah(line.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {isOwner ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Penarikan</CardTitle>
              </CardHeader>
              <CardContent>
                {withdrawals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Belum ada penarikan.</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {withdrawals.map((row) => (
                      <li key={row.id} className="flex items-center justify-between gap-2 py-2.5">
                        <span>
                          <span className="font-medium tabular-nums">
                            {formatRupiah(row.amount)}
                          </span>
                          <span className="block text-muted-foreground">
                            {row.bank_name} · {formatDateTime(row.requested_at, timezone)}
                            {row.paid_at ? ` · dibayar ${formatCalendarDate(row.paid_at)}` : ""}
                          </span>
                          {row.rejection_reason ? (
                            <span className="block text-muted-foreground">
                              {row.rejection_reason}
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
                <CardTitle>Penyesuaian saldo</CardTitle>
                <CardDescription>
                  Hanya owner. Tercatat di buku besar dan log aktivitas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdjustBalanceForm creatorId={creatorId} />
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Penarikan dan penyesuaian saldo hanya dapat dilihat dan dikelola owner.
          </p>
        )}
      </div>
    </div>
  );
}
