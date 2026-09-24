"use client";

import { Fragment, useState, useTransition } from "react";
import { Calculator, ChevronDown, ChevronUp, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ClientPaymentStatusBadge, PayoutStatusBadge } from "@/components/status/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { EffectiveFeeScheme } from "@/lib/calculations/fee-scheme";
import type { CampaignFinance } from "@/lib/calculations/finance";
import { INELIGIBLE_REASON_LABELS, type PayoutCalculation } from "@/lib/calculations/payout";
import type { CampaignStatus } from "@/lib/constants/campaigns";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/constants/creators";
import { type ClientPaymentStatus, type PayoutStatus } from "@/lib/constants/finance";
import type { FinanceAssignment } from "@/lib/data/finance";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarDate, formatDateTime } from "@/lib/format/date";
import { formatNumber, formatPercent } from "@/lib/format/number";
import {
  approvePayoutAction,
  calculateAllPayoutsAction,
  calculatePayoutAction,
  deleteClientPaymentAction,
  revokePayoutApprovalAction,
} from "../../finance-actions";
import {
  AdjustmentDialog,
  ClientPaymentDialog,
  MarkPaidDialog,
  ReceiptDialog,
} from "./finance-dialogs";

type PayoutView = {
  id: string;
  status: PayoutStatus;
  base_amount: number;
  views_bonus: number;
  registrant_bonus: number;
  adjustment_amount: number;
  adjustment_reason: string;
  total_amount: number;
  calculated_at: string;
  approved_at: string | null;
  approverName: string | null;
  paid_at: string | null;
  proofUrl: string | null;
  outdated: boolean;
};

export type FinanceRow = {
  assignment: FinanceAssignment;
  scheme: EffectiveFeeScheme;
  preview: PayoutCalculation;
  payout: PayoutView | null;
};

export type PaymentView = {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  status: ClientPaymentStatus;
  paid_amount: number;
  paid_at: string | null;
  proofUrl: string | null;
};

type Props = {
  campaignId: string;
  campaignStatus: CampaignStatus;
  isOwner: boolean;
  summary: CampaignFinance;
  rows: FinanceRow[];
  payments: PaymentView[];
  contentInfo: Record<string, { platform: string; posted_url: string | null }>;
};

const dash = (value: number | null, format: (v: number) => string) =>
  value === null ? "–" : format(value);

function Tile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

type Dialog =
  | { kind: "adjust" | "paid"; row: FinanceRow }
  | { kind: "new-payment" }
  | { kind: "receipt"; payment: PaymentView }
  | null;

export function FinancePanel(props: Props) {
  const { campaignId, campaignStatus, isOwner, summary } = props;
  const closed = campaignStatus === "selesai";
  const [dialog, setDialog] = useState<Dialog>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ status: string; message: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Harga paket" value={formatRupiah(summary.packagePrice)} />
        <Tile
          label="Diterima dari klien"
          value={formatRupiah(summary.clientPaid)}
          detail={`Sisa tagihan ${formatRupiah(summary.clientOutstanding)}`}
        />
        {summary.perViews ? (
          <>
            <Tile
              label="Anggaran klipper"
              value={formatRupiah(summary.perViews.creatorBudget)}
              detail={`Sisa ${formatRupiah(summary.perViews.budgetRemaining)}`}
            />
            <Tile
              label="Honor terpakai"
              value={formatRupiah(summary.perViews.creatorCost)}
              detail={`${formatPercent(summary.perViews.budgetUsedPct)} dari anggaran · dari buku besar saldo`}
            />
          </>
        ) : (
          <Tile
            label="Total honor kreator"
            value={formatRupiah(summary.totalPayouts)}
            detail="Semua honor tercatat (draf, disetujui, dibayar)"
          />
        )}
        <Tile
          label="Margin kotor"
          value={formatRupiah(summary.grossMargin)}
          detail={dash(summary.grossMarginPct, (v) => `${formatPercent(v)} dari harga paket`)}
        />
        <Tile
          label="Biaya per pendaftar"
          value={dash(summary.costPerRegistrant, formatRupiah)}
          detail={
            summary.costPerRegistrant === null ? "Belum ada pendaftar" : "Harga paket ÷ pendaftar"
          }
        />
        <Tile
          label="CPM"
          value={dash(summary.cpm, formatRupiah)}
          detail={summary.cpm === null ? "Belum ada views" : "Biaya per 1.000 views"}
        />
        {summary.perViews ? (
          <Tile
            label="Biaya efektif per 1.000 views"
            value={dash(summary.perViews.creatorCostPer1000Views, formatRupiah)}
            detail={
              summary.perViews.creatorCostPer1000Views === null
                ? "Belum ada views"
                : "Honor terpakai ÷ views terverifikasi × 1.000"
            }
          />
        ) : null}
      </div>

      {/* per_views: honor lives in the ledger (M19), not in payouts. */}
      {summary.perViews ? null : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Honor kreator</CardTitle>
              <CardDescription>
                Honor dasar per konten layak + bonus per 1.000 views + bonus per pendaftar ±
                penyesuaian (PRD 8.3). Hanya owner yang dapat menyetujui dan menandai dibayar.
              </CardDescription>
              {closed ? (
                <CardAction>
                  <Button
                    size="sm"
                    onClick={() => run(() => calculateAllPayoutsAction(campaignId))}
                    disabled={isPending || props.rows.length === 0}
                  >
                    <Calculator aria-hidden />
                    Hitung semua honor
                  </Button>
                </CardAction>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {!closed ? (
                <Alert>
                  <AlertDescription>
                    Honor baru dapat dihitung dan disimpan setelah kampanye berstatus Selesai. Angka
                    di bawah adalah perkiraan dari data saat ini.
                  </AlertDescription>
                </Alert>
              ) : null}

              {props.rows.length === 0 ? (
                <p className="text-sm text-muted-foreground">Belum ada kreator ditugaskan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kreator</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden text-right md:table-cell">Dasar</TableHead>
                        <TableHead className="hidden text-right md:table-cell">
                          Bonus views
                        </TableHead>
                        <TableHead className="hidden text-right md:table-cell">
                          Bonus pendaftar
                        </TableHead>
                        <TableHead className="hidden text-right lg:table-cell">
                          Penyesuaian
                        </TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {props.rows.map((row) => {
                        const payout = row.payout;
                        const shown = payout
                          ? {
                              base: payout.base_amount,
                              views: payout.views_bonus,
                              registrants: payout.registrant_bonus,
                              adjustment: payout.adjustment_amount,
                              total: payout.total_amount,
                            }
                          : {
                              base: row.preview.baseAmount,
                              views: row.preview.viewsBonus,
                              registrants: row.preview.registrantBonus,
                              adjustment: 0,
                              total: row.preview.totalAmount,
                            };
                        const isOpen = expanded === row.assignment.id;
                        return (
                          <Fragment key={row.assignment.id}>
                            <TableRow>
                              <TableCell className="font-medium">
                                {row.assignment.name}
                                <span className="block font-mono text-xs text-muted-foreground">
                                  {row.assignment.referralCode}
                                </span>
                              </TableCell>
                              <TableCell>
                                {payout ? (
                                  <PayoutStatusBadge status={payout.status} />
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    {closed ? "Belum dihitung" : "Perkiraan"}
                                  </Badge>
                                )}
                                {payout?.outdated ? (
                                  <span className="mt-1 block text-xs text-amber-600">
                                    Data berubah; hitung ulang
                                  </span>
                                ) : null}
                              </TableCell>
                              <TableCell className="hidden text-right tabular-nums md:table-cell">
                                {formatRupiah(shown.base)}
                              </TableCell>
                              <TableCell className="hidden text-right tabular-nums md:table-cell">
                                {formatRupiah(shown.views)}
                              </TableCell>
                              <TableCell className="hidden text-right tabular-nums md:table-cell">
                                {formatRupiah(shown.registrants)}
                              </TableCell>
                              <TableCell className="hidden text-right tabular-nums lg:table-cell">
                                {shown.adjustment === 0 ? "–" : formatRupiah(shown.adjustment)}
                              </TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">
                                {formatRupiah(shown.total)}
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-b-2 hover:bg-transparent">
                              <TableCell colSpan={7} className="pt-0">
                                <div className="flex flex-wrap gap-2">
                                  {closed && (!payout || payout.status === "draf") ? (
                                    <Button
                                      size="sm"
                                      variant={payout?.outdated || !payout ? "default" : "outline"}
                                      disabled={isPending}
                                      onClick={() =>
                                        run(() =>
                                          calculatePayoutAction(campaignId, row.assignment.id),
                                        )
                                      }
                                    >
                                      <Calculator aria-hidden />
                                      {payout ? "Hitung ulang" : "Hitung"}
                                    </Button>
                                  ) : null}
                                  {payout?.status === "draf" ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setDialog({ kind: "adjust", row })}
                                    >
                                      Penyesuaian
                                    </Button>
                                  ) : null}
                                  {isOwner && payout?.status === "draf" ? (
                                    <Button
                                      size="sm"
                                      disabled={isPending || payout.outdated}
                                      title={payout.outdated ? "Hitung ulang dulu" : undefined}
                                      onClick={() =>
                                        run(() => approvePayoutAction(campaignId, payout.id))
                                      }
                                    >
                                      Setujui
                                    </Button>
                                  ) : null}
                                  {isOwner && payout?.status === "disetujui" ? (
                                    <>
                                      <Button
                                        size="sm"
                                        onClick={() => setDialog({ kind: "paid", row })}
                                      >
                                        Tandai dibayar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={isPending}
                                        onClick={() => {
                                          if (window.confirm("Batalkan persetujuan honor ini?")) {
                                            run(() =>
                                              revokePayoutApprovalAction(campaignId, payout.id),
                                            );
                                          }
                                        }}
                                      >
                                        Batalkan persetujuan
                                      </Button>
                                    </>
                                  ) : null}
                                  {payout?.status === "dibayar" && payout.proofUrl ? (
                                    <Button size="sm" variant="ghost" asChild>
                                      <a href={payout.proofUrl} target="_blank" rel="noreferrer">
                                        <FileText aria-hidden />
                                        Bukti transfer
                                      </a>
                                    </Button>
                                  ) : null}
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    aria-expanded={isOpen}
                                    onClick={() => setExpanded(isOpen ? null : row.assignment.id)}
                                  >
                                    {isOpen ? (
                                      <ChevronUp aria-hidden />
                                    ) : (
                                      <ChevronDown aria-hidden />
                                    )}
                                    Rincian
                                  </Button>
                                </div>
                                {isOpen ? (
                                  <Breakdown row={row} contentInfo={props.contentInfo} />
                                ) : null}
                              </TableCell>
                            </TableRow>
                          </Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Pembayaran klien</CardTitle>
          <CardDescription>
            Invoice ke klien. Status mengikuti jumlah yang sudah dibayar. Bukti pembayaran hanya
            dapat dilihat dan diunggah owner.
          </CardDescription>
          <CardAction>
            <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "new-payment" })}>
              <Plus aria-hidden />
              Catat invoice
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          {props.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada invoice.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Jatuh tempo</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead className="text-right">Dibayar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {props.payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono">{payment.invoice_number}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatCalendarDate(payment.due_date)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRupiah(payment.amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatRupiah(payment.paid_amount)}
                        {payment.paid_at ? (
                          <span className="block text-xs text-muted-foreground">
                            {formatCalendarDate(payment.paid_at)}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <ClientPaymentStatusBadge status={payment.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDialog({ kind: "receipt", payment })}
                          >
                            Catat pembayaran
                          </Button>
                          {isOwner && payment.proofUrl ? (
                            <Button size="icon-sm" variant="ghost" asChild>
                              <a
                                href={payment.proofUrl}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Lihat bukti"
                              >
                                <FileText aria-hidden />
                              </a>
                            </Button>
                          ) : null}
                          {isOwner ? (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Hapus invoice"
                              disabled={isPending}
                              onClick={() => {
                                if (window.confirm(`Hapus invoice ${payment.invoice_number}?`)) {
                                  run(() => deleteClientPaymentAction(campaignId, payment.id));
                                }
                              }}
                            >
                              <Trash2 aria-hidden />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {dialog?.kind === "adjust" && dialog.row.payout ? (
        <AdjustmentDialog
          campaignId={campaignId}
          payout={dialog.row.payout}
          creatorName={dialog.row.assignment.name}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.kind === "paid" && dialog.row.payout ? (
        <MarkPaidDialog
          campaignId={campaignId}
          payoutId={dialog.row.payout.id}
          total={dialog.row.payout.total_amount}
          creatorName={dialog.row.assignment.name}
          onClose={() => setDialog(null)}
        />
      ) : null}
      {dialog?.kind === "new-payment" ? (
        <ClientPaymentDialog campaignId={campaignId} onClose={() => setDialog(null)} />
      ) : null}
      {dialog?.kind === "receipt" ? (
        <ReceiptDialog
          campaignId={campaignId}
          payment={dialog.payment}
          isOwner={isOwner}
          onClose={() => setDialog(null)}
        />
      ) : null}
    </div>
  );
}

function Breakdown({ row, contentInfo }: { row: FinanceRow; contentInfo: Props["contentInfo"] }) {
  const { preview, scheme, payout } = row;
  return (
    <div className="mt-3 space-y-3 rounded-md bg-muted/50 p-3 text-sm">
      <dl className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Honor dasar / konten</dt>
          <dd className="tabular-nums">
            {formatRupiah(scheme.baseFee)}
            {scheme.overridden.baseFee ? " (khusus)" : ""}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Konten layak / disepakati</dt>
          <dd className="tabular-nums">
            {preview.eligibleContents} / {row.assignment.contentsCommitted} → dibayar{" "}
            {preview.validContents}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Views konten layak</dt>
          <dd className="tabular-nums">
            {formatNumber(preview.totalViews)} × {formatRupiah(scheme.bonusPer1000Views)}/1.000
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Batas bonus views</dt>
          <dd className="tabular-nums">
            {scheme.viewsBonusCap === null ? "Tanpa batas" : formatRupiah(scheme.viewsBonusCap)}
            {preview.viewsBonus < preview.viewsBonusRaw
              ? ` (dari ${formatRupiah(preview.viewsBonusRaw)})`
              : ""}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted-foreground">Pendaftar kode ini</dt>
          <dd className="tabular-nums">
            {formatNumber(preview.registrantCount)} × {formatRupiah(scheme.bonusPerRegistrant)}
          </dd>
        </div>
        {payout && payout.adjustment_amount !== 0 ? (
          <div className="flex justify-between gap-2">
            <dt className="text-muted-foreground">Penyesuaian</dt>
            <dd>
              {formatRupiah(payout.adjustment_amount)} · {payout.adjustment_reason}
            </dd>
          </div>
        ) : null}
      </dl>

      {preview.contents.length ? (
        <ul className="space-y-1">
          {preview.contents.map((line) => {
            const info = contentInfo[line.id];
            return (
              <li key={line.id} className="flex flex-wrap items-center gap-2">
                <Badge variant={line.eligible ? "secondary" : "outline"}>
                  {line.eligible
                    ? line.countsForBaseFee
                      ? "Layak · honor dasar"
                      : "Layak · di luar kuota"
                    : INELIGIBLE_REASON_LABELS[line.reason!]}
                </Badge>
                <span>
                  {SOCIAL_PLATFORM_LABELS[info?.platform as SocialPlatform] ??
                    info?.platform ??
                    "Konten"}
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {formatNumber(line.views)} views
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-muted-foreground">Belum ada konten untuk kreator ini.</p>
      )}

      {payout ? (
        <p className="text-xs text-muted-foreground">
          Dihitung {formatDateTime(payout.calculated_at)}
          {payout.approved_at
            ? ` · disetujui ${payout.approverName ?? ""} ${formatDateTime(payout.approved_at)}`
            : ""}
          {payout.paid_at ? ` · dibayar ${formatCalendarDate(payout.paid_at)}` : ""}
        </p>
      ) : null}
    </div>
  );
}
