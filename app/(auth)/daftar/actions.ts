"use server";

import { headers } from "next/headers";
import { fail, invalid, ok, type ActionResult } from "@/lib/actions";
import { CREATOR_TERMS_VERSION } from "@/lib/constants/creators";
import { publicEnv } from "@/lib/env";
import { serverEnv } from "@/lib/env.server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FixedWindowRateLimiter } from "@/lib/tracking/rate-limit";
import { clientIpFromHeaders, hashIp } from "@/lib/tracking/redirect";
import { signupSchema } from "@/lib/validation/signup";

/** FR-M16-06: five registrations per visitor per hour, per server process. */
const signupLimiter = new FixedWindowRateLimiter(5, 60 * 60 * 1000);

const GENERIC_FAILURE =
  "Pendaftaran belum berhasil. Jika nomor WhatsApp ini pernah terdaftar, masuk dengan akun lama atau hubungi tim.";

/**
 * FR-M16-01, FR-M16-02. Creates the account through Supabase Auth; the
 * creator row is made by `handle_new_user`, which checks every field again and
 * always assigns the `creator` role. Nothing here trusts the browser.
 */
export async function signUpCreatorAction(
  values: unknown,
): Promise<ActionResult<{ email: string }>> {
  const parsed = signupSchema.safeParse(values);
  if (!parsed.success) return invalid(parsed.error);
  const input = parsed.data;

  const requestHeaders = await headers();
  const ipHash = await hashIp(clientIpFromHeaders(requestHeaders), serverEnv().CLICK_IP_HASH_SALT);
  if (ipHash && !signupLimiter.check(ipHash).allowed) {
    return fail("Terlalu banyak percobaan pendaftaran. Coba lagi dalam satu jam.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/portal/mulai`,
      data: {
        signup: "mandiri",
        full_name: input.full_name,
        stage_name: input.stage_name,
        birth_date: input.birth_date,
        phone_wa: input.phone_wa,
        city: input.city,
        province: input.province,
        terms_version: CREATOR_TERMS_VERSION,
      },
    },
  });

  if (error) {
    if (error.status === 429) {
      return fail("Terlalu banyak percobaan pendaftaran. Coba lagi beberapa saat lagi.");
    }
    if (error.code === "weak_password") {
      return fail("Kata sandi terlalu lemah. Gunakan huruf besar, huruf kecil, dan angka.");
    }
    // An email that already has an account is answered like a success
    // (Supabase does the same once confirmations are on), so the form cannot
    // be used to find out who is registered.
    if (error.code === "user_already_exists" || error.code === "email_exists") {
      return ok("Pendaftaran diterima.", { email: input.email });
    }
    // "Database error saving new user": handle_new_user refused the row,
    // almost always a WhatsApp number that is already registered.
    console.error(`creator sign-up failed (${error.code ?? error.status}): ${error.message}`);
    return fail(GENERIC_FAILURE);
  }

  return ok("Pendaftaran diterima.", { email: input.email });
}
