import { formatInTimeZone } from "date-fns-tz";
import { DUE_CHECKPOINTS, type MetricCheckpoint } from "@/lib/constants/metrics";
import { resolveTimezone } from "@/lib/format/timezone";

/**
 * Snapshot due dates (FR-M10-02, PRD 8.5).
 *
 * H+n is due on the calendar day `n` days after the posting day, where the
 * posting day is read in the user's display timezone. A snapshot for H+n
 * posted at 23:30 WITA on 5 Oct is due on 6 Oct, even though that moment is
 * still 5 Oct in UTC.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** `yyyy-MM-dd` calendar date of an instant in the display timezone. */
export function localDate(instant: Date | string, timezone?: string | null): string {
  return formatInTimeZone(new Date(instant), resolveTimezone(timezone), "yyyy-MM-dd");
}

function addDays(calendarDate: string, days: number): string {
  const date = new Date(`${calendarDate}T00:00:00Z`);
  return new Date(date.getTime() + days * DAY_MS).toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00Z`).getTime() - new Date(`${from}T00:00:00Z`).getTime()) / DAY_MS,
  );
}

export function checkpointDueDate(
  postedAt: string,
  days: number,
  timezone?: string | null,
): string {
  return addDays(localDate(postedAt, timezone), days);
}

export type DueCheckInput = {
  id: string;
  posted_at: string | null;
  live_status: "belum_tayang" | "tayang" | "dihapus";
  /** Checkpoints that already have a snapshot. */
  checkpoints: MetricCheckpoint[];
};

export type DueSnapshot = {
  contentId: string;
  checkpoint: MetricCheckpoint;
  dueDate: string;
  /** 0 = due today, 3 = three days late. */
  daysOverdue: number;
};

/**
 * Live content whose H+1/H+3/H+7 day has arrived without a snapshot for that
 * checkpoint, most overdue first. Removed content needs no more snapshots.
 */
export function dueSnapshots(
  contents: DueCheckInput[],
  now: Date,
  timezone?: string | null,
): DueSnapshot[] {
  const today = localDate(now, timezone);
  const due: DueSnapshot[] = [];

  for (const content of contents) {
    if (content.live_status !== "tayang" || !content.posted_at) continue;
    for (const { checkpoint, days } of DUE_CHECKPOINTS) {
      if (content.checkpoints.includes(checkpoint)) continue;
      const dueDate = checkpointDueDate(content.posted_at, days, timezone);
      if (dueDate <= today) {
        due.push({
          contentId: content.id,
          checkpoint,
          dueDate,
          daysOverdue: daysBetween(dueDate, today),
        });
      }
    }
  }

  return due.sort(
    (a, b) =>
      b.daysOverdue - a.daysOverdue ||
      DUE_CHECKPOINTS.findIndex((c) => c.checkpoint === a.checkpoint) -
        DUE_CHECKPOINTS.findIndex((c) => c.checkpoint === b.checkpoint),
  );
}

/**
 * Default checkpoint for a new snapshot: the earliest fixed checkpoint that
 * is due and still missing; otherwise `akhir` if missing; otherwise `lainnya`.
 */
export function suggestCheckpoint(
  content: Pick<DueCheckInput, "posted_at" | "checkpoints">,
  now: Date,
  timezone?: string | null,
): MetricCheckpoint {
  if (content.posted_at) {
    const today = localDate(now, timezone);
    for (const { checkpoint, days } of DUE_CHECKPOINTS) {
      if (content.checkpoints.includes(checkpoint)) continue;
      if (checkpointDueDate(content.posted_at, days, timezone) <= today) return checkpoint;
    }
  }
  return content.checkpoints.includes("akhir") ? "lainnya" : "akhir";
}
