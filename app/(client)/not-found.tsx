import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Missing records inside the client portal shell. */
export default function ClientNotFound() {
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-3xl font-semibold tracking-tight">Data tidak ditemukan</p>
      <p className="max-w-md text-muted-foreground">
        Kampanye yang Anda buka mungkin belum berjalan atau tautannya keliru.
      </p>
      <Button asChild>
        <Link href="/klien">Kembali ke beranda</Link>
      </Button>
    </div>
  );
}
