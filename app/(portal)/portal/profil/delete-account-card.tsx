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
        "Minta penghapusan akun? Tim akan menghapus data pribadi Anda setelah saldo diselesaikan. Tindakan ini tidak dapat dibatalkan setelah diproses.",
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
          Data pribadi Anda dihapus atas permintaan, sesuai Kebijakan Privasi. Riwayat kampanye
          disimpan tanpa identitas Anda.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {requestedAt ? (
          <p className="text-sm text-muted-foreground">
            Permintaan dikirim {formatDate(requestedAt, timezone)}. Tim akan menghubungi Anda.
          </p>
        ) : (
          <Button variant="outline" disabled={isPending} onClick={request}>
            {isPending ? "Mengirim…" : "Minta penghapusan akun"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
