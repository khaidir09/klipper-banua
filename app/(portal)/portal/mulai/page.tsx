import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreator } from "@/lib/auth/guards";
import { getPortalProfile, listPortalSocialAccounts } from "@/lib/data/portal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SocialAccountsManager } from "../profil/social-accounts-manager";
import { VerificationCodeCard } from "../profil/verification-code-card";

export const metadata: Metadata = { title: "Mulai" };

const STEPS = [
  "Tambahkan akun medsos yang kamu pakai buat posting klip.",
  "Salin kode verifikasimu, lalu tulis di caption setiap klip.",
  "Pilih kampanye, baca brief-nya, lalu bikin dan posting klip di akunmu.",
  "Kirim tautan klip plus screenshot views. Setelah dicek tim, honornya masuk ke saldomu.",
];

/**
 * FR-M16-05. Where the confirmation email lands: a new klipper adds their
 * first social account here, which turns `prospek` into `aktif`.
 */
export default async function PortalStartPage() {
  await requireCreator();
  const supabase = await createSupabaseServerClient();
  const [creator, accounts] = await Promise.all([
    getPortalProfile(supabase),
    listPortalSocialAccounts(supabase),
  ]);
  if (!creator) redirect("/portal");

  const ready = creator.status !== "prospek" && accounts.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Selamat datang, klipper!"
        description="Beresin dua langkah singkat ini dulu, habis itu kamu bisa ambil kampanye pertamamu."
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Cara dapat honor</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm">
            {STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>1. Akun medsos kamu</h2>
          </CardTitle>
          <CardDescription>
            Cukup satu akun TikTok, Instagram, YouTube, atau Facebook, asal punya kamu sendiri.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SocialAccountsManager accounts={accounts} hasBadge={Boolean(creator.local_badge_at)} />
        </CardContent>
      </Card>

      <VerificationCodeCard code={creator.verification_code} />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {ready ? (
          <Button asChild className="h-11">
            <Link href="/portal/kampanye">Pilih kampanye</Link>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tambahkan minimal satu akun medsos dulu supaya akunmu aktif.
          </p>
        )}
      </div>
    </div>
  );
}
