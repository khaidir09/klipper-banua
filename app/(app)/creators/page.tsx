import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ProvinceSelect } from "@/components/forms/province-select";
import { ListPagination } from "@/components/tables/list-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { requireInternal } from "@/lib/auth/guards";
import {
  CREATOR_STATUSES,
  CREATOR_STATUS_LABELS,
  CREATOR_TIERS,
  CREATOR_TIER_LABELS,
  NICHES,
  NICHE_LABELS,
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABELS,
} from "@/lib/constants/creators";
import { listCreators } from "@/lib/data/creators";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { creatorListQuerySchema } from "@/lib/validation/creators";
import { CreatorsTable } from "./creators-table";

export const metadata: Metadata = { title: "Kreator" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CreatorsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireInternal();
  const raw = await searchParams;
  const query = creatorListQuerySchema.parse(raw);

  const supabase = await createSupabaseServerClient();
  const result = await listCreators(supabase, query);

  const params = {
    q: query.q || undefined,
    province: query.province,
    city: query.city || undefined,
    niche: query.niche,
    tier: query.tier,
    status: query.status,
    platform: query.platform,
    min_pct: query.min_pct !== undefined ? String(query.min_pct) : undefined,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kreator"
        description="Kreator lokal beserta akun media sosial dan bukti audiensnya."
        actions={
          <Button asChild>
            <Link href="/creators/new">
              <Plus aria-hidden />
              Tambah kreator
            </Link>
          </Button>
        }
      />

      <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" role="search">
        <div className="relative sm:col-span-2">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query.q}
            placeholder="Cari nama lengkap atau nama panggung…"
            aria-label="Cari kreator"
            className="pl-8"
          />
        </div>
        <ProvinceSelect
          name="province"
          defaultValue={query.province ?? ""}
          allowEmpty
          aria-label="Provinsi"
        />
        <Input name="city" defaultValue={query.city} placeholder="Kota" aria-label="Kota" />
        <NativeSelect name="niche" defaultValue={query.niche ?? ""} aria-label="Niche">
          <NativeSelectOption value="">Semua niche</NativeSelectOption>
          {NICHES.map((niche) => (
            <NativeSelectOption key={niche} value={niche}>
              {NICHE_LABELS[niche]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect name="tier" defaultValue={query.tier ?? ""} aria-label="Tier">
          <NativeSelectOption value="">Semua tier</NativeSelectOption>
          {CREATOR_TIERS.map((tier) => (
            <NativeSelectOption key={tier} value={tier}>
              {CREATOR_TIER_LABELS[tier]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect name="status" defaultValue={query.status ?? ""} aria-label="Status">
          <NativeSelectOption value="">Semua status</NativeSelectOption>
          {CREATOR_STATUSES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {CREATOR_STATUS_LABELS[status]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect name="platform" defaultValue={query.platform ?? ""} aria-label="Platform">
          <NativeSelectOption value="">Semua platform</NativeSelectOption>
          {SOCIAL_PLATFORMS.map((platform) => (
            <NativeSelectOption key={platform} value={platform}>
              {SOCIAL_PLATFORM_LABELS[platform]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Input
          name="min_pct"
          type="number"
          min={0}
          max={100}
          defaultValue={query.min_pct ?? ""}
          placeholder="Min. % audiens Kalimantan"
          aria-label="Persentase audiens Kalimantan minimum"
        />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-2">
          <Button type="submit" variant="outline">
            Terapkan filter
          </Button>
          <Button type="button" variant="ghost" asChild>
            <Link href="/creators">Reset</Link>
          </Button>
        </div>
      </form>

      <CreatorsTable
        rows={result.rows}
        filtered={Boolean(
          query.q ||
          query.province ||
          query.city ||
          query.niche ||
          query.tier ||
          query.status ||
          query.platform ||
          query.min_pct !== undefined,
        )}
      />

      <ListPagination
        page={result.page}
        totalPages={result.totalPages}
        totalItems={result.count}
        params={params}
        basePath="/creators"
      />
    </div>
  );
}
