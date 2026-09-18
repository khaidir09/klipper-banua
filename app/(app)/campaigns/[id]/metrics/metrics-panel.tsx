"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, ExternalLink, FileImage, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CumulativeViewsChart } from "@/components/charts/cumulative-views-chart";
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
import type { CreatorMetricsRow, CumulativePoint } from "@/lib/calculations/campaign-metrics";
import type { DueSnapshot } from "@/lib/calculations/checkpoints";
import { LIVE_STATUS_LABELS } from "@/lib/constants/contents";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/constants/creators";
import { CHECKPOINT_LABELS, type MetricCheckpoint } from "@/lib/constants/metrics";
import type { MetricContentView, RegistrantReportView } from "@/lib/data/metrics";
import { formatCalendarRange, formatDateTime } from "@/lib/format/date";
import { formatNumber, formatPercent } from "@/lib/format/number";
import { deleteRegistrantReportAction, deleteSnapshotAction } from "../../metric-actions";
import { RegistrantReportDialog, SnapshotDialog } from "./metrics-dialogs";

export type MetricsContent = MetricContentView & {
  creatorName: string;
  views: number;
  decreased: string[];
  due: DueSnapshot[];
  suggestedCheckpoint: MetricCheckpoint;
};

export type AssignmentOption = { id: string; name: string; referralCode: string };

export type MetricsPanelProps = {
  campaignId: string;
  canEdit: boolean;
  timezone: string;
  summary: {
    views: number;
    viewsProgress: number | null;
    targetViews: number;
    clicks: number;
    humanClicks: number;
    registrants: number;
    registrantsProgress: number | null;
    targetRegistrants: number;
    liveContents: number;
    targetContents: number;
  };
  chart: CumulativePoint[];
  creators: (CreatorMetricsRow & { name: string })[];
  contents: MetricsContent[];
  reports: RegistrantReportView[];
  assignments: AssignmentOption[];
};

function StatTile({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </div>
  );
}

function targetDetail(progress: number | null, target: number) {
  return progress === null
    ? "Target belum diatur"
    : `${formatPercent(progress)} dari target ${formatNumber(target)}`;
}

export function MetricsPanel(props: MetricsPanelProps) {
  const { campaignId, canEdit, timezone, summary } = props;
  const [snapshotFor, setSnapshotFor] = useState<MetricsContent | null>(null);
  const [reporting, setReporting] = useState(false);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Total views"
          value={formatNumber(summary.views)}
          detail={targetDetail(summary.viewsProgress, summary.targetViews)}
        />
        <StatTile
          label="Klik tautan (non-bot)"
          value={formatNumber(summary.humanClicks)}
          detail={`${formatNumber(summary.clicks)} klik total termasuk bot`}
        />
        <StatTile
          label="Pendaftar"
          value={formatNumber(summary.registrants)}
          detail={targetDetail(summary.registrantsProgress, summary.targetRegistrants)}
        />
        <StatTile
          label="Konten tayang"
          value={formatNumber(summary.liveContents)}
          detail={
            summary.targetContents > 0
              ? `dari target ${formatNumber(summary.targetContents)} konten`
              : "Target belum diatur"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Views kumulatif per checkpoint</CardTitle>
          <CardDescription>
            Jumlah views semua konten tayang. Konten tanpa snapshot di suatu checkpoint memakai
            nilai terakhirnya.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CumulativeViewsChart points={props.chart} target={summary.targetViews} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per kreator</CardTitle>
        </CardHeader>
        <CardContent>
          {props.creators.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada kreator ditugaskan.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kreator</TableHead>
                    <TableHead className="text-right">Konten tayang</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Klik (non-bot)</TableHead>
                    <TableHead className="text-right">Pendaftar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {props.creators.map((row) => (
                    <TableRow key={row.assignmentId}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{row.liveContents}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.views)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.humanClicks)}
                        <span className="text-muted-foreground"> / {formatNumber(row.clicks)}</span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatNumber(row.registrants)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Snapshot metrik per konten</CardTitle>
          <CardDescription>
            Views konten = snapshot terbaru. Isi H+1, H+3, H+7, dan akhir kampanye dengan tangkapan
            layar sebagai bukti.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {props.contents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada konten yang tayang. Tandai konten tayang di tab Konten.
            </p>
          ) : (
            props.contents.map((content) => (
              <ContentSnapshots
                key={content.id}
                campaignId={campaignId}
                content={content}
                canEdit={canEdit}
                timezone={timezone}
                onAdd={() => setSnapshotFor(content)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <RegistrantReports
        campaignId={campaignId}
        canEdit={canEdit}
        timezone={timezone}
        reports={props.reports}
        assignments={props.assignments}
        onAdd={() => setReporting(true)}
      />

      {snapshotFor ? (
        <SnapshotDialog
          campaignId={campaignId}
          content={snapshotFor}
          timezone={timezone}
          onClose={() => setSnapshotFor(null)}
        />
      ) : null}
      {reporting ? (
        <RegistrantReportDialog
          campaignId={campaignId}
          assignments={props.assignments}
          onClose={() => setReporting(false)}
        />
      ) : null}
    </div>
  );
}

function ContentSnapshots({
  campaignId,
  content,
  canEdit,
  timezone,
  onAdd,
}: {
  campaignId: string;
  content: MetricsContent;
  canEdit: boolean;
  timezone: string;
  onAdd: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const decreased = new Set(content.decreased);

  function remove(snapshotId: string, checkpoint: MetricCheckpoint) {
    if (!window.confirm(`Hapus snapshot ${CHECKPOINT_LABELS[checkpoint]}?`)) return;
    startTransition(async () => {
      const result = await deleteSnapshotAction(campaignId, snapshotId);
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <section
      id={`content-${content.id}`}
      className="scroll-mt-20 rounded-lg border p-3 sm:p-4"
      aria-label={`Snapshot ${content.creatorName}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="font-medium">
            {content.creatorName}
            <Badge variant="secondary" className="ml-2 align-middle">
              {SOCIAL_PLATFORM_LABELS[content.platform as SocialPlatform] ?? content.platform}
            </Badge>
            <Badge
              variant={content.live_status === "dihapus" ? "destructive" : "outline"}
              className="ml-1 align-middle"
            >
              {LIVE_STATUS_LABELS[content.live_status]}
            </Badge>
          </p>
          {content.posted_url ? (
            <a
              href={content.posted_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:underline"
            >
              <ExternalLink className="size-3 shrink-0" aria-hidden />
              <span className="truncate">{content.posted_url}</span>
            </a>
          ) : null}
          {content.posted_at ? (
            <p className="text-xs text-muted-foreground">
              Tayang {formatDateTime(content.posted_at, timezone)}
            </p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Views terkini</p>
          <p className="text-xl font-semibold tabular-nums">{formatNumber(content.views)}</p>
        </div>
      </div>

      {content.due.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {content.due.map((due) => (
            <Badge key={due.checkpoint} variant="outline" className="border-amber-500/60">
              <AlertTriangle className="text-amber-600" aria-hidden />
              {CHECKPOINT_LABELS[due.checkpoint]}{" "}
              {due.daysOverdue === 0 ? "jatuh tempo hari ini" : `terlambat ${due.daysOverdue} hari`}
            </Badge>
          ))}
        </div>
      ) : null}

      {content.snapshots.length ? (
        <div className="mt-3 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Checkpoint</TableHead>
                <TableHead>Diambil</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="hidden text-right md:table-cell">Suka</TableHead>
                <TableHead className="hidden text-right md:table-cell">Komentar</TableHead>
                <TableHead className="hidden text-right md:table-cell">Bagikan</TableHead>
                <TableHead className="hidden text-right md:table-cell">Simpan</TableHead>
                <TableHead className="text-right">Bukti</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {content.snapshots.map((snapshot) => (
                <TableRow key={snapshot.id}>
                  <TableCell>{CHECKPOINT_LABELS[snapshot.checkpoint]}</TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateTime(snapshot.captured_at, timezone)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {decreased.has(snapshot.id) ? (
                      <span
                        className="mr-1 inline-flex align-middle text-amber-600"
                        title="Views lebih kecil dari snapshot sebelumnya"
                      >
                        <AlertTriangle className="size-3.5" aria-label="Views turun" />
                      </span>
                    ) : null}
                    {formatNumber(snapshot.views)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {formatNumber(snapshot.likes)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {formatNumber(snapshot.comments)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {formatNumber(snapshot.shares)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {formatNumber(snapshot.saves)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {snapshot.proofUrl ? (
                        <Button size="icon-sm" variant="ghost" asChild>
                          <a
                            href={snapshot.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            aria-label="Lihat bukti"
                          >
                            <FileImage aria-hidden />
                          </a>
                        </Button>
                      ) : null}
                      {canEdit ? (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Hapus snapshot"
                          disabled={isPending}
                          onClick={() => remove(snapshot.id, snapshot.checkpoint)}
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
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Belum ada snapshot.</p>
      )}

      {canEdit ? (
        <Button size="sm" className="mt-3" onClick={onAdd}>
          <Plus aria-hidden />
          Tambah snapshot
        </Button>
      ) : null}
    </section>
  );
}

function RegistrantReports({
  campaignId,
  canEdit,
  timezone,
  reports,
  assignments,
  onAdd,
}: {
  campaignId: string;
  canEdit: boolean;
  timezone: string;
  reports: RegistrantReportView[];
  assignments: AssignmentOption[];
  onAdd: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const byId = new Map(assignments.map((a) => [a.id, a]));

  function remove(reportId: string) {
    if (!window.confirm("Hapus laporan pendaftar ini?")) return;
    startTransition(async () => {
      const result = await deleteRegistrantReportAction(campaignId, reportId);
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan pendaftar</CardTitle>
        <CardDescription>
          Angka rekap dari klien per kode kreator. Tidak ada data pribadi pendaftar yang disimpan.
        </CardDescription>
        {canEdit ? (
          <CardAction>
            <Button size="sm" variant="outline" onClick={onAdd}>
              <Plus aria-hidden />
              Catat laporan
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada laporan pendaftar.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode kreator</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead className="text-right">Pendaftar</TableHead>
                  <TableHead className="hidden md:table-cell">Catatan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => {
                  const assignment = report.assignmentId ? byId.get(report.assignmentId) : null;
                  return (
                    <TableRow key={report.id}>
                      <TableCell>
                        {assignment ? (
                          <>
                            <span className="font-mono">{assignment.referralCode}</span>
                            <span className="block text-xs text-muted-foreground">
                              {assignment.name}
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">Tanpa kode</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatCalendarRange(report.period_start, report.period_end)}
                        <span className="block text-xs text-muted-foreground">
                          dicatat {formatDateTime(report.created_at, timezone)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatNumber(report.registrant_count)}
                      </TableCell>
                      <TableCell className="hidden max-w-64 truncate text-muted-foreground md:table-cell">
                        {report.notes || "–"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {report.proofUrl ? (
                            <Button size="icon-sm" variant="ghost" asChild>
                              <a
                                href={report.proofUrl}
                                target="_blank"
                                rel="noreferrer"
                                aria-label="Lihat bukti"
                              >
                                <FileImage aria-hidden />
                              </a>
                            </Button>
                          ) : null}
                          {canEdit ? (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              aria-label="Hapus laporan"
                              disabled={isPending}
                              onClick={() => remove(report.id)}
                            >
                              <Trash2 aria-hidden />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
