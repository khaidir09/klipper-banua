import { AppShell } from "@/components/layout/app-shell";
import { sidebarDefaultOpen } from "@/components/layout/sidebar-state";
import { requireClient } from "@/lib/auth/guards";
import { publicEnv } from "@/lib/env";

/**
 * Client portal (PRD M14). `requireClient` sends every other role to where it
 * belongs and signs out an account whose access was withdrawn.
 */
export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireClient();

  return (
    <AppShell
      appName={publicEnv.NEXT_PUBLIC_APP_NAME}
      fullName={profile.full_name}
      email={user.email ?? ""}
      role={profile.role}
      area="client"
      defaultOpen={await sidebarDefaultOpen()}
    >
      {/* Clients check progress from a phone too: see `.touch-targets` in globals.css. */}
      <div className="touch-targets">{children}</div>
    </AppShell>
  );
}
