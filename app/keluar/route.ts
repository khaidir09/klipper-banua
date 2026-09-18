import { NextResponse, type NextRequest } from "next/server";
import { appUrl } from "@/lib/app-url";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Clears the session. Used by the header logout form (POST) and by the route
 * guard when a deactivated member still holds a valid cookie (GET).
 */
async function signOutAndRedirect(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  const reason = request.nextUrl.searchParams.get("alasan") ?? "keluar";
  const loginUrl = appUrl("/login");
  loginUrl.searchParams.set("alasan", reason);

  return NextResponse.redirect(loginUrl, { status: 303 });
}

export async function GET(request: NextRequest) {
  return signOutAndRedirect(request);
}

export async function POST(request: NextRequest) {
  return signOutAndRedirect(request);
}
