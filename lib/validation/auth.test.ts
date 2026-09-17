import { describe, expect, it } from "vitest";
import { passwordSchema, safeNextPath } from "@/lib/validation/auth";

describe("safeNextPath", () => {
  it("keeps relative in-app paths", () => {
    expect(safeNextPath("/campaigns/123")).toBe("/campaigns/123");
  });

  it("falls back to the dashboard for missing values", () => {
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath("")).toBe("/dashboard");
  });

  it("rejects absolute and protocol-relative URLs", () => {
    expect(safeNextPath("https://evil.example")).toBe("/dashboard");
    expect(safeNextPath("//evil.example")).toBe("/dashboard");
  });

  it("avoids redirect loops back to the auth routes", () => {
    expect(safeNextPath("/login?next=/x")).toBe("/dashboard");
    expect(safeNextPath("/keluar")).toBe("/dashboard");
  });
});

describe("passwordSchema", () => {
  it("accepts a password that meets every requirement", () => {
    expect(passwordSchema.safeParse("RahasiaKuat1").success).toBe(true);
  });

  it("rejects passwords that are too short or incomplete", () => {
    expect(passwordSchema.safeParse("Ab1").success).toBe(false);
    expect(passwordSchema.safeParse("semuahurufkecil1").success).toBe(false);
    expect(passwordSchema.safeParse("TanpaAngkaSamaSekali").success).toBe(false);
  });
});
