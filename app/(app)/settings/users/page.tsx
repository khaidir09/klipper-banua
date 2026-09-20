import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/guards";
import { listProfiles } from "@/lib/data/users";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { InviteUserDialog } from "./invite-user-dialog";
import { UsersTable } from "./users-table";

export const metadata: Metadata = { title: "Pengguna" };

export default async function UsersPage() {
  const session = await requireRole("owner");
  const supabase = await createSupabaseServerClient();
  const profiles = await listProfiles(supabase);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Akun tim hanya dibuat lewat undangan. Penerima memilih kata sandi sendiri dari tautan
          email. Akun portal kreator dikelola dari halaman kreator masing-masing.
        </p>
        <InviteUserDialog />
      </div>
      <UsersTable
        profiles={profiles.map((p) => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          role: p.role as "owner" | "manager",
          is_active: p.is_active,
          created_at: p.created_at,
        }))}
        currentUserId={session.user.id}
        timezone={session.profile.timezone}
      />
    </div>
  );
}
