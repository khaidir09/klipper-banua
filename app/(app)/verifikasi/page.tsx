import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireInternal } from "@/lib/auth/guards";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/constants/creators";
import { listClipQueue, type ClipQueueItem } from "@/lib/data/clips";
import { formatDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Verifikasi klip" };

function QueueCard({
  id,
  title,
  description,
  empty,
  items,
  timezone,
}: {
  id: string;
  title: string;
  description: string;
  empty: string;
  items: ClipQueueItem[];
  timezone: string;
}) {
  return (
    <Card id={id} className="scroll-mt-20">
      <CardHeader>
        <CardTitle>
          <h2>
            {title} <span className="text-muted-foreground">({formatNumber(items.length)})</span>
          </h2>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y">
            {items.map((item) => (
              <li key={item.submissionId}>
                <Link
                  href={`/verifikasi/${item.contentId}`}
                  className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-2.5 text-sm hover:bg-accent/60"
                >
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.creatorName}</span>
                      <span className="text-muted-foreground">
                        {SOCIAL_PLATFORM_LABELS[item.platform]} · {item.campaign.code}
                      </span>
                      {item.revisionCount > 0 ? (
                        <Badge variant="outline">Kiriman ulang {item.revisionCount}</Badge>
                      ) : null}
                      {item.overdue ? (
                        <Badge variant="destructive">
                          <AlertTriangle aria-hidden />
                          Lewat 24 jam
                        </Badge>
                      ) : null}
                    </span>
                    <span className="block text-muted-foreground">
                      {formatNumber(item.claimedViews)} views diklaim · menunggu sejak{" "}
                      {formatDateTime(item.waitingSince, timezone)}
                    </span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/** FR-M10-03, FR-M18-04, FR-M18-05: both verification queues, oldest first. */
export default async function VerificationQueuePage() {
  const { profile } = await requireInternal();
  const supabase = await createSupabaseServerClient();
  const { clips, viewsUpdates } = await listClipQueue(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Verifikasi"
        description="Klip baru dan pembaruan views dari klipper kampanye per views. Yang paling lama menunggu di atas."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <QueueCard
          id="klip"
          title="Klip menunggu verifikasi"
          description="Periksa kode verifikasi di caption, akun, isi, periode, dan views sebelum menyetujui."
          empty="Tidak ada klip yang menunggu."
          items={clips}
          timezone={profile.timezone}
        />
        <QueueCard
          id="views"
          title="Pembaruan views menunggu"
          description="Klip yang sudah disetujui dengan views baru. Hanya selisih honornya yang dikreditkan."
          empty="Tidak ada pembaruan views yang menunggu."
          items={viewsUpdates}
          timezone={profile.timezone}
        />
      </div>
    </div>
  );
}
