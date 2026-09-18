import Link from "next/link";
import { Plus } from "lucide-react";
import {
  AssignmentStatusBadge,
  CampaignStatusBadge,
} from "@/components/campaigns/campaign-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AssignmentStatus, CampaignStatus } from "@/lib/constants/campaigns";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarRange } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { creatorTotals } from "@/lib/calculations/creator-totals";
import { PAYOUT_STATUS_LABELS, type PayoutStatus } from "@/lib/constants/finance";

type HistoryCampaign = {
  id: string;
  code: string;
  name: string;
  status: CampaignStatus;
  start_date: string;
  end_date: string;
};

/** FR-M2-03: campaigns of a client with the total contract value. */
export function ClientCampaignHistory({
  clientId,
  campaigns,
  totalValue,
}: {
  clientId: string;
  campaigns: (HistoryCampaign & { package_price: number })[];
  totalValue: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat kampanye</CardTitle>
        <CardDescription>
          Total nilai kontrak:{" "}
          <span className="font-medium text-foreground">{formatRupiah(totalValue)}</span> (tanpa
          kampanye dibatalkan)
        </CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/campaigns/new?client_id=${clientId}`}>
              <Plus aria-hidden />
              Kampanye baru
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada kampanye.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kampanye</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Periode</TableHead>
                <TableHead className="text-right">Harga paket</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <Link
                      href={`/campaigns/${campaign.id}/overview`}
                      className="font-medium hover:underline"
                    >
                      {campaign.name}
                    </Link>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {campaign.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <CampaignStatusBadge status={campaign.status} />
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap sm:table-cell">
                    {formatCalendarRange(campaign.start_date, campaign.end_date)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatRupiah(campaign.package_price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/** FR-M3-08: campaign history with views, registrants and fees received. */
export function CreatorCampaignHistory({
  assignments,
}: {
  assignments: {
    id: string;
    status: AssignmentStatus;
    contents_committed: number;
    referral_code: string;
    campaign: HistoryCampaign | null;
    views: number;
    registrants: number;
    payout: { status: PayoutStatus; total_amount: number } | null;
  }[];
}) {
  const totals = creatorTotals(assignments);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Riwayat kampanye</CardTitle>
        <CardDescription>
          Total views {formatNumber(totals.views)} · pendaftar {formatNumber(totals.registrants)} ·
          honor diterima {formatRupiah(totals.feesReceived)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum pernah ditugaskan.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kampanye</TableHead>
                <TableHead>Penugasan</TableHead>
                <TableHead className="hidden sm:table-cell">Kode</TableHead>
                <TableHead className="hidden md:table-cell">Periode</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Views</TableHead>
                <TableHead className="hidden text-right lg:table-cell">Pendaftar</TableHead>
                <TableHead className="text-right">Honor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell>
                    {assignment.campaign ? (
                      <>
                        <Link
                          href={`/campaigns/${assignment.campaign.id}/creators`}
                          className="font-medium hover:underline"
                        >
                          {assignment.campaign.name}
                        </Link>
                        <span className="mt-0.5 block">
                          <CampaignStatusBadge status={assignment.campaign.status} />
                        </span>
                      </>
                    ) : (
                      "–"
                    )}
                  </TableCell>
                  <TableCell>
                    <AssignmentStatusBadge status={assignment.status} />
                    <span className="block text-xs text-muted-foreground">
                      {assignment.contents_committed} konten
                    </span>
                  </TableCell>
                  <TableCell className="hidden font-mono sm:table-cell">
                    {assignment.referral_code}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap md:table-cell">
                    {assignment.campaign
                      ? formatCalendarRange(
                          assignment.campaign.start_date,
                          assignment.campaign.end_date,
                        )
                      : "–"}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">
                    {formatNumber(assignment.views)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">
                    {formatNumber(assignment.registrants)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {assignment.payout ? (
                      <>
                        {formatRupiah(assignment.payout.total_amount)}
                        <span className="block text-xs text-muted-foreground">
                          {PAYOUT_STATUS_LABELS[assignment.payout.status]}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">–</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
