"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, CircleAlert } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CreatorStatus } from "@/lib/constants/creators";
import { formatDate, formatDateInput, formatDateTime } from "@/lib/format/date";
import { applyFieldErrors } from "@/lib/forms";
import { termsSchema, type TermsFormInput, type TermsInput } from "@/lib/validation/creators";
import { recordTermsAction, verifyCreatorAction } from "../actions";

type TermsVerificationProps = {
  creatorId: string;
  status: CreatorStatus;
  termsVersion: string | null;
  termsAgreedAt: string | null;
  verifiedAt: string | null;
  blockers: string[];
  timezone: string;
};

export function TermsVerification({
  creatorId,
  status,
  termsVersion,
  termsAgreedAt,
  verifiedAt,
  blockers,
  timezone,
}: TermsVerificationProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<TermsFormInput, unknown, TermsInput>({
    resolver: zodResolver(termsSchema),
    defaultValues: {
      terms_version: termsVersion ?? "",
      terms_agreed_at: termsAgreedAt ? formatDateInput(termsAgreedAt, timezone) : "",
    },
  });

  function onSubmit(values: TermsInput) {
    startTransition(async () => {
      const result = await recordTermsAction(creatorId, values);
      if (result.status === "success") toast.success(result.message);
      else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  function verify() {
    startTransition(async () => {
      const result = await verifyCreatorAction({ id: creatorId });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  const canVerify = blockers.length === 0 && status !== "terverifikasi" && status !== "diblokir";
  const { errors } = form.formState;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Persetujuan syarat kerja sama</CardTitle>
          <CardDescription>
            Catat versi syarat yang disetujui kreator dan tanggal persetujuannya (FR-M3-04).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {termsAgreedAt ? (
            <p className="mb-4 text-sm">
              Tercatat: versi <span className="font-medium">{termsVersion}</span> pada{" "}
              {formatDate(termsAgreedAt, timezone)}.
            </p>
          ) : null}
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="terms_version">Versi syarat</FieldLabel>
                  <Input
                    id="terms_version"
                    placeholder="mis. v1.0-2026"
                    aria-invalid={Boolean(errors.terms_version)}
                    {...form.register("terms_version")}
                  />
                  <FieldError errors={[errors.terms_version]} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="terms_agreed_at">Tanggal persetujuan</FieldLabel>
                  <Input
                    id="terms_agreed_at"
                    type="date"
                    aria-invalid={Boolean(errors.terms_agreed_at)}
                    {...form.register("terms_agreed_at")}
                  />
                  <FieldError errors={[errors.terms_agreed_at]} />
                </Field>
              </div>
              <div>
                <Button type="submit" variant="outline" disabled={isPending}>
                  {isPending
                    ? "Menyimpan…"
                    : termsAgreedAt
                      ? "Perbarui persetujuan"
                      : "Catat persetujuan"}
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Verifikasi</CardTitle>
          <CardDescription>
            Kreator hanya dapat diverifikasi jika punya minimal satu akun sosial berbukti audiens
            dan persetujuan syarat sudah tercatat (FR-M3-05).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {verifiedAt ? (
            <Alert>
              <BadgeCheck />
              <AlertTitle>Terverifikasi</AlertTitle>
              <AlertDescription>Pada {formatDateTime(verifiedAt, timezone)}.</AlertDescription>
            </Alert>
          ) : null}

          {blockers.length ? (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertTitle>Belum memenuhi syarat</AlertTitle>
              <AlertDescription>
                <ul className="list-disc pl-4">
                  {blockers.map((blocker) => (
                    <li key={blocker}>{blocker}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {status === "diblokir" ? (
            <p className="text-sm text-muted-foreground">
              Kreator yang diblokir tidak dapat diverifikasi.
            </p>
          ) : null}

          <Button onClick={verify} disabled={!canVerify || isPending}>
            <BadgeCheck aria-hidden />
            {status === "terverifikasi" ? "Sudah terverifikasi" : "Verifikasi kreator"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
