import { describe, expect, it } from "vitest";
import { totalContractValue } from "@/lib/calculations/contract";

describe("totalContractValue (FR-M2-03)", () => {
  it("sums package prices across statuses except cancelled", () => {
    expect(
      totalContractValue([
        { status: "draft", package_price: 5_000_000 },
        { status: "aktif", package_price: 15_000_000 },
        { status: "selesai", package_price: 10_000_000 },
        { status: "dibatalkan", package_price: 8_000_000 },
      ]),
    ).toBe(30_000_000);
  });

  it("is zero without campaigns", () => {
    expect(totalContractValue([])).toBe(0);
  });
});
