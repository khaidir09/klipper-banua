"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/** Shared body of the error boundaries; the digest lets the team find the server log. */
export function ErrorState({
  error,
  retry,
  className = "min-h-svh",
}: {
  error: Error & { digest?: string };
  retry: () => void;
  className?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={`flex flex-col items-center justify-center gap-4 p-6 text-center ${className}`}>
      <p className="text-3xl font-semibold tracking-tight">Terjadi kesalahan</p>
      <p className="max-w-md text-muted-foreground">
        Halaman ini gagal dimuat. Silakan coba lagi; jika berulang, hubungi tim teknis
        {error.digest ? (
          <>
            {" "}
            dengan kode <span className="font-mono">{error.digest}</span>
          </>
        ) : null}
        .
      </p>
      <Button onClick={() => retry()}>Coba lagi</Button>
    </div>
  );
}
