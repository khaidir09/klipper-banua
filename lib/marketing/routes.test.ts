import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isMarketingPath,
  INDEXED_PATHS,
  isPrivatePath,
  MARKETING_FILES,
  MARKETING_PATHS,
  PRIVATE_PREFIXES,
  SIGNUP_PATH,
} from "@/lib/marketing/routes";

const MARKETING_DIR = join(process.cwd(), "app", "(marketing)");

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry) ? [path] : [];
  });
}

describe("marketing paths", () => {
  it("recognises every public page and nothing else", () => {
    for (const path of MARKETING_PATHS) {
      expect(isMarketingPath(path)).toBe(true);
    }

    expect(isMarketingPath("/dashboard")).toBe(false);
    expect(isMarketingPath("/kreator/rahasia")).toBe(false);
  });

  it("treats the crawler files as public too", () => {
    for (const file of MARKETING_FILES) {
      expect(isMarketingPath(file)).toBe(true);
      expect(isPrivatePath(file)).toBe(false);
    }
  });

  it("never collides with an area that requires a session (FR-M15-08)", () => {
    for (const path of MARKETING_PATHS) {
      expect(isPrivatePath(path)).toBe(false);
    }
  });

  it("indexes the kliper registration without treating it as static (v4.0)", () => {
    expect(INDEXED_PATHS).toContain(SIGNUP_PATH);
    expect(isPrivatePath(SIGNUP_PATH)).toBe(false);
    // The proxy must still read the session on /daftar to send members home.
    expect(isMarketingPath(SIGNUP_PATH)).toBe(false);
  });

  it("treats a private prefix and everything under it as private", () => {
    expect(isPrivatePath("/portal")).toBe(true);
    expect(isPrivatePath("/klien/kampanye/abc")).toBe(true);
    expect(isPrivatePath("/r/abc123")).toBe(true);
    expect(isPrivatePath("/api/reminders/due-snapshots")).toBe(true);
  });

  it("does not mistake a public page for a private one by prefix", () => {
    // `/kreator` is public; `/creators` is the internal page. One must not
    // shadow the other.
    expect(PRIVATE_PREFIXES).toContain("/creators");
    expect(isPrivatePath("/kreator")).toBe(false);
  });
});

describe("marketing pages stay session-free (FR-M15-05, FR-M15-09, aturan keamanan M15)", () => {
  const files = sourceFiles(MARKETING_DIR);

  it("finds the public pages", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(["@/lib/supabase", "@/lib/auth", "@/lib/env.server", "server-only", "next/headers"])(
    "never imports %s",
    (forbidden) => {
      const offenders = files.filter((file) => readFileSync(file, "utf8").includes(forbidden));

      expect(offenders).toEqual([]);
    },
  );

  it("reads campaigns only through the anon catalog loader", () => {
    const loader = readFileSync(join(process.cwd(), "lib", "marketing", "campaigns.ts"), "utf8");

    for (const forbidden of ["@/lib/supabase", "@/lib/auth", "@/lib/env.server", "next/headers"]) {
      expect(loader).not.toContain(forbidden);
    }
    expect(loader).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(loader).toContain('.from("public_campaign_catalog")');
  });
});
