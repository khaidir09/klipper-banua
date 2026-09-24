"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SocialPlatform } from "@/lib/constants/creators";
import type { PortalClip } from "@/lib/data/portal";
import { ClipList } from "./clip-list";
import { SubmitClipDialog } from "./clip-forms";

/**
 * FR-M18-01 on the assignment page: the clips sent for this campaign and the
 * button to send another. `blocker` explains why sending is off; the server
 * checks everything again.
 */
export function SubmitClipCard({
  assignmentId,
  campaignId,
  platforms,
  verificationCode,
  maxClips,
  activeClipCount,
  blocker,
  clips,
  timezone,
}: {
  assignmentId: string;
  campaignId: string;
  platforms: SocialPlatform[];
  verificationCode: string;
  maxClips: number;
  activeClipCount: number;
  blocker: string | null;
  clips: PortalClip[];
  timezone: string;
}) {
  const [open, setOpen] = useState(false);
  const noPlatform = platforms.length === 0;

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>
            <h2>Klipmu di kampanye ini</h2>
          </CardTitle>
          <CardDescription>
            {activeClipCount} dari {maxClips} klip terpakai. Posting dari akun yang sudah kamu
            daftarkan, tulis kode{" "}
            <span className="font-mono font-semibold">{verificationCode}</span> di caption, lalu
            kirim tautannya di sini.
          </CardDescription>
        </div>
        {!blocker && !noPlatform ? (
          <Button onClick={() => setOpen(true)} className="h-11">
            <Plus aria-hidden />
            Kirim klip
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        {blocker ? <p className="text-sm font-medium text-destructive">{blocker}</p> : null}
        {!blocker && noPlatform ? (
          <p className="text-sm font-medium text-destructive">
            Daftarkan dulu akun medsos di Profil untuk salah satu platform kampanye ini, baru kamu
            bisa kirim klip.
          </p>
        ) : null}
        {clips.length ? (
          <ClipList clips={clips} timezone={timezone} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Belum ada klip. Kirim klip pertamamu sekarang.
          </p>
        )}
      </CardContent>

      {open ? (
        <SubmitClipDialog
          assignmentId={assignmentId}
          campaignId={campaignId}
          platforms={platforms}
          verificationCode={verificationCode}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </Card>
  );
}
