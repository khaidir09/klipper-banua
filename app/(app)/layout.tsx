import { AppShell } from "@/components/layout/app-shell";
import { sidebarDefaultOpen } from "@/components/layout/sidebar-state";
import { requireInternal } from "@/lib/auth/guards";
import { publicEnv } from "@/lib/env";

/**
 * Guards every authenticated route: no session, a deactivated account or a
 * creator portal account never reaches the pages below (FR-M1-03, FR-M13-02).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireInternal();

  return (
    <AppShell
      appName={publicEnv.NEXT_PUBLIC_APP_NAME}
      fullName={profile.full_name}
      email={user.email ?? ""}
      role={profile.role}
      area="app"
      defaultOpen={await sidebarDefaultOpen()}
    >
      {children}
    </AppShell>
  );
}
