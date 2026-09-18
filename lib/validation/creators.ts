import { z } from "zod";
import {
  CREATOR_STATUSES,
  CREATOR_TIERS,
  MINIMUM_CREATOR_AGE,
  NICHES,
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
});

export type CreatorListQuery = z.infer<typeof creatorListQuerySchema>;

/**
 * Gate for FR-M3-05: verification needs at least one social account with an
 * audience proof and a recorded terms agreement.
 */
export function verificationBlockers(input: {
  hasProofAccount: boolean;
  termsAgreedAt: string | null;
}): string[] {
  const blockers: string[] = [];
  if (!input.hasProofAccount) {
    blockers.push("Belum ada akun media sosial dengan bukti audiens.");
  }
  if (!input.termsAgreedAt) {
    blockers.push("Persetujuan syarat kerja sama belum dicatat.");
  }
  return blockers;
}

/** PRD section 9: the owner types the word to confirm an irreversible erasure. */
export const ANONYMIZE_CONFIRMATION = "ANONIMKAN";

export const anonymizeCreatorSchema = z.object({
  id: uuidField,
  confirmation: z.literal(ANONYMIZE_CONFIRMATION, {
    message: `Ketik ${ANONYMIZE_CONFIRMATION} untuk mengonfirmasi.`,
  }),
});
