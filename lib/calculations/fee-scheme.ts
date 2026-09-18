/**
 * Effective fee scheme per assignment (PRD 8.1):
 *   effective value = campaign_creators.<column> ?? campaigns.default_<column>
 *
 * Amounts are whole Rupiah integers.
 */

export type CampaignFeeDefaults = {
  default_base_fee: number;
  default_bonus_per_1000_views: number;
  default_bonus_per_registrant: number;
  default_views_bonus_cap: number | null;
};

export type AssignmentFeeOverrides = {
  base_fee: number | null;
  bonus_per_1000_views: number | null;
  bonus_per_registrant: number | null;
  views_bonus_cap: number | null;
};

export type EffectiveFeeScheme = {
  baseFee: number;
  bonusPer1000Views: number;
  bonusPerRegistrant: number;
  /** null means the views bonus has no cap. */
  viewsBonusCap: number | null;
  /** Which values come from the assignment rather than the campaign default. */
  overridden: {
    baseFee: boolean;
    bonusPer1000Views: boolean;
    bonusPerRegistrant: boolean;
    viewsBonusCap: boolean;
  };
};

export function effectiveFeeScheme(
  assignment: AssignmentFeeOverrides,
  campaign: CampaignFeeDefaults,
): EffectiveFeeScheme {
  return {
    baseFee: assignment.base_fee ?? campaign.default_base_fee,
    bonusPer1000Views: assignment.bonus_per_1000_views ?? campaign.default_bonus_per_1000_views,
    bonusPerRegistrant: assignment.bonus_per_registrant ?? campaign.default_bonus_per_registrant,
    viewsBonusCap: assignment.views_bonus_cap ?? campaign.default_views_bonus_cap,
    overridden: {
      baseFee: assignment.base_fee !== null,
      bonusPer1000Views: assignment.bonus_per_1000_views !== null,
      bonusPerRegistrant: assignment.bonus_per_registrant !== null,
      viewsBonusCap: assignment.views_bonus_cap !== null,
    },
  };
}
