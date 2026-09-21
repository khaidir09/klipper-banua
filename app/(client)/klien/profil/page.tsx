import type { Metadata } from "next";
import { ProfileForm } from "@/components/forms/profile-form";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireClient } from "@/lib/auth/guards";
import { resolveTimezone } from "@/lib/format/timezone";

export const metadata: Metadata = { title: "Profil saya" };

export default async function ClientProfilePage() {
  const { user, profile } = await requireClient();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil saya"
        description="Data kontak dan instansi dikelola tim. Hubungi tim bila ada yang perlu diperbarui."
      />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>
            <h2>Akun portal</h2>
          </CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            defaultValues={{
              full_name: profile.full_name,
              timezone: resolveTimezone(profile.timezone),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
