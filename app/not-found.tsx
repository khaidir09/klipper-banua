import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-3xl font-semibold tracking-tight">404</p>
      <p className="text-muted-foreground">Halaman yang Anda cari tidak ditemukan.</p>
      <Button asChild>
        <Link href="/dashboard">Kembali ke dasbor</Link>
      </Button>
    </div>
  );
}
