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
  "Tambahkan akun media sosial yang Anda pakai untuk memposting klip.",
  "Salin kode verifikasi dan tulis di caption setiap klip.",
  "Pilih kampanye, baca brief, lalu buat dan posting klip di akun Anda.",
  "Kirim tautan klip beserta bukti views. Honor masuk ke saldo setelah diverifikasi tim.",
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
        description="Selesaikan dua langkah ini sebelum mengambil kampanye pertama."
      />

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Cara kerja</h2>
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
            <h2>1. Akun media sosial</h2>
          </CardTitle>
          <CardDescription>
            Minimal satu akun TikTok, Instagram, YouTube, atau Facebook milik Anda sendiri.
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
            Tambahkan minimal satu akun media sosial untuk mengaktifkan akun Anda.
          </p>
        )}
      </div>
    </div>
  );
}
