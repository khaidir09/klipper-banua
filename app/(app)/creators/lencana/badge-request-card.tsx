"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { BadgeCheck, ExternalLink, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { LOCAL_BADGE_MIN_PCT, SOCIAL_PLATFORM_LABELS } from "@/lib/constants/creators";
import type { BadgeRequest } from "@/lib/data/creators";
import { formatDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { decideBadgeRequestAction } from "../actions";

/** One open request: the claim, the screenshot, and the two decisions. */
export function BadgeRequestCard({
  request,
  timezone,
}: {
  request: BadgeRequest;
  timezone: string;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesError, setNotesError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const pct = request.kalimantan_audience_pct ?? 0;
  const meetsThreshold = pct >= LOCAL_BADGE_MIN_PCT;

  function decide(decision: "beri" | "tolak") {
    setNotesError(null);
    startTransition(async () => {
      const result = await decideBadgeRequestAction({
        account_id: request.id,
        decision,
        notes,
      });
      if (result.status === "success") toast.success(result.message);
      else {
        toast.error(result.message);
        if (result.fieldErrors?.notes) setNotesError(result.fieldErrors.notes);
      }
    });
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 sm:flex-row">
        <div className="flex size-40 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
          {request.proof_url ? (
            <a href={request.proof_url} target="_blank" rel="noreferrer" title="Buka bukti">
              {/* Signed URL expires in a minute; a plain img avoids the Next image loader. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={request.proof_url}
                alt={`Analitik audiens @${request.handle}`}
                className="size-40 object-cover"
              />
            </a>
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" aria-label="Tanpa bukti" />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5 text-sm">
          <p className="font-medium">
            <Link href={`/creators/${request.creator.id}`} className="hover:underline">
              {request.creator.full_name}
            </Link>
            {request.creator.stage_name ? (
              <span className="text-muted-foreground"> · {request.creator.stage_name}</span>
            ) : null}
          </p>
          <p>
            <Badge variant="secondary" className="mr-1.5 align-middle">
              {SOCIAL_PLATFORM_LABELS[request.platform]}
            </Badge>
            @{request.handle}
            {request.profile_url ? (
              <a
                href={request.profile_url}
                target="_blank"
                rel="noreferrer"
                className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                aria-label={`Buka profil @${request.handle}`}
              >
                <ExternalLink className="size-3.5" aria-hidden />
              </a>
            ) : null}
            <span className="text-muted-foreground">
              {" "}
              · {formatNumber(request.followers_count)} pengikut
            </span>
          </p>
          <p>
            Audiens Kalimantan:{" "}
            <span className={meetsThreshold ? "font-medium" : "font-medium text-destructive"}>
              {pct}%
            </span>
            {meetsThreshold ? null : (
              <span className="text-muted-foreground"> (di bawah {LOCAL_BADGE_MIN_PCT}%)</span>
            )}
          </p>
          <p className="text-muted-foreground">Kota teratas: {request.top_cities || "–"}</p>
          <p className="text-muted-foreground">
            {request.creator.city}, {request.creator.province} · diajukan{" "}
            {request.badge_requested_at ? formatDateTime(request.badge_requested_at, timezone) : ""}
          </p>

          {rejecting ? (
            <Field className="pt-2" data-invalid={Boolean(notesError)}>
              <FieldLabel htmlFor={`notes-${request.id}`}>Alasan penolakan</FieldLabel>
              <Textarea
                id={`notes-${request.id}`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Mis. tangkapan layar tidak menampilkan lokasi penonton."
                aria-invalid={Boolean(notesError)}
              />
              {notesError ? <FieldError>{notesError}</FieldError> : null}
            </Field>
          ) : null}
        </div>
      </CardContent>
      <CardFooter className="flex flex-wrap justify-end gap-2">
        {rejecting ? (
          <>
            <Button variant="ghost" onClick={() => setRejecting(false)} disabled={isPending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={() => decide("tolak")} disabled={isPending}>
              Tolak pengajuan
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => setRejecting(true)} disabled={isPending}>
              <X aria-hidden />
              Tolak
            </Button>
            <Button onClick={() => decide("beri")} disabled={isPending || !meetsThreshold}>
              <BadgeCheck aria-hidden />
              Beri lencana
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
