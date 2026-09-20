"use server";

import { redirect } from "next/navigation";
import { publicEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  homePathForRole,
  loginSchema,
  newPasswordSchema,
  safeNextPath,
} from "@/lib/validation/auth";

export type ActionResult =
  { status: "error"; message: string } | { status: "success"; message: string };

const GENERIC_CREDENTIALS_ERROR = "Email atau kata sandi salah.";

/** FR-M1-01. Every input is validated again on the server. */
export async function signInAction(values: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(values);

  if (!parsed.success) {
    return { status: "error", message: "Periksa kembali email dan kata sandi Anda." };
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  // Keep the message generic so the form cannot be used to discover accounts.
  if (error || !data.user) {
    return { status: "error", message: GENERIC_CREDENTIALS_ERROR };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active, role")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return {
      status: "error",
      message: "Akun Anda dinonaktifkan. Hubungi owner untuk mengaktifkan kembali.",
    };
  }

  redirect(safeNextPath(parsed.data.next, homePathForRole(profile.role)));
}

/** FR-M1-04. Always answers the same way, whether or not the email exists. */
export async function requestPasswordResetAction(values: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return { status: "error", message: "Format email tidak valid." };
  }

  const supabase = await createSupabaseServerClient();

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/atur-sandi`,
  });

  return {
    status: "success",
    message:
      "Jika email tersebut terdaftar, tautan untuk mengatur ulang kata sandi sudah kami kirim. Periksa kotak masuk Anda.",
  };
}

/** FR-M1-04. Requires the recovery session created by the emailed link. */
export async function updatePasswordAction(values: unknown): Promise<ActionResult> {
  const parsed = newPasswordSchema.safeParse(values);

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Kata sandi belum memenuhi syarat.",
    };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      status: "error",
      message: "Tautan pemulihan tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { status: "error", message: "Kata sandi gagal diperbarui. Coba lagi." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  redirect(homePathForRole(profile?.role ?? "manager"));
}
