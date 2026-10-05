import { CopyButton } from "@/components/forms/copy-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * FR-M16-07. The code proves that a clip was posted from the kliper's own
 * account: it goes into the caption or description of every clip (FR-M18-03).
 */
export function VerificationCodeCard({ code }: { code: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>Kode verifikasimu</h2>
        </CardTitle>
        <CardDescription>
          Tulis kode ini di caption atau deskripsi setiap klip. Tanpa kode ini, klipmu nggak bisa
          disetujui.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-3">
        <code className="rounded-md bg-muted px-3 py-2 font-mono text-lg font-semibold tracking-wider">
          {code}
        </code>
        <CopyButton value={code} label="Salin kode" successMessage="Kode verifikasi disalin." />
      </CardContent>
    </Card>
  );
}
