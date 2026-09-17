import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { requireSession } from "@/lib/auth/guards";
import { NICHES, type Niche } from "@/lib/constants/creators";
import { isProvince } from "@/lib/constants/regions";
import { getCreator } from "@/lib/data/creators";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatWhatsapp } from "@/lib/validation/phone";
import { CreatorForm } from "../../creator-form";

export const metadata: Metadata = { title: "Ubah kreator" };

export default async function EditCreatorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSession();
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const creator = await getCreator(supabase, id);
  if (!creator) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Ubah: ${creator.full_name}`}
        backHref={`/creators/${id}`}
        backLabel="Detail kreator"
      />
      <CreatorForm
        creatorId={id}
        defaultValues={{
          full_name: creator.full_name,
          stage_name: creator.stage_name,
          phone_wa: formatWhatsapp(creator.phone_wa),
          email: creator.email,
          city: creator.city,
          province: isProvince(creator.province) ? creator.province : "Kalimantan Selatan",
          birth_date: creator.birth_date,
          niches: creator.niches.filter((n): n is Niche =>
            (NICHES as readonly string[]).includes(n),
          ),
          tier: creator.tier,
          status: creator.status,
          notes: creator.notes,
        }}
      />
    </div>
  );
}
