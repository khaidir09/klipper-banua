/** Timezones used by the team. Kalimantan spans WITA and WIB (PRD section 9). */
export const TIMEZONES = {
  "Asia/Makassar": "WITA",
  "Asia/Jakarta": "WIB",
} as const;

export type SupportedTimezone = keyof typeof TIMEZONES;

export const DEFAULT_TIMEZONE: SupportedTimezone = "Asia/Makassar";

export function isSupportedTimezone(value: string): value is SupportedTimezone {
  return value in TIMEZONES;
}

/** Falls back to WITA when a stored value is missing or unknown. */
export function resolveTimezone(value: string | null | undefined): SupportedTimezone {
  return value && isSupportedTimezone(value) ? value : DEFAULT_TIMEZONE;
}

export function timezoneLabel(value: string | null | undefined): string {
  return TIMEZONES[resolveTimezone(value)];
}
