import { PageHeader } from "@/components/layout/page-header";
import { SettingsNav } from "@/components/layout/settings-nav";
import { requireSession } from "@/lib/auth/guards";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireSession();

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" />
      <SettingsNav isOwner={profile.role === "owner"} />
      {children}
    </div>
  );
}
