"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Send } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CreatorStatus } from "@/lib/constants/creators";
import type { PortalAccount } from "@/lib/data/creators";
import { formatDateTime } from "@/lib/format/date";
import { applyFieldErrors } from "@/lib/forms";
import { invitePortalSchema } from "@/lib/validation/creators";
import { invitePortalAccessAction, setPortalAccessAction } from "../actions";

const emailSchema = invitePortalSchema.pick({ email: true });
type EmailInput = { email: string };

type PortalAccessProps = {
  creatorId: string;
  creatorEmail: string;
  status: CreatorStatus;
  account: PortalAccount | null;
  portalInvitedAt: string | null;
  isOwner: boolean;
  timezone: string;
};

/** FR-M13-01 and FR-M13-08: the team's view of a creator's portal access. */
export function PortalAccess({
  creatorId,
  creatorEmail,
  status,
  account,
  portalInvitedAt,
  isOwner,
  timezone,
}: PortalAccessProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<EmailInput, unknown, EmailInput>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: account?.email ?? creatorEmail },
  });

  const canInvite = status === "terverifikasi" || status === "aktif";

  function invite(values: EmailInput) {
    startTransition(async () => {
      const result = await invitePortalAccessAction({ creator_id: creatorId, email: values.email });
      if (result.status === "success") toast.success(result.message);
      else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  function toggleAccess(isActive: boolean) {
    startTransition(async () => {
      const result = await setPortalAccessAction({ creator_id: creatorId, is_active: isActive });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Akses portal kreator</CardTitle>
        <CardDescription>
          Kreator memakai portal untuk melihat brief, materi, dan kode referalnya sendiri. Undangan
          dikirim lewat email; kreator memilih kata sandinya sendiri.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {account ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Mail className="size-4 text-muted-foreground" aria-hidden />
              <span className="font-medium">{account.email}</span>
              {account.is_active ? (
                <Badge variant="success">Akses aktif</Badge>
              ) : (
                <Badge variant="destructive">Akses dicabut</Badge>
              )}
            </div>
            {portalInvitedAt ? (
              <p className="text-xs text-muted-foreground">
                Undangan terakhir dikirim {formatDateTime(portalInvitedAt, timezone)}.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                disabled={isPending}
                onClick={() => invite({ email: account.email })}
              >
                <Send aria-hidden />
                Kirim ulang tautan masuk
              </Button>
              {isOwner ? (
                <Button
                  variant={account.is_active ? "outline" : "default"}
                  disabled={isPending}
                  onClick={() => toggleAccess(!account.is_active)}
                >
                  {account.is_active ? "Cabut akses" : "Aktifkan kembali"}
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            {canInvite ? null : (
              <Alert>
                <AlertDescription>
                  Kreator harus berstatus terverifikasi atau aktif sebelum dapat diundang ke portal.
                </AlertDescription>
              </Alert>
            )}
            <form onSubmit={form.handleSubmit(invite)} noValidate>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="portal_email">Email kreator</FieldLabel>
                  <Input
                    id="portal_email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@email.com"
                    aria-invalid={Boolean(form.formState.errors.email)}
                    disabled={!canInvite}
                    {...form.register("email")}
                  />
                  <FieldError errors={[form.formState.errors.email]} />
                </Field>
                <Button type="submit" disabled={isPending || !canInvite} className="w-fit">
                  <Send aria-hidden />
                  Undang ke portal
                </Button>
              </FieldGroup>
            </form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
