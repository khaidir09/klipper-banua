"use client";

import { useState, useTransition } from "react";
import { Ban, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/format/date";
import { blockCreatorAction, unblockCreatorAction } from "../actions";

/**
 * FR-M3-09. Any team member may block with a reason; only the owner unblocks
 * (enforced again by `guard_creator_block`).
 */
export function BlockPanel({
  creatorId,
  blocked,
  blockedAt,
  blockedReason,
  isOwner,
  timezone,
}: {
  creatorId: string;
  blocked: boolean;
  blockedAt: string | null;
  blockedReason: string | null;
  isOwner: boolean;
  timezone: string;
}) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function block() {
    setReasonError(null);
    startTransition(async () => {
      const result = await blockCreatorAction({ creator_id: creatorId, reason });
      if (result.status === "success") {
        toast.success(result.message);
        setReason("");
      } else {
        toast.error(result.message);
        if (result.fieldErrors?.reason) setReasonError(result.fieldErrors.reason);
      }
    });
  }

  function unblock() {
    if (!window.confirm("Buka blokir kliper ini? Statusnya kembali aktif.")) return;
    startTransition(async () => {
      const result = await unblockCreatorAction({ id: creatorId });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blokir</CardTitle>
        <CardDescription>
          Kliper yang diblokir tidak dapat masuk portal, bergabung ke kampanye, atau mengirim klip.
          Gunakan untuk kecurangan views atau pelanggaran syarat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {blocked ? (
          <>
            <Alert variant="destructive">
              <Ban />
              <AlertTitle>
                Diblokir{blockedAt ? ` sejak ${formatDateTime(blockedAt, timezone)}` : ""}
              </AlertTitle>
              <AlertDescription>{blockedReason}</AlertDescription>
            </Alert>
            {isOwner ? (
              <Button variant="outline" onClick={unblock} disabled={isPending}>
                <ShieldCheck aria-hidden />
                Buka blokir
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Hanya owner yang dapat membuka blokir.
              </p>
            )}
          </>
        ) : (
          <>
            <Field data-invalid={Boolean(reasonError)}>
              <FieldLabel htmlFor="block-reason">Alasan pemblokiran</FieldLabel>
              <Textarea
                id="block-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Mis. views dua klip terbukti dari bot."
                aria-invalid={Boolean(reasonError)}
              />
              {reasonError ? <FieldError>{reasonError}</FieldError> : null}
            </Field>
            <Button variant="destructive" onClick={block} disabled={isPending}>
              <Ban aria-hidden />
              Blokir kliper
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
