import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/guards";
import { CreatorForm } from "../creator-form";

export const metadata: Metadata = { title: "Tambah kreator" };

export default async function NewCreatorPage() {
  await requireSession();

  return (
    <div className="space-y-6">
      <PageHeader title="Tambah kreator" backHref="/creators" backLabel="Daftar kreator" />
      <CreatorForm />
    </div>
  );
}
