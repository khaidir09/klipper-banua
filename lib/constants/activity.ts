/** Audit trail vocabulary (FR-M11-01) with the labels shown to the owner (FR-M11-02). */

export const ACTIVITY_ENTITY_LABELS = {
  profile: "Pengguna",
  client: "Klien",
  client_contact: "Kontak klien",
  creator: "Kreator",
  creator_social_account: "Akun sosial kreator",
  creator_bank_account: "Rekening kreator",
  campaign: "Kampanye",
  campaign_asset: "Materi kampanye",
  campaign_creator: "Penugasan",
  content: "Konten",
  metric_snapshot: "Snapshot metrik",
  registrant_report: "Laporan pendaftar",
  payout: "Honor",
  metric_submission: "Kiriman metrik kreator",
  client_payment: "Pembayaran klien",
  creator_ledger_entry: "Saldo klipper",
  withdrawal: "Penarikan saldo",
  platform_settings: "Pengaturan platform",
} as const;

export type ActivityEntityType = keyof typeof ACTIVITY_ENTITY_LABELS;
export const ACTIVITY_ENTITY_TYPES = Object.keys(ACTIVITY_ENTITY_LABELS) as ActivityEntityType[];

export const ACTIVITY_ACTION_LABELS = {
  create: "Membuat",
  update: "Mengubah",
  delete: "Menghapus",
  invite: "Mengundang",
  role_change: "Mengubah peran",
  activate: "Mengaktifkan",
  deactivate: "Menonaktifkan",
  verify: "Memverifikasi",
  terms_recorded: "Mencatat persetujuan",
  bank_account_viewed: "Melihat rekening",
  status_change: "Mengubah status",
  new_draft: "Mengirim draf baru",
  review: "Mereview",
  posted: "Mencatat tayang",
  removed: "Mencatat dihapus",
  calculate: "Menghitung honor",
  adjust: "Menyesuaikan honor",
  approve: "Menyetujui honor",
  revoke_approval: "Membatalkan persetujuan",
  paid: "Menandai dibayar",
  payment_recorded: "Mencatat pembayaran",
  anonymize: "Menganonimkan data",
  share_link_create: "Membuat tautan laporan klien",
  share_link_revoke: "Mencabut tautan laporan klien",
  portal_invite: "Mengundang ke portal kreator",
  portal_access: "Mengubah akses portal kreator",
  confirm_assignment: "Mengonfirmasi brief penugasan",
  submit_draft: "Mengirim draf dari portal",
  propose_posted: "Melaporkan konten tayang",
  submit_metric: "Mengirim bukti metrik",
  verify_submission: "Memverifikasi kiriman kreator",
  self_signup: "Mendaftar mandiri sebagai klipper",
  badge_request: "Mengajukan lencana Klipper Lokal",
  badge_grant: "Memberi lencana Klipper Lokal",
  badge_reject: "Menolak pengajuan lencana",
  badge_revoke: "Mencabut lencana Klipper Lokal",
  block: "Memblokir klipper",
  unblock: "Membuka blokir klipper",
  deletion_request: "Meminta penghapusan akun",
  budget_change: "Mengubah anggaran klipper",
  join_campaign: "Bergabung ke kampanye",
  withdraw_campaign: "Mundur dari kampanye",
  accept_terms: "Menyetujui Syarat Klipper terbaru",
  submit_clip: "Mengirim klip",
  resubmit_clip: "Mengirim ulang klip",
  submit_views_update: "Mengirim pembaruan views",
  verify_clip: "Memverifikasi klip",
  verify_views_update: "Memverifikasi pembaruan views",
  cancel_clip: "Membatalkan honor klip",
  ledger_credit: "Menambah saldo honor klip",
  ledger_cancel: "Membatalkan saldo honor klip",
  ledger_adjust: "Menyesuaikan saldo klipper",
  withdrawal_request: "Mengajukan penarikan saldo",
  withdrawal_diproses: "Memproses penarikan",
  withdrawal_dibayar: "Menandai penarikan dibayar",
  withdrawal_ditolak: "Menolak penarikan",
  min_withdrawal_change: "Mengubah minimum penarikan",
  cover_change: "Mengubah gambar sampul kampanye",
} as const;

export type ActivityAction = keyof typeof ACTIVITY_ACTION_LABELS;
export const ACTIVITY_ACTIONS = Object.keys(ACTIVITY_ACTION_LABELS) as ActivityAction[];

/** Page of the record an entry refers to, when it has one of its own. */
export function activityEntityHref(entityType: string, entityId: string | null): string | null {
  if (!entityId) return null;
  switch (entityType) {
    case "campaign":
      return `/campaigns/${entityId}/overview`;
    case "creator":
      return `/creators/${entityId}`;
    case "client":
      return `/clients/${entityId}`;
    case "creator_bank_account":
      return `/creators/${entityId}`;
    default:
      return null;
  }
}
