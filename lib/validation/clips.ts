import { z } from "zod";
import { CLIP_CHECKLIST_ITEMS, CLIP_REJECTION_REASONS } from "@/lib/constants/clips";
import { REVIEW_DECISIONS } from "@/lib/constants/contents";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creators";
import { isLocalDateTimeInput } from "@/lib/format/date";
import { optionalHttpUrl, uuidField } from "./common";
import { countField } from "./money";

const localDateTimeField = (message: string) =>
  z.string().refine(isLocalDateTimeInput, { message });

const proofPathField = z.string().trim().min(1, { message: "Unggah screenshot views-nya dulu." });

const requiredCountField = z.union([z.string(), z.number()]).pipe(countField);

/** FR-M18-01. `posted_at` is wall-clock time in the kliper's timezone. */
export const clipSubmitSchema = z.object({
  assignment_id: uuidField,
  platform: z.enum(SOCIAL_PLATFORMS, { message: "Pilih platform." }),
  posted_url: optionalHttpUrl.refine((value) => value !== null, {
    message: "Tempel tautan klipmu yang sudah tayang.",
  }),
  posted_at: localDateTimeField("Waktu tayang wajib diisi."),
  views: requiredCountField,
  likes: countField,
  comments: countField,
  shares: countField,
  proof_path: proofPathField,
  // FR-M18-03: the kliper states the code is in the caption; the team checks.
  code_in_caption: z.literal(true, {
    message: "Pastikan kode verifikasimu ada di caption, lalu centang pernyataan ini.",
  }),
});

export type ClipSubmitFormInput = z.input<typeof clipSubmitSchema>;
export type ClipSubmitInput = z.output<typeof clipSubmitSchema>;

/** FR-M18-03: sent again after a revision request, with the same URL. */
export const clipResubmitSchema = z.object({ content_id: uuidField });

/** FR-M18-05: new views for an approved clip. */
export const viewsUpdateSchema = z.object({
  content_id: uuidField,
  views: requiredCountField,
  likes: countField,
  comments: countField,
  shares: countField,
  proof_path: proofPathField,
});

export type ViewsUpdateFormInput = z.input<typeof viewsUpdateSchema>;
export type ViewsUpdateInput = z.output<typeof viewsUpdateSchema>;

const clipChecklistShape = Object.fromEntries(
  CLIP_CHECKLIST_ITEMS.map((item) => [item.key, z.boolean().default(false)]),
) as Record<(typeof CLIP_CHECKLIST_ITEMS)[number]["key"], z.ZodDefault<z.ZodBoolean>>;

/** Empty select value → null. */
const optionalReasonField = z
  .union([z.enum(CLIP_REJECTION_REASONS), z.literal(""), z.null()])
  .transform((value) => value || null);

/** Empty input → null, otherwise a whole number of views. */
const optionalViewsField = z.union([z.string(), z.number(), z.null()]).transform((value, ctx) => {
  if (value === null || (typeof value === "string" && !value.trim())) return null;
  const parsed = countField.safeParse(value);
  if (!parsed.success) {
    ctx.addIssue({ code: "custom", message: "Masukkan angka bulat, mis. 25." });
    return z.NEVER;
  }
  return parsed.data;
});

/**
 * FR-M18-04. Checklist completeness is checked against the campaign on the
 * server; the rules below are the ones that do not depend on it.
 */
export const clipVerifySchema = z
  .object({
    content_id: uuidField,
    decision: z.enum(REVIEW_DECISIONS, { message: "Pilih keputusan." }),
    checklist: z.object(clipChecklistShape),
    verified_views: optionalViewsField,
    rejection_reason: optionalReasonField,
    notes: z.string().trim().max(2000),
  })
  .refine((value) => value.decision !== "disetujui" || value.verified_views !== null, {
    path: ["verified_views"],
    message: "Isi views terverifikasi dari halaman klip.",
  })
  .refine((value) => value.decision !== "revisi" || value.notes.length > 0, {
    path: ["notes"],
    message: "Tulis apa yang harus diperbaiki kliper.",
  })
  .refine((value) => value.decision !== "ditolak" || value.rejection_reason !== null, {
    path: ["rejection_reason"],
    message: "Pilih alasan penolakan.",
  })
  .refine((value) => value.decision !== "ditolak" || value.notes.length > 0, {
    path: ["notes"],
    message: "Tulis catatan penolakan untuk kliper.",
  });

export type ClipVerifyFormInput = z.input<typeof clipVerifySchema>;
export type ClipVerifyInput = z.output<typeof clipVerifySchema>;

/** FR-M18-05: accept with verified views, or reject with a reason. */
export const viewsUpdateVerifySchema = z
  .object({
    submission_id: uuidField,
    accept: z.boolean(),
    verified_views: optionalViewsField,
    notes: z.string().trim().max(2000),
  })
  .refine((value) => !value.accept || value.verified_views !== null, {
    path: ["verified_views"],
    message: "Isi views terverifikasi dari halaman klip.",
  })
  .refine((value) => value.accept || value.notes.length > 0, {
    path: ["notes"],
    message: "Tulis alasan penolakan untuk kliper.",
  });

export type ViewsUpdateVerifyFormInput = z.input<typeof viewsUpdateVerifySchema>;
export type ViewsUpdateVerifyInput = z.output<typeof viewsUpdateVerifySchema>;

/** FR-M18-06 (`dihapus`) and FR-M18-07 (`kecurangan`, owner only). */
export const clipCancelSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("dihapus"),
    content_id: uuidField,
    removed_at: localDateTimeField("Waktu klip dihapus wajib diisi."),
  }),
  z.object({
    kind: z.literal("kecurangan"),
    content_id: uuidField,
    rejection_reason: z.enum(CLIP_REJECTION_REASONS, { message: "Pilih alasan penolakan." }),
    notes: z.string().trim().min(1, { message: "Tulis bukti kecurangan untuk kliper." }).max(2000),
  }),
]);

export type ClipCancelFormInput = z.input<typeof clipCancelSchema>;
export type ClipCancelInput = z.output<typeof clipCancelSchema>;
