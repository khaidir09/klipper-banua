"use client";

import { useTransition } from "react";
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
import { CAMPAIGN_TRANSITIONS } from "@/lib/campaigns/status";
import type { CampaignStatus } from "@/lib/constants/campaigns";
import { changeCampaignStatusAction } from "../actions";

const ACTIONS: Record<
  CampaignStatus,
  { label: string; description: string; variant: "default" | "outline" | "destructive" }
> = {
  aktif: {
    label: "Aktifkan",
    description: "Kampanye mulai berjalan. Tautan pelacakan kreator sudah bisa dibagikan.",
    variant: "default",
  },
  selesai: {
    label: "Tandai selesai",
    description:
      "Kampanye ditutup. Setelah ini hanya owner yang dapat mengubah data kampanye, dan honor dapat dihitung.",
    variant: "outline",
  },
  dibatalkan: {
    label: "Batalkan",
    description: "Kampanye dibatalkan. Tautan pelacakan akan menampilkan halaman tidak ditemukan.",
    variant: "destructive",
  },
  draft: { label: "Jadikan draft", description: "", variant: "outline" },
};

export function StatusActions({
  campaignId,
  status,
  activationBlockers,
  canEdit,
}: {
  campaignId: string;
  status: CampaignStatus;
  activationBlockers: string[];
  canEdit: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const targets = CAMPAIGN_TRANSITIONS[status];
  if (!canEdit || targets.length === 0) return null;

  function change(to: CampaignStatus) {
    startTransition(async () => {
      const result = await changeCampaignStatusAction({ id: campaignId, status: to });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {targets.map((to) => {
        const action = ACTIONS[to];
        const blocked = to === "aktif" && activationBlockers.length > 0;
        return (
          <AlertDialog key={to}>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant={action.variant} disabled={isPending}>
                {action.label}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{action.label} kampanye?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2">
                    {blocked ? (
                      <>
                        <p>Kampanye belum bisa diaktifkan:</p>
                        <ul className="list-disc pl-4">
                          {activationBlockers.map((blocker) => (
                            <li key={blocker}>{blocker}</li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p>{action.description}</p>
                    )}
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{blocked ? "Tutup" : "Batal"}</AlertDialogCancel>
                {blocked ? null : (
                  <AlertDialogAction onClick={() => change(to)} disabled={isPending}>
                    {action.label}
                  </AlertDialogAction>
                )}
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        );
      })}
    </div>
  );
}
