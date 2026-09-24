import type { Database } from "@/types/database";

export type ClientType = Database["public"]["Enums"]["client_type"];

/** Enum values follow the PRD; labels are what the team sees. */
export const CLIENT_TYPE_LABELS: Record<ClientType, string> = {
  brand: "Brand bisnis",
  umkm: "UMKM",
  instansi: "Instansi",
  personal: "Personal",
  lainnya: "Lainnya",
};

export const CLIENT_TYPES = Object.keys(CLIENT_TYPE_LABELS) as ClientType[];
