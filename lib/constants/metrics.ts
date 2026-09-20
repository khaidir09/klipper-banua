import type { Database } from "@/types/database";

export type MetricCheckpoint = Database["public"]["Enums"]["metric_checkpoint"];

export const CHECKPOINT_LABELS: Record<MetricCheckpoint, string> = {
  "H+1": "H+1",
  "H+3": "H+3",
  "H+7": "H+7",
  akhir: "Akhir kampanye",
  lainnya: "Lainnya",
};

export const CHECKPOINTS = Object.keys(CHECKPOINT_LABELS) as MetricCheckpoint[];

/** FR-M13-06: how a creator's metric submission is doing. */
export type SubmissionStatus = Database["public"]["Enums"]["submission_status"];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  menunggu: "Menunggu verifikasi",
  diterima: "Diterima",
  ditolak: "Ditolak",
};

/** Checkpoints that fall due a fixed number of days after posting (FR-M10-02). */
export const DUE_CHECKPOINTS = [
  { checkpoint: "H+1", days: 1 },
  { checkpoint: "H+3", days: 3 },
  { checkpoint: "H+7", days: 7 },
] as const satisfies readonly { checkpoint: MetricCheckpoint; days: number }[];

/** Checkpoints shown on the cumulative views chart, in order (FR-M7-05). */
export const CHART_CHECKPOINTS = [
  "H+1",
  "H+3",
  "H+7",
  "akhir",
] as const satisfies readonly MetricCheckpoint[];

/** Private bucket for metric screenshots and registrant-report proofs (PRD 7.1). */
export const METRIC_PROOF_BUCKET = "metric-proofs";
export const METRIC_PROOF_MAX_BYTES = 10 * 1024 * 1024;
export const METRIC_PROOF_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;
