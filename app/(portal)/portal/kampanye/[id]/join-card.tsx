"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { joinCampaignAction } from "../actions";

/**
 * FR-M17-04: joining is also the kliper's dated acknowledgement of the brief
 * (FR-M13-10), so it needs the same explicit tick. `blocker` explains why the
 * button is off; the server checks everything again.
 */
export function JoinCard({
  campaignId,
  maxClips,
  minLiveDays,
  paidLabelRequired,
  blocker,
}: {
  campaignId: string;
  maxClips: number;
  minLiveDays: number;
  paidLabelRequired: boolean;
  blocker: string | null;
}) {
  const [agreed, setAgreed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function join() {
    startTransition(async () => {
      // Success redirects to the new assignment and never returns.
      const result = await joinCampaignAction({ campaign_id: campaignId, agreed });
      if (result?.status === "error") toast.error(result.message);
    });
  }

  return (
    <Card className="border-primary lg:col-span-2">
      <CardHeader>
        <CardTitle>
          <h2>Gabung kampanye ini</h2>
        </CardTitle>
        <CardDescription>
          Begitu gabung, kamu langsung dapat kode referal dan tautan khusus, dan bisa mulai kirim
          klip.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            Kamu bisa kirim maksimal <strong>{maxClips} klip</strong>.
          </li>
          <li>
            Klip jangan dihapus sebelum <strong>{minLiveDays} hari</strong>.
          </li>
          <li>Tulis kode verifikasimu di caption setiap klip.</li>
          <li>
            {paidLabelRequired
              ? "Wajib pasang label konten berbayar."
              : "Label konten berbayar nggak wajib."}
          </li>
        </ul>

        {blocker ? (
          <p className="text-sm font-medium text-destructive">{blocker}</p>
        ) : (
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
        )}

        <Button className="h-11" onClick={join} disabled={Boolean(blocker) || !agreed || isPending}>
          <UserPlus aria-hidden />
          {isPending ? "Memproses…" : "Gabung"}
        </Button>
      </CardContent>
    </Card>
  );
}
