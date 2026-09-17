import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { DetailList } from "@/components/layout/detail-list";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth/guards";
import { CLIENT_TYPE_LABELS } from "@/lib/constants/clients";
import { getClient } from "@/lib/data/clients";
import { formatDateTime } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ClientContacts } from "./client-contacts";
import { DeleteClientButton } from "./delete-client-button";

export const metadata: Metadata = { title: "Detail klien" };

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireSession();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const client = await getClient(supabase, id);
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={CLIENT_TYPE_LABELS[client.type]}
        backHref="/clients"
        backLabel="Daftar klien"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/clients/${id}/edit`}>
                <Pencil aria-hidden />
                Ubah
              </Link>
            </Button>
            {profile.role === "owner" ? (
              <DeleteClientButton clientId={id} name={client.name} />
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informasi klien</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                {
                  label: "Jenis",
                  value: <Badge variant="secondary">{CLIENT_TYPE_LABELS[client.type]}</Badge>,
                },
                { label: "Provinsi", value: client.province },
                { label: "Kota / kabupaten", value: client.city },
                { label: "Alamat", value: client.address, wide: true },
                { label: "Catatan", value: client.notes, wide: true },
                {
                  label: "Terakhir diperbarui",
                  value: formatDateTime(client.updated_at, profile.timezone),
                },
              ]}
            />
          </CardContent>
        </Card>

        <ClientContacts clientId={id} contacts={client.contacts} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat kampanye</CardTitle>
          <CardDescription>
            Daftar kampanye dan total nilai kontrak tampil di sini setelah modul kampanye (Fase 2).
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
