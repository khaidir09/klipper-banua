import { describe, expect, it } from "vitest";
import { dbRuleMessage } from "@/lib/actions";

describe("dbRuleMessage", () => {
  it("maps trigger keys", () => {
    expect(
      dbRuleMessage({ message: "REVIEW_NOT_PENDING: only content waiting for review" }, "x"),
    ).toContain("sudah direview");
  });

  it("maps named check constraints", () => {
    expect(
      dbRuleMessage(
        {
          message:
            'new row for relation "contents" violates check constraint "contents_posted_requires_approval"',
        },
        "x",
      ),
    ).toContain("sudah disetujui");
  });

  it("falls back for anything else", () => {
    expect(dbRuleMessage({ message: "connection reset" }, "Gagal.")).toBe("Gagal.");
    expect(dbRuleMessage(null, "Gagal.")).toBe("Gagal.");
  });
});
