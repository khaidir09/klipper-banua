import { z } from "zod";
import { CHECKPOINTS } from "@/lib/constants/metrics";
import { isLocalDateTimeInput } from "@/lib/format/date";
import { nullableText, uuidField } from "./common";
import { countField } from "./money";

const dateField = (message: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message });

/** FR-M7-01. `captured_at` is wall-clock time in the user's timezone. */
export const snapshotSchema = z.object({
  content_id: uuidField,
  checkpoint: z.enum(CHECKPOINTS, { message: "Pilih checkpoint." }),
  captured_at: z
    .string()
    .refine(isLocalDateTimeInput, { message: "Waktu pengambilan wajib diisi." }),
  views: countField,
  likes: countField,
  comments: countField,
  shares: countField,
  saves: countField,
  proof_path: z.string().trim().min(1, { message: "Unggah tangkapan layar bukti metrik." }),
});

export type SnapshotFormInput = z.input<typeof snapshotSchema>;
export type SnapshotInput = z.output<typeof snapshotSchema>;

/** FR-M13-06: what a creator sends from the portal; the team verifies it. */
export const metricSubmissionSchema = snapshotSchema;

export type MetricSubmissionFormInput = z.input<typeof metricSubmissionSchema>;
export type MetricSubmissionInput = z.output<typeof metricSubmissionSchema>;

/** FR-M13-06: accepting needs nothing, rejecting always needs a reason. */
export const submissionReviewSchema = z
  .object({
    submission_id: uuidField,
    accept: z.boolean(),
    notes: z.string().trim().max(2000).default(""),
  })
  .refine((value) => value.accept || value.notes.length > 0, {
    path: ["notes"],
    message: "Tulis alasan penolakan agar kreator tahu yang harus diperbaiki.",
  });

export type SubmissionReviewFormInput = z.input<typeof submissionReviewSchema>;
export type SubmissionReviewInput = z.output<typeof submissionReviewSchema>;

export const NO_PERSONAL_DATA_MESSAGE =
  "Pastikan bukti hanya berisi angka rekap, tanpa nama/NIK/nomor HP pendaftar, lalu centang konfirmasi.";

/** FR-M7-04: aggregate numbers only; never registrant personal data. */
export const registrantReportSchema = z
  .object({
    // "" in the select means "tanpa kode" (not attributable to a creator).
    campaign_creator_id: z
      .union([uuidField, z.literal(""), z.null()])
      .transform((value) => value || null),
    period_start: dateField("Tanggal awal periode wajib diisi."),
    period_end: dateField("Tanggal akhir periode wajib diisi."),
    registrant_count: countField,
    proof_path: nullableText.transform((value) => value || null),
    proof_confirmed_no_personal_data: z.boolean(),
    notes: z.string().trim().max(2000),
  })
  .refine((value) => value.period_end >= value.period_start, {
    path: ["period_end"],
    message: "Akhir periode tidak boleh sebelum awal periode.",
  })
  .refine((value) => !value.proof_path || value.proof_confirmed_no_personal_data, {
    path: ["proof_confirmed_no_personal_data"],
    message: NO_PERSONAL_DATA_MESSAGE,
  });

export type RegistrantReportFormInput = z.input<typeof registrantReportSchema>;
export type RegistrantReportInput = z.output<typeof registrantReportSchema>;
