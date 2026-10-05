import Link from "next/link";
import { BudgetMeter } from "@/components/campaigns/budget-meter";
import { PlatformIcon } from "@/components/platform-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { campaignCoverUrl } from "@/lib/campaigns/cover";
import { formatRupiah } from "@/lib/format/currency";
import { formatNumber } from "@/lib/format/number";
import type { PublicCampaign } from "@/lib/marketing/campaigns";
import { SIGNUP_PATH } from "@/lib/marketing/routes";

/**
 * One open campaign on the public site (FR-M15-09). The same numbers as the
 * portal card, without the brief: that, the material and the Gabung button
 * are behind the kliper login.
 */
export function PublicCampaignCard({ campaign }: { campaign: PublicCampaign }) {
  const coverUrl = campaignCoverUrl(campaign.cover_image_path);

  return (
    <article className="flex w-full flex-col overflow-hidden rounded-xl border bg-card">
      <div className="relative aspect-video bg-brand-panel">
        {coverUrl ? (
          // Public Storage URL; a plain img avoids configuring the Next image loader.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          // No cover yet: the campaign's initial on the brand surface.
          <div
            aria-hidden
            className="flex size-full items-center justify-center bg-gradient-to-br from-brand-panel to-primary/70 text-5xl font-semibold text-brand-panel-foreground/80"
          >
            {campaign.name.trim().charAt(0).toUpperCase()}
          </div>
        )}
        {campaign.local_only || campaign.budget_exhausted ? (
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
            {campaign.local_only ? <Badge>Khusus Kliper Lokal</Badge> : null}
            {campaign.budget_exhausted ? <Badge variant="destructive">Anggaran habis</Badge> : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <h3 className="font-semibold text-pretty">{campaign.name}</h3>
            <p className="text-sm text-muted-foreground">{campaign.client_name}</p>
          </div>
          <ul className="flex shrink-0 items-center gap-2 pt-0.5" aria-label="Platform">
            {campaign.allowed_platforms.map((platform) => (
              <li key={platform}>
                <PlatformIcon platform={platform} />
              </li>
            ))}
          </ul>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Tarif / 1.000 views</dt>
            <dd className="font-semibold tabular-nums">
              {formatRupiah(campaign.rate_per_1000_views)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Min. views klaim</dt>
            <dd className="tabular-nums">
              {campaign.min_views_to_earn > 0
                ? `${formatNumber(campaign.min_views_to_earn)} views`
                : "Tanpa minimum"}
            </dd>
          </div>
        </dl>

        <BudgetMeter
          pct={campaign.budget_remaining_pct}
          exhausted={campaign.budget_exhausted}
          total={campaign.budget_total}
          used={campaign.budget_used}
          remaining={campaign.budget_remaining}
        />

        {/* A visitor signs up first; a kliper who already has an account signs
            in and lands straight on this campaign's brief in the portal. */}
        <div className="mt-auto space-y-2 pt-1">
          <Button asChild className="h-11 w-full px-5 text-sm">
            <Link href={SIGNUP_PATH} data-cta>
              Daftar untuk gabung
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
