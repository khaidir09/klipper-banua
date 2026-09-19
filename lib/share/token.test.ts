import { describe, expect, it } from "vitest";
import { generateShareToken, hashShareToken, isShareTokenFormat, secretsEqual } from "./token";

describe("share tokens", () => {
  it("generates 43-character base64url tokens that differ every time", () => {
    const tokens = new Set(Array.from({ length: 50 }, generateShareToken));
    expect(tokens.size).toBe(50);
    for (const token of tokens) expect(isShareTokenFormat(token)).toBe(true);
  });

  it("rejects anything that is not a generated token", () => {
    expect(isShareTokenFormat("")).toBe(false);
    expect(isShareTokenFormat("short")).toBe(false);
    expect(isShareTokenFormat(`${"a".repeat(42)}=`)).toBe(false);
    expect(isShareTokenFormat(`${"a".repeat(42)}/`)).toBe(false);
    expect(isShareTokenFormat("a".repeat(44))).toBe(false);
  });

  it("hashes to the lowercase hex form the database checks", () => {
    const hash = hashShareToken("abc");
    expect(hash).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hashShareToken(generateShareToken())).not.toBe(hashShareToken(generateShareToken()));
  });
});

describe("secretsEqual", () => {
  it("matches only the exact secret", () => {
    expect(secretsEqual("s3cret-token", "s3cret-token")).toBe(true);
    expect(secretsEqual("s3cret-token ", "s3cret-token")).toBe(false);
    expect(secretsEqual("", "s3cret-token")).toBe(false);
    expect(secretsEqual("x".repeat(500), "s3cret-token")).toBe(false);
  });
});
