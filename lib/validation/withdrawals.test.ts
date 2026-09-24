import { describe, expect, it } from "vitest";
import {
  balanceAdjustmentSchema,
  minWithdrawalSchema,
  portalBankAccountSchema,
  withdrawalProcessSchema,
  withdrawalRequestSchema,
} from "./withdrawals";

const id = "11111111-1111-4111-8111-111111111111";

describe("portalBankAccountSchema (FR-M19-04)", () => {
  it("accepts a listed bank and strips separators from the number", () => {
    const parsed = portalBankAccountSchema.parse({
      bank_name: "DANA",
      account_number: "0812-3456 7890",
      account_holder: "Rina Aulia",
    });
    expect(parsed.account_number).toBe("081234567890");
  });

  it("refuses a bank outside the list", () => {
    expect(
      portalBankAccountSchema.safeParse({
        bank_name: "Bank Antah",
        account_number: "12345678",
        account_holder: "x",
      }).success,
    ).toBe(false);
  });
});

describe("withdrawalRequestSchema", () => {
  it("reads Indonesian thousand separators", () => {
    expect(withdrawalRequestSchema.parse({ amount: "150.000" }).amount).toBe(150_000);
    expect(withdrawalRequestSchema.safeParse({ amount: "" }).success).toBe(false);
  });
});

describe("withdrawalProcessSchema (FR-M19-06)", () => {
  it("needs the date and proof to mark paid, a reason to reject", () => {
    expect(
      withdrawalProcessSchema.safeParse({
        status: "dibayar",
        withdrawal_id: id,
        paid_at: "",
        proof_path: "",
      }).success,
    ).toBe(false);
    expect(
      withdrawalProcessSchema.safeParse({
        status: "dibayar",
        withdrawal_id: id,
        paid_at: "2026-10-10",
        proof_path: "withdrawals/x.png",
      }).success,
    ).toBe(true);
    expect(
      withdrawalProcessSchema.safeParse({ status: "ditolak", withdrawal_id: id, reason: " " })
        .success,
    ).toBe(false);
  });

  it("records the transfer fee the klipper bears; empty means none", () => {
    const paid = (transfer_fee: string) =>
      withdrawalProcessSchema.parse({
        status: "dibayar",
        withdrawal_id: id,
        paid_at: "2026-10-10",
        proof_path: "withdrawals/x.png",
        transfer_fee,
      });
    expect(paid("2.500")).toMatchObject({ transfer_fee: 2_500 });
    expect(paid("")).toMatchObject({ transfer_fee: 0 });
  });
});

describe("balanceAdjustmentSchema", () => {
  it("takes signed amounts and refuses zero", () => {
    expect(
      balanceAdjustmentSchema.parse({ creator_id: id, amount: "-50.000", reason: "x" }).amount,
    ).toBe(-50_000);
    expect(
      balanceAdjustmentSchema.safeParse({ creator_id: id, amount: "0", reason: "x" }).success,
    ).toBe(false);
    expect(
      balanceAdjustmentSchema.safeParse({ creator_id: id, amount: "10.000", reason: "" }).success,
    ).toBe(false);
  });
});

describe("minWithdrawalSchema", () => {
  it("keeps the minimum within the database bounds", () => {
    expect(minWithdrawalSchema.parse({ min_withdrawal: "100.000" }).min_withdrawal).toBe(100_000);
    expect(minWithdrawalSchema.safeParse({ min_withdrawal: "5.000" }).success).toBe(false);
  });
});
