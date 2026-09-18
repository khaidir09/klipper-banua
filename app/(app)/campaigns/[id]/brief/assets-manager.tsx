"use client";

import { useState, useTransition } from "react";
import { Download, ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  ASSET_TYPES,
  ASSET_TYPE_LABELS,
  CAMPAIGN_ASSET_MAX_BYTES,
  CAMPAIGN_ASSET_MIME_TYPES,
  type AssetType,
} from "@/lib/constants/campaigns";
import type { CampaignAssetRow } from "@/lib/data/campaigns";
import { uploadToBucket } from "@/lib/storage/upload";
import { addAssetAction, deleteAssetAction } from "../../actions";

type AssetWithUrl = CampaignAssetRow & { signed_url: string | null };

const BUCKET = "campaign-assets";

export function AssetsManager({
  campaignId,
  assets,
  canEdit,
}: {
  campaignId: string;
  assets: AssetWithUrl[];
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function remove(asset: AssetWithUrl) {
    if (!window.confirm(`Hapus materi "${asset.title}"?`)) return;
    startTransition(async () => {
      const result = await deleteAssetAction({ campaign_id: campaignId, asset_id: asset.id });
      if (result.status === "success") toast.success(result.message);
      else toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materi kampanye</CardTitle>
        <CardDescription>
          Unggah berkas (maks. 50 MB) atau tautkan materi besar dari Google Drive.
        </CardDescription>
        {canEdit ? (
          <CardAction>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              <Plus aria-hidden />
              Tambah materi
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent>
        {assets.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada materi.</p>
        ) : (
          <ul className="divide-y">
            {assets.map((asset) => (
              <li
                key={asset.id}
                className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 gap-3 text-sm">
                  <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <div className="min-w-0">
                    <p className="font-medium">
                      {asset.title}
                      <Badge variant="outline" className="ml-2 align-middle">
                        {ASSET_TYPE_LABELS[asset.type]}
                      </Badge>
                    </p>
                    {asset.notes ? <p className="text-muted-foreground">{asset.notes}</p> : null}
                    {asset.external_url ? (
                      <p className="truncate text-xs text-muted-foreground">{asset.external_url}</p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  {asset.external_url ? (
                    <Button size="icon-sm" variant="ghost" asChild>
                      <a
                        href={asset.external_url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Buka tautan"
                      >
                        <ExternalLink aria-hidden />
                      </a>
                    </Button>
                  ) : asset.signed_url ? (
                    <Button size="icon-sm" variant="ghost" asChild>
                      <a href={asset.signed_url} aria-label="Unduh berkas">
                        <Download aria-hidden />
                      </a>
                    </Button>
                  ) : null}
                  {canEdit ? (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Hapus materi"
                      disabled={isPending}
                      onClick={() => remove(asset)}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {open ? <AddAssetDialog campaignId={campaignId} onClose={() => setOpen(false)} /> : null}
    </Card>
  );
}

function AddAssetDialog({ campaignId, onClose }: { campaignId: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AssetType>("video");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const useLink = type === "tautan";

  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) return setError("Judul materi wajib diisi.");
    if (useLink && !url.trim()) return setError("Tempel tautan materi.");
    if (!useLink && !file && !url.trim()) {
      return setError("Pilih berkas untuk diunggah atau tempel tautan eksternal.");
    }
    if (file) {
      if (file.size > CAMPAIGN_ASSET_MAX_BYTES) {
        return setError("Berkas lebih dari 50 MB. Unggah ke Google Drive lalu tempel tautannya.");
      }
      if (!(CAMPAIGN_ASSET_MIME_TYPES as readonly string[]).includes(file.type)) {
        return setError("Format berkas tidak didukung (gambar, MP4/MOV, PDF, Word, PowerPoint).");
      }
    }

    startTransition(async () => {
      let filePath: string | null = null;

      if (file && !useLink) {
        const upload = await uploadToBucket(BUCKET, campaignId, file);
        if (upload.error !== null) {
          setError(`Berkas gagal diunggah: ${upload.error}`);
          return;
        }
        filePath = upload.path;
      }

      const result = await addAssetAction({
        campaign_id: campaignId,
        title,
        type,
        external_url: filePath ? "" : url,
        notes,
        file_path: filePath ?? "",
      });
      if (result.status === "success") {
        toast.success(result.message);
        onClose();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Tambah materi</DialogTitle>
            <DialogDescription>
              Isi salah satu: unggah berkas, atau tautan eksternal untuk video besar.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
              <Field>
                <FieldLabel htmlFor="asset-title">Judul</FieldLabel>
                <Input id="asset-title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </Field>
              <Field>
                <FieldLabel htmlFor="asset-type">Jenis</FieldLabel>
                <NativeSelect
                  id="asset-type"
                  value={type}
                  onChange={(e) => setType(e.target.value as AssetType)}
                >
                  {ASSET_TYPES.map((value) => (
                    <NativeSelectOption key={value} value={value}>
                      {ASSET_TYPE_LABELS[value]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            {useLink ? null : (
              <Field>
                <FieldLabel htmlFor="asset-file">Berkas</FieldLabel>
                <Input
                  id="asset-file"
                  type="file"
                  accept={CAMPAIGN_ASSET_MIME_TYPES.join(",")}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <FieldDescription>Maks. 50 MB. Kosongkan jika memakai tautan.</FieldDescription>
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="asset-url">Tautan eksternal</FieldLabel>
              <Input
                id="asset-url"
                type="url"
                placeholder="https://drive.google.com/…"
                value={url}
                disabled={Boolean(file) && !useLink}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="asset-notes">Catatan</FieldLabel>
              <Textarea
                id="asset-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>

            {error ? <FieldError>{error}</FieldError> : null}
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Menyimpan…" : "Simpan materi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
