import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/guards";
import { listClientOptions } from "@/lib/data/campaigns";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CampaignForm } from "../campaign-form";

export const metadata: Metadata = { title: "Buat kampanye" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewCampaignPage({ searchParams }: { searchParams: SearchParams }) {
  await requireSession();
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const clients = await listClientOptions(supabase);

  // `?client_id=` preselects the client when coming from a client page.
  const preselected =
    typeof params.client_id === "string" && clients.some((c) => c.id === params.client_id)
      ? params.client_id
      : "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buat kampanye"
        description="Kampanye baru selalu berstatus Draft sampai diaktifkan."
        backHref="/campaigns"
        backLabel="Daftar kampanye"
      />
      <CampaignForm clients={clients} defaultValues={{ client_id: preselected }} />
    </div>
  );
}
