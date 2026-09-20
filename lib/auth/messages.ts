/** Login screen notices, keyed by the `?alasan=` / `?error=` query parameter. */
export const AUTH_MESSAGES: Record<string, string> = {
  nonaktif: "Akun Anda dinonaktifkan. Hubungi owner untuk mengaktifkan kembali.",
  sesi: "Sesi Anda berakhir. Silakan masuk kembali.",
  keluar: "Anda telah keluar.",
  portal: "Akun Anda belum terhubung ke portal kreator. Hubungi tim untuk mengaktifkannya kembali.",
  tautan: "Tautan pemulihan tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.",
};

export function authMessage(key: string | null | undefined): string | null {
  if (!key) return null;
  return AUTH_MESSAGES[key] ?? null;
}
