import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed `middleware.ts` to `proxy.ts`; it runs on the Node.js runtime.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on every request except static assets, image files, the public
     * tracking redirect `/r/<slug>` and the health probe (no session needed).
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|r/|healthz|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
