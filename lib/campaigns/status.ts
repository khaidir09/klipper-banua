import type {
  AssignmentStatus,
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

export function activationBlockers(input: {
  objective: CampaignObjective;
  landingUrl: string | null;
  assignmentStatuses: AssignmentStatus[];
}): string[] {
  const blockers: string[] = [];
  if (input.objective === "pendaftar" && !input.landingUrl?.trim()) {
    blockers.push("Kampanye bertujuan pendaftar wajib memiliki URL tujuan.");
  }
  if (!input.assignmentStatuses.some((status) => ACTIVE_ASSIGNMENT_STATUSES.includes(status))) {
    blockers.push("Tugaskan minimal satu kreator (status diundang atau bergabung).");
  }
  return blockers;
}

/** Closed campaigns are read-only except for owners (PRD 8.5). */
export function isCampaignLocked(status: CampaignStatus): boolean {
  return status === "selesai" || status === "dibatalkan";
}
