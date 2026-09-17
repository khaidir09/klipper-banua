import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format/date";

export const metadata: Metadata = {
  title: "Dasbor",
};

export default async function DashboardPage() {
  const { profile } = await requireSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dasbor</h1>
        <p className="text-sm text-muted-foreground">
          Halo, {profile.full_name || "tim"}. Hari ini {formatDate(new Date(), profile.timezone)}.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Belum ada data</CardTitle>
          <CardDescription>
            Kartu ringkasan kampanye, konten menunggu review, dan pengingat snapshot dibangun pada
            Fase 4 (PRD M10).
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Fondasi aplikasi sudah siap: autentikasi, proteksi rute, dan layout.
        </CardContent>
      </Card>
    </div>
  );
}
