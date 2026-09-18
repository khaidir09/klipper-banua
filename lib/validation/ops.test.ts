import { describe, expect, it } from "vitest";
import { closingNotesSchema } from "@/lib/validation/campaigns";
import { opsTimeLogSchema } from "@/lib/validation/ops";

const valid = {
  activity: "rekap_metrik",
  minutes: "90",
  log_date: "2026-10-20",
  notes: " rekap H+7 ",
};

describe("operational time log schema (FR-M12-01)", () => {
  it("coerces minutes and trims notes, and accepts its own output", () => {
    const once = opsTimeLogSchema.parse(valid);
    expect(once).toEqual({
      activity: "rekap_metrik",
      minutes: 90,
      log_date: "2026-10-20",
      notes: "rekap H+7",
    });
    expect(opsTimeLogSchema.parse(once)).toEqual(once);
  });

  it("rejects empty, fractional, zero and over-a-day durations", () => {
    for (const minutes of ["", "1.5", "0", "1441"]) {
      expect(opsTimeLogSchema.safeParse({ ...valid, minutes }).success).toBe(false);
    }
    expect(opsTimeLogSchema.safeParse({ ...valid, minutes: "1440" }).success).toBe(true);
  });

  it("rejects unknown activities and missing dates", () => {
    expect(opsTimeLogSchema.safeParse({ ...valid, activity: "rapat" }).success).toBe(false);
    expect(opsTimeLogSchema.safeParse({ ...valid, log_date: "" }).success).toBe(false);
  });
});

describe("closing notes schema (FR-M9-02)", () => {
  const id = "3f6f2a57-6f5d-4f0f-9d8a-2a8a2f0b8c11";

  it("allows empty notes and caps the length", () => {
    expect(closingNotesSchema.parse({ id, closing_notes: "  " }).closing_notes).toBe("");
    expect(closingNotesSchema.safeParse({ id, closing_notes: "x".repeat(5001) }).success).toBe(
      false,
    );
  });
});
