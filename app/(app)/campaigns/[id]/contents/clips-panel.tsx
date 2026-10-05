import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { LiveStatusBadge, ReviewStatusBadge } from "@/components/status/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/constants/creators";
import type { CampaignClipRow } from "@/lib/data/clips";
import { formatRupiah } from "@/lib/format/currency";
import { formatDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";

/**
 * FR-M18-04: the Konten tab of a `per_views` campaign lists the clips the
 * klipers sent. Decisions are taken on the verification page, which keeps
 * the honor ledger right.
 */
export function ClipsPanel({ clips, timezone }: { clips: CampaignClipRow[]; timezone: string }) {
  const earned = clips.reduce((sum, clip) => sum + clip.earned, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Klip ({formatNumber(clips.length)})</h2>
        </CardTitle>
        <CardDescription>
          Klip dikirim kliper setelah tayang dan diverifikasi di halaman Verifikasi. Total honor
          klip: {formatRupiah(earned)}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {clips.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada klip untuk kampanye ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kliper</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tayang</TableHead>
                  <TableHead className="text-right">Views terverifikasi</TableHead>
                  <TableHead className="text-right">Honor</TableHead>
                  <TableHead>
                    <span className="sr-only">Buka</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clips.map((clip) => (
                  <TableRow key={clip.id}>
                    <TableCell>
                      <span className="font-medium">{clip.creatorName}</span>
                      <span className="block text-xs text-muted-foreground">
                        {SOCIAL_PLATFORM_LABELS[clip.platform]}
                        {clip.url ? (
                          <>
                            {" · "}
                            <a
                              href={clip.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 hover:underline"
                            >
                              buka klip
                              <ExternalLink className="size-3" aria-hidden />
                            </a>
                          </>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <ReviewStatusBadge status={clip.reviewStatus} />
                        {clip.reviewStatus === "disetujui" ? (
                          <LiveStatusBadge status={clip.liveStatus} />
                        ) : null}
                        {clip.pendingViews ? <Badge variant="warning">Views baru</Badge> : null}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {clip.postedAt ? formatDateTime(clip.postedAt, timezone) : "–"}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {clip.verifiedViews === null ? "–" : formatNumber(clip.verifiedViews)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatRupiah(clip.earned)}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/verifikasi/${clip.id}`}
                        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                      >
                        Verifikasi
                        <ChevronRight className="size-4" aria-hidden />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
