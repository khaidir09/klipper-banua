import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Missing records inside the creator portal shell. */
export default function PortalNotFound() {
  return (
    <div className="flex min-h-[60svh] flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-3xl font-semibold tracking-tight">Data tidak ditemukan</p>
      <p className="max-w-md text-muted-foreground">
        Penugasan yang Anda buka mungkin sudah berakhir atau tautannya keliru.
      </p>
      <Button asChild>
        <Link href="/portal">Kembali ke beranda</Link>
      </Button>
    </div>
  );
}
