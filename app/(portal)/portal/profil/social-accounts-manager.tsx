"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BadgeCheck, Clock, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import {
  LOCAL_BADGE_MIN_PCT,
  SOCIAL_PLATFORMS,
  SOCIAL_PLATFORM_LABELS,
} from "@/lib/constants/creators";
import type { PortalSocialAccount } from "@/lib/data/portal";
import { formatNumber } from "@/lib/format/number";
import { applyFieldErrors } from "@/lib/forms";
import {
  portalSocialAccountSchema,
  type PortalSocialAccountFormInput,
  type PortalSocialAccountInput,
} from "@/lib/validation/creators";
import {
  deletePortalSocialAccountAction,
  requestLocalBadgeAction,
  savePortalSocialAccountAction,
} from "./actions";

type Editing = PortalSocialAccount | "new" | null;

/**
 * FR-M3-03 and FR-M16-08 from the klipper's side: their own accounts, and the
 * local badge request that rides on one of them. `hasBadge` is the creator's
 * badge (`verified_at`), which a single verified account earns.
 */
export function SocialAccountsManager({
  accounts,
  hasBadge,
}: {
  accounts: PortalSocialAccount[];
  hasBadge: boolean;
}) {
  const [editing, setEditing] = useState<Editing>(accounts.length ? null : "new");
  const [requesting, setRequesting] = useState<PortalSocialAccount | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove(account: PortalSocialAccount) {
    const label = `${SOCIAL_PLATFORM_LABELS[account.platform]} @${account.handle}`;
    if (!window.confirm(`Hapus akun ${label}?`)) return;
    startTransition(async () => {
      const result = await deletePortalSocialAccountAction({ id: account.id });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <div className="space-y-4">
      {accounts.length ? (
        <ul className="grid gap-3">
          {accounts.map((account) => (
            <li key={account.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="min-w-0 font-medium break-words">
                  <Badge variant="secondary" className="mr-1.5 align-middle">
                    {SOCIAL_PLATFORM_LABELS[account.platform]}
                  </Badge>
                  @{account.handle}
                  {account.profile_url ? (
                    <a
                      href={account.profile_url}
                      target="_blank"
                      rel="noreferrer"
                      className="ml-1 inline-flex align-middle text-muted-foreground hover:text-foreground"
                      aria-label={`Buka profil @${account.handle}`}
                    >
                      <ExternalLink className="size-3.5" aria-hidden />
                    </a>
                  ) : null}
                </p>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Ubah akun @${account.handle}`}
                    onClick={() => setEditing(account)}
                  >
                    <Pencil aria-hidden />
                  </Button>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`Hapus akun @${account.handle}`}
                    disabled={isPending}
                    onClick={() => remove(account)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-muted-foreground">
                {formatNumber(account.followers_count)} pengikut
              </p>
              <BadgeState account={account} hasBadge={hasBadge} onRequest={setRequesting} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Belum ada akun media sosial.</p>
      )}

      <Button variant="outline" className="h-11 w-full sm:w-auto" onClick={() => setEditing("new")}>
        <Plus aria-hidden />
        Tambah akun
      </Button>

      {editing ? (
        <AccountDialog
          account={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
      {requesting ? (
        <BadgeRequestDialog account={requesting} onClose={() => setRequesting(null)} />
      ) : null}
    </div>
  );
}

function BadgeState({
  account,
  hasBadge,
  onRequest,
}: {
  account: PortalSocialAccount;
  hasBadge: boolean;
  onRequest: (account: PortalSocialAccount) => void;
}) {
  if (account.last_verified_at) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-success">
        <BadgeCheck className="size-4" aria-hidden />
        Audiens Kalimantan {account.kalimantan_audience_pct}% terverifikasi
      </p>
    );
  }
  if (account.badge_requested_at) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-muted-foreground">
        <Clock className="size-4" aria-hidden />
        Pengajuan lencana sedang diperiksa tim
      </p>
    );
  }
  return (
    <div className="mt-2 space-y-2">
      {account.badge_review_notes ? (
        <p className="rounded-md bg-muted p-2 text-muted-foreground">
          Pengajuan sebelumnya ditolak: {account.badge_review_notes}
        </p>
      ) : null}
      {hasBadge ? null : (
        <Button size="sm" variant="outline" onClick={() => onRequest(account)}>
          Ajukan lencana Klipper Lokal
        </Button>
      )}
    </div>
  );
}

function AccountDialog({
  account,
  onClose,
}: {
  account: PortalSocialAccount | null;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<PortalSocialAccountFormInput, unknown, PortalSocialAccountInput>({
    resolver: zodResolver(portalSocialAccountSchema),
    defaultValues: account
      ? {
          platform: account.platform,
          handle: account.handle,
          profile_url: account.profile_url,
          followers_count: account.followers_count,
        }
      : { platform: "tiktok", handle: "", profile_url: "", followers_count: 0 },
  });
  const { errors } = form.formState;

  function onSubmit(values: PortalSocialAccountInput) {
    startTransition(async () => {
      const result = await savePortalSocialAccountAction(account?.id ?? null, values);
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
        applyFieldErrors(form, result);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{account ? "Ubah akun" : "Tambah akun media sosial"}</DialogTitle>
            <DialogDescription>
              Klip hanya dihitung bila diposting dari akun yang terdaftar di sini.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="ps-platform">Platform</FieldLabel>
                <NativeSelect
                  id="ps-platform"
                  className="h-11 w-full"
                  defaultValue={account?.platform ?? "tiktok"}
                  {...form.register("platform")}
                >
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <NativeSelectOption key={platform} value={platform}>
                      {SOCIAL_PLATFORM_LABELS[platform]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.platform]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="ps-handle">Nama akun</FieldLabel>
                <Input
                  id="ps-handle"
                  placeholder="tanpa @"
                  autoCapitalize="none"
                  className="h-11"
                  aria-invalid={Boolean(errors.handle)}
                  {...form.register("handle")}
                />
                <FieldError errors={[errors.handle]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="ps-url">URL profil</FieldLabel>
              <Input
                id="ps-url"
                type="url"
                placeholder="https://www.tiktok.com/@namaakun"
                className="h-11"
                aria-invalid={Boolean(errors.profile_url)}
                {...form.register("profile_url")}
              />
              <FieldError errors={[errors.profile_url]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="ps-followers">Jumlah pengikut</FieldLabel>
              <Input
                id="ps-followers"
                type="number"
                min={0}
                inputMode="numeric"
                className="h-11"
                aria-invalid={Boolean(errors.followers_count)}
                {...form.register("followers_count")}
              />
              <FieldError errors={[errors.followers_count]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** FR-M16-08. A plain form: the screenshot travels as FormData. */
function BadgeRequestDialog({
  account,
  onClose,
}: {
  account: PortalSocialAccount;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.set("account_id", account.id);
    setErrors({});
    startTransition(async () => {
      const result = await requestLocalBadgeAction(formData);
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
        setErrors(result.fieldErrors ?? {});
      }
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={onSubmit} noValidate>
          <DialogHeader>
            <DialogTitle>Ajukan lencana Klipper Lokal</DialogTitle>
            <DialogDescription>
              Lencana membuka kampanye khusus audiens Kalimantan. Syaratnya minimal{" "}
              {LOCAL_BADGE_MIN_PCT}% audiens akun ini berada di Kalimantan, dibuktikan dengan
              tangkapan layar analitik.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            <p className="text-sm">
              Akun: <strong>{SOCIAL_PLATFORM_LABELS[account.platform]}</strong> @{account.handle}
            </p>
            <Field>
              <FieldLabel htmlFor="br-pct">% audiens di Kalimantan</FieldLabel>
              <Input
                id="br-pct"
                name="kalimantan_audience_pct"
                type="number"
                min={0}
                max={100}
                step="0.1"
                inputMode="decimal"
                className="h-11"
                defaultValue={account.kalimantan_audience_pct ?? ""}
                aria-invalid={Boolean(errors.kalimantan_audience_pct)}
              />
              {errors.kalimantan_audience_pct ? (
                <FieldError>{errors.kalimantan_audience_pct}</FieldError>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="br-cities">Kota audiens teratas</FieldLabel>
              <Input
                id="br-cities"
                name="top_cities"
                placeholder="Banjarmasin, Banjarbaru, Martapura"
                className="h-11"
                defaultValue={account.top_cities}
                aria-invalid={Boolean(errors.top_cities)}
              />
              {errors.top_cities ? <FieldError>{errors.top_cities}</FieldError> : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="br-proof">Tangkapan layar analitik audiens</FieldLabel>
              <Input
                id="br-proof"
                name="audience_proof"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                aria-invalid={Boolean(errors.audience_proof)}
              />
              <FieldDescription>
                Halaman analitik yang menampilkan lokasi atau kota penonton. PNG, JPG, atau WebP,
                maks. 5 MB.
              </FieldDescription>
              {errors.audience_proof ? <FieldError>{errors.audience_proof}</FieldError> : null}
            </Field>
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Mengirim…" : "Kirim pengajuan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
