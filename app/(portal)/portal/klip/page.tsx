import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { requireCreator } from "@/lib/auth/guards";
import { listPortalClips } from "@/lib/data/portal";
import { formatRupiah } from "@/lib/format/currency";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClipList } from "./clip-list";

export const metadata: Metadata = { title: "Klip Saya" };

/** FR-M18: every clip the klipper sent, across campaigns, newest first. */
export default async function PortalClipsPage() {
  const session = await requireCreator();
  const supabase = await createSupabaseServerClient();
  const clips = await listPortalClips(supabase, { timezone: session.profile.timezone });

  const waiting = clips.filter((clip) => clip.reviewStatus === "menunggu_review").length;
  const needsFix = clips.filter((clip) => clip.reviewStatus === "revisi").length;
  const earned = clips.reduce((sum, clip) => sum + clip.earnedAmount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Klip Saya"
        description="Status verifikasi, views terverifikasi, dan honor setiap klip yang Anda kirim."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Menunggu verifikasi", value: String(waiting) },
          { label: "Perlu perbaikan", value: String(needsFix) },
          { label: "Honor dari klip", value: formatRupiah(earned) },
        ].map((item) => (
          <Card key={item.label}>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-2xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {clips.length ? (
        <ClipList clips={clips} timezone={session.profile.timezone} showCampaign />
      ) : (
        <p className="text-sm text-muted-foreground">
          Belum ada klip. Buka{" "}
          <Link href="/portal/penugasan" className="font-medium underline">
            Kampanye Saya
          </Link>{" "}
          lalu kirim klip dari halaman kampanyenya.
        </p>
      )}
    </div>
  );
}
