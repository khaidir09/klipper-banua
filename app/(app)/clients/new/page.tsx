import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/guards";
import { ClientForm } from "../client-form";

export const metadata: Metadata = { title: "Tambah klien" };

export default async function NewClientPage() {
  await requireSession();

  return (
    <div className="space-y-6">
      <PageHeader title="Tambah klien" backHref="/clients" backLabel="Daftar klien" />
      <ClientForm />
    </div>
  );
}
