"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { SOCIAL_PLATFORMS, SOCIAL_PLATFORM_LABELS } from "@/lib/constants/creators";
import type { SocialAccountRow } from "@/lib/data/creators";
import { formatDate, formatDateInput } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { applyFieldErrors } from "@/lib/forms";
import {
  socialAccountSchema,
  type SocialAccountFormInput,
  type SocialAccountInput,
} from "@/lib/validation/creators";
import { deleteSocialAccountAction, saveSocialAccountAction } from "../actions";

export type SocialAccountWithProof = SocialAccountRow & { proof_url: string | null };

export function SocialAccounts({
  creatorId,
  accounts,
  timezone,
}: {
  creatorId: string;
  accounts: SocialAccountWithProof[];
  timezone: string;
}) {
  const [editing, setEditing] = useState<SocialAccountWithProof | null | "new">(null);
  const [isPending, startTransition] = useTransition();

  function remove(account: SocialAccountWithProof) {
    if (
      !window.confirm(`Hapus akun ${SOCIAL_PLATFORM_LABELS[account.platform]} @${account.handle}?`)
    )
      return;
    startTransition(async () => {
      const result = await deleteSocialAccountAction({
        creator_id: creatorId,
        account_id: account.id,
      });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Akun media sosial</CardTitle>
        <CardDescription>
          Unggah tangkapan layar analitik audiens sebagai bukti persentase audiens Kalimantan.
        </CardDescription>
        <CardAction>
          <Button size="sm" variant="outline" onClick={() => setEditing("new")}>
            <Plus aria-hidden />
            Tambah akun
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada akun media sosial.</p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {accounts.map((account) => (
              <li key={account.id} className="flex gap-3 rounded-lg border p-3">
                <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                  {account.proof_url ? (
                    <a
                      href={account.proof_url}
                      target="_blank"
                      rel="noreferrer"
                      title="Buka bukti audiens"
                    >
                      {/* Signed URL expires in a minute; a plain img avoids the Next image loader. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={account.proof_url}
                        alt="Bukti analitik audiens"
                        className="size-24 object-cover"
                      />
                    </a>
                  ) : (
                    <ImageIcon
                      className="size-6 text-muted-foreground"
                      aria-label="Belum ada bukti"
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">
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
                          aria-label="Buka profil"
                        >
                          <ExternalLink className="size-3.5" />
                        </a>
                      ) : null}
                    </p>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Ubah akun"
                        onClick={() => setEditing(account)}
                      >
                        <Pencil aria-hidden />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Hapus akun"
                        disabled={isPending}
                        onClick={() => remove(account)}
                      >
                        <Trash2 aria-hidden />
                      </Button>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    {formatNumber(account.followers_count)} pengikut
                  </p>
                  <p>
                    Audiens Kalimantan:{" "}
                    {account.kalimantan_audience_pct !== null ? (
                      <span className="font-medium">{account.kalimantan_audience_pct}%</span>
                    ) : (
                      <span className="text-muted-foreground">belum diisi</span>
                    )}
                  </p>
                  {account.top_cities ? (
                    <p className="text-muted-foreground">Kota teratas: {account.top_cities}</p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">
                    {account.audience_proof_path ? "Bukti terunggah" : "Tanpa bukti"}
                    {account.last_verified_at
                      ? ` · diverifikasi ${formatDate(account.last_verified_at, timezone)}`
                      : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {editing ? (
        <SocialAccountDialog
          creatorId={creatorId}
          account={editing === "new" ? null : editing}
          timezone={timezone}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Card>
  );
}

function SocialAccountDialog({
  creatorId,
  account,
  timezone,
  onClose,
}: {
  creatorId: string;
  account: SocialAccountWithProof | null;
  timezone: string;
  onClose: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [fileError, setFileError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const form = useForm<SocialAccountFormInput, unknown, SocialAccountInput>({
    resolver: zodResolver(socialAccountSchema),
    defaultValues: account
      ? {
          platform: account.platform,
          handle: account.handle,
          profile_url: account.profile_url,
          followers_count: account.followers_count,
          kalimantan_audience_pct: account.kalimantan_audience_pct ?? "",
          top_cities: account.top_cities,
          last_verified_at: account.last_verified_at
            ? formatDateInput(account.last_verified_at, timezone)
            : "",
        }
      : {
          platform: "tiktok",
          handle: "",
          profile_url: "",
          followers_count: 0,
          kalimantan_audience_pct: "",
          top_cities: "",
          last_verified_at: "",
        },
  });

  function onSubmit(values: SocialAccountInput) {
    setFileError(null);
    const formData = new FormData();
    formData.set("platform", values.platform);
    formData.set("handle", values.handle);
    formData.set("profile_url", values.profile_url);
    formData.set("followers_count", String(values.followers_count));
    formData.set(
      "kalimantan_audience_pct",
      values.kalimantan_audience_pct === null ? "" : String(values.kalimantan_audience_pct),
    );
    formData.set("top_cities", values.top_cities);
    formData.set("last_verified_at", values.last_verified_at ?? "");
    if (file) formData.set("audience_proof", file);

    startTransition(async () => {
      const result = await saveSocialAccountAction(creatorId, account?.id ?? null, formData);
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        toast.error(result.message);
        applyFieldErrors(form, result);
        if (result.fieldErrors?.audience_proof) setFileError(result.fieldErrors.audience_proof);
      }
    });
  }

  const { errors } = form.formState;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <DialogHeader>
            <DialogTitle>{account ? "Ubah akun" : "Tambah akun media sosial"}</DialogTitle>
            <DialogDescription>
              Data audiens diisi dari analitik yang dikirim kreator.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="sa-platform">Platform</FieldLabel>
                <NativeSelect id="sa-platform" {...form.register("platform")}>
                  {SOCIAL_PLATFORMS.map((platform) => (
                    <NativeSelectOption key={platform} value={platform}>
                      {SOCIAL_PLATFORM_LABELS[platform]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
                <FieldError errors={[errors.platform]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="sa-handle">Handle</FieldLabel>
                <Input
                  id="sa-handle"
                  placeholder="tanpa @"
                  aria-invalid={Boolean(errors.handle)}
                  {...form.register("handle")}
                />
                <FieldError errors={[errors.handle]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="sa-url">URL profil</FieldLabel>
              <Input
                id="sa-url"
                type="url"
                placeholder="https://"
                aria-invalid={Boolean(errors.profile_url)}
                {...form.register("profile_url")}
              />
              <FieldError errors={[errors.profile_url]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="sa-followers">Jumlah pengikut</FieldLabel>
                <Input
                  id="sa-followers"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.followers_count)}
                  {...form.register("followers_count")}
                />
                <FieldError errors={[errors.followers_count]} />
              </Field>
              <Field>
                <FieldLabel htmlFor="sa-pct">% audiens Kalimantan</FieldLabel>
                <Input
                  id="sa-pct"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.kalimantan_audience_pct)}
                  {...form.register("kalimantan_audience_pct")}
                />
                <FieldError errors={[errors.kalimantan_audience_pct]} />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="sa-cities">Kota audiens teratas</FieldLabel>
              <Input
                id="sa-cities"
                placeholder="Banjarmasin, Banjarbaru, Samarinda"
                {...form.register("top_cities")}
              />
              <FieldError errors={[errors.top_cities]} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="sa-proof">Bukti analitik audiens</FieldLabel>
                <Input
                  id="sa-proof"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  aria-invalid={Boolean(fileError)}
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                />
                <FieldDescription>
                  PNG, JPG, atau WebP, maks. 5 MB.
                  {account?.audience_proof_path ? " Mengganti bukti sebelumnya." : ""}
                </FieldDescription>
                {fileError ? <FieldError>{fileError}</FieldError> : null}
              </Field>
              <Field>
                <FieldLabel htmlFor="sa-verified">Tanggal verifikasi terakhir</FieldLabel>
                <Input id="sa-verified" type="date" {...form.register("last_verified_at")} />
                <FieldError errors={[errors.last_verified_at]} />
              </Field>
            </div>
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
