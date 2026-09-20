import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { requireInternal } from "@/lib/auth/guards";
import { getClient } from "@/lib/data/clients";
import { isProvince } from "@/lib/constants/regions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClientForm } from "../../client-form";

export const metadata: Metadata = { title: "Ubah klien" };

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireInternal();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const client = await getClient(supabase, id);
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Ubah: ${client.name}`}
        backHref={`/clients/${id}`}
        backLabel="Detail klien"
      />
      <ClientForm
        clientId={id}
        defaultValues={{
          name: client.name,
          type: client.type,
          city: client.city,
          province: isProvince(client.province) ? client.province : "Kalimantan Selatan",
          address: client.address,
          notes: client.notes,
        }}
      />
    </div>
  );
}
