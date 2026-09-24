import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { contentViews, totalRegistrants, totalViews } from "@/lib/calculations/campaign-metrics";
import { effectiveFeeScheme } from "@/lib/calculations/fee-scheme";
import { campaignFinance } from "@/lib/calculations/finance";
import {
  calculatePayout,
  type PayoutCalculation,
  type PayoutContentInput,
} from "@/lib/calculations/payout";
import { FINANCE_PROOF_BUCKET } from "@/lib/constants/finance";
import type { Database, Json } from "@/types/database";

type Supabase = SupabaseClient<Database>;
type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];
export type PayoutRow = Database["public"]["Tables"]["payouts"]["Row"];
export type ClientPaymentRow = Database["public"]["Tables"]["client_payments"]["Row"];

const PROOF_URL_SECONDS = 5 * 60;

export type FinanceAssignment = {
  id: string;
  name: string;
  referralCode: string;
  status: Database["public"]["Enums"]["assignment_status"];
  contentsCommitted: number;
  overrides: {
    base_fee: number | null;
    bonus_per_1000_views: number | null;
    bonus_per_registrant: number | null;
    views_bonus_cap: number | null;
  };
};

/**
 * Everything a payout needs, loaded once so the Finance tab preview and the
 * saved payout always come from the same inputs (PRD 8.2, 8.3).
 */
export async function loadPayoutInputs(supabase: Supabase, campaignId: string) {
  const [assignmentsResult, contentsResult, reportsResult] = await Promise.all([
    supabase
      .from("campaign_creators")
      .select(
        "id, status, referral_code, contents_committed, base_fee, bonus_per_1000_views, bonus_per_registrant, views_bonus_cap, creator:creators(full_name, stage_name)",
      )
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: true }),
    supabase
      .from("contents")
      .select(
        "id, campaign_creator_id, platform, review_status, posted_url, posted_at, live_status, removed_at, assignment:campaign_creators!inner(campaign_id), snapshots:metric_snapshots(checkpoint, captured_at, created_at, views)",
      )
      .eq("assignment.campaign_id", campaignId),
    supabase
      .from("registrant_reports")
      .select("campaign_creator_id, registrant_count")
      .eq("campaign_id", campaignId),
  ]);

  for (const result of [assignmentsResult, contentsResult, reportsResult]) {
    if (result.error) throw new Error(result.error.message);
  }

  const assignments: FinanceAssignment[] = (assignmentsResult.data ?? []).map((row) => ({
    id: row.id,
    name: row.creator?.stage_name || row.creator?.full_name || "–",
    referralCode: row.referral_code,
    status: row.status,
    contentsCommitted: row.contents_committed,
    overrides: {
      base_fee: row.base_fee,
      bonus_per_1000_views: row.bonus_per_1000_views,
      bonus_per_registrant: row.bonus_per_registrant,
      views_bonus_cap: row.views_bonus_cap,
    },
  }));

  const contents = (contentsResult.data ?? []).map((row) => ({
    assignmentId: row.campaign_creator_id,
    payoutInput: {
      id: row.id,
      review_status: row.review_status,
      posted_url: row.posted_url,
      posted_at: row.posted_at,
      live_status: row.live_status,
      removed_at: row.removed_at,
      views: contentViews(row.snapshots),
    } satisfies PayoutContentInput,
    posted: row.posted_at !== null,
    platform: row.platform,
    snapshots: row.snapshots,
  }));

  const reports = (reportsResult.data ?? []).map((row) => ({
    assignmentId: row.campaign_creator_id,
    registrant_count: row.registrant_count,
  }));

  return { assignments, contents, reports };
}

export type PayoutInputs = Awaited<ReturnType<typeof loadPayoutInputs>>;

/** Runs the PRD 8.3 calculation for one assignment. */
export function computeAssignmentPayout(
  campaign: Pick<
    CampaignRow,
    | "min_live_days"
    | "default_base_fee"
    | "default_bonus_per_1000_views"
    | "default_bonus_per_registrant"
    | "default_views_bonus_cap"
  >,
  inputs: PayoutInputs,
  assignment: FinanceAssignment,
  adjustmentAmount: number,
): PayoutCalculation {
  return calculatePayout({
    scheme: effectiveFeeScheme(assignment.overrides, campaign),
    contentsCommitted: assignment.contentsCommitted,
    minLiveDays: campaign.min_live_days,
    contents: inputs.contents
      .filter((c) => c.assignmentId === assignment.id)
      .map((c) => c.payoutInput),
    registrantCount: totalRegistrants(
      inputs.reports.filter((r) => r.assignmentId === assignment.id),
    ),
    adjustmentAmount,
  });
}

/** Stored with the payout so every number can be explained later (PRD 7). */
export function calculationSnapshot(
  campaign: Pick<CampaignRow, "min_live_days">,
  assignment: FinanceAssignment,
  scheme: ReturnType<typeof effectiveFeeScheme>,
  calculation: PayoutCalculation,
): Json {
  return {
    calculated_at: new Date().toISOString(),
    scheme: {
      base_fee: scheme.baseFee,
      bonus_per_1000_views: scheme.bonusPer1000Views,
      bonus_per_registrant: scheme.bonusPerRegistrant,
      views_bonus_cap: scheme.viewsBonusCap,
      overridden: scheme.overridden,
    },
    contents_committed: assignment.contentsCommitted,
    min_live_days: campaign.min_live_days,
    eligible_contents: calculation.eligibleContents,
    valid_contents: calculation.validContents,
    total_views: calculation.totalViews,
    views_bonus_raw: calculation.viewsBonusRaw,
    registrant_count: calculation.registrantCount,
    contents: calculation.contents.map((line) => ({
      id: line.id,
      views: line.views,
      eligible: line.eligible,
      reason: line.reason,
      counts_for_base_fee: line.countsForBaseFee,
    })),
  };
}

async function signFinanceProofs(supabase: Supabase, paths: string[]) {
  const signed = new Map<string, string>();
  if (!paths.length) return signed;
  const { data } = await supabase.storage
    .from(FINANCE_PROOF_BUCKET)
    .createSignedUrls(paths, PROOF_URL_SECONDS);
  for (const entry of data ?? []) {
    if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
  }
  return signed;
}

/** FR-M8-01 … FR-M8-06: data for the Finance tab. */
export async function getCampaignFinance(
  supabase: Supabase,
  campaign: CampaignRow,
  isOwner: boolean,
) {
  const [inputs, payoutsResult, paymentsResult] = await Promise.all([
    loadPayoutInputs(supabase, campaign.id),
    supabase
      .from("payouts")
      .select(
        "*, assignment:campaign_creators!inner(campaign_id), approver:profiles!payouts_approved_by_fkey(full_name)",
      )
      .eq("assignment.campaign_id", campaign.id),
    supabase
      .from("client_payments")
      .select("*")
      .eq("campaign_id", campaign.id)
      .order("due_date", { ascending: true }),
  ]);
  if (payoutsResult.error) throw new Error(payoutsResult.error.message);
  if (paymentsResult.error) throw new Error(paymentsResult.error.message);

  const payouts = payoutsResult.data ?? [];
  const payments = paymentsResult.data ?? [];

  // Finance proofs are owner-only; managers never get a link (RLS would refuse anyway).
  const signed = isOwner
    ? await signFinanceProofs(
        supabase,
        [...payouts.map((p) => p.transfer_proof_path), ...payments.map((p) => p.proof_path)].filter(
          (p): p is string => Boolean(p),
        ),
      )
    : new Map<string, string>();

  const rows = inputs.assignments.map((assignment) => {
    const payout = payouts.find((p) => p.campaign_creator_id === assignment.id) ?? null;
    // The preview keeps the stored adjustment so it matches a recalculation.
    const preview = computeAssignmentPayout(
      campaign,
      inputs,
      assignment,
      payout?.adjustment_amount ?? 0,
    );
    return {
      assignment,
      scheme: effectiveFeeScheme(assignment.overrides, campaign),
      preview,
      payout: payout
        ? {
            id: payout.id,
            status: payout.status,
            base_amount: payout.base_amount,
            views_bonus: payout.views_bonus,
            registrant_bonus: payout.registrant_bonus,
            adjustment_amount: payout.adjustment_amount,
            adjustment_reason: payout.adjustment_reason,
            total_amount: payout.total_amount,
            calculated_at: payout.calculated_at,
            approved_at: payout.approved_at,
            approverName: payout.approver?.full_name ?? null,
            paid_at: payout.paid_at,
            proofUrl: payout.transfer_proof_path
              ? (signed.get(payout.transfer_proof_path) ?? null)
              : null,
            /** The stored numbers no longer match the current data. */
            outdated:
              payout.status === "draf" &&
              (payout.base_amount !== preview.baseAmount ||
                payout.views_bonus !== preview.viewsBonus ||
                payout.registrant_bonus !== preview.registrantBonus),
          }
        : null,
    };
  });

  const contentsForTotals = inputs.contents.map((c) => ({
    posted: c.posted,
    snapshots: c.snapshots,
  }));
  // PRD 8.4: a per_views campaign pays from the ledger, within its budget.
  let perViews: { creatorBudget: number; creatorCost: number } | undefined;
  if (campaign.payout_model === "per_views") {
    const { data: cost, error } = await supabase.rpc("campaign_creator_cost", {
      target_campaign_id: campaign.id,
    });
    if (error) throw new Error(error.message);
    perViews = { creatorBudget: Number(campaign.creator_budget), creatorCost: Number(cost ?? 0) };
  }

  const summary = campaignFinance({
    packagePrice: campaign.package_price,
    clientPayments: payments,
    payouts,
    totalViews: totalViews(contentsForTotals),
    totalRegistrants: totalRegistrants(inputs.reports),
    perViews,
  });

  const contentInfo = Object.fromEntries(
    inputs.contents.map((c) => [
      c.payoutInput.id,
      { platform: c.platform, posted_url: c.payoutInput.posted_url },
    ]),
  );

  return {
    summary,
    rows,
    contentInfo,
    payments: payments.map((payment) => ({
      ...payment,
      proofUrl: payment.proof_path ? (signed.get(payment.proof_path) ?? null) : null,
    })),
  };
}
