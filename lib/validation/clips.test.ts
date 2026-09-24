import { describe, expect, it } from "vitest";
import {
  clipCancelSchema,
  clipSubmitSchema,
  clipVerifySchema,
  viewsUpdateVerifySchema,
} from "./clips";

const id = "11111111-1111-4111-8111-111111111111";

describe("clipSubmitSchema (FR-M18-01)", () => {
  const valid = {
    assignment_id: id,
    platform: "tiktok",
    posted_url: "https://www.tiktok.com/@a/video/1",
    posted_at: "2026-10-05T10:00",
    views: "23.450",
    likes: "",
    comments: 0,
    shares: 0,
    proof_path: `${id}/proof.png`,
    code_in_caption: true,
  };

  it("parses a complete clip", () => {
    const parsed = clipSubmitSchema.parse(valid);
    expect(parsed.views).toBe(23_450);
    expect(parsed.likes).toBe(0);
  });

  it("needs the live URL, the screenshot and the caption statement", () => {
    expect(clipSubmitSchema.safeParse({ ...valid, posted_url: "" }).success).toBe(false);
    expect(clipSubmitSchema.safeParse({ ...valid, proof_path: "" }).success).toBe(false);
    expect(clipSubmitSchema.safeParse({ ...valid, code_in_caption: false }).success).toBe(false);
  });

  it("parses its own output again (form → server)", () => {
    const parsed = clipSubmitSchema.parse(valid);
    expect(clipSubmitSchema.parse(parsed)).toEqual(parsed);
  });
});

describe("clipVerifySchema (FR-M18-04)", () => {
  const base = {
    content_id: id,
    checklist: {},
    verified_views: "",
    rejection_reason: "",
    notes: "",
  };

  it("needs verified views to approve", () => {
    expect(clipVerifySchema.safeParse({ ...base, decision: "disetujui" }).success).toBe(false);
    const parsed = clipVerifySchema.parse({
      ...base,
      decision: "disetujui",
      verified_views: "20.000",
    });
    expect(parsed.verified_views).toBe(20_000);
    expect(parsed.rejection_reason).toBeNull();
  });

  it("needs notes for a revision", () => {
    expect(clipVerifySchema.safeParse({ ...base, decision: "revisi" }).success).toBe(false);
    expect(
      clipVerifySchema.safeParse({ ...base, decision: "revisi", notes: "Tambah kode" }).success,
    ).toBe(true);
  });

  it("needs a reason and notes to reject", () => {
    expect(clipVerifySchema.safeParse({ ...base, decision: "ditolak", notes: "x" }).success).toBe(
      false,
    );
    expect(
      clipVerifySchema.safeParse({ ...base, decision: "ditolak", rejection_reason: "duplikat" })
        .success,
    ).toBe(false);
    expect(
      clipVerifySchema.safeParse({
        ...base,
        decision: "ditolak",
        rejection_reason: "duplikat",
        notes: "Sama dengan klip lain",
      }).success,
    ).toBe(true);
  });
});

describe("viewsUpdateVerifySchema (FR-M18-05)", () => {
  it("needs verified views to accept and notes to reject", () => {
    const base = { submission_id: id, verified_views: "", notes: "" };
    expect(viewsUpdateVerifySchema.safeParse({ ...base, accept: true }).success).toBe(false);
    expect(viewsUpdateVerifySchema.safeParse({ ...base, accept: false }).success).toBe(false);
    expect(
      viewsUpdateVerifySchema.safeParse({ ...base, accept: true, verified_views: 41000 }).success,
    ).toBe(true);
  });
});

describe("clipCancelSchema (FR-M18-06, FR-M18-07)", () => {
  it("needs a removal time for a removed clip", () => {
    expect(
      clipCancelSchema.safeParse({ kind: "dihapus", content_id: id, removed_at: "" }).success,
    ).toBe(false);
    expect(
      clipCancelSchema.safeParse({
        kind: "dihapus",
        content_id: id,
        removed_at: "2026-10-05T10:00",
      }).success,
    ).toBe(true);
  });

  it("needs a reason and evidence for fraud", () => {
    expect(
      clipCancelSchema.safeParse({
        kind: "kecurangan",
        content_id: id,
        rejection_reason: "views_tidak_wajar",
        notes: "",
      }).success,
    ).toBe(false);
  });
});
