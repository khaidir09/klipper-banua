import type { CampaignRow } from "@/lib/data/campaigns";
import { formatAmountDigits } from "@/lib/format/currency";
import type { CampaignFormInput } from "@/lib/validation/campaigns";

/** Maps a stored campaign onto the edit form's text fields. */
export function campaignToFormValues(campaign: CampaignRow): CampaignFormInput {
  const amount = (value: number | null) => (value === null ? "" : formatAmountDigits(value));
  return {
    client_id: campaign.client_id,
    code: campaign.code,
    name: campaign.name,
    objective: campaign.objective,
    brief: campaign.brief,
    must_do: campaign.must_do.join("\n"),
    must_not: campaign.must_not.join("\n"),
    hashtags: campaign.hashtags.join(" "),
    paid_label_required: campaign.paid_label_required,
    landing_url: campaign.landing_url ?? "",
    start_date: campaign.start_date,
    end_date: campaign.end_date,
    min_live_days: String(campaign.min_live_days),
    package_price: amount(campaign.package_price),
    target_contents: String(campaign.target_contents),
    target_views: amount(campaign.target_views),
    target_registrants: String(campaign.target_registrants),
    default_base_fee: amount(campaign.default_base_fee),
    default_bonus_per_1000_views: amount(campaign.default_bonus_per_1000_views),
    default_bonus_per_registrant: amount(campaign.default_bonus_per_registrant),
    default_views_bonus_cap: amount(campaign.default_views_bonus_cap),
  };
}
