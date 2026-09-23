import type { Metadata } from "next";
import { BadgeCheck } from "lucide-react";
import { ProfileForm } from "@/components/forms/profile-form";
import { DetailList } from "@/components/layout/detail-list";
import { PageHeader } from "@/components/layout/page-header";
import { CreatorStatusBadge } from "@/components/status/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreator } from "@/lib/auth/guards";
import { CREATOR_TIER_LABELS } from "@/lib/constants/creators";
import { getPortalProfile, listPortalSocialAccounts } from "@/lib/data/portal";
import { formatDate } from "@/lib/format/date";
import { formatWhatsapp } from "@/lib/validation/phone";
import { resolveTimezone } from "@/lib/format/timezone";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DeleteAccountCard } from "./delete-account-card";
import { SocialAccountsManager } from "./social-accounts-manager";
import { VerificationCodeCard } from "./verification-code-card";

export const metadata: Metadata = { title: "Profil saya" };

export default async function PortalProfilePage() {
  const { user, profile } = await requireCreator();
  const supabase = await createSupabaseServerClient();
  const [creator, accounts] = await Promise.all([
    getPortalProfile(supabase),
    listPortalSocialAccounts(supabase),
  ]);
  const timezone = resolveTimezone(profile.timezone);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil saya"
        description="Kode verifikasi, akun media sosial, dan lencana Klipper Lokal. Perubahan data diri lewat tim."
      />

      {creator ? <VerificationCodeCard code={creator.verification_code} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Akun media sosial</h2>
          </CardTitle>
          <CardDescription>
            Daftarkan setiap akun yang Anda pakai untuk memposting klip.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialAccountsManager accounts={accounts} hasBadge={Boolean(creator?.local_badge_at)} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              <h2>Data diri</h2>
            </CardTitle>
            {creator ? (
              <CardDescription className="flex flex-wrap items-center gap-2">
                <CreatorStatusBadge status={creator.status} />
                {creator.local_badge_at ? (
                  <Badge variant="outline" className="gap-1">
                    <BadgeCheck className="size-3.5 text-success" aria-hidden />
                    Klipper Lokal sejak {formatDate(creator.local_badge_at, timezone)}
                  </Badge>
                ) : null}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            {creator ? (
              <DetailList
                items={[
                  { label: "Nama lengkap", value: creator.full_name },
                  { label: "Nama panggung", value: creator.stage_name },
                  { label: "WhatsApp", value: formatWhatsapp(creator.phone_wa) },
                  { label: "Email", value: creator.email },
                  { label: "Kota", value: creator.city },
                  { label: "Provinsi", value: creator.province },
                  { label: "Tier", value: CREATOR_TIER_LABELS[creator.tier] },
                  { label: "Versi syarat disetujui", value: creator.terms_version },
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Data klipper tidak tersedia.</p>
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
                timezone,
              }}
            />
          </CardContent>
        </Card>
      </div>

      {creator ? (
        <DeleteAccountCard requestedAt={creator.deletion_requested_at} timezone={timezone} />
      ) : null}
    </div>
  );
}
