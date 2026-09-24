import { describe, expect, it } from "vitest";
import { withdrawalsCsv } from "./withdrawals-csv";

describe("withdrawalsCsv (FR-M19-08)", () => {
  it("writes one row per withdrawal with the full account for the transfer", () => {
    const csv = withdrawalsCsv(
      [
        {
          requestedAt: "2026-10-10T02:00:00Z",
          creatorName: "Rina Aulia",
          stageName: "rina.kuliner",
          bankName: "Bank Kalsel",
          accountNumber: "0012345601",
          accountHolder: "Rina Aulia",
          holderMatchesName: true,
          amount: 234_500,
          transferFee: 2_500,
          status: "diproses",
          paidAt: null,
        },
      ],
      "Asia/Makassar",
    );
    const [header, row] = csv.replace(/^﻿/, "").split("\r\n");
    expect(header).toContain("Nomor rekening");
    expect(row).toBe(
      "10 Okt 2026, 10.00 WITA;Rina Aulia;rina.kuliner;Bank Kalsel;0012345601;Rina Aulia;Ya;234500;2500;232000;Diproses;",
    );
  });
});
