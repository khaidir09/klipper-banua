import { z } from "zod";
import {
  CREATOR_STATUSES,
  CREATOR_TIERS,
  LOCAL_BADGE_MIN_PCT,
  MINIMUM_CREATOR_AGE,
  NICHES,
  SIGNUP_SOURCES,
  SOCIAL_PLATFORMS,
} from "@/lib/constants/creators";
import { PROVINCES } from "@/lib/constants/regions";
import {
  listQuerySchema,
  optionalEmailField,
  optionalTextField,
  shortTextField,
  uuidField,
} from "./common";
import { whatsappField } from "./phone";

/** True when the person turns `MINIMUM_CREATOR_AGE` on or before `today`. */
export function isAdult(birthDate: Date, today: Date = new Date()): boolean {
  const cutoff = new Date(
    Date.UTC(today.getUTCFullYear() - MINIMUM_CREATOR_AGE, today.getUTCMonth(), today.getUTCDate()),
  );
  return birthDate.getTime() <= cutoff.getTime();
}

export const UNDERAGE_MESSAGE = `Kreator harus berusia minimal ${MINIMUM_CREATOR_AGE} tahun saat didaftarkan.`;

/** `yyyy-MM-dd` from a date input, parsed as a UTC calendar date. */
const birthDateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Tanggal lahir wajib diisi." })
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), {
    message: "Tanggal lahir tidak valid.",
  })
  .refine((value) => isAdult(new Date(`${value}T00:00:00Z`)), { message: UNDERAGE_MESSAGE });

export const creatorSchema = z.object({
  full_name: z.string().trim().min(1, { message: "Nama lengkap wajib diisi." }).max(200),
  stage_name: shortTextField,
  phone_wa: whatsappField,
  email: optionalEmailField,
  city: shortTextField,
  province: z.enum(PROVINCES, { message: "Pilih provinsi." }),
  birth_date: birthDateField,
  niches: z.array(z.enum(NICHES)).max(NICHES.length).default([]),
  tier: z.enum(CREATOR_TIERS, { message: "Pilih tier." }),
  status: z.enum(CREATOR_STATUSES, { message: "Pilih status." }),
  notes: optionalTextField,
});

export type CreatorFormInput = z.input<typeof creatorSchema>;
export type CreatorInput = z.output<typeof creatorSchema>;

export const socialAccountSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS, { message: "Pilih platform." }),
  handle: z
    .string()
    .trim()
    .min(1, { message: "Handle wajib diisi." })
    .max(100)
    .transform((value) => value.replace(/^@/, "")),
  profile_url: z
    .string()
    .trim()
    .max(500)
    .refine((value) => !value || z.url().safeParse(value).success, {
      message: "URL profil tidak valid.",
    })
    .default(""),
  followers_count: z.coerce
    .number({ message: "Jumlah pengikut harus angka." })
    .int()
    .min(0, { message: "Jumlah pengikut tidak boleh negatif." })
    .default(0),
  kalimantan_audience_pct: z
    .union([z.literal(""), z.coerce.number().min(0).max(100)])
    .transform((value) => (value === "" ? null : value))
    .nullable()
    .default(null),
  top_cities: shortTextField,
  last_verified_at: z
    .string()
    .trim()
    .transform((value) => (value ? value : null))
    .nullable()
    .default(null),
});

export type SocialAccountFormInput = z.input<typeof socialAccountSchema>;
export type SocialAccountInput = z.output<typeof socialAccountSchema>;

export const termsSchema = z.object({
  terms_version: z.string().trim().min(1, { message: "Versi syarat wajib diisi." }).max(50),
  terms_agreed_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Tanggal persetujuan wajib diisi." }),
});

export type TermsFormInput = z.input<typeof termsSchema>;
export type TermsInput = z.output<typeof termsSchema>;

export const bankAccountSchema = z.object({
  bank_name: z.string().trim().min(1, { message: "Nama bank wajib diisi." }).max(100),
  account_number: z
    .string()
    .trim()
    .transform((value) => value.replace(/[\s-]/g, ""))
    .pipe(
      z.string().regex(/^\d{4,}$/, { message: "Nomor rekening harus angka, minimal 4 digit." }),
    ),
  account_holder: z
    .string()
    .trim()
    .min(1, { message: "Nama pemilik rekening wajib diisi." })
    .max(200),
});

export type BankAccountFormInput = z.input<typeof bankAccountSchema>;
export type BankAccountInput = z.output<typeof bankAccountSchema>;

export const creatorIdSchema = z.object({ creator_id: uuidField });

/** FR-M3-07 filters. Unknown values fall back to "no filter". */
export const creatorListQuerySchema = listQuerySchema.extend({
  province: z.enum(PROVINCES).optional().catch(undefined),
  city: z.string().trim().max(100).default(""),
  niche: z.enum(NICHES).optional().catch(undefined),
  tier: z.enum(CREATOR_TIERS).optional().catch(undefined),
  status: z.enum(CREATOR_STATUSES).optional().catch(undefined),
  platform: z.enum(SOCIAL_PLATFORMS).optional().catch(undefined),
  min_pct: z.coerce.number().min(0).max(100).optional().catch(undefined),
  // v4.0 (M16): who registered the klipper, and whether they hold the local badge.
  source: z.enum(SIGNUP_SOURCES).optional().catch(undefined),
  badge: z.enum(["ya", "tidak"]).optional().catch(undefined),
});

export type CreatorListQuery = z.infer<typeof creatorListQuerySchema>;

/**
 * Gate for FR-M3-05: the local badge needs at least one social account whose
 * audience proof shows `LOCAL_BADGE_MIN_PCT` or more in Kalimantan (v4.0),
 * and a recorded terms agreement.
 */
export function verificationBlockers(input: {
  hasProofAccount: boolean;
  /** Defaults to `hasProofAccount` for callers that predate the threshold. */
  hasLocalAudience?: boolean;
  termsAgreedAt: string | null;
}): string[] {
  const blockers: string[] = [];
  if (!input.hasProofAccount) {
    blockers.push("Belum ada akun media sosial dengan bukti audiens.");
  } else if (input.hasLocalAudience === false) {
    blockers.push(
      `Belum ada akun berbukti dengan audiens Kalimantan minimal ${LOCAL_BADGE_MIN_PCT}%.`,
    );
  }
  if (!input.termsAgreedAt) {
    blockers.push("Persetujuan syarat kerja sama belum dicatat.");
  }
  return blockers;
}

/* ------------------------------------------------------------------ */
/* Creator portal (M13, v2.0)                                          */
/* ------------------------------------------------------------------ */

/** FR-M13-01: an invitation needs an email address to send it to. */
export const invitePortalSchema = z.object({
  creator_id: uuidField,
  email: z.email({ message: "Format email tidak valid." }).transform((v) => v.toLowerCase()),
});

export type InvitePortalInput = z.infer<typeof invitePortalSchema>;

/** FR-M13-08: owner switches a creator's portal access on or off. */
export const portalAccessSchema = z.object({
  creator_id: uuidField,
  is_active: z.boolean(),
});

/** PRD section 9: the owner types the word to confirm an irreversible erasure. */
export const ANONYMIZE_CONFIRMATION = "ANONIMKAN";

export const anonymizeCreatorSchema = z.object({
  id: uuidField,
  confirmation: z.literal(ANONYMIZE_CONFIRMATION, {
    message: `Ketik ${ANONYMIZE_CONFIRMATION} untuk mengonfirmasi.`,
  }),
});

/* ------------------------------------------------------------------ */
/* Klipper self-service (M16, v4.0)                                    */
/* ------------------------------------------------------------------ */

/**
 * FR-M3-03 from the portal: the account itself. The audience claim travels
 * with a badge request instead, and the verification stamp stays with the team.
 */
export const portalSocialAccountSchema = socialAccountSchema.pick({
  platform: true,
  handle: true,
  profile_url: true,
  followers_count: true,
});

export type PortalSocialAccountFormInput = z.input<typeof portalSocialAccountSchema>;
export type PortalSocialAccountInput = z.output<typeof portalSocialAccountSchema>;

/** FR-M16-08: the claim behind a local badge request; the screenshot is separate. */
export const badgeRequestSchema = z.object({
  account_id: uuidField,
  kalimantan_audience_pct: z.coerce
    .number({ message: "Isi persentase audiens Kalimantan." })
    .min(0, { message: "Persentase minimal 0." })
    .max(100, { message: "Persentase maksimal 100." }),
  top_cities: z.string().trim().min(1, { message: "Isi kota audiens teratas." }).max(200),
});

export type BadgeRequestInput = z.output<typeof badgeRequestSchema>;

/** FR-M3-05: the team's answer to a badge request. */
export const badgeDecisionSchema = z
  .object({
    account_id: uuidField,
    decision: z.enum(["beri", "tolak"]),
    notes: z.string().trim().max(500).default(""),
  })
  .refine((value) => value.decision === "beri" || value.notes.length > 0, {
    path: ["notes"],
    message: "Tulis alasan penolakan agar klipper tahu yang perlu diperbaiki.",
  });

export type BadgeDecisionInput = z.output<typeof badgeDecisionSchema>;

/** FR-M3-09: blocking always carries a reason; unblocking is owner-only. */
export const blockCreatorSchema = z.object({
  creator_id: uuidField,
  reason: z
    .string()
    .trim()
    .min(5, { message: "Tulis alasan pemblokiran (minimal 5 karakter)." })
    .max(500),
});

export type BlockCreatorInput = z.output<typeof blockCreatorSchema>;
