"use client";

import { useState, useTransition } from "react";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { confirmAssignmentAction } from "../../actions";

/**
 * FR-M13-10: the creator's own dated acknowledgement of the brief. Nothing
 * else can be sent for the assignment until this is done, so the card sits at
 * the top of the page and says plainly what is still locked.
 */
export function ConfirmBriefCard({
  assignmentId,
  paidLabelRequired,
  contentsCommitted,
  minLiveDays,
}: {
  assignmentId: string;
  paidLabelRequired: boolean;
  contentsCommitted: number;
  minLiveDays: number;
}) {
  const [agreed, setAgreed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await confirmAssignmentAction({ id: assignmentId });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Card className="border-primary lg:col-span-2">
      <CardHeader>
        <CardTitle>
          <h2>Konfirmasi brief</h2>
        </CardTitle>
        <CardDescription>
          Baca brief, poin wajib, dan larangan di bawah. Setelah dikonfirmasi, Anda dapat mengirim
          draf, melaporkan konten tayang, dan mengirim bukti metrik.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            Anda menyanggupi <strong>{contentsCommitted} konten</strong> untuk kampanye ini.
          </li>
          <li>
            Konten harus tetap tayang minimal <strong>{minLiveDays} hari</strong> agar honor
            dihitung penuh.
          </li>
          <li>
            {paidLabelRequired
              ? "Label berbayar wajib dicantumkan pada setiap konten."
              : "Label berbayar tidak diwajibkan untuk kampanye ini."}
          </li>
        </ul>

        <Field orientation="horizontal">
          <Checkbox
            id="setuju-brief"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
          />
          <FieldLabel htmlFor="setuju-brief" className="font-normal">
            Saya sudah membaca brief beserta poin wajib dan larangannya, dan saya menyetujuinya.
          </FieldLabel>
        </Field>

        <Button onClick={confirm} disabled={!agreed || isPending}>
          <CheckCircle2 aria-hidden />
          {isPending ? "Menyimpan…" : "Konfirmasi dan mulai kerjakan"}
        </Button>
      </CardContent>
    </Card>
  );
}
