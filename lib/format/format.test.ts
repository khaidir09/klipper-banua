import { describe, expect, it } from "vitest";
import { formatAmountDigits, formatRupiah, toBigInt } from "@/lib/format/currency";
import { formatNumber, formatPercent } from "@/lib/format/number";
import { formatDate, formatDateInput, formatDateTime, formatTime } from "@/lib/format/date";
import { DEFAULT_TIMEZONE, resolveTimezone, timezoneLabel } from "@/lib/format/timezone";

describe("formatRupiah", () => {
  it("formats whole Rupiah with dot separators", () => {
    expect(formatRupiah(1_500_000n)).toBe("Rp 1.500.000");
  });

  it("formats zero", () => {
    expect(formatRupiah(0n)).toBe("Rp 0");
  });

  it("formats negative adjustments", () => {
    expect(formatRupiah(-250_000n)).toBe("Rp -250.000");
  });

  it("keeps large bigint amounts exact", () => {
    // Beyond Number.MAX_SAFE_INTEGER: must not lose precision.
    expect(formatAmountDigits(9_007_199_254_740_993n)).toBe("9.007.199.254.740.993");
  });

  it("accepts numeric strings from JSON payloads", () => {
    expect(formatRupiah("2500000")).toBe("Rp 2.500.000");
  });

  it("truncates fractions instead of rounding money up", () => {
    expect(toBigInt(1999.9)).toBe(1999n);
    expect(toBigInt(-1999.9)).toBe(-1999n);
  });

  it("rejects values that are not whole amounts", () => {
    expect(() => formatRupiah("1.500,00")).toThrow(TypeError);
    expect(() => formatRupiah(Number.NaN)).toThrow(TypeError);
  });
});

describe("formatNumber", () => {
  it("separates thousands with dots", () => {
    expect(formatNumber(1_250_000)).toBe("1.250.000");
  });

  it("formats percentages with one decimal", () => {
    expect(formatPercent(62.55)).toBe("62,6%");
    expect(formatPercent(0)).toBe("0,0%");
  });

  it("falls back to a placeholder when a percentage cannot be computed", () => {
    expect(formatPercent(Number.POSITIVE_INFINITY)).toBe("–");
  });
});

describe("date formatting", () => {
  // 2026-09-17T16:30:00Z is already 18 Sep in WITA (+08) but still 17 Sep in WIB (+07).
  const nightUtc = "2026-09-17T16:30:00Z";

  it("renders short dates in Indonesian", () => {
    expect(formatDate("2026-09-17T02:00:00Z")).toBe("17 Sep 2026");
  });

  it("uses WITA by default", () => {
    expect(formatDate(nightUtc)).toBe("18 Sep 2026");
    expect(formatTime(nightUtc)).toBe("00.30");
  });

  it("shifts the calendar day for WIB users", () => {
    expect(formatDate(nightUtc, "Asia/Jakarta")).toBe("17 Sep 2026");
    expect(formatTime(nightUtc, "Asia/Jakarta")).toBe("23.30");
  });

  it("appends the timezone label to timestamps", () => {
    expect(formatDateTime(nightUtc)).toBe("18 Sep 2026, 00.30 WITA");
    expect(formatDateTime(nightUtc, "Asia/Jakarta")).toBe("17 Sep 2026, 23.30 WIB");
  });

  it("formats date inputs in the display timezone", () => {
    expect(formatDateInput(nightUtc)).toBe("2026-09-18");
    expect(formatDateInput(nightUtc, "Asia/Jakarta")).toBe("2026-09-17");
  });

  it("rejects invalid dates", () => {
    expect(() => formatDate("not-a-date")).toThrow(TypeError);
  });
});

describe("resolveTimezone", () => {
  it("falls back to WITA for unknown or missing values", () => {
    expect(resolveTimezone(null)).toBe(DEFAULT_TIMEZONE);
    expect(resolveTimezone("Europe/Berlin")).toBe(DEFAULT_TIMEZONE);
    expect(timezoneLabel(null)).toBe("WITA");
  });

  it("keeps a supported timezone", () => {
    expect(resolveTimezone("Asia/Jakarta")).toBe("Asia/Jakarta");
  });
});
