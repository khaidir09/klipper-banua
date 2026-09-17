import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/validation/auth";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "recovery",
  "invite",
  "email",
  "email_change",
  "magiclink",
];

/**
 * Exchanges the code from a password-recovery or invitation email for a
 * session, then sends the user on to pick a password (FR-M1-02, FR-M1-04).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type");
  const type = EMAIL_OTP_TYPES.find((t) => t === typeParam) ?? "recovery";
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  } else if (tokenHash) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("alasan", "tautan");
  return NextResponse.redirect(loginUrl);
}
