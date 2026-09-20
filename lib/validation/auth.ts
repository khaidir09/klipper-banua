import { z } from "zod";

/** Mirrors `password_requirements` in supabase/config.toml. */
export const passwordSchema = z
  .string()
  .min(8, { message: "Kata sandi minimal 8 karakter." })
  .regex(/[a-z]/, { message: "Kata sandi harus memuat huruf kecil." })
  .regex(/[A-Z]/, { message: "Kata sandi harus memuat huruf kapital." })
  .regex(/\d/, { message: "Kata sandi harus memuat angka." });

export const loginSchema = z.object({
  email: z.email({ message: "Format email tidak valid." }),
  password: z.string().min(1, { message: "Kata sandi wajib diisi." }),
  next: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ message: "Format email tidak valid." }),
});

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    passwordConfirmation: z.string().min(1, { message: "Ulangi kata sandi baru." }),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Konfirmasi kata sandi tidak sama.",
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

/**
 * Only allows relative in-app paths as a post-login destination, so a crafted
 * `?next=` cannot bounce the user to another site. `fallback` is where the
 * signed-in user belongs: `/dashboard` for the team, `/portal` for a creator
 * (FR-M13-02).
 */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/keluar")) return fallback;
  return value;
}

/** Landing page for a role (FR-M13-02). */
export function homePathForRole(role: string): string {
  return role === "creator" ? "/portal" : "/dashboard";
}
