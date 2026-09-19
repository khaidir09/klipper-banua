"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Link2, Link2Off, RefreshCw } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { OpenShareLink } from "@/lib/data/share-links";
import { formatDateTime } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";
import { createReportShareLinkAction, revokeReportShareLinkAction } from "../../share-actions";

type Props = {
  campaignId: string;
  /** Campaign is aktif or selesai (FR-M9-05). */
  shareable: boolean;
  link: OpenShareLink | null;
  timezone: string;
};

/** FR-M9-05: create, re-create and revoke the client's read-only report link. */
export function ShareLinkCard({ campaignId, shareable, link, timezone }: Props) {
  const [expiresOn, setExpiresOn] = useState("");
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPending, startTransition] = useTransition();

  const expired = link?.expires_at ? new Date(link.expires_at) <= new Date() : false;

  function create() {
    startTransition(async () => {
      const result = await createReportShareLinkAction({
        campaign_id: campaignId,
        expires_on: expiresOn,
      });
      if (result.status === "success" && result.data) {
        setCreatedUrl(result.data.url);
        setCopied(false);
        setExpiresOn("");
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  function revoke() {
    if (!link) return;
    startTransition(async () => {
      const result = await revokeReportShareLinkAction({
        campaign_id: campaignId,
        link_id: link.id,
      });
      if (result.status === "success") {
        setCreatedUrl(null);
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  }

  async function copy() {
    if (!createdUrl) return;
    try {
      await navigator.clipboard.writeText(createdUrl);
      setCopied(true);
      toast.success("Tautan disalin.");
    } catch {
      toast.error("Gagal menyalin; pilih tautan lalu salin manual.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tautan untuk klien</CardTitle>
        <CardDescription>
          Klien membuka laporan ini tanpa login. Isinya sama dengan versi cetak, tanpa data
          keuangan.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {createdUrl ? (
          <Field>
            <FieldLabel htmlFor="share-link-url">Tautan baru</FieldLabel>
            <div className="flex gap-2">
              <Input
                id="share-link-url"
                readOnly
                value={createdUrl}
                className="font-mono text-xs"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button type="button" variant="outline" size="icon" onClick={copy}>
                {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
                <span className="sr-only">Salin tautan</span>
              </Button>
            </div>
            <FieldDescription>
              Salin sekarang. Demi keamanan, tautan hanya ditampilkan sekali; untuk mengirim ulang,
              buat tautan baru.
            </FieldDescription>
          </Field>
        ) : null}

        {link ? (
          <div className="space-y-1 rounded-md border p-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Link2 className="size-4 text-muted-foreground" aria-hidden />
              <span className="font-medium">Tautan aktif</span>
              {expired ? <Badge variant="destructive">Kedaluwarsa</Badge> : null}
            </div>
            <p className="text-muted-foreground">
              Dibuat {formatDateTime(link.created_at, timezone)}
              {link.creator?.full_name ? ` oleh ${link.creator.full_name}` : ""}
            </p>
            <p className="text-muted-foreground">
              {link.expires_at
                ? `Berlaku sampai ${formatDateTime(link.expires_at, timezone)}`
                : "Berlaku sampai dicabut"}
            </p>
            <p className="text-muted-foreground">
              Dilihat {formatNumber(link.view_count)} kali
              {link.last_viewed_at
                ? `, terakhir ${formatDateTime(link.last_viewed_at, timezone)}`
                : ""}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada tautan aktif.</p>
        )}

        {shareable ? (
          <Field>
            <FieldLabel htmlFor="share-link-expiry">Kedaluwarsa (opsional)</FieldLabel>
            <Input
              id="share-link-expiry"
              type="date"
              value={expiresOn}
              onChange={(event) => setExpiresOn(event.target.value)}
            />
            <FieldDescription>
              Kosongkan agar berlaku sampai dicabut.
              {link ? ' "Buat ulang" langsung mencabut tautan yang sedang aktif.' : ""}
            </FieldDescription>
          </Field>
        ) : (
          <p className="text-sm text-muted-foreground">
            Tautan dapat dibuat untuk kampanye berstatus aktif atau selesai.
          </p>
        )}

        {shareable || link ? (
          <div className="flex flex-wrap gap-2">
            {shareable ? (
              <Button type="button" onClick={create} disabled={isPending}>
                {link ? <RefreshCw aria-hidden /> : <Link2 aria-hidden />}
                {link ? "Buat ulang" : "Buat tautan"}
              </Button>
            ) : null}
            {link ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="outline" disabled={isPending}>
                    <Link2Off aria-hidden />
                    Cabut
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cabut tautan laporan?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Klien tidak dapat membuka laporan lewat tautan ini lagi. Anda dapat membuat
                      tautan baru kapan saja.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={revoke}>Cabut tautan</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
