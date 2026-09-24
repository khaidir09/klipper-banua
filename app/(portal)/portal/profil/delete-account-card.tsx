"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/format/date";
import { requestAccountDeletionAction } from "./actions";

/** FR-M16-09. The request only flags the account; the owner does the erasure. */
export function DeleteAccountCard({
  requestedAt,
  timezone,
}: {
  requestedAt: string | null;
  timezone: string;
}) {
  const [isPending, startTransition] = useTransition();

  function request() {
    if (
      !window.confirm(
        "Yakin mau hapus akun? Tim akan menghapus data pribadimu setelah saldomu beres. Kalau sudah diproses, ini nggak bisa dibatalkan.",
      )
    )
      return;
    startTransition(async () => {
      const result = await requestAccountDeletionAction();
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Hapus akun</h2>
        </CardTitle>
        <CardDescription>
          Kamu bisa minta data pribadimu dihapus, sesuai Kebijakan Privasi. Riwayat kampanye tetap
          disimpan, tapi tanpa identitasmu.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requestedAt ? (
          <p className="text-sm text-muted-foreground">
            Permintaan dikirim {formatDate(requestedAt, timezone)}. Tim bakal menghubungimu.
          </p>
        ) : (
          <Button variant="outline" disabled={isPending} onClick={request}>
            {isPending ? "Mengirim…" : "Minta hapus akun"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
