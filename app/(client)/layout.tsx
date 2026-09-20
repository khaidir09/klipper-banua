import { AppShell } from "@/components/layout/app-shell";
import { requireClient } from "@/lib/auth/guards";
import { publicEnv } from "@/lib/env";
import { timezoneLabel } from "@/lib/format/timezone";

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
      timezoneLabel={timezoneLabel(profile.timezone)}
    >
      {children}
    </AppShell>
  );
}
