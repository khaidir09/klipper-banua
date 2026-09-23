"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { withdrawAssignmentAction } from "../../kampanye/actions";

/**
 * FR-M17-05: a klipper may leave a per_views campaign while none of their
 * clips was approved. Joining the same campaign again is not possible.
 */
export function WithdrawCard({ assignmentId }: { assignmentId: string }) {
  const [isPending, startTransition] = useTransition();

  function onConfirm() {
    startTransition(async () => {
      const result = await withdrawAssignmentAction({ id: assignmentId });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>
          <h2>Mundur dari kampanye</h2>
        </CardTitle>
        <CardDescription>
          Selama belum ada klip Anda yang disetujui, Anda boleh mundur. Setelah mundur, Anda tidak
          dapat bergabung lagi ke kampanye ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" disabled={isPending}>
              <LogOut aria-hidden />
              {isPending ? "Memproses…" : "Mundur"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Mundur dari kampanye ini?</AlertDialogTitle>
              <AlertDialogDescription>
                Anda tidak dapat bergabung lagi ke kampanye yang sama setelah mundur.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction onClick={onConfirm} disabled={isPending}>
                Ya, mundur
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
