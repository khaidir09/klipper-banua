/** Same page for unknown, revoked and expired links: no hint which one it was. */
export default function SharedReportNotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-xl font-semibold">Tautan laporan tidak berlaku</h1>
      <p className="max-w-sm text-muted-foreground">
        Tautan ini salah, sudah dicabut, atau sudah kedaluwarsa. Hubungi tim yang membagikannya
        untuk meminta tautan baru.
      </p>
    </main>
  );
}
