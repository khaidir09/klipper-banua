import { z } from "zod";
import {
  ASSET_TYPES,
  ASSIGNMENT_STATUSES,
  CAMPAIGN_ACCESSES,
  CAMPAIGN_OBJECTIVES,
  CAMPAIGN_STATUSES,
  CLAIM_GRACE_DAYS_LIMIT,
  MAX_CLIPS_PER_CREATOR_LIMIT,
} from "@/lib/constants/campaigns";
import { CATALOG_SORTS } from "@/lib/campaigns/open";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creators";
import {
  isValidReferralCode,
  isValidTrackingSlug,
  normalizeReferralCode,
  normalizeTrackingSlug,
} from "@/lib/referral/generate";
import {
  listQuerySchema,
  nullableText,
  optionalHttpUrl,
  optionalTextField,
  uuidField,
} from "./common";
import { countField, moneyField, optionalMoneyField } from "./money";

const dateField = (message: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message });

/** One item per line; used for must-do and must-not lists. */
export const linesField = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : value.split(/\r?\n/)))
  .transform((items) => items.map((item) => item.trim().replace(/^[-•*]\s*/, "")).filter(Boolean))
  .pipe(z.array(z.string().max(300, { message: "Setiap poin maksimal 300 karakter." })).max(30));

/** Hashtags separated by spaces, commas or new lines; stored with a leading #. */
export const hashtagsField = z
  .union([z.string(), z.array(z.string())])
  .transform((value) => (Array.isArray(value) ? value : value.split(/[\s,]+/)))
  .transform((items) => [
    ...new Set(
      items
        .map((item) => item.trim().replace(/^#+/, ""))
        .filter(Boolean)
        .map((t) => `#${t}`),
    ),
  ])
  .pipe(
    z
      .array(
        z.string().regex(/^#[\p{L}\p{N}_]{1,60}$/u, {
          message: "Hashtag hanya boleh huruf, angka, dan garis bawah.",
        }),
      )
      .max(30),
  );

const landingUrlField = optionalHttpUrl;

/** Platforms a `per_views` campaign accepts; duplicates collapse (FR-M17-01). */
export const allowedPlatformsField = z
  .array(z.enum(SOCIAL_PLATFORMS, { message: "Platform tidak dikenal." }))
  .transform((items) => SOCIAL_PLATFORMS.filter((platform) => items.includes(platform)));

/** An optional cap: empty means "no cap", zero is refused (the database needs > 0). */
const optionalCapField = optionalMoneyField.refine((value) => value === null || value > 0, {
  message: "Kosongkan jika tanpa batas; jangan isi 0.",
});

export const campaignSchema = z
  .object({
    client_id: uuidField.refine(Boolean, { message: "Pilih klien." }),
    code: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase().replace(/\s+/g, "-"))
      .pipe(
        z
          .string()
          .min(1, { message: "Kode kampanye wajib diisi." })
          .max(50)
          .regex(/^[A-Z0-9]+(-[A-Z0-9]+)*$/, {
            message: "Gunakan huruf, angka, dan tanda hubung, mis. PMB-KAMPUSX-2026-01.",
          }),
      ),
    name: z.string().trim().min(1, { message: "Nama kampanye wajib diisi." }).max(200),
    objective: z.enum(CAMPAIGN_OBJECTIVES, { message: "Pilih tujuan kampanye." }),
    brief: optionalTextField,
    must_do: linesField,
    must_not: linesField,
    hashtags: hashtagsField,
    paid_label_required: z.boolean(),
    landing_url: landingUrlField,
    start_date: dateField("Tanggal mulai wajib diisi."),
    end_date: dateField("Tanggal selesai wajib diisi."),
    min_live_days: countField,
    package_price: moneyField,
    target_contents: countField,
    target_views: countField,
    target_registrants: countField,
    default_base_fee: moneyField,
    default_bonus_per_1000_views: moneyField,
    default_bonus_per_registrant: moneyField,
    default_views_bonus_cap: optionalMoneyField,
    // Open campaigns, per_views honor (FR-M17-01). Required values are only
    // enforced at activation (FR-M17-02), so drafts can be saved early.
    access: z.enum(CAMPAIGN_ACCESSES, { message: "Pilih akses kampanye." }),
    rate_per_1000_views: moneyField,
    creator_budget: moneyField,
    max_payout_per_clip: optionalCapField,
    max_payout_per_creator: optionalCapField,
    min_views_to_earn: countField,
    max_clips_per_creator: countField.refine(
      (value) => value >= 1 && value <= MAX_CLIPS_PER_CREATOR_LIMIT,
      { message: `Isi antara 1 dan ${MAX_CLIPS_PER_CREATOR_LIMIT} klip.` },
    ),
    allowed_platforms: allowedPlatformsField,
    local_only: z.boolean(),
    claim_grace_days: countField.refine((value) => value <= CLAIM_GRACE_DAYS_LIMIT, {
      message: `Maksimal ${CLAIM_GRACE_DAYS_LIMIT} hari.`,
    }),
  })
  // The landing URL is only enforced at activation (FR-M4-02, see
  // lib/campaigns/status.ts), so drafts can be saved before the client shares
  // the registration page.
  .refine((value) => value.end_date >= value.start_date, {
    path: ["end_date"],
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
  });

export type CampaignFormInput = z.input<typeof campaignSchema>;
export type CampaignInput = z.output<typeof campaignSchema>;

export const campaignStatusChangeSchema = z.object({
  id: uuidField,
  status: z.enum(CAMPAIGN_STATUSES),
});

export const closingNotesSchema = z.object({
  id: uuidField,
  closing_notes: z.string().trim().max(5000),
});

export const campaignListQuerySchema = listQuerySchema.extend({
  status: z.enum(CAMPAIGN_STATUSES).optional().catch(undefined),
  client_id: uuidField.optional().catch(undefined),
});

export type CampaignListQuery = z.infer<typeof campaignListQuerySchema>;

export const assetSchema = z.object({
  title: z.string().trim().min(1, { message: "Judul materi wajib diisi." }).max(200),
  type: z.enum(ASSET_TYPES, { message: "Pilih jenis materi." }),
  external_url: optionalHttpUrl,
  notes: optionalTextField,
});

export type AssetInput = z.output<typeof assetSchema>;

const optionalReferralCode = nullableText.transform((value, ctx) => {
  if (!value) return null;
  const normalized = normalizeReferralCode(value);
  if (!isValidReferralCode(normalized)) {
    ctx.addIssue({
      code: "custom",
      message: "6–8 huruf kapital/angka tanpa I, O, 0, atau 1.",
    });
    return z.NEVER;
  }
  return normalized;
});

const optionalTrackingSlug = nullableText.transform((value, ctx) => {
  if (!value) return null;
  const normalized = normalizeTrackingSlug(value);
  if (!isValidTrackingSlug(normalized)) {
    ctx.addIssue({
      code: "custom",
      message: "4–40 huruf kecil, angka, atau tanda hubung (tidak di awal/akhir).",
    });
    return z.NEVER;
  }
  return normalized;
});

const assignmentFields = {
  status: z.enum(ASSIGNMENT_STATUSES, { message: "Pilih status." }),
  contents_committed: countField,
  base_fee: optionalMoneyField,
  bonus_per_1000_views: optionalMoneyField,
  bonus_per_registrant: optionalMoneyField,
  views_bonus_cap: optionalMoneyField,
  referral_code: optionalReferralCode,
  tracking_slug: optionalTrackingSlug,
};

/** New assignment; empty code/slug are generated on the server. */
export const assignmentCreateSchema = z.object({
  creator_id: uuidField,
  ...assignmentFields,
});

export const assignmentUpdateSchema = z.object(assignmentFields);

export type AssignmentCreateFormInput = z.input<typeof assignmentCreateSchema>;
export type AssignmentCreateInput = z.output<typeof assignmentCreateSchema>;
export type AssignmentUpdateFormInput = z.input<typeof assignmentUpdateSchema>;
export type AssignmentUpdateInput = z.output<typeof assignmentUpdateSchema>;

/** Catalog filters in the portal URL (FR-M17-03); anything unknown is dropped. */
export const catalogQuerySchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS).optional().catch(undefined),
  tujuan: z.enum(CAMPAIGN_OBJECTIVES).optional().catch(undefined),
  lokal: z
    .literal("1")
    .optional()
    .catch(undefined)
    .transform((value) => value === "1"),
  urut: z.enum(CATALOG_SORTS).optional().catch(undefined),
});

export type CatalogQuery = z.output<typeof catalogQuerySchema>;
