import type {
  AssignmentStatus,
  CampaignAccess,
  CampaignObjective,
  CampaignStatus,
} from "@/lib/constants/campaigns";

/**
 * Campaign lifecycle (FR-M4-02): draft → aktif → selesai, or cancelled from
 * draft/aktif. Mirrored by the `guard_campaign_update` trigger.
 */
export const CAMPAIGN_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  draft: ["aktif", "dibatalkan"],
  aktif: ["selesai", "dibatalkan"],
  selesai: [],
  dibatalkan: [],
};

export function canTransition(from: CampaignStatus, to: CampaignStatus): boolean {
  return CAMPAIGN_TRANSITIONS[from].includes(to);
}

/** Assignments that still count as "a creator on the campaign". */
export const ACTIVE_ASSIGNMENT_STATUSES: AssignmentStatus[] = ["diundang", "bergabung"];

/** What a `per_views` campaign needs before it can run (FR-M17-02). */
export type PerViewsActivationInput = {
  brief: string;
  assetCount: number;
  ratePer1000Views: number;
  creatorBudget: number;
  /** `yyyy-MM-dd`. */
  endDate: string;
  allowedPlatforms: readonly string[];
  /** Business day in `Asia/Makassar`, see campaignToday(). */
  today: string;
};

/**
 * Activation rules (FR-M4-02, FR-M17-02), mirrored by the
 * `guard_campaign_update` trigger. `perViews` is null for legacy `paket`
 * campaigns; `access` defaults to `undangan`, the only mode they have.
 */
export function activationBlockers(input: {
  /** Only legacy `paket` campaigns have one (FR-M4-01). */
  objective: CampaignObjective | null;
  landingUrl: string | null;
  assignmentStatuses: AssignmentStatus[];
  access?: CampaignAccess;
  perViews?: PerViewsActivationInput | null;
}): string[] {
  const blockers: string[] = [];
  if (input.objective === "pendaftar" && !input.landingUrl?.trim()) {
    blockers.push("Kampanye bertujuan pendaftar wajib memiliki URL tujuan.");
  }

  const perViews = input.perViews;
  if (perViews) {
    if (!perViews.brief.trim()) blockers.push("Isi brief kampanye.");
    if (perViews.assetCount < 1) blockers.push("Tambahkan minimal satu materi kampanye.");
    if (perViews.ratePer1000Views <= 0) blockers.push("Isi tarif per 1.000 views.");
    if (perViews.creatorBudget <= 0) blockers.push("Isi anggaran kliper.");
    if (perViews.endDate < perViews.today) {
      blockers.push("Tanggal selesai sudah lewat; perpanjang periode kampanye.");
    }
    if (!perViews.allowedPlatforms.length) blockers.push("Pilih minimal satu platform.");
  }

  // FR-M4-02: an open campaign may start without klipers.
  if (
    (input.access ?? "undangan") === "undangan" &&
    !input.assignmentStatuses.some((status) => ACTIVE_ASSIGNMENT_STATUSES.includes(status))
  ) {
    blockers.push("Tugaskan minimal satu kreator (status diundang atau bergabung).");
  }
  return blockers;
}

/** Closed campaigns are read-only except for owners (PRD 8.5). */
export function isCampaignLocked(status: CampaignStatus): boolean {
  return status === "selesai" || status === "dibatalkan";
}
