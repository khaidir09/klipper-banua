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
import { CLIENT_TYPES, CLIENT_TYPE_LABELS } from "@/lib/constants/clients";
import { listClients } from "@/lib/data/clients";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clientListQuerySchema } from "@/lib/validation/clients";
import { ClientsTable } from "./clients-table";

export const metadata: Metadata = { title: "Klien" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ClientsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireInternal();
  const raw = await searchParams;
  const query = clientListQuerySchema.parse(raw);

  const supabase = await createSupabaseServerClient();
  const result = await listClients(supabase, query);

  const params = {
    q: query.q || undefined,
    type: query.type,
    province: query.province,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Klien"
        description="Instansi yang membeli paket kampanye."
        actions={
          <Button asChild>
            <Link href="/clients/new">
              <Plus aria-hidden />
              Tambah klien
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
            placeholder="Cari nama atau kota…"
            aria-label="Cari klien"
            className="pl-8"
          />
        </div>
        <NativeSelect name="type" defaultValue={query.type ?? ""} aria-label="Jenis klien">
          <NativeSelectOption value="">Semua jenis</NativeSelectOption>
          {CLIENT_TYPES.map((type) => (
            <NativeSelectOption key={type} value={type}>
              {CLIENT_TYPE_LABELS[type]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <ProvinceSelect
          name="province"
          defaultValue={query.province ?? ""}
          allowEmpty
          aria-label="Provinsi"
        />
        <Button type="submit" variant="outline">
          Terapkan
        </Button>
      </form>

      <ClientsTable
        rows={result.rows}
        filtered={Boolean(query.q || query.type || query.province)}
      />

      <ListPagination
        page={result.page}
        totalPages={result.totalPages}
        totalItems={result.count}
        params={params}
        basePath="/clients"
      />
    </div>
  );
}
