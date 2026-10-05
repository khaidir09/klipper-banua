import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/guards";
import { getMinWithdrawal } from "@/lib/data/withdrawals";
import { formatDateTime } from "@/lib/format/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MinWithdrawalForm } from "./min-withdrawal-form";

export const metadata: Metadata = { title: "Pengaturan penarikan" };

/** Rate used to express the minimum in views; the demo and pilot rate. */
const REFERENCE_RATE = 10_000;

export default async function WithdrawalSettingsPage() {
  const session = await requireRole("owner");
  const supabase = await createSupabaseServerClient();
  const [current, { data: row }] = await Promise.all([
    getMinWithdrawal(supabase),
    supabase
      .from("platform_settings")
      .select("updated_at, editor:profiles(full_name)")
      .maybeSingle(),
  ]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Minimum penarikan saldo</h2>
        </CardTitle>
        <CardDescription>
          Kliper hanya dapat mengajukan penarikan bila nominalnya mencapai batas ini. Perubahan
          berlaku langsung untuk pengajuan berikutnya dan tercatat di log aktivitas.
          {row?.updated_at
            ? ` Terakhir diubah ${formatDateTime(row.updated_at, session.profile.timezone)}${row.editor?.full_name ? ` oleh ${row.editor.full_name}` : ""}.`
            : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MinWithdrawalForm current={current} referenceRate={REFERENCE_RATE} />
      </CardContent>
    </Card>
  );
}
