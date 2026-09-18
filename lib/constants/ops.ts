import type { Database } from "@/types/database";

export type OpsActivity = Database["public"]["Enums"]["ops_activity"];

/** FR-M12-01 activities, in the order they are listed in the recap. */
export const OPS_ACTIVITY_LABELS: Record<OpsActivity, string> = {
  review: "Review konten",
  rekap_metrik: "Rekap metrik",
  koordinasi_kreator: "Koordinasi kreator",
  koordinasi_klien: "Koordinasi klien",
  pembayaran: "Pembayaran",
  laporan: "Laporan",
  lainnya: "Lainnya",
};

export const OPS_ACTIVITIES = Object.keys(OPS_ACTIVITY_LABELS) as OpsActivity[];

/** One entry covers at most a full day (matches `ops_time_logs_minutes_check`). */
export const OPS_MAX_MINUTES = 1440;
