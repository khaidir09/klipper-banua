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
    default:
      return null;
  }
}
