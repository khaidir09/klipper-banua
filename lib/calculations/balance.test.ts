import { describe, expect, it } from "vitest";
import {
  balanceSummary,
  canReachMinimum,
  withdrawalBlockers,
  type WithdrawalCheckInput,
} from "./balance";

describe("balanceSummary (PRD 8.7, FR-M19-03)", () => {
  it("adds every entry to the available balance", () => {
    const summary = balanceSummary([
      { entryType: "honor_klip", amount: 234_500 },
      { entryType: "honor_klip", amount: 175_500 },
      { entryType: "penarikan", amount: -300_000 },
    ]);
    expect(summary).toEqual({ available: 110_000, totalEarned: 410_000, totalWithdrawn: 300_000 });
  });

  it("gives a refund back and nets it out of the withdrawn total", () => {
    const summary = balanceSummary([
      { entryType: "honor_klip", amount: 200_000 },
      { entryType: "penarikan", amount: -200_000 },
      { entryType: "pengembalian_penarikan", amount: 200_000 },
    ]);
    expect(summary).toEqual({ available: 200_000, totalEarned: 200_000, totalWithdrawn: 0 });
  });

  it("goes negative after a cancellation that follows a withdrawal", () => {
    const summary = balanceSummary([
      { entryType: "honor_klip", amount: 100_000 },
      { entryType: "penarikan", amount: -100_000 },
      { entryType: "pembatalan", amount: -100_000 },
    ]);
    expect(summary.available).toBe(-100_000);
    expect(summary.totalEarned).toBe(0);
  });

  it("counts owner adjustments as earnings", () => {
    expect(balanceSummary([{ entryType: "penyesuaian", amount: -25_000 }]).totalEarned).toBe(
      -25_000,
    );
  });
});

describe("withdrawalBlockers (FR-M19-05)", () => {
  const now = new Date("2026-10-10T00:00:00Z");
  const ok: WithdrawalCheckInput = {
    creatorBlocked: false,
    hasBirthDate: true,
    hasBankAccount: true,
    bankHoldUntil: null,
    openWithdrawalStatuses: [],
    amount: 150_000,
    available: 200_000,
    minWithdrawal: 100_000,
    now,
  };

  it("allows a valid request", () => {
    expect(withdrawalBlockers(ok)).toEqual([]);
  });

  it("refuses until the birth date is filled in (FR-M3-02)", () => {
    expect(withdrawalBlockers({ ...ok, hasBirthDate: false })).toEqual(["no_birth_date"]);
  });

  it("allows exactly the minimum and exactly the balance", () => {
    expect(withdrawalBlockers({ ...ok, amount: 100_000 })).toEqual([]);
    expect(withdrawalBlockers({ ...ok, amount: 200_000 })).toEqual([]);
  });

  it("refuses below the minimum and above the balance", () => {
    expect(withdrawalBlockers({ ...ok, amount: 99_999 })).toEqual(["below_minimum"]);
    expect(withdrawalBlockers({ ...ok, amount: 200_001 })).toEqual(["above_balance"]);
  });

  it("holds requests for 24 hours after a bank change", () => {
    expect(withdrawalBlockers({ ...ok, bankHoldUntil: new Date("2026-10-10T05:00:00Z") })).toEqual([
      "bank_recently_changed",
    ]);
    expect(withdrawalBlockers({ ...ok, bankHoldUntil: new Date("2026-10-09T23:00:00Z") })).toEqual(
      [],
    );
  });

  it("allows one open withdrawal only", () => {
    expect(withdrawalBlockers({ ...ok, openWithdrawalStatuses: ["diproses"] })).toEqual([
      "withdrawal_in_progress",
    ]);
    expect(withdrawalBlockers({ ...ok, openWithdrawalStatuses: ["dibayar", "ditolak"] })).toEqual(
      [],
    );
  });

  it("refuses a blocked kliper and a missing bank account", () => {
    expect(withdrawalBlockers({ ...ok, creatorBlocked: true, hasBankAccount: false })).toEqual([
      "creator_blocked",
      "no_bank_account",
    ]);
  });

  it("refuses anything while the balance is negative", () => {
    expect(withdrawalBlockers({ ...ok, available: -50_000 })).toContain("above_balance");
  });
});

describe("canReachMinimum", () => {
  it("compares the balance with the minimum", () => {
    expect(canReachMinimum(99_999, 100_000)).toBe(false);
    expect(canReachMinimum(100_000, 100_000)).toBe(true);
  });
});
