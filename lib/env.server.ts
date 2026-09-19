import "server-only";
import { z } from "zod";

/**
 * Server-only environment variables. Never import this module from a client
 * component: it carries the service role key and the click hashing salt.
 */
const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CLICK_IP_HASH_SALT: z.string().min(1),
  DEFAULT_TIMEZONE: z.enum(["Asia/Makassar", "Asia/Jakarta"]).default("Asia/Makassar"),
  // Bearer token n8n sends to the reminder endpoint (FR-M10-05). Unset turns
  // the endpoint off; empty counts as unset.
  REMINDER_API_TOKEN: z
    .string()
    .trim()
    .transform((value) => value || undefined)
    .pipe(z.string().min(32, "REMINDER_API_TOKEN must be at least 32 characters.").optional())
    .optional(),
});

let cached: z.infer<typeof serverEnvSchema> | null = null;

/**
 * Parsed lazily so that builds which never touch these secrets do not fail.
 */
export function serverEnv() {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    CLICK_IP_HASH_SALT: process.env.CLICK_IP_HASH_SALT,
    DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE,
    REMINDER_API_TOKEN: process.env.REMINDER_API_TOKEN,
  });

  if (!parsed.success) {
    throw new Error(`Invalid server environment variables:\n${z.prettifyError(parsed.error)}`);
  }

  cached = parsed.data;
  return cached;
}
