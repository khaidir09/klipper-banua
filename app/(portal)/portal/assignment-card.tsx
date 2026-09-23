import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import { AssignmentStatusBadge, CampaignStatusBadge } from "@/components/status/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarRange } from "@/lib/format/date";
import type { PortalAssignment } from "@/lib/data/portal";

/** One assignment in the portal's lists (FR-M13-03). */
export function AssignmentCard({ assignment }: { assignment: PortalAssignment }) {
  const needsConfirmation =
    assignment.status === "diundang" && assignment.campaign_status === "aktif";

  return (
    <Card className="relative">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CampaignStatusBadge status={assignment.campaign_status} />
          <AssignmentStatusBadge status={assignment.status} />
        </div>
        <CardTitle className="text-base">
          <h2>
            {/* Stretched link: the whole card is the tap target, which beats
                padding a one-line title out to 44px on a phone. */}
            <Link
              href={`/portal/penugasan/${assignment.id}`}
              className="after:absolute after:inset-0 hover:underline focus-visible:underline"
            >
              {assignment.campaign_name}
            </Link>
          </h2>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{assignment.client_name}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Periode</dt>
            <dd>{formatCalendarRange(assignment.start_date, assignment.end_date)}</dd>
          </div>
          {assignment.payout_model === "per_views" ? (
            <div>
              <dt className="text-muted-foreground">Tarif / 1.000 views</dt>
              <dd className="tabular-nums">{formatRupiah(assignment.rate_per_1000_views)}</dd>
            </div>
          ) : (
            <div>
              <dt className="text-muted-foreground">Konten disepakati</dt>
              <dd>{assignment.contents_committed} konten</dd>
            </div>
          )}
          <div>
            <dt className="text-muted-foreground">Kode referal</dt>
            <dd className="font-mono">{assignment.referral_code}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Minimal tayang</dt>
            <dd>{assignment.min_live_days} hari</dd>
          </div>
        </dl>
        {/* FR-M13-10: an unconfirmed assignment is the one thing the creator
            has to act on, so the list says so instead of only the badge. */}
        {needsConfirmation ? (
          <p className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            <CircleAlert className="size-4" aria-hidden />
            Menunggu konfirmasi brief Anda
          </p>
        ) : (
          /* Affordance only. The card itself carries the link, so a screen
             reader announces one target per card instead of two. */
          <p className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            {assignment.status === "mundur" ? "Lihat riwayat" : "Lihat brief"}
            <ArrowRight className="size-4" aria-hidden />
          </p>
        )}
      </CardContent>
    </Card>
  );
}
