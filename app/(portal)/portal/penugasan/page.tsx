import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { requireCreator } from "@/lib/auth/guards";
import { listPortalAssignments } from "@/lib/data/portal";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AssignmentCard } from "../assignment-card";

export const metadata: Metadata = { title: "Kampanye Saya" };

export default async function PortalAssignmentsPage() {
  await requireCreator();
  const supabase = await createSupabaseServerClient();
  const assignments = await listPortalAssignments(supabase);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kampanye Saya"
        description="Semua kampanye yang kamu ikuti. Yang lagi jalan ada di paling atas."
      />

      {assignments.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Kamu belum ikut kampanye apa pun.{" "}
          <Link href="/portal/kampanye" className="font-medium underline">
            Cari kampanye pertamamu
          </Link>
          .
        </p>
      )}
    </div>
  );
}
