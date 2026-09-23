import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireInternal } from "@/lib/auth/guards";
import { LOCAL_BADGE_MIN_PCT } from "@/lib/constants/creators";
import { listBadgeRequests } from "@/lib/data/creators";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BadgeRequestCard } from "./badge-request-card";

export const metadata: Metadata = { title: "Pengajuan lencana" };

/** FR-M3-05: the queue of local badge requests sent from the portal. */
export default async function BadgeRequestsPage() {
  const { profile } = await requireInternal();
  const supabase = await createSupabaseServerClient();
  const requests = await listBadgeRequests(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengajuan lencana Klipper Lokal"
        description={`Periksa tangkapan layar analitik: lencana diberikan bila minimal ${LOCAL_BADGE_MIN_PCT}% audiens berada di Kalimantan.`}
        backHref="/creators"
        backLabel="Daftar kreator"
      />

      {requests.length ? (
        <div className="grid gap-4">
          {requests.map((request) => (
            <BadgeRequestCard key={request.id} request={request} timezone={profile.timezone} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Tidak ada pengajuan yang menunggu.</p>
      )}
    </div>
  );
}
