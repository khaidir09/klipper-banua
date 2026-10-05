"use client";

import { useState, useTransition } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Ban, Check, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { clipEarning } from "@/lib/calculations/clip-earning";
import {
  CLIP_REJECTION_REASON_LABELS,
  CLIP_REJECTION_REASONS,
  clipChecklistItemsFor,
} from "@/lib/constants/clips";
import { REVIEW_DECISION_LABELS, type ReviewDecision } from "@/lib/constants/contents";
import type { ClipCampaignTerms, ClipLedgerSums } from "@/lib/data/clips";
import { formatRupiah } from "@/lib/format/currency";
import { formatDateTimeInput } from "@/lib/format/date";
import { applyFieldErrors } from "@/lib/forms";
import { parseRupiah } from "@/lib/validation/money";
import {
  clipCancelSchema,
  clipVerifySchema,
  viewsUpdateVerifySchema,
  type ClipCancelFormInput,
  type ClipCancelInput,
  type ClipVerifyFormInput,
  type ClipVerifyInput,
  type ViewsUpdateVerifyFormInput,
  type ViewsUpdateVerifyInput,
} from "@/lib/validation/clips";
import { cancelClipAction, verifyClipAction, verifyViewsUpdateAction } from "../actions";

/**
 * Honor the typed-in verified views would credit (PRD 8.6). Same function as
 * the server, on the ledger sums read when the page loaded; the server reads
 * them again before deciding.
 */
function CreditPreview({
  views,
  terms,
  ledger,
}: {
  views: unknown;
  terms: ClipCampaignTerms;
  ledger: ClipLedgerSums;
}) {
  const parsed = typeof views === "number" ? views : parseRupiah(String(views ?? ""));
  if (parsed === null) return null;
  const earning = clipEarning({ ...terms, ...ledger, verifiedViews: parsed });
  return (
    <div className="rounded-md border bg-muted/40 p-3 text-sm">
      <p>
        Honor klip pada {parsed.toLocaleString("id-ID")} views:{" "}
        <span className="font-medium">{formatRupiah(earning.clipEarning)}</span>
        {ledger.alreadyCreditedForClip > 0
          ? ` · sudah dikreditkan ${formatRupiah(ledger.alreadyCreditedForClip)}`
          : ""}
      </p>
      <p className="mt-1 font-semibold">
        Kredit sekarang: {formatRupiah(earning.credit)}
        {earning.limitedBy === "anggaran"
          ? " — dibatasi sisa anggaran kampanye"
          : earning.limitedBy === "kliper"
            ? " — dibatasi batas honor per kliper"
            : ""}
      </p>
      {earning.eligibleViews === 0 && parsed > 0 ? (
        <p className="mt-1 text-muted-foreground">
          Di bawah minimum {terms.minViewsToEarn.toLocaleString("id-ID")} views, jadi belum ada
          honor.
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* A new clip (FR-M18-04)                                              */
/* ------------------------------------------------------------------ */

export function ClipDecisionForm({
  contentId,
  claimedViews,
  paidLabelRequired,
  terms,
  ledger,
}: {
  contentId: string;
  claimedViews: number;
  paidLabelRequired: boolean;
  terms: ClipCampaignTerms;
  ledger: ClipLedgerSums;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const items = clipChecklistItemsFor(paidLabelRequired);

  const form = useForm<ClipVerifyFormInput, unknown, ClipVerifyInput>({
    resolver: zodResolver(clipVerifySchema),
    defaultValues: {
      content_id: contentId,
      decision: "disetujui",
      checklist: {},
      verified_views: String(claimedViews),
      rejection_reason: "",
      notes: "",
    },
  });
  const decision = useWatch({ control: form.control, name: "decision" }) as ReviewDecision;
  const verifiedViews = useWatch({ control: form.control, name: "verified_views" });

  function onSubmit(values: ClipVerifyInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await verifyClipAction(values);
      if (result.status === "success") toast.success(result.message);
      else {
        setServerError(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  const { errors } = form.formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Keputusan</h2>
        </CardTitle>
        <CardDescription>
          Buka klip di platformnya, lalu cocokkan dengan checklist. Views terverifikasi boleh lebih
          kecil dari klaim.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <Field>
              <FieldLabel htmlFor="vc-decision">Keputusan</FieldLabel>
              <NativeSelect id="vc-decision" {...form.register("decision")}>
                {(["disetujui", "revisi", "ditolak"] as const).map((value) => (
                  <NativeSelectOption key={value} value={value}>
                    {REVIEW_DECISION_LABELS[value]}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>

            {decision === "disetujui" ? (
              <>
                <fieldset className="space-y-2">
                  <legend className="mb-1 text-sm font-medium">Checklist</legend>
                  {items.map((item) => (
                    <Controller
                      key={item.key}
                      control={form.control}
                      name={`checklist.${item.key}`}
                      render={({ field }) => (
                        <Field orientation="horizontal">
                          <Checkbox
                            id={`vc-${item.key}`}
                            checked={field.value === true}
                            onCheckedChange={(checked) => field.onChange(checked === true)}
                          />
                          <FieldLabel htmlFor={`vc-${item.key}`} className="font-normal">
                            {item.label}
                          </FieldLabel>
                        </Field>
                      )}
                    />
                  ))}
                </fieldset>

                <Field>
                  <FieldLabel htmlFor="vc-views">Views terverifikasi</FieldLabel>
                  <Input id="vc-views" inputMode="numeric" {...form.register("verified_views")} />
                  <FieldDescription>
                    Klaim kliper: {claimedViews.toLocaleString("id-ID")} views.
                  </FieldDescription>
                  <FieldError errors={[errors.verified_views]} />
                </Field>
                <CreditPreview views={verifiedViews} terms={terms} ledger={ledger} />
              </>
            ) : null}

            {decision === "ditolak" ? (
              <Field>
                <FieldLabel htmlFor="vc-reason">Alasan penolakan</FieldLabel>
                <NativeSelect id="vc-reason" {...form.register("rejection_reason")}>
                  <NativeSelectOption value="">Pilih alasan…</NativeSelectOption>
                  {CLIP_REJECTION_REASONS.map((reason) => (
                    <NativeSelectOption key={reason} value={reason}>
                      {CLIP_REJECTION_REASON_LABELS[reason]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.rejection_reason]} />
              </Field>
            ) : null}

            <Field>
              <FieldLabel htmlFor="vc-notes">
                {decision === "disetujui" ? "Catatan (opsional)" : "Catatan untuk kliper"}
              </FieldLabel>
              <Textarea
                id="vc-notes"
                rows={3}
                placeholder={
                  decision === "revisi"
                    ? "Mis. kode verifikasi belum ada di caption; tambahkan lalu kirim ulang."
                    : undefined
                }
                {...form.register("notes")}
              />
              <FieldError errors={[errors.notes]} />
            </Field>

            <Button
              type="submit"
              disabled={isPending}
              variant={decision === "ditolak" ? "destructive" : "default"}
              className="h-11"
            >
              {decision === "disetujui" ? <Check aria-hidden /> : <X aria-hidden />}
              {isPending ? "Menyimpan…" : REVIEW_DECISION_LABELS[decision]}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* A views update (FR-M18-05)                                          */
/* ------------------------------------------------------------------ */

export function ViewsUpdateDecisionForm({
  submissionId,
  claimedViews,
  terms,
  ledger,
}: {
  submissionId: string;
  claimedViews: number;
  terms: ClipCampaignTerms;
  ledger: ClipLedgerSums;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ViewsUpdateVerifyFormInput, unknown, ViewsUpdateVerifyInput>({
    resolver: zodResolver(viewsUpdateVerifySchema),
    defaultValues: {
      submission_id: submissionId,
      accept: true,
      verified_views: String(claimedViews),
      notes: "",
    },
  });
  const verifiedViews = useWatch({ control: form.control, name: "verified_views" });

  function submit(accept: boolean) {
    form.setValue("accept", accept);
    void form.handleSubmit((values) => {
      setServerError(null);
      startTransition(async () => {
        const result = await verifyViewsUpdateAction(values);
        if (result.status === "success") toast.success(result.message);
        else {
          setServerError(result.message);
          applyFieldErrors(form, result);
        }
      });
    })();
  }

  const { errors } = form.formState;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Pembaruan views</h2>
        </CardTitle>
        <CardDescription>
          Klaim kliper: {claimedViews.toLocaleString("id-ID")} views. Hanya selisih honornya yang
          dikreditkan; views yang turun tidak mengurangi saldo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => event.preventDefault()} noValidate>
          <FieldGroup>
            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}
            <Field>
              <FieldLabel htmlFor="vu-verified">Views terverifikasi</FieldLabel>
              <Input id="vu-verified" inputMode="numeric" {...form.register("verified_views")} />
              <FieldError errors={[errors.verified_views]} />
            </Field>
            <CreditPreview views={verifiedViews} terms={terms} ledger={ledger} />
            <Field>
              <FieldLabel htmlFor="vu-notes">Catatan (wajib bila menolak)</FieldLabel>
              <Textarea id="vu-notes" rows={2} {...form.register("notes")} />
              <FieldError errors={[errors.notes]} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                className="h-11"
                disabled={isPending}
                onClick={() => submit(true)}
              >
                <Check aria-hidden />
                Terima
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11"
                disabled={isPending}
                onClick={() => submit(false)}
              >
                <X aria-hidden />
                Tolak
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Taken down (FR-M18-06) or fraud (FR-M18-07)                         */
/* ------------------------------------------------------------------ */

export function CancelClipCard({
  contentId,
  isOwner,
  minLiveDays,
  isLive,
}: {
  contentId: string;
  isOwner: boolean;
  minLiveDays: number;
  isLive: boolean;
}) {
  const [kind, setKind] = useState<"dihapus" | "kecurangan">(isLive ? "dihapus" : "kecurangan");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClipCancelFormInput, unknown, ClipCancelInput>({
    resolver: zodResolver(clipCancelSchema),
    values:
      kind === "dihapus"
        ? { kind, content_id: contentId, removed_at: formatDateTimeInput(new Date()) }
        : { kind, content_id: contentId, rejection_reason: "views_tidak_wajar", notes: "" },
  });

  function onSubmit(values: ClipCancelInput) {
    setServerError(null);
    startTransition(async () => {
      const result = await cancelClipAction(values);
      if (result.status === "success") toast.success(result.message);
      else {
        setServerError(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  if (!isLive && !isOwner) return null;
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Batalkan honor klip</h2>
        </CardTitle>
        <CardDescription>
          Klip dihapus sebelum {minLiveDays} hari tayang membatalkan seluruh honornya. Setelah itu
          honor tetap milik kliper.
          {isOwner ? " Kecurangan terbukti selalu membatalkan seluruh honor (hanya owner)." : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <FieldGroup>
            {serverError ? (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            {isOwner && isLive ? (
              <Field>
                <FieldLabel htmlFor="cc-kind">Jenis</FieldLabel>
                <NativeSelect
                  id="cc-kind"
                  value={kind}
                  onChange={(event) => setKind(event.target.value as typeof kind)}
                >
                  <NativeSelectOption value="dihapus">Klip dihapus / diprivat</NativeSelectOption>
                  <NativeSelectOption value="kecurangan">Kecurangan terbukti</NativeSelectOption>
                </NativeSelect>
              </Field>
            ) : null}

            {kind === "dihapus" ? (
              <Field>
                <FieldLabel htmlFor="cc-removed">Waktu klip dihapus</FieldLabel>
                <Input id="cc-removed" type="datetime-local" {...form.register("removed_at")} />
                <FieldError errors={[errors.removed_at]} />
              </Field>
            ) : (
              <>
                <Field>
                  <FieldLabel htmlFor="cc-reason">Alasan penolakan</FieldLabel>
                  <NativeSelect id="cc-reason" {...form.register("rejection_reason")}>
                    {CLIP_REJECTION_REASONS.map((reason) => (
                      <NativeSelectOption key={reason} value={reason}>
                        {CLIP_REJECTION_REASON_LABELS[reason]}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="cc-notes">Bukti kecurangan (dibaca kliper)</FieldLabel>
                  <Textarea id="cc-notes" rows={3} {...form.register("notes")} />
                  <FieldError errors={[errors.notes]} />
                </Field>
              </>
            )}

            <Button type="submit" variant="destructive" disabled={isPending} className="h-11">
              {kind === "dihapus" ? <Trash2 aria-hidden /> : <Ban aria-hidden />}
              {isPending
                ? "Menyimpan…"
                : kind === "dihapus"
                  ? "Tandai dihapus"
                  : "Tolak dan batalkan honor"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
