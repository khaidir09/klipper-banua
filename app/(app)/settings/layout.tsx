import { PageHeader } from "@/components/layout/page-header";
import { SettingsNav } from "@/components/layout/settings-nav";
import { requireInternal } from "@/lib/auth/guards";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireInternal();

  return (
    <div className="space-y-6">
      <PageHeader title="Pengaturan" />
      <SettingsNav isOwner={profile.role === "owner"} />
      {children}
    </div>
  );
}
