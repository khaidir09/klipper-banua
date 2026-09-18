import { z } from "zod";
import { REVIEW_DECISIONS } from "@/lib/constants/contents";
import { SOCIAL_PLATFORMS } from "@/lib/constants/creators";
import { CHECKLIST_ITEMS } from "@/lib/contents/review";
import { isLocalDateTimeInput } from "@/lib/format/date";
import { nullableText, optionalHttpUrl, uuidField } from "./common";

const captionField = z.string().trim().max(5000, { message: "Caption maksimal 5.000 karakter." });

/** Storage path produced by the browser upload; empty when a link is used. */
const draftFilePathField = nullableText.transform((value) => value || null);

const draftFields = {
  platform: z.enum(SOCIAL_PLATFORMS, { message: "Pilih platform." }),
  draft_url: optionalHttpUrl,
  draft_file_path: draftFilePathField,
  caption_draft: captionField,
};

const needsDraft = (value: { draft_url: string | null; draft_file_path: string | null }) =>
  Boolean(value.draft_url || value.draft_file_path);

const DRAFT_MESSAGE = "Tempel tautan draf atau unggah berkas draf.";

/** FR-M6-01 */
export const contentCreateSchema = z
  .object({ campaign_creator_id: uuidField, ...draftFields })
  .refine(needsDraft, { path: ["draft_url"], message: DRAFT_MESSAGE });

export type ContentCreateFormInput = z.input<typeof contentCreateSchema>;
export type ContentCreateInput = z.output<typeof contentCreateSchema>;

/** Correcting a draft that is still waiting, or answering a revision request. */
export const draftUpdateSchema = z
  .object(draftFields)
  .refine(needsDraft, { path: ["draft_url"], message: DRAFT_MESSAGE });

export type DraftUpdateFormInput = z.input<typeof draftUpdateSchema>;
export type DraftUpdateInput = z.output<typeof draftUpdateSchema>;

const checklistShape = Object.fromEntries(
  CHECKLIST_ITEMS.map((item) => [item.key, z.boolean().default(false)]),
) as Record<(typeof CHECKLIST_ITEMS)[number]["key"], z.ZodDefault<z.ZodBoolean>>;

/** FR-M6-02, FR-M6-03. Checklist completeness is checked against the campaign on the server. */
export const reviewSchema = z
  .object({
    decision: z.enum(REVIEW_DECISIONS, { message: "Pilih keputusan." }),
    checklist: z.object(checklistShape),
    notes: z.string().trim().max(2000),
  })
  .refine((value) => value.decision !== "revisi" || value.notes.length > 0, {
    path: ["notes"],
    message: "Catatan wajib diisi untuk permintaan revisi.",
  });

export type ReviewFormInput = z.input<typeof reviewSchema>;
export type ReviewInput = z.output<typeof reviewSchema>;

const localDateTimeField = (message: string) =>
  z.string().refine(isLocalDateTimeInput, { message });

/** FR-M6-04: times are wall-clock values in the user's timezone. */
export const postedSchema = z.object({
  posted_url: optionalHttpUrl.refine((value) => value !== null, {
    message: "URL tayang wajib diisi.",
  }),
  posted_at: localDateTimeField("Waktu tayang wajib diisi."),
});

export type PostedFormInput = z.input<typeof postedSchema>;
export type PostedInput = z.output<typeof postedSchema>;

/** FR-M6-05 */
export const removedSchema = z.object({
  removed_at: localDateTimeField("Waktu penghapusan wajib diisi."),
});

export type RemovedFormInput = z.input<typeof removedSchema>;
export type RemovedInput = z.output<typeof removedSchema>;
