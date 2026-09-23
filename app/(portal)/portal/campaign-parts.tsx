import { Download, ExternalLink } from "lucide-react";
import { DetailList } from "@/components/layout/detail-list";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ASSET_TYPE_LABELS } from "@/lib/constants/campaigns";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/constants/creators";
import type { PortalAsset } from "@/lib/data/portal";
import { formatRupiah } from "@/lib/format/currency";
import { formatNumber } from "@/lib/format/number";

/**
 * Pieces shared by the catalog detail (before joining, FR-M17-03) and the
 * assignment page (after joining): the brief, the material and the terms of
 * a per_views campaign.
 */

function List({ items, empty }: { items: string[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function BriefCards({
  brief,
  hashtags,
  paidLabelRequired,
  mustDo,
  mustNot,
}: {
  brief: string;
  hashtags: string[];
  paidLabelRequired: boolean;
  mustDo: string[];
  mustNot: string[];
}) {
  return (
    <>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>
            <h2>Brief</h2>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm whitespace-pre-line">
            {brief || <span className="text-muted-foreground">Belum ada deskripsi brief.</span>}
          </p>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            <Badge variant={paidLabelRequired ? "default" : "outline"}>
              {paidLabelRequired ? "Label berbayar wajib" : "Label berbayar tidak wajib"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Yang wajib</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <List items={mustDo} empty="Belum ada poin wajib." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <h2>Larangan</h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <List items={mustNot} empty="Belum ada larangan." />
        </CardContent>
      </Card>
    </>
  );
}

export function AssetListCard({
  assets,
  emptyMessage = "Belum ada materi untuk kampanye ini.",
}: {
  assets: (PortalAsset & { signed_url: string | null })[];
  emptyMessage?: string;
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>
          <h2>Materi kampanye</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {assets.length ? (
          <ul className="divide-y">
            {assets.map((asset) => {
              const href = asset.signed_url ?? asset.external_url;
              return (
                <li key={asset.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{asset.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ASSET_TYPE_LABELS[asset.type]}
                      {asset.notes ? ` · ${asset.notes}` : ""}
                    </p>
                  </div>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-cta
                      className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
                    >
                      {asset.file_path ? (
                        <Download className="size-4" aria-hidden />
                      ) : (
                        <ExternalLink className="size-4" aria-hidden />
                      )}
                      {asset.file_path ? "Unduh" : "Buka"}
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">Berkas tidak tersedia</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}

export type PerViewsTerms = {
  rate_per_1000_views: number;
  max_payout_per_clip: number | null;
  max_payout_per_creator: number | null;
  min_views_to_earn: number;
  max_clips_per_creator: number;
  allowed_platforms: SocialPlatform[];
  local_only: boolean;
  min_live_days: number;
  claim_grace_days: number;
};

export function platformList(platforms: SocialPlatform[]): string {
  return platforms.map((platform) => SOCIAL_PLATFORM_LABELS[platform]).join(", ") || "–";
}

/** How a per_views clip earns (PRD 8.6), in the klipper's words. */
export function PerViewsTermsCard({
  terms,
  className,
}: {
  terms: PerViewsTerms;
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
          <h2>Honor per views</h2>
        </CardTitle>
        <CardDescription>
          Honor dihitung dari views yang diverifikasi tim, lalu masuk ke saldo Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DetailList
          items={[
            { label: "Tarif per 1.000 views", value: formatRupiah(terms.rate_per_1000_views) },
            {
              label: "Minimum views berhonor",
              value: terms.min_views_to_earn
                ? `${formatNumber(terms.min_views_to_earn)} views`
                : "Tanpa minimum",
            },
            {
              label: "Batas honor per klip",
              value:
                terms.max_payout_per_clip === null
                  ? "Tanpa batas"
                  : formatRupiah(terms.max_payout_per_clip),
            },
            {
              label: "Batas honor per klipper",
              value:
                terms.max_payout_per_creator === null
                  ? "Tanpa batas"
                  : formatRupiah(terms.max_payout_per_creator),
            },
            { label: "Klip maksimal", value: `${terms.max_clips_per_creator} klip` },
            { label: "Platform", value: platformList(terms.allowed_platforms) },
            { label: "Minimal tayang", value: `${terms.min_live_days} hari` },
            {
              label: "Masa klaim views",
              value: `${terms.claim_grace_days} hari setelah kampanye selesai`,
            },
            ...(terms.local_only
              ? [{ label: "Peserta", value: "Khusus lencana Klipper Lokal", wide: true }]
              : []),
          ]}
        />
      </CardContent>
    </Card>
  );
}
