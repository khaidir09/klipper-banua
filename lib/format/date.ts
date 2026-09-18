import { formatInTimeZone } from "date-fns-tz";
import { id } from "date-fns/locale";
import { resolveTimezone, timezoneLabel } from "@/lib/format/timezone";

/**
 * Timestamps are stored as UTC `timestamptz` and rendered in the user's
 * timezone, WITA by default (PRD section 9).
 */
export type DateInput = Date | string | number;

function toDate(value: DateInput): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError(`Invalid date value: ${String(value)}`);
  }
  return date;
}

/** e.g. `17 Sep 2026` */
export function formatDate(value: DateInput, timezone?: string | null): string {
  return formatInTimeZone(toDate(value), resolveTimezone(timezone), "d MMM yyyy", { locale: id });
}

/** e.g. `17 September 2026` */
export function formatDateLong(value: DateInput, timezone?: string | null): string {
  return formatInTimeZone(toDate(value), resolveTimezone(timezone), "d MMMM yyyy", { locale: id });
}

/** e.g. `17 Sep 2026, 08.30 WITA` */
export function formatDateTime(value: DateInput, timezone?: string | null): string {
  const zone = resolveTimezone(timezone);
  const formatted = formatInTimeZone(toDate(value), zone, "d MMM yyyy, HH.mm", { locale: id });
  return `${formatted} ${timezoneLabel(zone)}`;
}

/** e.g. `08.30` */
export function formatTime(value: DateInput, timezone?: string | null): string {
  return formatInTimeZone(toDate(value), resolveTimezone(timezone), "HH.mm", { locale: id });
}

/** `yyyy-MM-dd` in the display timezone, for date inputs and CSV exports. */
export function formatDateInput(value: DateInput, timezone?: string | null): string {
  return formatInTimeZone(toDate(value), resolveTimezone(timezone), "yyyy-MM-dd");
}

/**
 * Formats a Postgres `date` column (`yyyy-MM-dd`), e.g. a campaign period or a
 * birth date. These are calendar dates without a time or zone, so no timezone
 * conversion applies. e.g. `1 Okt 2026`.
 */
export function formatCalendarDate(value: string, pattern = "d MMM yyyy"): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new TypeError(`Invalid calendar date: ${value}`);
  }
  return formatInTimeZone(toDate(`${value}T00:00:00Z`), "UTC", pattern, { locale: id });
}

/** e.g. `1 Okt – 31 Okt 2026`, or with both years when they differ. */
export function formatCalendarRange(start: string, end: string): string {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${formatCalendarDate(start, sameYear ? "d MMM" : "d MMM yyyy")} – ${formatCalendarDate(end)}`;
}
