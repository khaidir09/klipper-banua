import "server-only";
import { cookies } from "next/headers";

/** Matches SIDEBAR_COOKIE_NAME in `components/ui/sidebar.tsx`. */
const SIDEBAR_COOKIE = "sidebar_state";

/**
 * Reads the persisted sidebar state so the server renders it already open or
 * collapsed. Without this the shell always renders open and snaps shut on
 * hydration for anyone who collapsed it.
 */
export async function sidebarDefaultOpen(): Promise<boolean> {
  const store = await cookies();
  return store.get(SIDEBAR_COOKIE)?.value !== "false";
}
