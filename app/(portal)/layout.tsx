import { AppShell } from "@/components/layout/app-shell";
import { sidebarDefaultOpen } from "@/components/layout/sidebar-state";
import { requireCreator } from "@/lib/auth/guards";
import { publicEnv } from "@/lib/env";

/**
 * Creator portal (PRD M13). `requireCreator` sends internal members back to
 * the app and signs out an account whose portal access was withdrawn.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireCreator();

  return (
    <AppShell
      appName={publicEnv.NEXT_PUBLIC_APP_NAME}
      fullName={profile.full_name}
      email={user.email ?? ""}
      role={profile.role}
      area="portal"
      defaultOpen={await sidebarDefaultOpen()}
    >
      {/* Creators work from a phone: see the `.touch-targets` rule in globals.css. */}
      <div className="touch-targets">{children}</div>
    </AppShell>
  );
}
