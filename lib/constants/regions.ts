/**
 * The team only works in Kalimantan (PRD section 1), so the province list is
 * limited to the five Kalimantan provinces. `province` is a plain `text`
 * column; the allowed set is enforced here and in the Zod schemas.
 */
export const KALIMANTAN_PROVINCES = [
  "Kalimantan Barat",
  "Kalimantan Tengah",
  "Kalimantan Selatan",
  "Kalimantan Timur",
  "Kalimantan Utara",
] as const;

export const PROVINCES = KALIMANTAN_PROVINCES;

export type Province = (typeof PROVINCES)[number];

/** Home province of the team; the default for every new client and creator. */
export const DEFAULT_PROVINCE: Province = "Kalimantan Selatan";

export function isProvince(value: string): value is Province {
  return (PROVINCES as readonly string[]).includes(value);
}
