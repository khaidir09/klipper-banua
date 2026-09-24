import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clapperboard, Compass } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreator } from "@/lib/auth/guards";
import {
  getPortalBalance,
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
  const [creator, assignments, catalog, clips, balance] = await Promise.all([
    getPortalProfile(supabase),
    listPortalAssignments(supabase),
    listPortalCatalog(supabase),
    listPortalClips(supabase, { timezone: profile.timezone }),
    getPortalBalance(supabase),
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
  const decisions = clips
    .filter((clip) => clip.lastReview)
    .sort((a, b) => b.lastReview!.createdAt.localeCompare(a.lastReview!.createdAt))
    .slice(0, 3);
  const DECISION_TEXT = {
    disetujui: "disetujui",
    revisi: "perlu diperbaiki",
    ditolak: "ditolak",
  } as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting}
        description="Kampanye yang kamu ikuti, klip yang lagi dicek tim, dan saldomu, semua ada di sini."
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
              Kampanye yang bisa kamu ikuti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{openToJoin}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Klip lagi dicek tim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{waitingClips}</p>
          </CardContent>
        </Card>
        <Link href="/portal/saldo" className="block rounded-xl hover:bg-accent/40">
          <Card className="h-full bg-transparent">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo tersedia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{formatRupiah(balance?.available ?? 0)}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {decisions.length ? (
        <Card>
          <CardHeader>
            <CardTitle>
              <h2 className="flex items-center gap-2">
                <Clapperboard className="size-5" aria-hidden />
                Kabar terbaru klipmu
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
              Cari kampanye, mulai dapat honor
            </h2>
          </CardTitle>
          <CardDescription>
            Pilih kampanye, baca brief-nya, gabung, lalu posting klip di akunmu. Setiap 1.000 views
            yang lolos cek tim jadi honor di saldomu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="h-11">
            <Link href="/portal/kampanye">
              Lihat kampanye
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Kampanye yang lagi jalan</h2>
        {running.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {running.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Kamu belum ikut kampanye yang lagi jalan.{" "}
            {assignments.length ? (
              <>
                Kampanye lamamu ada di{" "}
                <Link href="/portal/penugasan" className="font-medium underline">
                  Kampanye Saya
                </Link>
                .
              </>
            ) : (
              "Yuk, pilih satu dari katalog dan mulai ngeklip."
            )}
          </p>
        )}
      </section>
    </div>
  );
}
