import type { Database } from "@/types/database";

export type CreatorTier = Database["public"]["Enums"]["creator_tier"];
export type CreatorStatus = Database["public"]["Enums"]["creator_status"];
export type SocialPlatform = Database["public"]["Enums"]["social_platform"];

export const CREATOR_TIER_LABELS: Record<CreatorTier, string> = {
  nano: "Nano",
  mikro: "Mikro",
  menengah: "Menengah",
};

export const CREATOR_TIERS = Object.keys(CREATOR_TIER_LABELS) as CreatorTier[];

export const CREATOR_STATUS_LABELS: Record<CreatorStatus, string> = {
  prospek: "Prospek",
  terverifikasi: "Terverifikasi",
  aktif: "Aktif",
  nonaktif: "Nonaktif",
  diblokir: "Diblokir",
};

export const CREATOR_STATUSES = Object.keys(CREATOR_STATUS_LABELS) as CreatorStatus[];

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  facebook: "Facebook",
};

export const SOCIAL_PLATFORMS = Object.keys(SOCIAL_PLATFORM_LABELS) as SocialPlatform[];

/**
 * Content niches offered in the multi-select (FR-M3-01). Stored as plain text
 * in `creators.niches`, so adding an entry here needs no migration.
 */
export const NICHES = [
  "pendidikan",
  "kuliner",
  "hiburan",
  "gaya_hidup",
  "kecantikan",
  "teknologi",
  "olahraga",
  "keluarga",
  "wisata",
  "bisnis",
  "lainnya",
] as const;

export type Niche = (typeof NICHES)[number];

export const NICHE_LABELS: Record<Niche, string> = {
  pendidikan: "Pendidikan",
  kuliner: "Kuliner",
  hiburan: "Hiburan",
  gaya_hidup: "Gaya hidup",
  kecantikan: "Kecantikan",
  teknologi: "Teknologi",
  olahraga: "Olahraga",
  keluarga: "Keluarga",
  wisata: "Wisata",
  bisnis: "Bisnis",
  lainnya: "Lainnya",
};

export function nicheLabel(value: string): string {
  return (NICHE_LABELS as Record<string, string>)[value] ?? value;
}

/** Minimum age at registration (FR-M3-02). */
export const MINIMUM_CREATOR_AGE = 18;

export type SignupSource = Database["public"]["Enums"]["signup_source"];

export const SIGNUP_SOURCE_LABELS: Record<SignupSource, string> = {
  undangan: "Didaftarkan tim",
  mandiri: "Daftar mandiri",
};

export const SIGNUP_SOURCES = Object.keys(SIGNUP_SOURCE_LABELS) as SignupSource[];

/**
 * Version of the klipper terms (Syarat Klipper) a registration agrees to
 * (FR-M3-04, FR-M16-01). Bump it whenever /syarat changes materially: from
 * Phase 16 on, joining a campaign asks for the latest version again.
 */
export const CREATOR_TERMS_VERSION = "2026-10";

/** Minimum Kalimantan audience share for the local badge (FR-M3-05). */
export const LOCAL_BADGE_MIN_PCT = 50;
