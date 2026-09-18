"use client";

/**
 * Last-resort boundary for errors in the root layout itself. It replaces the
 * layout, so it brings its own html/body and inline styles (no app CSS).
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="id">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          padding: 16,
          textAlign: "center",
          color: "#222",
          background: "#fafafa",
        }}
      >
        <main>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 .5rem" }}>Terjadi kesalahan</h1>
          <p style={{ color: "#666", margin: "0 0 1rem" }}>
            Aplikasi gagal dimuat. Silakan coba lagi
            {error.digest ? ` (kode: ${error.digest})` : ""}.
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              padding: ".5rem 1rem",
              borderRadius: 6,
              border: 0,
              background: "#222",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Coba lagi
          </button>
        </main>
      </body>
    </html>
  );
}
