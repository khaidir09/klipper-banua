import { z } from "zod";

/** Shape every Server Action returns when it does not redirect. */
export type ActionResult<T = undefined> =
  | { status: "success"; message: string; data?: T }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export function ok<T>(message: string, data?: T): ActionResult<T> {
  return { status: "success", message, data };
}

export function fail<T = undefined>(message: string): ActionResult<T> {
  return { status: "error", message };
}

/** Turns a Zod failure into one general message plus per-field messages. */
export function invalid<T = undefined>(error: z.ZodError): ActionResult<T> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  const first = error.issues[0]?.message ?? "Periksa kembali isian Anda.";
  return { status: "error", message: first, fieldErrors };
}

/** Postgres error codes, used to give friendlier messages. */
export const PG_UNIQUE_VIOLATION = "23505";
export const PG_CHECK_VIOLATION = "23514";
export const PG_FOREIGN_KEY_VIOLATION = "23503";

/**
 * Messages for the rule violations raised by the database triggers
 * (see supabase/migrations). The trigger message starts with the key.
 */
const DB_RULE_MESSAGES: Record<string, string> = {
  CAMPAIGN_LOCKED: "Kampanye sudah selesai atau dibatalkan; hanya owner yang dapat mengubahnya.",
  INVALID_TRANSITION: "Perubahan status kampanye tersebut tidak diizinkan.",
  ACTIVATION_NEEDS_LANDING_URL: "Kampanye bertujuan pendaftar wajib memiliki URL tujuan.",
  ACTIVATION_NEEDS_CREATOR: "Tugaskan minimal satu kreator sebelum mengaktifkan kampanye.",
  CREATOR_BLOCKED: "Kreator yang diblokir tidak dapat ditugaskan.",
  CREATOR_NOT_VERIFIED: "Hanya kreator terverifikasi atau aktif yang dapat ditugaskan.",
  TRACKING_FROZEN:
    "Kode referal dan slug tidak dapat diubah karena sudah ada klik atau laporan pendaftar tercatat.",
  REVIEW_NOT_PENDING: "Konten ini sudah direview; tunggu draf baru sebelum mereview lagi.",
  CHECKLIST_INCOMPLETE: "Centang semua item checklist sebelum menyetujui konten.",
  INVALID_REVIEW_TRANSITION: "Status review hanya berubah lewat keputusan review atau draf baru.",
  DRAFT_FROZEN: "Draf yang sudah direview tidak dapat diubah; kirim draf baru setelah revisi.",
  REVIEW_IMMUTABLE: "Riwayat review tidak dapat diubah atau dihapus.",
  CONTENT_ASSIGNMENT_FIXED: "Konten tidak dapat dipindahkan ke kreator lain.",
  SNAPSHOT_NEEDS_LIVE_CONTENT: "Snapshot metrik hanya untuk konten yang sudah tayang.",
  SNAPSHOT_BEFORE_POSTING: "Waktu pengambilan snapshot tidak boleh sebelum waktu tayang.",
  REPORT_ASSIGNMENT_MISMATCH: "Kode kreator tersebut bukan milik kampanye ini.",
  PAYOUT_NEEDS_CLOSED_CAMPAIGN: "Honor baru dapat dihitung setelah kampanye berstatus selesai.",
  PAYOUT_LOCKED: "Honor yang sudah disetujui atau dibayar tidak dapat dihitung ulang atau diubah.",
  PAYOUT_OWNER_ONLY: "Hanya owner yang dapat menyetujui atau menandai honor dibayar.",
  INVALID_PAYOUT_TRANSITION: "Perubahan status honor tersebut tidak diizinkan.",
  FINANCE_OWNER_ONLY: "Bukti keuangan hanya dapat dikelola owner.",
  SHARE_LINK_CAMPAIGN_STATUS:
    "Tautan laporan hanya dapat dibuat untuk kampanye berstatus aktif atau selesai.",
  SHARE_LINK_FIXED: "Tautan laporan tidak dapat diubah; cabut lalu buat tautan baru.",
  SHARE_LINK_REVOKED: "Tautan yang sudah dicabut tidak dapat diaktifkan kembali.",
  CREATOR_ANONYMIZED: "Data pribadi kreator ini sudah dianonimkan dan tidak dapat diubah lagi.",
  CREATOR_NOT_FOUND: "Kreator tidak ditemukan.",
  OWNER_ONLY: "Hanya owner yang dapat melakukan tindakan ini.",
  OPS_LOG_OWNER_FIXED: "Kampanye dan pencatat waktu tidak dapat diubah.",
  PORTAL_LINK_INTERNAL_ONLY: "Akses portal kreator hanya dapat diubah oleh tim internal.",
  PORTAL_FIELD_LOCKED: "Bagian itu hanya dapat diubah tim, bukan dari portal kreator.",
  PORTAL_CONFIRM_ONLY: "Penugasan ini sudah dikonfirmasi atau tidak lagi menunggu konfirmasi Anda.",
  PAKET_RETIRED:
    "Kampanye baru memakai honor per 1.000 views; model paket hanya untuk kampanye lama.",
  PAYOUT_MODEL_LOCKED: "Model honor tidak dapat diubah setelah kampanye aktif.",
  RATE_LOCKED: "Tarif tidak dapat diubah karena sudah ada klip disetujui.",
  BUDGET_BELOW_USED: "Anggaran tidak boleh lebih kecil dari honor yang sudah terpakai.",
  ACTIVATION_NEEDS_BRIEF: "Isi brief kampanye sebelum mengaktifkan.",
  ACTIVATION_NEEDS_ASSET: "Tambahkan minimal satu materi kampanye sebelum mengaktifkan.",
  ACTIVATION_NEEDS_RATE: "Isi tarif per 1.000 views sebelum mengaktifkan.",
  ACTIVATION_NEEDS_BUDGET: "Isi anggaran kliper sebelum mengaktifkan.",
  ACTIVATION_PAST_END_DATE: "Tanggal selesai sudah lewat; perpanjang periode kampanye.",
  ACTIVATION_NEEDS_PLATFORM: "Pilih minimal satu platform sebelum mengaktifkan.",
  JOIN_CREATOR_NOT_ACTIVE:
    "Tambahkan minimal satu akun media sosial di Profil agar akun Anda aktif dan bisa bergabung.",
  JOIN_TERMS_OUTDATED: "Syarat Kliper sudah diperbarui. Setujui versi terbaru sebelum bergabung.",
  JOIN_CAMPAIGN_CLOSED: "Kampanye ini tidak sedang membuka pendaftaran kliper.",
  JOIN_PAST_DEADLINE: "Periode kampanye ini sudah berakhir.",
  JOIN_BUDGET_EXHAUSTED: "Anggaran kampanye ini sudah habis.",
  JOIN_LOCAL_ONLY: "Kampanye ini khusus pemegang lencana Kliper Lokal.",
  WITHDRAW_NOT_ALLOWED: "Untuk kampanye paket, hubungi tim jika ingin mundur.",
  WITHDRAW_HAS_APPROVED_CLIP: "Anda tidak dapat mundur karena sudah ada klip yang disetujui.",
  SUBMISSION_NEEDS_LIVE_CONTENT: "Bukti metrik hanya untuk konten yang sudah tayang.",
  SUBMISSION_BEFORE_POSTING: "Waktu pengambilan tidak boleh sebelum waktu tayang.",
  SUBMISSION_NOT_PENDING: "Kiriman ini sudah diverifikasi tim.",
  SUBMISSION_NOT_FOUND: "Kiriman tidak ditemukan.",
  SUBMISSION_REJECT_NEEDS_NOTES: "Tulis alasan penolakan agar kreator tahu yang harus diperbaiki.",
  SUBMISSION_INTERNAL_ONLY: "Hanya tim yang dapat memverifikasi kiriman kreator.",
  CLIP_NEEDS_URL: "Klip dikirim bersama tautan dan waktu tayangnya.",
  CLIP_NEEDS_PROOF: "Klip dikirim bersama tangkapan layar views.",
  CLIP_CREATOR_NOT_ACTIVE: "Akun kliper Anda belum aktif.",
  CLIP_TERMS_OUTDATED:
    "Syarat Kliper sudah diperbarui. Setujui versi terbaru sebelum mengirim klip.",
  CLIP_ASSIGNMENT_NOT_JOINED: "Klip hanya dapat dikirim untuk kampanye yang sudah Anda ikuti.",
  CLIP_CAMPAIGN_CLOSED: "Kampanye ini sudah tidak menerima klip baru.",
  CLIP_BUDGET_EXHAUSTED: "Anggaran kampanye ini sudah habis, jadi klip baru tidak diterima.",
  CLIP_PLATFORM_NOT_ALLOWED: "Kampanye ini tidak menerima klip dari platform tersebut.",
  CLIP_NO_SOCIAL_ACCOUNT:
    "Tambahkan akun media sosial untuk platform ini di Profil sebelum mengirim klip.",
  CLIP_POSTED_IN_FUTURE: "Waktu tayang tidak boleh di masa depan.",
  CLIP_OUTSIDE_PERIOD: "Waktu tayang harus di antara saat Anda bergabung dan akhir kampanye.",
  CLIP_LIMIT_REACHED: "Anda sudah mengirim jumlah klip maksimal untuk kampanye ini.",
  CLIP_URL_REJECTED_BEFORE: "Klip dengan tautan ini pernah ditolak dan tidak dapat dikirim lagi.",
  CLIP_USE_VERIFY: "Klip kampanye per views diputuskan lewat halaman Verifikasi.",
  CLIP_NOT_PER_VIEWS: "Konten kampanye paket direview di tab Konten.",
  CLIP_INTERNAL_ONLY: "Hanya tim yang dapat memverifikasi klip.",
  CLIP_NEEDS_VERIFIED_VIEWS: "Isi views terverifikasi dari halaman klip.",
  CLIP_REJECT_NEEDS_REASON: "Pilih alasan penolakan.",
  CLIP_REJECT_NEEDS_NOTES: "Tulis catatan penolakan untuk kliper.",
  CLIP_NOT_APPROVED: "Hanya klip yang sudah disetujui yang dapat dibatalkan.",
  CLIP_NOT_LIVE: "Klip ini tidak sedang tayang.",
  CLIP_REMOVED_AT_INVALID: "Isi waktu klip dihapus; tidak boleh di masa depan.",
  CLIP_CANCEL_KIND: "Jenis pembatalan tidak dikenal.",
  SUBMISSION_INITIAL_FIXED: "Bukti views pertama tetap melekat pada klip dan tidak dapat ditarik.",
  VIEWS_UPDATE_NOT_ALLOWED:
    "Pembaruan views hanya untuk klip yang sudah disetujui dan masih tayang.",
  VIEWS_UPDATE_CLOSED: "Masa klaim pembaruan views kampanye ini sudah berakhir.",
  VIEWS_UPDATE_TOO_SOON: "Pembaruan views paling cepat 24 jam setelah kiriman terakhir.",
  CREDIT_INVALID: "Nominal honor tidak valid.",
  CREDIT_ABOVE_CLIP_EARNING: "Honor melebihi yang dihasilkan views terverifikasi klip ini.",
  CREDIT_ABOVE_CREATOR_CAP: "Honor melebihi batas honor per kliper kampanye ini.",
  BUDGET_EXCEEDED: "Anggaran kampanye tidak cukup untuk honor ini.",
  LEDGER_IMMUTABLE: "Entri saldo tidak dapat diubah atau dihapus.",
  LEDGER_FUNCTION_ONLY: "Entri saldo hanya dicatat lewat verifikasi klip.",
  WITHDRAW_CREATOR_BLOCKED: "Akun Anda diblokir, jadi saldo belum dapat ditarik.",
  WITHDRAW_NEEDS_BIRTH_DATE: "Lengkapi tanggal lahir di halaman Saldo sebelum menarik saldo.",
  BIRTH_DATE_ALREADY_SET: "Tanggal lahir sudah terisi. Hubungi tim bila perlu mengubahnya.",
  BIRTH_DATE_INVALID: "Tanggal lahir tidak valid.",
  WITHDRAW_NEEDS_BANK: "Isi rekening atau e-wallet di Profil sebelum menarik saldo.",
  WITHDRAW_BANK_RECENT:
    "Rekening baru saja diubah. Demi keamanan, penarikan dapat diajukan 24 jam setelah perubahan.",
  WITHDRAW_PENDING_EXISTS: "Masih ada penarikan yang sedang diproses.",
  WITHDRAW_BELOW_MIN: "Nominal di bawah minimum penarikan.",
  WITHDRAW_ABOVE_BALANCE: "Nominal melebihi saldo tersedia.",
  WITHDRAWAL_FUNCTION_ONLY: "Penarikan hanya diubah lewat halaman Penarikan.",
  WITHDRAWAL_IMMUTABLE: "Penarikan tetap tercatat dan tidak dapat dihapus.",
  WITHDRAWAL_NOT_FOUND: "Penarikan tidak ditemukan.",
  INVALID_WITHDRAWAL_TRANSITION: "Perubahan status penarikan tersebut tidak diizinkan.",
  WITHDRAWAL_PAID_NEEDS_PROOF: "Isi tanggal transfer dan unggah bukti transfer.",
  WITHDRAWAL_REJECT_NEEDS_REASON: "Tulis alasan penolakan untuk kliper.",
  WITHDRAWAL_FEE_INVALID: "Biaya transfer tidak boleh negatif atau sebesar nominal penarikan.",
  ADJUSTMENT_INVALID: "Nominal penyesuaian tidak boleh nol.",
  ADJUSTMENT_NEEDS_REASON: "Alasan penyesuaian wajib diisi.",
  BANK_ACCOUNT_INCOMPLETE: "Lengkapi bank dan nama pemilik rekening.",
  ANONYMIZE_BALANCE_NOT_ZERO:
    "Saldo kliper masih ada. Selesaikan saldonya (bayar atau sesuaikan) sebelum menghapus akun.",
  ANONYMIZE_WITHDRAWAL_OPEN: "Selesaikan penarikan yang berjalan sebelum menghapus akun.",
};

/** Check constraints whose violation deserves a specific message. */
const CONSTRAINT_MESSAGES: Record<string, string> = {
  contents_posted_requires_approval:
    "URL tayang hanya dapat diisi untuk konten yang sudah disetujui.",
  content_reviews_revision_notes_check: "Catatan wajib diisi untuk permintaan revisi.",
  contents_removed_check: "Waktu penghapusan tidak boleh sebelum waktu tayang.",
  metric_snapshots_checkpoint_key: "Checkpoint ini sudah memiliki snapshot untuk konten tersebut.",
  registrant_reports_proof_confirmation_check:
    "Konfirmasi bahwa bukti tidak memuat data pribadi pendaftar.",
  registrant_reports_period_check: "Akhir periode tidak boleh sebelum awal periode.",
  payouts_adjustment_reason_check: "Alasan penyesuaian wajib diisi.",
  payouts_paid_check: "Status dibayar wajib disertai tanggal bayar dan bukti transfer.",
  client_payments_invoice_number_key: "Nomor invoice sudah dipakai.",
  client_payments_paid_at_check: "Tanggal bayar wajib diisi jika ada pembayaran.",
  ops_time_logs_minutes_check: "Durasi harus antara 1 dan 1.440 menit.",
  creators_phone_wa_key: "Nomor WhatsApp tersebut sudah dipakai kreator lain.",
  campaigns_paket_invite_only: "Kampanye paket hanya dapat memakai akses undangan.",
  campaigns_max_clips_check: "Maksimal klip per kliper harus antara 1 dan 50.",
  campaigns_claim_grace_days_check: "Masa klaim harus antara 0 dan 60 hari.",
  campaigns_per_views_money_check:
    "Periksa tarif, anggaran, dan batas honor; nilainya tidak boleh negatif.",
  campaign_creators_campaign_creator_key: "Kliper ini sudah tercatat di kampanye tersebut.",
  withdrawals_transfer_fee_check:
    "Biaya transfer tidak boleh negatif atau sebesar nominal penarikan.",
  withdrawals_one_open_idx: "Masih ada penarikan yang sedang diproses.",
  platform_settings_min_withdrawal_check: "Minimum penarikan antara Rp 10.000 dan Rp 100.000.000.",
  creator_bank_accounts_number_check: "Nomor rekening harus angka, minimal 4 digit.",
  contents_posted_url_normalized_key:
    "Klip dengan tautan ini sudah pernah dikirim, oleh Anda atau kliper lain.",
  metric_submissions_pending_idx:
    "Masih ada kiriman views yang menunggu verifikasi untuk klip ini.",
  creators_blocked_reason_check:
    "Kreator diblokir lewat tombol Blokir di halaman kreator, beserta alasannya.",
};

/** Maps a trigger or constraint violation to Indonesian text; falls back otherwise. */
export function dbRuleMessage(
  error: { message?: string; code?: string } | null,
  fallback: string,
): string {
  const message = error?.message ?? "";
  const key = message.split(":")[0]?.trim();
  if (key && DB_RULE_MESSAGES[key]) return DB_RULE_MESSAGES[key];
  const constraint = Object.keys(CONSTRAINT_MESSAGES).find((name) => message.includes(name));
  if (constraint) return CONSTRAINT_MESSAGES[constraint]!;

  // Nothing matched, so the user only gets `fallback`. Leave the real error in
  // the server log: an RLS denial and a bad payload look identical from the
  // outside, which once made a production failure impossible to diagnose.
  console.error(`unmapped database error (${error?.code ?? "no code"}): ${message}`);
  return fallback;
}
