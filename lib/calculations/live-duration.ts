/**
 * How long content stayed live (PRD 8.2 condition 3, FR-M10-04).
 *
 * Content removed by the creator only keeps counting when
 * `removed_at − posted_at ≥ min_live_days`. The duration is measured exactly,
 * not in calendar days.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function liveDurationMs(postedAt: string, removedAt: string): number {
  return new Date(removedAt).getTime() - new Date(postedAt).getTime();
}

/** True when removed content stayed up for fewer than `minLiveDays` days. */
export function removedBeforeMinLiveDays(
  postedAt: string,
  removedAt: string,
  minLiveDays: number,
): boolean {
  return liveDurationMs(postedAt, removedAt) < minLiveDays * DAY_MS;
}

/** Whole days the content stayed live, rounded down (for display). */
export function liveDays(postedAt: string, removedAt: string): number {
  return Math.floor(liveDurationMs(postedAt, removedAt) / DAY_MS);
}
