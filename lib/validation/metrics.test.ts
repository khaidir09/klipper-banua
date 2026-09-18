import { describe, expect, it } from "vitest";
import { registrantReportSchema, snapshotSchema } from "@/lib/validation/metrics";

const content = "3f6f2a57-6f5d-4f0f-9d8a-2a8a2f0b8c11";

describe("snapshotSchema (FR-M7-01)", () => {
  const valid = {
    content_id: content,
    checkpoint: "H+1",
    captured_at: "2026-10-06T10:00",
    views: "12.500",
    likes: "830",
    comments: "",
    shares: "12",
    saves: "40",
    proof_path: `${content}/bukti.png`,
  };

  it("parses counts typed with thousand separators", () => {
    const result = snapshotSchema.parse(valid);
    expect(result.views).toBe(12500);
    expect(result.comments).toBe(0);
  });

  it("requires the proof screenshot", () => {
    expect(snapshotSchema.safeParse({ ...valid, proof_path: "" }).success).toBe(false);
  });

  it("rejects negative or fractional counts", () => {
    expect(snapshotSchema.safeParse({ ...valid, views: "-5" }).success).toBe(false);
    expect(snapshotSchema.safeParse({ ...valid, views: "12,5" }).success).toBe(false);
  });

  it("is idempotent for server re-validation", () => {
    const once = snapshotSchema.parse(valid);
    expect(snapshotSchema.parse(once)).toEqual(once);
  });
});

describe("registrantReportSchema (FR-M7-04)", () => {
  const valid = {
    campaign_creator_id: content,
    period_start: "2026-10-01",
    period_end: "2026-10-07",
    registrant_count: "12",
    proof_path: "",
    proof_confirmed_no_personal_data: false,
    notes: "",
  };

  it("accepts an aggregate count and treats an empty code as 'tanpa kode'", () => {
    expect(registrantReportSchema.parse(valid).registrant_count).toBe(12);
    expect(
      registrantReportSchema.parse({ ...valid, campaign_creator_id: "" }).campaign_creator_id,
    ).toBeNull();
  });

  it("requires the no-personal-data confirmation when a proof is attached", () => {
    const result = registrantReportSchema.safeParse({ ...valid, proof_path: "x/rekap.pdf" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["proof_confirmed_no_personal_data"]);
    }
    expect(
      registrantReportSchema.safeParse({
        ...valid,
        proof_path: "x/rekap.pdf",
        proof_confirmed_no_personal_data: true,
      }).success,
    ).toBe(true);
  });

  it("has no field for registrant personal data", () => {
    const parsed = registrantReportSchema.parse({
      ...valid,
      nama: "Budi",
      nik: "6371...",
    } as never);
    expect(Object.keys(parsed)).not.toContain("nama");
    expect(Object.keys(parsed)).not.toContain("nik");
  });

  it("rejects an inverted period", () => {
    expect(registrantReportSchema.safeParse({ ...valid, period_end: "2026-09-30" }).success).toBe(
      false,
    );
  });

  it("is idempotent for server re-validation", () => {
    const once = registrantReportSchema.parse({ ...valid, campaign_creator_id: "" });
    expect(registrantReportSchema.parse(once)).toEqual(once);
  });
});
