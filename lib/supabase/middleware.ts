import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/** Routes reachable without a session. Everything else requires login (FR-M1-03). */
const PUBLIC_PATHS = ["/login", "/lupa-sandi", "/atur-sandi", "/auth/callback"];

/** Public tracking redirect, implemented in phase 2 (FR-M5-05). */
const PUBLIC_PREFIXES = ["/r/"];

function isPublicPath(pathname: string) {
  return (
    PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}

/**
 * Refreshes the Supabase session cookie and guards the authenticated routes.
 * Called from `proxy.ts` (formerly `middleware.ts`, renamed in Next.js 16).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Do not run any logic between client creation and `getUser()`: it refreshes
  // the auth token and a stray await can log users out at random.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/lupa-sandi")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}
