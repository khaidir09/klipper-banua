import { z } from "zod";
import { MINIMUM_CREATOR_AGE } from "@/lib/constants/creators";
import { PROVINCES } from "@/lib/constants/regions";
import { passwordSchema } from "./auth";
import { isAdult } from "./creators";
import { isDisposableEmail } from "./disposable-email";
import { normalizeWhatsapp } from "./phone";

export const SIGNUP_UNDERAGE_MESSAGE = `Klipper harus berusia minimal ${MINIMUM_CREATOR_AGE} tahun.`;

const requiredText = (message: string, max = 120) =>
  z.string().trim().min(1, { message }).max(max, { message: "Isian terlalu panjang." });

const mustAccept = (message: string) => z.boolean().refine((value) => value, { message });

/**
 * FR-M16-01. The same rules run again inside `handle_new_user`, because the
 * Auth API can be called without this form.
 */
export const signupSchema = z
  .object({
    email: z
      .email({ message: "Format email tidak valid." })
      .max(255)
      .transform((value) => value.toLowerCase())
      .refine((value) => !isDisposableEmail(value), {
        message: "Pakai email pribadi yang aktif, jangan email sementara.",
      }),
    password: passwordSchema,
    passwordConfirmation: z.string().min(1, { message: "Ulangi kata sandi." }),
    full_name: requiredText("Nama lengkap wajib diisi.", 200),
    stage_name: requiredText("Nama panggung wajib diisi."),
    birth_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Tanggal lahir wajib diisi." })
      .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), {
        message: "Tanggal lahir tidak valid.",
      })
      .refine((value) => isAdult(new Date(`${value}T00:00:00Z`)), {
        message: SIGNUP_UNDERAGE_MESSAGE,
      }),
    phone_wa: z
      .string()
      .trim()
      .max(32)
      .transform((value, ctx) => {
        const normalized = normalizeWhatsapp(value);
        if (!normalized) {
          ctx.addIssue({
            code: "custom",
            message: "Nomor WhatsApp tidak valid. Contoh: 0812-3456-7890.",
          });
          return z.NEVER;
        }
        return normalized;
      }),
    city: requiredText("Kota wajib diisi."),
    province: z.enum(PROVINCES, { message: "Pilih provinsi." }),
    agree_terms: mustAccept("Setujui Syarat Klipper untuk melanjutkan."),
    agree_privacy: mustAccept("Setujui Kebijakan Privasi untuk melanjutkan."),
    confirm_adult: mustAccept(`Pastikan Anda berusia minimal ${MINIMUM_CREATOR_AGE} tahun.`),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "Kata sandinya belum sama. Coba ketik ulang.",
  });

export type SignupFormInput = z.input<typeof signupSchema>;
export type SignupInput = z.output<typeof signupSchema>;
