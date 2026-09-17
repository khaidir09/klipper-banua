import { AppShell } from "@/components/layout/app-shell";
import { requireSession } from "@/lib/auth/guards";
import { publicEnv } from "@/lib/env";
import { timezoneLabel } from "@/lib/format/timezone";

/**
 * Guards every authenticated route: no session or a deactivated account never
 * reaches the pages below (FR-M1-03).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireSession();

  return (
    <AppShell
      appName={publicEnv.NEXT_PUBLIC_APP_NAME}
      fullName={profile.full_name}
      email={user.email ?? ""}
      role={profile.role}
      timezoneLabel={timezoneLabel(profile.timezone)}
    >
      {children}
    </AppShell>
  );
}
