"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatMinutes, type OpsTimeRecap } from "@/lib/calculations/ops-time";
import { OPS_ACTIVITIES, OPS_ACTIVITY_LABELS, type OpsActivity } from "@/lib/constants/ops";
import { formatCalendarDate } from "@/lib/format/date";
import { formatPercent } from "@/lib/format/number";
import { applyFieldErrors } from "@/lib/forms";
import {
  opsTimeLogSchema,
  type OpsTimeLogFormInput,
  type OpsTimeLogInput,
} from "@/lib/validation/ops";
import { createOpsTimeLogAction, deleteOpsTimeLogAction } from "../../report-actions";

export type OpsTimeEntry = {
  id: string;
  user_id: string;
  activity: OpsActivity;
  minutes: number;
  log_date: string;
  notes: string;
  userName: string | null;
};

/** PRD M12: time log per campaign with a recap per activity. */
export function OpsTimePanel({
  campaignId,
  currentUserId,
  isOwner,
  today,
  recap,
  entries,
}: {
  campaignId: string;
  currentUserId: string;
  isOwner: boolean;
  /** `yyyy-MM-dd` in the user's timezone, the form's default date. */
  today: string;
  recap: OpsTimeRecap;
  entries: OpsTimeEntry[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function remove(entry: OpsTimeEntry) {
    if (!window.confirm("Hapus catatan waktu ini?")) return;
    startTransition(async () => {
      const result = await deleteOpsTimeLogAction(campaignId, entry.id);
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  const used = recap.rows.filter((row) => row.minutes > 0);

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>
          <h2>Waktu operasional</h2>
        </CardTitle>
        <CardDescription>
          Total {formatMinutes(recap.totalMinutes)} dari {recap.totalEntries} catatan. Rekap ini
          menunjukkan pekerjaan yang paling menyita waktu.
        </CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <Plus aria-hidden />
            Catat waktu
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="ops-recap-title">
          <h3 id="ops-recap-title" className="mb-2 text-sm font-medium">
            Rekap per aktivitas
          </h3>
          {used.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada waktu yang dicatat.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aktivitas</TableHead>
                  <TableHead className="text-right">Waktu</TableHead>
                  <TableHead className="text-right">Porsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {used.map((row) => (
                  <TableRow key={row.activity}>
                    <TableCell>
                      {OPS_ACTIVITY_LABELS[row.activity]}
                      <span className="block text-xs text-muted-foreground">
                        {row.entries} catatan
                      </span>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {formatMinutes(row.minutes)}
                    </TableCell>
                    <TableCell className="w-32">
                      <div className="flex items-center justify-end gap-2">
                        <div className="hidden h-1.5 w-12 overflow-hidden rounded-full bg-muted sm:block">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${row.sharePct ?? 0}%` }}
                          />
                        </div>
                        <span className="tabular-nums">{formatPercent(row.sharePct ?? 0)}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {formatMinutes(recap.totalMinutes)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </section>

        <section aria-labelledby="ops-entries-title">
          <h3 id="ops-entries-title" className="mb-2 text-sm font-medium">
            Catatan terbaru
          </h3>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada catatan.</p>
          ) : (
            <ul className="max-h-80 divide-y overflow-y-auto">
              {entries.map((entry) => (
                <li key={entry.id} className="flex items-start gap-3 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p>
                      <span className="font-medium">{OPS_ACTIVITY_LABELS[entry.activity]}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        · {formatMinutes(entry.minutes)}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatCalendarDate(entry.log_date)} · {entry.userName ?? "–"}
                    </p>
                    {entry.notes ? (
                      <p className="mt-0.5 text-xs break-words whitespace-pre-line">
                        {entry.notes}
                      </p>
                    ) : null}
                  </div>
                  {isOwner || entry.user_id === currentUserId ? (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Hapus catatan waktu"
                      disabled={isPending}
                      onClick={() => remove(entry)}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardContent>

      {open ? (
        <OpsTimeDialog campaignId={campaignId} today={today} onClose={() => setOpen(false)} />
      ) : null}
    </Card>
  );
}

function OpsTimeDialog({
  campaignId,
  today,
  onClose,
}: {
  campaignId: string;
  today: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<OpsTimeLogFormInput, unknown, OpsTimeLogInput>({
    resolver: zodResolver(opsTimeLogSchema),
    defaultValues: { activity: "review", minutes: "", log_date: today, notes: "" },
  });

  function onSubmit(values: OpsTimeLogInput) {
    startTransition(async () => {
      const result = await createOpsTimeLogAction(campaignId, values);
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>Catat waktu kerja</DialogTitle>
            <DialogDescription>
              Waktu yang Anda habiskan untuk kampanye ini. Dicatat atas nama Anda.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="my-4">
            <Field>
              <FieldLabel htmlFor="ops-activity">Aktivitas</FieldLabel>
              <NativeSelect
                id="ops-activity"
                aria-invalid={Boolean(errors.activity)}
                {...form.register("activity")}
              >
                {OPS_ACTIVITIES.map((activity) => (
                  <NativeSelectOption key={activity} value={activity}>
                    {OPS_ACTIVITY_LABELS[activity]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError errors={[errors.activity]} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="ops-minutes">Durasi (menit)</FieldLabel>
                <Input
                  id="ops-minutes"
                  inputMode="numeric"
                  placeholder="30"
                  aria-invalid={Boolean(errors.minutes)}
                  {...form.register("minutes")}
                />
                <FieldError errors={[errors.minutes]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="ops-date">Tanggal</FieldLabel>
                <Input
                  id="ops-date"
                  type="date"
                  aria-invalid={Boolean(errors.log_date)}
                  {...form.register("log_date")}
                />
                <FieldError errors={[errors.log_date]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="ops-notes">Catatan (opsional)</FieldLabel>
              <Textarea
                id="ops-notes"
                rows={3}
                aria-invalid={Boolean(errors.notes)}
                {...form.register("notes")}
              />
              <FieldError errors={[errors.notes]} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
