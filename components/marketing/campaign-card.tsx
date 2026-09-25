import Link from "next/link";
import { BudgetMeter } from "@/components/campaigns/budget-meter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/constants/creators";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarDate } from "@/lib/format/date";
import type { PublicCampaign } from "@/lib/marketing/campaigns";
import { SIGNUP_PATH } from "@/lib/marketing/routes";

/**
 * One open campaign on the public site (FR-M15-09). The same numbers as the
 * portal card, without the brief: that, the material and the Gabung button
 * are behind the klipper login.
 */
export function PublicCampaignCard({ campaign }: { campaign: PublicCampaign }) {
  const portalPath = `/portal/kampanye/${campaign.id}`;

  return (
    <article className="flex w-full flex-col gap-4 rounded-xl border bg-card p-5">
      <div className="space-y-2">
        {campaign.local_only || campaign.budget_exhausted ? (
          <div className="flex flex-wrap items-center gap-2">
            {campaign.local_only ? <Badge>Khusus Klipper Lokal</Badge> : null}
            {campaign.budget_exhausted ? <Badge variant="destructive">Anggaran habis</Badge> : null}
          </div>
        ) : null}
        <h3 className="font-semibold text-pretty">{campaign.name}</h3>
        <p className="text-sm text-muted-foreground">{campaign.client_name}</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        <div>
          <dt className="text-muted-foreground">Tarif / 1.000 views</dt>
          <dd className="font-semibold tabular-nums">
            {formatRupiah(campaign.rate_per_1000_views)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Honor maks. per klip</dt>
          <dd className="tabular-nums">
            {campaign.max_payout_per_clip === null
              ? "Tanpa batas"
              : formatRupiah(campaign.max_payout_per_clip)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Berakhir</dt>
          <dd>{formatCalendarDate(campaign.end_date)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Kuota klip</dt>
          <dd>{campaign.max_clips_per_creator} klip</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted-foreground">Platform</dt>
          <dd>
            {campaign.allowed_platforms
              .map((platform) => SOCIAL_PLATFORM_LABELS[platform])
              .join(", ")}
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

      {/* A visitor signs up first; a klipper who already has an account signs
          in and lands straight on this campaign's brief in the portal. */}
      <div className="mt-auto space-y-2 pt-1">
        <Button asChild className="h-11 w-full px-5 text-sm">
          <Link href={SIGNUP_PATH} data-cta>
            Daftar untuk gabung
          </Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(portalPath)}`}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Masuk untuk lihat brief
          </Link>
        </p>
      </div>
    </article>
  );
}
