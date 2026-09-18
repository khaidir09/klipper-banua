import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Missing records (a deleted campaign, a mistyped id) inside the app shell. */
export default function AppNotFound() {
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-3xl font-semibold tracking-tight">Data tidak ditemukan</p>
      <p className="max-w-md text-muted-foreground">
        Data yang Anda buka mungkin sudah dihapus atau tautannya keliru.
      </p>
      <Button asChild>
        <Link href="/dashboard">Kembali ke dasbor</Link>
      </Button>
    </div>
  );
}
