import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ListPagination } from "@/components/tables/list-pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { requireSession } from "@/lib/auth/guards";
import { CAMPAIGN_STATUSES, CAMPAIGN_STATUS_LABELS } from "@/lib/constants/campaigns";
import { listCampaigns, listClientOptions } from "@/lib/data/campaigns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { campaignListQuerySchema } from "@/lib/validation/campaigns";
import { CampaignsTable } from "./campaigns-table";

export const metadata: Metadata = { title: "Kampanye" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function CampaignsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireSession();
  const query = campaignListQuerySchema.parse(await searchParams);

  const supabase = await createSupabaseServerClient();
  const [result, clients] = await Promise.all([
    listCampaigns(supabase, query),
    listClientOptions(supabase),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kampanye"
        description="Paket promosi per klien beserta brief, kreator, dan tautan pelacakan."
        actions={
          <Button asChild>
            <Link href="/campaigns/new">
              <Plus aria-hidden />
              Buat kampanye
            </Link>
          </Button>
        }
      />

      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={query.q}
            placeholder="Cari nama atau kode kampanye…"
            aria-label="Cari kampanye"
            className="pl-8"
          />
        </div>
        <NativeSelect name="status" defaultValue={query.status ?? ""} aria-label="Status">
          <NativeSelectOption value="">Semua status</NativeSelectOption>
          {CAMPAIGN_STATUSES.map((status) => (
            <NativeSelectOption key={status} value={status}>
              {CAMPAIGN_STATUS_LABELS[status]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <NativeSelect name="client_id" defaultValue={query.client_id ?? ""} aria-label="Klien">
          <NativeSelectOption value="">Semua klien</NativeSelectOption>
          {clients.map((client) => (
            <NativeSelectOption key={client.id} value={client.id}>
              {client.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button type="submit" variant="outline">
          Terapkan
        </Button>
      </form>

      <CampaignsTable rows={result.rows} />

      <ListPagination
        page={result.page}
        totalPages={result.totalPages}
        totalItems={result.count}
        params={{ q: query.q || undefined, status: query.status, client_id: query.client_id }}
        basePath="/campaigns"
      />
    </div>
  );
}
