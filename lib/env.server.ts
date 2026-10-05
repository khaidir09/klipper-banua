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

/*
 * SMTP for kliper notification emails (FR-M18-09, FR-M19-09). Optional:
 * without SMTP_HOST and EMAIL_FROM no email is sent. Kept apart from
 * `serverEnv()` so a half-filled SMTP block never breaks the rest of the app.
 */
const blankToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const smtpEnvSchema = z.object({
  SMTP_HOST: z.preprocess(blankToUndefined, z.string().optional()),
  SMTP_PORT: z.preprocess(blankToUndefined, z.coerce.number().int().positive().default(587)),
  SMTP_USER: z.preprocess(blankToUndefined, z.string().optional()),
  SMTP_PASS: z.preprocess(blankToUndefined, z.string().optional()),
  EMAIL_FROM: z.preprocess(blankToUndefined, z.string().optional()),
});

export type SmtpConfig = {
  host: string;
  port: number;
  auth: { user: string; pass: string } | undefined;
  from: string;
};

let smtpCached: SmtpConfig | null | undefined;

/** The SMTP settings, or `null` when notification emails are turned off. */
export function smtpConfig(): SmtpConfig | null {
  if (smtpCached !== undefined) return smtpCached;

  const parsed = smtpEnvSchema.safeParse({
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    EMAIL_FROM: process.env.EMAIL_FROM,
  });
  if (!parsed.success) {
    throw new Error(`Invalid SMTP environment variables:\n${z.prettifyError(parsed.error)}`);
  }

  const env = parsed.data;
  smtpCached =
    env.SMTP_HOST && env.EMAIL_FROM
      ? {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS ?? "" } : undefined,
          from: env.EMAIL_FROM,
        }
      : null;
  return smtpCached;
}
