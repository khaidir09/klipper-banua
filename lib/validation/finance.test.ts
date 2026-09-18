import { describe, expect, it } from "vitest";
import {
  adjustmentSchema,
  clientPaymentReceiptSchema,
  clientPaymentSchema,
  markPaidSchema,
} from "@/lib/validation/finance";
import { parseSignedRupiah } from "@/lib/validation/money";

describe("parseSignedRupiah", () => {
  it("reads negative and positive whole amounts", () => {
    expect(parseSignedRupiah("-50.000")).toBe(-50_000);
    expect(parseSignedRupiah("+ 25.000")).toBe(25_000);
    expect(parseSignedRupiah("Rp 10.000")).toBe(10_000);
    expect(parseSignedRupiah(-7)).toBe(-7);
  });

  it("rejects fractions and garbage", () => {
    expect(parseSignedRupiah("-1.500,50")).toBeNull();
    expect(parseSignedRupiah("--5")).toBeNull();
    expect(parseSignedRupiah(1.5)).toBeNull();
  });
});

describe("adjustmentSchema (FR-M8-02)", () => {
  it("requires a reason for a non-zero adjustment", () => {
    const result = adjustmentSchema.safeParse({
      adjustment_amount: "-50.000",
      adjustment_reason: " ",
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["adjustment_reason"]);
  });

  it("accepts a negative adjustment with a reason and a zero one without", () => {
    expect(
      adjustmentSchema.parse({
        adjustment_amount: "-50.000",
        adjustment_reason: "Terlambat posting",
      }).adjustment_amount,
    ).toBe(-50_000);
    expect(
      adjustmentSchema.parse({ adjustment_amount: "", adjustment_reason: "" }).adjustment_amount,
    ).toBe(0);
  });

  it("is idempotent for server re-validation", () => {
    const once = adjustmentSchema.parse({ adjustment_amount: "-50.000", adjustment_reason: "x" });
    expect(adjustmentSchema.parse(once)).toEqual(once);
  });
});

describe("markPaidSchema (FR-M8-03)", () => {
  it("needs both the payment date and the transfer proof", () => {
    expect(
      markPaidSchema.safeParse({ paid_at: "2026-11-05", transfer_proof_path: "" }).success,
    ).toBe(false);
    expect(markPaidSchema.safeParse({ paid_at: "", transfer_proof_path: "x/t.pdf" }).success).toBe(
      false,
    );
    expect(
      markPaidSchema.safeParse({ paid_at: "2026-11-05", transfer_proof_path: "x/t.pdf" }).success,
    ).toBe(true);
  });
});

describe("client payment schemas (FR-M8-05)", () => {
  it("normalises the invoice number and parses the amount", () => {
    const parsed = clientPaymentSchema.parse({
      invoice_number: " inv-2026-001 ",
      amount: "15.000.000",
      due_date: "2026-11-15",
    });
    expect(parsed).toEqual({
      invoice_number: "INV-2026-001",
      amount: 15_000_000,
      due_date: "2026-11-15",
    });
    expect(clientPaymentSchema.parse(parsed)).toEqual(parsed);
  });

  it("rejects a zero invoice", () => {
    expect(
      clientPaymentSchema.safeParse({ invoice_number: "X", amount: "0", due_date: "2026-11-15" })
        .success,
    ).toBe(false);
  });

  it("requires a date when money was received", () => {
    expect(
      clientPaymentReceiptSchema.safeParse({
        paid_amount: "5.000.000",
        paid_at: "",
        proof_path: "",
      }).success,
    ).toBe(false);
    const once = clientPaymentReceiptSchema.parse({
      paid_amount: "5.000.000",
      paid_at: "2026-11-10",
      proof_path: "",
    });
    expect(once).toEqual({ paid_amount: 5_000_000, paid_at: "2026-11-10", proof_path: null });
    expect(clientPaymentReceiptSchema.parse(once)).toEqual(once);
  });
});
