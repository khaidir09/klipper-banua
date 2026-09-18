import type { CampaignStatus } from "@/lib/constants/campaigns";

/**
 * Total contract value for a client (FR-M2-03): the sum of package prices of
 * its campaigns. Cancelled campaigns are excluded because no work is billed.
 * Amounts are whole Rupiah integers.
 */
export function totalContractValue(
  campaigns: { status: CampaignStatus; package_price: number }[],
): number {
  return campaigns
    .filter((campaign) => campaign.status !== "dibatalkan")
    .reduce((sum, campaign) => sum + campaign.package_price, 0);
}
