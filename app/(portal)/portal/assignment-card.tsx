import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  AssignmentStatusBadge,
  CampaignStatusBadge,
} from "@/components/campaigns/campaign-status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCalendarRange } from "@/lib/format/date";
import type { PortalAssignment } from "@/lib/data/portal";

/** One assignment in the portal's lists (FR-M13-03). */
export function AssignmentCard({ assignment }: { assignment: PortalAssignment }) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CampaignStatusBadge status={assignment.campaign_status} />
          <AssignmentStatusBadge status={assignment.status} />
        </div>
        <CardTitle className="text-base">
          <Link href={`/portal/penugasan/${assignment.id}`} className="hover:underline">
            {assignment.campaign_name}
          </Link>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{assignment.client_name}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Periode</dt>
            <dd>{formatCalendarRange(assignment.start_date, assignment.end_date)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Konten disepakati</dt>
            <dd>{assignment.contents_committed} konten</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Kode referal</dt>
            <dd className="font-mono">{assignment.referral_code}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Minimal tayang</dt>
            <dd>{assignment.min_live_days} hari</dd>
          </div>
        </dl>
        <Link
          href={`/portal/penugasan/${assignment.id}`}
          className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          Lihat brief
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      </CardContent>
    </Card>
  );
}
