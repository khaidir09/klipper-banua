"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-3xl font-semibold tracking-tight">Terjadi kesalahan</p>
      <p className="text-muted-foreground">
        Silakan coba lagi. Jika berulang, hubungi tim teknis.
        {error.digest ? ` (kode: ${error.digest})` : null}
      </p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
