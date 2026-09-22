import { z } from "zod";

/**
 * Public environment variables. Safe to read from client components.
 * Values must be referenced literally so Next.js can inline them at build time.
 */
/**
 * An unset or empty variable means "not configured", not "invalid": the
 * public contact buttons are simply left out when a value is missing, so the
 * internal app still boots on a deployment without a public site.
 */
const optional = <T extends z.ZodType>(schema: T) =>
  z.preprocess(
    (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
    schema.optional(),
  );

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Public site (PRD M15). International format, digits only.
  NEXT_PUBLIC_CONTACT_WA: optional(z.string().regex(/^\+?[\d\s-]{8,20}$/)),
  NEXT_PUBLIC_CONTACT_EMAIL: optional(z.email()),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_CONTACT_WA: process.env.NEXT_PUBLIC_CONTACT_WA,
  NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
});

if (!parsed.success) {
  throw new Error(
    `Invalid public environment variables:\n${z.prettifyError(parsed.error)}\nCopy .env.example to .env.local and fill it in.`,
  );
}

export const publicEnv = parsed.data;
