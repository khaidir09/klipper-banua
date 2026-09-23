import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireCreator } from "@/lib/auth/guards";
import { getPortalProfile, listPortalAssignments } from "@/lib/data/portal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AssignmentCard } from "./assignment-card";

export const metadata: Metadata = { title: "Beranda" };

export default async function PortalHomePage() {
  const { profile } = await requireCreator();
  const supabase = await createSupabaseServerClient();
  const [creator, assignments] = await Promise.all([
    getPortalProfile(supabase),
    listPortalAssignments(supabase),
  ]);
  // FR-M16-05: a new klipper finishes their account before anything else.
  if (creator?.status === "prospek") redirect("/portal/mulai");

  const running = assignments.filter((row) => row.campaign_status === "aktif");
  const committed = running.reduce((total, row) => total + row.contents_committed, 0);
  const greeting = profile.full_name ? `Halo, ${profile.full_name}` : "Halo";

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting}
        description="Di sini Anda melihat brief, materi, dan kode referal untuk setiap kampanye yang Anda kerjakan."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kampanye berjalan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{running.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Konten yang disepakati
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{committed}</p>
          </CardContent>
        </Card>
      </div>

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
                  Penugasan saya
                </Link>
                .
              </>
            ) : (
              "Tim akan menghubungi Anda saat ada penugasan baru."
            )}
          </p>
        )}
      </section>
    </div>
  );
}
