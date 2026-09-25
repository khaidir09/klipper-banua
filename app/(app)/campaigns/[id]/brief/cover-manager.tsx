"use client";

import { useRef, useState, useTransition } from "react";
import { ImageIcon, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldError } from "@/components/ui/field";
import { campaignCoverUrl } from "@/lib/campaigns/cover";
import {
  CAMPAIGN_COVER_BUCKET,
  CAMPAIGN_COVER_MAX_BYTES,
  CAMPAIGN_COVER_MIME_TYPES,
} from "@/lib/constants/campaigns";
import { uploadToBucket } from "@/lib/storage/upload";
import { setCampaignCoverAction } from "../../actions";

/**
 * Cover image for the public campaign card (FR-M15-09, PRD 1.7). Public on
 * purpose, unlike the material below it, so the card says so.
 */
export function CoverManager({
  campaignId,
  coverPath,
  canEdit,
}: {
  campaignId: string;
  coverPath: string | null;
  canEdit: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const coverUrl = campaignCoverUrl(coverPath);

  function upload(file: File) {
    setError(null);
    if (!(CAMPAIGN_COVER_MIME_TYPES as readonly string[]).includes(file.type)) {
      return setError("Format gambar harus PNG, JPG, atau WebP.");
    }
    if (file.size > CAMPAIGN_COVER_MAX_BYTES) {
      return setError("Gambar lebih dari 2 MB. Perkecil dulu ukurannya.");
    }

    startTransition(async () => {
      const result = await uploadToBucket(CAMPAIGN_COVER_BUCKET, campaignId, file);
      if (result.error !== null) {
        setError(`Gambar gagal diunggah: ${result.error}`);
        return;
      }
      const saved = await setCampaignCoverAction({
        campaign_id: campaignId,
        file_path: result.path,
      });
      if (saved.status === "success") toast.success(saved.message);
      else setError(saved.message);
    });
  }

  function remove() {
    if (!window.confirm("Hapus gambar sampul kampanye ini?")) return;
    setError(null);
    startTransition(async () => {
      const result = await setCampaignCoverAction({ campaign_id: campaignId, file_path: null });
      if (result.status === "success") toast.success(result.message);
      else setError(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gambar sampul</CardTitle>
        <CardDescription>
          Tampil di kartu kampanye situs publik dan bisa dilihat siapa saja. Rasio 16:9, PNG/JPG/WebP,
          maks. 2 MB. Jangan pakai materi rahasia.
        </CardDescription>
        {canEdit ? (
          <CardAction className="flex gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => inputRef.current?.click()}
            >
              <Upload aria-hidden />
              {isPending ? "Menyimpan…" : coverUrl ? "Ganti" : "Unggah"}
            </Button>
            {coverUrl ? (
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label="Hapus gambar sampul"
                disabled={isPending}
                onClick={remove}
              >
                <Trash2 aria-hidden />
              </Button>
            ) : null}
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex aspect-video max-w-md items-center justify-center overflow-hidden rounded-lg border bg-muted">
          {coverUrl ? (
            // Public Storage URL; a plain img avoids configuring the Next image loader.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="Gambar sampul kampanye" className="size-full object-cover" />
          ) : (
            <ImageIcon className="size-6 text-muted-foreground" aria-label="Belum ada gambar" />
          )}
        </div>
        {error ? <FieldError>{error}</FieldError> : null}
        <input
          ref={inputRef}
          type="file"
          accept={CAMPAIGN_COVER_MIME_TYPES.join(",")}
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) upload(file);
          }}
        />
      </CardContent>
    </Card>
  );
}
