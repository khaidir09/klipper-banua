import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { requireCreator } from "@/lib/auth/guards";
import { CATALOG_SORTS, CATALOG_SORT_LABELS, sortCatalog } from "@/lib/campaigns/open";
import {
  CREATOR_TERMS_VERSION,
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABELS,
} from "@/lib/constants/creators";
import { getPortalProfile, listPortalCatalog, type PortalCatalogCampaign } from "@/lib/data/portal";
import { formatRupiah } from "@/lib/format/currency";
import { formatCalendarDate } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { catalogQuerySchema } from "@/lib/validation/campaigns";
import { platformList } from "../campaign-parts";
import { BudgetMeter } from "@/components/campaigns/budget-meter";
import { TermsNotice } from "./terms-notice";

export const metadata: Metadata = { title: "Katalog kampanye" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function CatalogCard({ campaign }: { campaign: PortalCatalogCampaign }) {
  return (
    <Card className="relative">
      <CardHeader className="gap-2">
        {campaign.local_only || campaign.budget_exhausted || campaign.assignment_id ? (
          <div className="flex flex-wrap items-center gap-2">
            {campaign.local_only ? <Badge>Khusus Klipper Lokal</Badge> : null}
            {campaign.budget_exhausted ? <Badge variant="destructive">Anggaran habis</Badge> : null}
            {campaign.assignment_id ? <Badge variant="secondary">Kamu sudah ikut</Badge> : null}
          </div>
        ) : null}
        <CardTitle className="text-base">
          <h2>
            {/* Stretched link: the whole card is the tap target on a phone. */}
            <Link
              href={`/portal/kampanye/${campaign.id}`}
              className="after:absolute after:inset-0 hover:underline focus-visible:underline"
            >
              {campaign.name}
            </Link>
          </h2>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{campaign.client_name}</p>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
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
            <dd>{platformList(campaign.allowed_platforms)}</dd>
          </div>
        </dl>
        <BudgetMeter
          pct={campaign.budget_remaining_pct}
          exhausted={campaign.budget_exhausted}
          total={campaign.budget_total}
          used={campaign.budget_used}
          remaining={campaign.budget_remaining}
        />
        <p className="inline-flex items-center gap-1 font-medium text-primary">
          Lihat brief
          <ArrowRight className="size-4" aria-hidden />
        </p>
      </CardContent>
    </Card>
  );
}

/** FR-M17-03: open campaigns a klipper may join. */
export default async function PortalCatalogPage({ searchParams }: { searchParams: SearchParams }) {
  await requireCreator();
  const query = catalogQuerySchema.parse(await searchParams);
  const supabase = await createSupabaseServerClient();
  const [creator, catalog] = await Promise.all([
    getPortalProfile(supabase),
    listPortalCatalog(supabase),
  ]);

  const filtered = catalog.filter(
    (campaign) =>
      (!query.platform || campaign.allowed_platforms.includes(query.platform)) &&
      (!query.lokal || campaign.local_only),
  );
  const campaigns = sortCatalog(filtered, query.urut ?? "terbaru");
  const filtering = Boolean(query.platform || query.lokal);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Katalog kampanye"
        description="Pilih kampanye yang cocok sama gayamu. Setiap 1.000 views yang lolos cek tim dibayar sesuai tarifnya."
      />

      {creator?.status === "prospek" ? (
        <Alert>
          <CircleAlert />
          <AlertDescription>
            <p>
              Kamu sudah bisa lihat-lihat kampanye. Biar bisa gabung,{" "}
              <Link href="/portal/mulai" className="font-medium underline">
                tambahkan minimal satu akun medsos
              </Link>{" "}
              dulu.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {creator && creator.terms_version !== CREATOR_TERMS_VERSION ? (
        <TermsNotice version={CREATOR_TERMS_VERSION} />
      ) : null}

      <form method="get" className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field>
          <FieldLabel htmlFor="platform">Platform</FieldLabel>
          <NativeSelect id="platform" name="platform" defaultValue={query.platform ?? ""}>
            <NativeSelectOption value="">Semua platform</NativeSelectOption>
            {SOCIAL_PLATFORMS.map((platform) => (
              <NativeSelectOption key={platform} value={platform}>
                {SOCIAL_PLATFORM_LABELS[platform]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field>
          <FieldLabel htmlFor="urut">Urutkan</FieldLabel>
          <NativeSelect id="urut" name="urut" defaultValue={query.urut ?? "terbaru"}>
            {CATALOG_SORTS.map((sort) => (
              <NativeSelectOption key={sort} value={sort}>
                {CATALOG_SORT_LABELS[sort]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        <Field orientation="horizontal" className="self-end pb-2">
          <Checkbox id="lokal" name="lokal" value="1" defaultChecked={query.lokal} />
          <FieldLabel htmlFor="lokal" className="font-normal">
            Khusus Klipper Lokal
          </FieldLabel>
        </Field>
        <div className="flex items-end gap-2">
          <Button type="submit" className="h-11 flex-1 sm:flex-none">
            Terapkan
          </Button>
          {filtering || query.urut ? (
            <Button variant="ghost" asChild className="h-11">
              <Link href="/portal/kampanye">Reset</Link>
            </Button>
          ) : null}
        </div>
      </form>

      {campaigns.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((campaign) => (
            <CatalogCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {filtering
            ? "Belum ada kampanye yang cocok sama filter ini. Coba ubah filternya."
            : "Belum ada kampanye yang buka. Cek lagi nanti, kampanye baru langsung muncul di sini."}
        </p>
      )}
    </div>
  );
}
