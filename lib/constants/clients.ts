import type { Database } from "@/types/database";

export type ClientType = Database["public"]["Enums"]["client_type"];

/** Enum values follow the PRD; labels are what the team sees. */
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  kampus_swasta: "Kampus swasta",
  sekolah_swasta: "Sekolah swasta",
  bank_daerah: "Bank daerah",
  bumd: "BUMD",
  pemda: "Pemda",
  event_organizer: "Event organizer",
  umkm: "UMKM",
  lainnya: "Lainnya",
};

export const CLIENT_TYPES = Object.keys(CLIENT_TYPE_LABELS) as ClientType[];
