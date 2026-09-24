import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clapperboard, Compass } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreator } from "@/lib/auth/guards";
import {
  getPortalProfile,
  listPortalAssignments,
  listPortalCatalog,
  listPortalClips,
} from "@/lib/data/portal";
import { formatRupiah } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AssignmentCard } from "./assignment-card";

export const metadata: Metadata = { title: "Beranda" };

export default async function PortalHomePage() {
  const { profile } = await requireCreator();
  const supabase = await createSupabaseServerClient();
  const [creator, assignments, catalog, clips] = await Promise.all([
    getPortalProfile(supabase),
    listPortalAssignments(supabase),
    listPortalCatalog(supabase),
    listPortalClips(supabase, { timezone: profile.timezone }),
  ]);
  // FR-M16-05: a new klipper finishes their account before anything else.
  if (creator?.status === "prospek") redirect("/portal/mulai");

  // Withdrawn assignments stay in "Kampanye Saya" but are no longer followed.
  const running = assignments.filter(
    (row) => row.campaign_status === "aktif" && row.status !== "mundur",
  );
  const openToJoin = catalog.filter((row) => !row.assignment_id && !row.budget_exhausted).length;
  const greeting = profile.full_name ? `Halo, ${profile.full_name}` : "Halo";
  // FR-M13-03: clips waiting for the team and the latest decisions.
  const waitingClips = clips.filter((clip) => clip.reviewStatus === "menunggu_review").length;
  const earned = clips.reduce((sum, clip) => sum + clip.earnedAmount, 0);
  const decisions = clips
    .filter((clip) => clip.lastReview)
    .sort((a, b) => b.lastReview!.createdAt.localeCompare(a.lastReview!.createdAt))
    .slice(0, 3);
  const DECISION_TEXT = {
    disetujui: "disetujui",
    revisi: "perlu perbaikan",
    ditolak: "ditolak",
  } as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting}
        description="Kampanye yang Anda ikuti, brief, materi, dan kode referalnya ada di sini."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kampanye diikuti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{running.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kampanye terbuka untuk Anda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{openToJoin}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Klip menunggu verifikasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{waitingClips}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Honor dari klip
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatRupiah(earned)}</p>
          </CardContent>
        </Card>
      </div>

      {decisions.length ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="flex items-center gap-2">
                <Clapperboard className="size-5" aria-hidden />
                Keputusan terbaru
              </h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              {decisions.map((clip) => (
                <li key={clip.id}>
                  <Link href={`/portal/klip#klip-${clip.id}`} className="hover:underline">
                    Klip {clip.campaignName}
                  </Link>{" "}
                  {DECISION_TEXT[clip.lastReview!.decision]} ·{" "}
                  <span className="text-muted-foreground">
                    {formatDate(clip.lastReview!.createdAt, profile.timezone)}
                  </span>
                </li>
              ))}
            </ul>
            <Button asChild variant="outline">
              <Link href="/portal/klip">Lihat semua klip</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>
            <h2 className="flex items-center gap-2">
              <Compass className="size-5" aria-hidden />
              Cari kampanye baru
            </h2>
          </CardTitle>
          <CardDescription>
            Baca brief di katalog, gabung, lalu posting klip di akun Anda. Honor dihitung per 1.000
            views yang diverifikasi tim.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="h-11">
            <Link href="/portal/kampanye">
              Buka katalog
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Kampanye berjalan</h2>
        {running.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {running.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Belum ada kampanye berjalan untuk Anda.{" "}
            {assignments.length ? (
              <>
                Penugasan sebelumnya ada di{" "}
                <Link href="/portal/penugasan" className="font-medium underline">
                  Kampanye Saya
                </Link>
                .
              </>
            ) : (
              "Pilih kampanye dari katalog untuk mulai."
            )}
          </p>
        )}
      </section>
    </div>
  );
}
