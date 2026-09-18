import { CHART_CHECKPOINTS, type MetricCheckpoint } from "@/lib/constants/metrics";

/**
 * Campaign metrics (PRD 8.4, FR-M7-02, FR-M7-05). Pure functions; views and
 * counts are whole numbers.
 */

export type SnapshotPoint = {
  id?: string;
  checkpoint: MetricCheckpoint;
  captured_at: string;
  views: number;
  /** Tie-breaker when two snapshots share a capture time. */
  created_at?: string;
};

const time = (value: string) => new Date(value).getTime();

function byCaptureTime(a: SnapshotPoint, b: SnapshotPoint): number {
  return (
    time(a.captured_at) - time(b.captured_at) ||
    time(a.created_at ?? a.captured_at) - time(b.created_at ?? b.captured_at)
  );
}

/** FR-M7-02: the most recent snapshot by `captured_at`. */
export function latestSnapshot<T extends SnapshotPoint>(snapshots: T[]): T | null {
  if (!snapshots.length) return null;
  return [...snapshots].sort(byCaptureTime).at(-1)!;
}

/** FR-M7-02: a content's views are those of its latest snapshot (0 without one). */
export function contentViews(snapshots: SnapshotPoint[]): number {
  return latestSnapshot(snapshots)?.views ?? 0;
}

export type ViewsWarning =
  | { kind: "lower_than_previous"; previousViews: number; previousCheckpoint: MetricCheckpoint }
  | { kind: "higher_than_next"; nextViews: number; nextCheckpoint: MetricCheckpoint };

/**
 * FR-M7-02: warns when a new snapshot breaks the non-decreasing views series,
 * either against the snapshot just before it or the one just after it.
 * Views rarely drop; a drop usually means a typo or the wrong screenshot.
 */
export function viewsWarnings(
  existing: SnapshotPoint[],
  candidate: Pick<SnapshotPoint, "captured_at" | "views"> & { id?: string },
): ViewsWarning[] {
  const others = existing.filter((snapshot) => !candidate.id || snapshot.id !== candidate.id);
  const at = time(candidate.captured_at);
  const before = latestSnapshot(others.filter((s) => time(s.captured_at) <= at));
  const after = [...others.filter((s) => time(s.captured_at) > at)].sort(byCaptureTime)[0];

  const warnings: ViewsWarning[] = [];
  if (before && candidate.views < before.views) {
    warnings.push({
      kind: "lower_than_previous",
      previousViews: before.views,
      previousCheckpoint: before.checkpoint,
    });
  }
  if (after && candidate.views > after.views) {
    warnings.push({
      kind: "higher_than_next",
      nextViews: after.views,
      nextCheckpoint: after.checkpoint,
    });
  }
  return warnings;
}

export type ContentMetricsInput = {
  /** Content counts toward views once it has gone live (tayang or dihapus). */
  posted: boolean;
  snapshots: SnapshotPoint[];
};

/** PRD 8.4: Σ latest-snapshot views of every content that went live. */
export function totalViews(contents: ContentMetricsInput[]): number {
  return contents
    .filter((content) => content.posted)
    .reduce((sum, content) => sum + contentViews(content.snapshots), 0);
}

/** PRD 8.4: Σ registrant_count, including reports without a referral code. */
export function totalRegistrants(reports: { registrant_count: number }[]): number {
  return reports.reduce((sum, report) => sum + report.registrant_count, 0);
}

/** Share of a target reached, in percent; null when no target was set. */
export function progressPercent(actual: number, target: number): number | null {
  if (target <= 0) return null;
  return (actual / target) * 100;
}

export type CumulativePoint = { checkpoint: MetricCheckpoint; views: number };

/**
 * FR-M7-05: total views across live content at each checkpoint. A content
 * without a snapshot for a checkpoint carries its last known value forward,
 * so the line never drops just because a snapshot is still missing.
 */
export function cumulativeViewsByCheckpoint(contents: ContentMetricsInput[]): CumulativePoint[] {
  const totals = CHART_CHECKPOINTS.map(() => 0);

  for (const content of contents) {
    if (!content.posted) continue;
    let carried = 0;
    CHART_CHECKPOINTS.forEach((checkpoint, index) => {
      const atCheckpoint = latestSnapshot(
        content.snapshots.filter((snapshot) => snapshot.checkpoint === checkpoint),
      );
      if (atCheckpoint) carried = atCheckpoint.views;
      totals[index]! += carried;
    });
  }

  return CHART_CHECKPOINTS.map((checkpoint, index) => ({ checkpoint, views: totals[index]! }));
}

export type CreatorMetricsRow = {
  assignmentId: string;
  liveContents: number;
  views: number;
  clicks: number;
  humanClicks: number;
  registrants: number;
};

/**
 * FR-M7-05: per-creator table (by assignment). Click totals arrive already
 * counted by the database, since a campaign can collect many clicks.
 */
export function metricsByAssignment(input: {
  assignmentIds: string[];
  contents: (ContentMetricsInput & { assignmentId: string })[];
  clicks: { assignmentId: string; total: number; human: number }[];
  reports: { assignmentId: string | null; registrant_count: number }[];
}): CreatorMetricsRow[] {
  return input.assignmentIds.map((assignmentId) => {
    const contents = input.contents.filter((c) => c.assignmentId === assignmentId);
    const clicks = input.clicks.find((c) => c.assignmentId === assignmentId);
    return {
      assignmentId,
      liveContents: contents.filter((c) => c.posted).length,
      views: totalViews(contents),
      clicks: clicks?.total ?? 0,
      humanClicks: clicks?.human ?? 0,
      registrants: totalRegistrants(input.reports.filter((r) => r.assignmentId === assignmentId)),
    };
  });
}

/**
 * FR-M7-02: ids of snapshots whose views are lower than the snapshot captured
 * just before them, for a warning marker in the snapshot table.
 */
export function decreasedSnapshotIds(snapshots: SnapshotPoint[]): Set<string> {
  const ordered = [...snapshots].sort(byCaptureTime);
  const flagged = new Set<string>();
  ordered.forEach((snapshot, index) => {
    const previous = ordered[index - 1];
    if (previous && snapshot.id && snapshot.views < previous.views) flagged.add(snapshot.id);
  });
  return flagged;
}
