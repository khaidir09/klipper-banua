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
        description="Kampanye yang Anda ikuti atau yang ditugaskan tim kepada Anda, yang berjalan lebih dulu."
      />

      {assignments.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {assignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Anda belum mengikuti kampanye apa pun.{" "}
          <Link href="/portal/kampanye" className="font-medium underline">
            Lihat katalog kampanye
          </Link>
          .
        </p>
      )}
    </div>
  );
}
