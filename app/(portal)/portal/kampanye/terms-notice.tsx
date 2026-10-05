"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";
import { acceptTermsAction } from "./actions";

/**
 * FR-M3-04: when the Syarat Kliper get a new version, the kliper agrees to
 * it again before joining or sending clips.
 */
export function TermsNotice({ version }: { version: string }) {
  const [agreed, setAgreed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function accept() {
    startTransition(async () => {
      const result = await acceptTermsAction();
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Alert>
      <FileText />
      <AlertTitle>Ada Syarat Kliper versi baru</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Baca dulu{" "}
          <Link href="/syarat" target="_blank" className="font-medium underline">
            Syarat Kliper versi {version}
          </Link>{" "}
          ya. Setelah kamu setujui, kamu bisa gabung kampanye dan kirim klip lagi.
        </p>
        <Field orientation="horizontal">
          <Checkbox
            id="setuju-syarat"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
          />
          <FieldLabel htmlFor="setuju-syarat" className="font-normal">
            Saya sudah membaca dan menyetujui Syarat Kliper versi {version}.
          </FieldLabel>
        </Field>
        <Button size="sm" onClick={accept} disabled={!agreed || isPending}>
          {isPending ? "Menyimpan…" : "Setujui syarat"}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
