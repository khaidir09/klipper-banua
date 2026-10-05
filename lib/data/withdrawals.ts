import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { balanceSummary, type BalanceSummary } from "@/lib/calculations/balance";
import { FINANCE_PROOF_BUCKET } from "@/lib/constants/finance";
import {
  DEFAULT_MIN_WITHDRAWAL,
  type LedgerEntryType,
  type WithdrawalStatus,
} from "@/lib/constants/withdrawals";
import type { WithdrawalListQuery } from "@/lib/validation/withdrawals";
import type { Database } from "@/types/database";

/**
 * Team reads for balances and withdrawals (PRD M19). `withdrawals` is
 * owner-only under RLS, so a manager simply gets no rows; the ledger is read
 * by both roles.
 */

type Supabase = SupabaseClient<Database>;

const PROOF_URL_SECONDS = 10 * 60;

/** Pengaturan → Penarikan; falls back to the default if the row is missing. */
export async function getMinWithdrawal(supabase: Supabase): Promise<number> {
  const { data, error } = await supabase.rpc("current_min_withdrawal");
  if (error) throw new Error(error.message);
  return Number(data ?? DEFAULT_MIN_WITHDRAWAL);
}

export type WithdrawalRow = {
  id: string;
  creatorId: string;
  creatorName: string;
  stageName: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  /** The creator's current account holder name matches their full name. */
  holderMatchesName: boolean;
  status: WithdrawalStatus;
  requestedAt: string;
  processedAt: string | null;
  paidAt: string | null;
  rejectionReason: string | null;
  /** Borne by the kliper; the transfer is amount − fee. */
  transferFee: number;
  proofUrl: string | null;
};

/** FR-M19-08: the owner's queue. Oldest first while open, newest first after. */
export async function listWithdrawals(
  supabase: Supabase,
  query: WithdrawalListQuery,
  timezoneOffsetDates?: { from?: string; to?: string },
): Promise<WithdrawalRow[]> {
  let request = supabase
    .from("withdrawals")
    .select(
      `id, creator_id, amount, bank_name, account_number, account_holder, status,
       requested_at, processed_at, paid_at, rejection_reason, transfer_proof_path, transfer_fee,
       creator:creators!inner(full_name, stage_name, bank:creator_bank_accounts(holder_matches_name))`,
    )
    .order("requested_at", {
      ascending: query.status === "diajukan" || query.status === "diproses",
    });

  if (query.status !== "semua") request = request.eq("status", query.status);
  if (timezoneOffsetDates?.from) request = request.gte("requested_at", timezoneOffsetDates.from);
  if (timezoneOffsetDates?.to) request = request.lt("requested_at", timezoneOffsetDates.to);

  const { data, error } = await request;
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  const paths = rows.map((row) => row.transfer_proof_path).filter((path): path is string => !!path);
  const signed = new Map<string, string>();
  if (paths.length) {
    const { data: urls } = await supabase.storage
      .from(FINANCE_PROOF_BUCKET)
      .createSignedUrls(paths, PROOF_URL_SECONDS);
    for (const entry of urls ?? []) {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    }
  }

  return rows.map((row) => {
    const bank = Array.isArray(row.creator.bank) ? row.creator.bank[0] : row.creator.bank;
    return {
      id: row.id,
      creatorId: row.creator_id,
      creatorName: row.creator.full_name,
      stageName: row.creator.stage_name,
      amount: Number(row.amount),
      bankName: row.bank_name,
      accountNumber: row.account_number,
      accountHolder: row.account_holder,
      holderMatchesName: bank?.holder_matches_name ?? true,
      status: row.status,
      requestedAt: row.requested_at,
      processedAt: row.processed_at,
      paidAt: row.paid_at,
      rejectionReason: row.rejection_reason,
      transferFee: Number(row.transfer_fee),
      proofUrl: row.transfer_proof_path ? (signed.get(row.transfer_proof_path) ?? null) : null,
    };
  });
}

/** Withdrawals waiting for the owner (FR-M10-01). Zero for a manager (RLS). */
export async function countOpenWithdrawals(supabase: Supabase): Promise<number> {
  const { count, error } = await supabase
    .from("withdrawals")
    .select("id", { count: "exact", head: true })
    .in("status", ["diajukan", "diproses"]);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export type CreatorLedgerLine = {
  id: string;
  entryType: LedgerEntryType;
  amount: number;
  campaignName: string | null;
  notes: string;
  createdAt: string;
};

/** FR-M3-08: a kliper's balance for the team, with the ledger behind it. */
export async function getCreatorBalance(
  supabase: Supabase,
  creatorId: string,
): Promise<{ summary: BalanceSummary; lines: CreatorLedgerLine[] }> {
  const { data, error } = await supabase
    .from("creator_ledger_entries")
    .select("id, entry_type, amount, notes, created_at, campaign:campaigns(name)")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const lines = (data ?? []).map((row) => ({
    id: row.id,
    entryType: row.entry_type,
    amount: Number(row.amount),
    campaignName: row.campaign?.name ?? null,
    notes: row.notes,
    createdAt: row.created_at,
  }));
  return {
    summary: balanceSummary(
      lines.map((line) => ({ entryType: line.entryType, amount: line.amount })),
    ),
    lines,
  };
}

/** FR-M3-08: one kliper's withdrawals, for the owner (RLS: empty for a manager). */
export async function listCreatorWithdrawals(supabase: Supabase, creatorId: string) {
  const { data, error } = await supabase
    .from("withdrawals")
    .select("id, amount, bank_name, status, requested_at, paid_at, rejection_reason")
    .eq("creator_id", creatorId)
    .order("requested_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, amount: Number(row.amount) }));
}

export type CreatorClipStats = {
  approved: number;
  rejected: number;
  verifiedViews: number;
};

/** FR-M3-08: clip counts and verified views across campaigns. */
export async function getCreatorClipStats(
  supabase: Supabase,
  creatorId: string,
): Promise<CreatorClipStats> {
  const { data, error } = await supabase
    .from("contents")
    .select("review_status, verified_views, assignment:campaign_creators!inner(creator_id)")
    .eq("assignment.creator_id", creatorId)
    .not("posted_url_normalized", "is", null);
  if (error) throw new Error(error.message);

  const rows = data ?? [];
  return {
    approved: rows.filter((row) => row.review_status === "disetujui").length,
    rejected: rows.filter((row) => row.review_status === "ditolak").length,
    verifiedViews: rows
      .filter((row) => row.review_status === "disetujui")
      .reduce((sum, row) => sum + Number(row.verified_views ?? 0), 0),
  };
}
