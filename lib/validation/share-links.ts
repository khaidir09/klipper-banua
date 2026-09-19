import { z } from "zod";
import { uuidField } from "./common";

/** Campaign statuses a client report link may be created for (FR-M9-05). */
export const SHAREABLE_CAMPAIGN_STATUSES = ["aktif", "selesai"] as const;

/**
 * FR-M9-05. The optional expiry is a calendar date; the link works through
 * the end of that day in the member's timezone.
 */
export const createShareLinkSchema = z.object({
  campaign_id: uuidField,
  expires_on: z
    .union([z.string(), z.null()])
    .transform((value) => (value ?? "").trim())
    .pipe(z.union([z.literal(""), z.iso.date({ message: "Tanggal kedaluwarsa tidak valid." })]))
    .transform((value) => value || null)
    .default(null),
});

export const revokeShareLinkSchema = z.object({
  campaign_id: uuidField,
  link_id: uuidField,
});
