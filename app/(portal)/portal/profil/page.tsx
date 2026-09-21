import type { Metadata } from "next";
import { ProfileForm } from "@/components/forms/profile-form";
import { DetailList } from "@/components/layout/detail-list";
import { PageHeader } from "@/components/layout/page-header";
import { CreatorStatusBadge } from "@/components/status/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreator } from "@/lib/auth/guards";
import { CREATOR_TIER_LABELS } from "@/lib/constants/creators";
import { getPortalProfile } from "@/lib/data/portal";
import { resolveTimezone } from "@/lib/format/timezone";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profil saya" };

export default async function PortalProfilePage() {
  const { user, profile } = await requireCreator();
  const supabase = await createSupabaseServerClient();
  const creator = await getPortalProfile(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil saya"
        description="Data kreator dikelola tim. Hubungi tim bila ada yang perlu diperbarui."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Data kreator</h2>
            </CardTitle>
            {creator ? (
              <CardDescription>
                <CreatorStatusBadge status={creator.status} />
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            {creator ? (
              <DetailList
                items={[
                  { label: "Nama lengkap", value: creator.full_name },
                  { label: "Nama panggung", value: creator.stage_name },
                  { label: "WhatsApp", value: creator.phone_wa },
                  { label: "Email", value: creator.email },
                  { label: "Kota", value: creator.city },
                  { label: "Provinsi", value: creator.province },
                  { label: "Tier", value: CREATOR_TIER_LABELS[creator.tier] },
                  { label: "Versi syarat disetujui", value: creator.terms_version },
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Data kreator tidak tersedia.</p>
            )}
          </CardContent>
        </Card>

        <Card>
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
    </div>
  );
}
