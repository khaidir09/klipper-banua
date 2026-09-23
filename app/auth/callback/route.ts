import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { appUrl } from "@/lib/app-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/validation/auth";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "recovery",
  // Confirmation of a klipper registration (FR-M16-02).
  "signup",
  "invite",
  "email",
  "email_change",
  "magiclink",
];

/**
 * Exchanges the code from a password-recovery, invitation or sign-up
 * confirmation email for a session, then sends the user on: to pick a
 * password (FR-M1-02, FR-M1-04) or to finish a klipper account (FR-M16-05).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const type = EMAIL_OTP_TYPES.find((t) => t === typeParam) ?? "recovery";
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(appUrl(next));
    }
  } else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(appUrl(next));
    }
  }

  const loginUrl = appUrl("/login");
  loginUrl.searchParams.set("alasan", "tautan");
  return NextResponse.redirect(loginUrl);
}
