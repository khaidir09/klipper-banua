import type { Database } from "@/types/database";

export type CampaignObjective = Database["public"]["Enums"]["campaign_objective"];
export type CampaignStatus = Database["public"]["Enums"]["campaign_status"];
export type AssetType = Database["public"]["Enums"]["asset_type"];
export type AssignmentStatus = Database["public"]["Enums"]["assignment_status"];

export const CAMPAIGN_OBJECTIVE_LABELS: Record<CampaignObjective, string> = {
  pendaftar: "Pendaftar",
  awareness: "Awareness",
  event: "Event",
};

export const CAMPAIGN_OBJECTIVES = Object.keys(CAMPAIGN_OBJECTIVE_LABELS) as CampaignObjective[];

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Draft",
  aktif: "Aktif",
  selesai: "Selesai",
  dibatalkan: "Dibatalkan",
};

export const CAMPAIGN_STATUSES = Object.keys(CAMPAIGN_STATUS_LABELS) as CampaignStatus[];

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  video: "Video",
  foto: "Foto",
  dokumen: "Dokumen",
  tautan: "Tautan",
};

export const ASSET_TYPES = Object.keys(ASSET_TYPE_LABELS) as AssetType[];

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  diundang: "Diundang",
  bergabung: "Bergabung",
  mundur: "Mundur",
  selesai: "Selesai",
};

export const ASSIGNMENT_STATUSES = Object.keys(ASSIGNMENT_STATUS_LABELS) as AssignmentStatus[];

/** Tabs of the campaign detail page (FR-M4-04), in display order. */
export const CAMPAIGN_TABS = [
  { segment: "overview", label: "Ringkasan" },
  { segment: "brief", label: "Brief & Materi" },
  { segment: "creators", label: "Kreator" },
  { segment: "contents", label: "Konten", phase: "Fase 3" },
  { segment: "metrics", label: "Metrik", phase: "Fase 4" },
  { segment: "finance", label: "Keuangan", phase: "Fase 5" },
  { segment: "report", label: "Laporan", phase: "Fase 6" },
] as const;

/** Upload limit for the `campaign-assets` bucket (PRD 7.1). */
export const CAMPAIGN_ASSET_MAX_BYTES = 50 * 1024 * 1024;

export const CAMPAIGN_ASSET_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
] as const;
