"use client";

import { useState, useTransition } from "react";
import { UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ANONYMIZE_CONFIRMATION } from "@/lib/validation/creators";
import { anonymizeCreatorAction } from "../actions";

/** PRD section 9: owner-only, irreversible erasure of a creator's personal data. */
export function AnonymizeCreatorButton({ creatorId, name }: { creatorId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setConfirmation("");
  }

  function onConfirm() {
    startTransition(async () => {
      const result = await anonymizeCreatorAction({ id: creatorId, confirmation });
      if (result.status === "success") {
        toast.success(result.message);
        close();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <UserX aria-hidden />
        Anonimkan data
      </Button>
      <Dialog open={open} onOpenChange={(value) => (value ? setOpen(true) : close())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anonimkan data {name}?</DialogTitle>
            <DialogDescription>
              Untuk permintaan penghapusan data pribadi dari kreator yang sudah pernah ditugaskan.
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <ul className="my-2 list-disc space-y-1 pl-5 text-sm">
            <li>
              Nama diganti &quot;Kreator anonim&quot;; WhatsApp, email, kota, tanggal lahir, dan
              catatan dikosongkan.
            </li>
            <li>Akun media sosial, bukti audiens, dan rekening dihapus permanen.</li>
            <li>
              Riwayat kampanye, konten, metrik, dan honor tetap tersimpan untuk pembukuan. Status
              menjadi diblokir sehingga tidak dapat ditugaskan lagi.
            </li>
          </ul>
          <Field>
            <FieldLabel htmlFor="anonymize-confirmation">
              Ketik <span className="font-mono">{ANONYMIZE_CONFIRMATION}</span> untuk melanjutkan
            </FieldLabel>
            <Input
              id="anonymize-confirmation"
              autoComplete="off"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
            <FieldDescription>Tindakan ini dicatat di log aktivitas.</FieldDescription>
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={isPending || confirmation !== ANONYMIZE_CONFIRMATION}
              onClick={onConfirm}
            >
              {isPending ? "Memproses…" : "Anonimkan permanen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
