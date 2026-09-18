import { z } from "zod";

/** Optional email that normalises the empty string to "". */
export const optionalEmailField = z
  .string()
  .trim()
  .max(255)
  .transform((value, ctx) => {
    if (!value) return "";
    const result = z.email().safeParse(value);
    if (!result.success) {
      ctx.addIssue({ code: "custom", message: "Format email tidak valid." });
      return z.NEVER;
    }
    return result.data.toLowerCase();
  });

export const optionalTextField = z.string().trim().max(2000).default("");

export const shortTextField = z.string().trim().max(200).default("");

// Any 8-4-4-4-12 hex id, as Postgres accepts. z.uuid() would also demand an
// RFC 4122 version nibble, rejecting ids that seed or imported data may use.
export const uuidField = z.guid({ message: "ID tidak valid." });

/** Pagination and search parameters shared by every list page. */
export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  q: z.string().trim().max(100).default(""),
});

export const PAGE_SIZE = 20;
