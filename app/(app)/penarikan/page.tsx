import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Download, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { WithdrawalStatusBadge } from "@/components/status/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { logActivity } from "@/lib/activity/log";
import { requireRole } from "@/lib/auth/guards";
import { WITHDRAWAL_STATUS_LABELS } from "@/lib/constants/withdrawals";
import { listWithdrawals } from "@/lib/data/withdrawals";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarDate, formatDateInput, formatDateTime } from "@/lib/format/date";
import { resolveTimezone } from "@/lib/format/timezone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { withdrawalListQuerySchema } from "@/lib/validation/withdrawals";
import { periodBounds } from "./period";
import { WithdrawalActions } from "./withdrawal-actions";

export const metadata: Metadata = { title: "Penarikan" };

const TABS = ["diajukan", "diproses", "dibayar", "ditolak", "semua"] as const;

/** FR-M19-06, FR-M19-08: the owner's withdrawal queue. Target: ≤ 1 working day. */
export default async function WithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireRole("owner");
  const tz = resolveTimezone(session.profile.timezone);
  const query = withdrawalListQuerySchema.parse(await searchParams);
  const supabase = await createSupabaseServerClient();
  const rows = await listWithdrawals(supabase, query, periodBounds(query, tz));
  // FR-M11-01: the owner saw full account numbers.
  if (rows.length) {
    await logActivity(supabase, {
      actorId: session.user.id,
      entityType: "withdrawal",
      entityId: null,
      action: "bank_account_viewed",
      details: { page: "penarikan", status: query.status, rows: rows.length },
    });
  }

  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const paid = rows.filter((row) => row.status === "dibayar").reduce((s, r) => s + r.amount, 0);
  const open = rows
    .filter((row) => row.status === "diajukan" || row.status === "diproses")
    .reduce((s, r) => s + r.amount, 0);

  const params = (overrides: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    const merged = { status: query.status, dari: query.dari, sampai: query.sampai, ...overrides };
    for (const [key, value] of Object.entries(merged)) if (value) next.set(key, value);
    return next.toString();
  };
  const today = formatDateInput(new Date(), tz);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Penarikan"
        description="Transfer manual ke rekening klipper, lalu tandai dibayar dengan bukti. Target: diproses paling lambat 1 hari kerja."
        actions={
          <Button variant="outline" asChild>
            <a href={`/penarikan/csv?${params({})}`}>
              <Download aria-hidden />
              Ekspor CSV
            </a>
          </Button>
        }
      />

      <nav className="flex flex-wrap gap-1 border-b" aria-label="Status penarikan">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={`/penarikan?${params({ status: tab })}`}
            aria-current={query.status === tab ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm",
              query.status === tab
                ? "border-foreground font-medium"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "semua" ? "Semua" : WITHDRAWAL_STATUS_LABELS[tab]}
          </Link>
        ))}
      </nav>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <input type="hidden" name="status" value={query.status} />
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">Diajukan dari</span>
          <Input type="date" name="dari" defaultValue={query.dari} className="w-auto" />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="text-muted-foreground">sampai</span>
          <Input type="date" name="sampai" defaultValue={query.sampai} className="w-auto" />
        </label>
        <Button type="submit" variant="outline">
          Terapkan
        </Button>
      </form>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { label: `Total (${rows.length} penarikan)`, value: total },
          { label: "Sudah dibayar", value: paid },
          { label: "Belum dibayar", value: open },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-semibold tabular-nums">{formatRupiah(item.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Tidak ada penarikan untuk filter ini.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Klipper</TableHead>
                <TableHead>Rekening</TableHead>
                <TableHead className="text-right">Nominal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Tindakan</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Link
                      href={`/creators/${row.creatorId}`}
                      className="font-medium hover:underline"
                    >
                      {row.creatorName}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {row.stageName ? `${row.stageName} · ` : ""}diajukan{" "}
                      {formatDateTime(row.requestedAt, tz)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono">{row.accountNumber}</span>
                    <span className="block text-xs text-muted-foreground">
                      {row.bankName} · a.n. {row.accountHolder}
                    </span>
                    {!row.holderMatchesName ? (
                      <Badge variant="warning" className="mt-1">
                        <AlertTriangle aria-hidden />
                        Nama pemilik tidak sama
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatRupiah(row.amount)}
                    {row.transferFee > 0 ? (
                      <span className="block text-xs font-normal text-muted-foreground">
                        biaya {formatRupiah(row.transferFee)} · diterima{" "}
                        {formatRupiah(row.amount - row.transferFee)}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <WithdrawalStatusBadge status={row.status} />
                    {row.paidAt ? (
                      <span className="block text-xs text-muted-foreground">
                        {formatCalendarDate(row.paidAt)}
                        {row.proofUrl ? (
                          <>
                            {" · "}
                            <a
                              href={row.proofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 hover:underline"
                            >
                              bukti
                              <ExternalLink className="size-3" aria-hidden />
                            </a>
                          </>
                        ) : null}
                      </span>
                    ) : null}
                    {row.rejectionReason ? (
                      <span className="block max-w-56 text-xs text-muted-foreground">
                        {row.rejectionReason}
                      </span>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <WithdrawalActions
                      id={row.id}
                      status={row.status}
                      amount={row.amount}
                      accountLabel={`${row.bankName} ${row.accountNumber} a.n. ${row.accountHolder}`}
                      today={today}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Alur: Diajukan → Diproses → Dibayar, atau Ditolak (saldo dikembalikan). Nomor rekening
        lengkap hanya tampil untuk owner.
      </p>
    </div>
  );
}
