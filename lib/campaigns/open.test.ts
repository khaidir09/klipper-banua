import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  campaignToday,
  canWithdraw,
  joinBlockers,
  sortCatalog,
  type JoinCheckInput,
} from "@/lib/campaigns/open";
import { activationBlockers, type PerViewsActivationInput } from "@/lib/campaigns/status";
import { CREATOR_TERMS_VERSION } from "@/lib/constants/creators";

const joinable: JoinCheckInput = {
  creator: { status: "aktif", termsVersion: "2026-10", hasLocalBadge: false },
  campaign: {
    status: "aktif",
    access: "terbuka",
    payoutModel: "per_views",
    endDate: "2026-10-31",
    localOnly: false,
    budgetExhausted: false,
  },
  alreadyJoined: false,
  currentTermsVersion: "2026-10",
  today: "2026-10-01",
};

describe("joinBlockers (FR-M17-04)", () => {
  it("lets an active kliper join a running open campaign", () => {
    expect(joinBlockers(joinable)).toEqual([]);
  });

  it("treats the legacy `terverifikasi` status as active", () => {
    expect(
      joinBlockers({ ...joinable, creator: { ...joinable.creator, status: "terverifikasi" } }),
    ).toEqual([]);
  });

  it.each([
    ["prospek", "creator_not_active"],
    ["nonaktif", "creator_not_active"],
    ["diblokir", "creator_not_active"],
  ] as const)("refuses a %s kliper", (status, blocker) => {
    expect(joinBlockers({ ...joinable, creator: { ...joinable.creator, status } })).toEqual([
      blocker,
    ]);
  });

  it("asks for the latest terms", () => {
    expect(
      joinBlockers({ ...joinable, creator: { ...joinable.creator, termsVersion: "v1" } }),
    ).toEqual(["terms_outdated"]);
    expect(
      joinBlockers({ ...joinable, creator: { ...joinable.creator, termsVersion: null } }),
    ).toEqual(["terms_outdated"]);
  });

  it("refuses invite-only, legacy and inactive campaigns", () => {
    const withCampaign = (campaign: Partial<JoinCheckInput["campaign"]>) =>
      joinBlockers({ ...joinable, campaign: { ...joinable.campaign, ...campaign } });
    expect(withCampaign({ access: "undangan" })).toEqual(["campaign_closed"]);
    expect(withCampaign({ payoutModel: "paket" })).toEqual(["campaign_closed"]);
    expect(withCampaign({ status: "selesai" })).toEqual(["campaign_closed"]);
  });

  it("allows joining on the last day, not after it", () => {
    const lastDay = { ...joinable, today: "2026-10-31" };
    expect(joinBlockers(lastDay)).toEqual([]);
    expect(joinBlockers({ ...lastDay, today: "2026-11-01" })).toEqual(["past_deadline"]);
  });

  it("refuses an exhausted budget", () => {
    expect(
      joinBlockers({ ...joinable, campaign: { ...joinable.campaign, budgetExhausted: true } }),
    ).toEqual(["budget_exhausted"]);
  });

  it("keeps local-only campaigns for badge holders", () => {
    const localOnly = { ...joinable, campaign: { ...joinable.campaign, localOnly: true } };
    expect(joinBlockers(localOnly)).toEqual(["local_only"]);
    expect(
      joinBlockers({ ...localOnly, creator: { ...localOnly.creator, hasLocalBadge: true } }),
    ).toEqual([]);
  });

  it("refuses joining twice", () => {
    expect(joinBlockers({ ...joinable, alreadyJoined: true })).toEqual(["already_joined"]);
  });
});

describe("canWithdraw (FR-M17-05)", () => {
  const base = {
    assignmentStatus: "bergabung",
    campaignStatus: "aktif",
    payoutModel: "per_views",
    approvedClipCount: 0,
  } as const;

  it("allows leaving before any approved clip", () => {
    expect(canWithdraw(base)).toBe(true);
  });

  it("refuses once a clip was approved", () => {
    expect(canWithdraw({ ...base, approvedClipCount: 1 })).toBe(false);
  });

  it("refuses package campaigns, finished campaigns and other statuses", () => {
    expect(canWithdraw({ ...base, payoutModel: "paket" })).toBe(false);
    expect(canWithdraw({ ...base, campaignStatus: "selesai" })).toBe(false);
    expect(canWithdraw({ ...base, assignmentStatus: "diundang" })).toBe(false);
    expect(canWithdraw({ ...base, assignmentStatus: "mundur" })).toBe(false);
  });
});

describe("activationBlockers for per_views (FR-M17-02)", () => {
  const ready: PerViewsActivationInput = {
    brief: "Potong video wisuda jadi klip 30 detik.",
    assetCount: 1,
    ratePer1000Views: 10_000,
    creatorBudget: 5_000_000,
    endDate: "2026-10-31",
    allowedPlatforms: ["tiktok"],
    today: "2026-10-01",
  };
  const open = {
    objective: null,
    landingUrl: null,
    assignmentStatuses: [],
    access: "terbuka" as const,
  };

  it("lets an open campaign start without klipers", () => {
    expect(activationBlockers({ ...open, perViews: ready })).toEqual([]);
  });

  it("still needs a kliper for an invite-only campaign", () => {
    expect(activationBlockers({ ...open, access: "undangan", perViews: ready })).toHaveLength(1);
  });

  it("lists every missing requirement", () => {
    const blockers = activationBlockers({
      ...open,
      perViews: {
        brief: " ",
        assetCount: 0,
        ratePer1000Views: 0,
        creatorBudget: 0,
        endDate: "2026-09-30",
        allowedPlatforms: [],
        today: "2026-10-01",
      },
    });
    expect(blockers).toHaveLength(6);
  });

  it("leaves the landing URL optional without a legacy objective", () => {
    expect(activationBlockers({ ...open, landingUrl: "  ", perViews: ready })).toEqual([]);
  });

  it("accepts an end date of today", () => {
    expect(activationBlockers({ ...open, perViews: { ...ready, endDate: "2026-10-01" } })).toEqual(
      [],
    );
  });
});

describe("sortCatalog (FR-M17-03)", () => {
  const rows = [
    {
      name: "B",
      published_at: "2026-10-02T00:00:00Z",
      rate_per_1000_views: 8_000,
      end_date: "2026-11-30",
    },
    {
      name: "A",
      published_at: "2026-10-05T00:00:00Z",
      rate_per_1000_views: 12_000,
      end_date: "2026-12-31",
    },
    {
      name: "C",
      published_at: "2026-10-01T00:00:00Z",
      rate_per_1000_views: 12_000,
      end_date: "2026-10-15",
    },
  ];

  it("sorts by newest, rate and deadline", () => {
    expect(sortCatalog(rows, "terbaru").map((r) => r.name)).toEqual(["A", "B", "C"]);
    expect(sortCatalog(rows, "tarif").map((r) => r.name)).toEqual(["A", "C", "B"]);
    expect(sortCatalog(rows, "tenggat").map((r) => r.name)).toEqual(["C", "B", "A"]);
  });
});

describe("campaignToday", () => {
  it("uses the WITA business day", () => {
    // 16.30 UTC on 30 Sep is already 1 Oct 00.30 in Asia/Makassar.
    expect(campaignToday(new Date("2026-09-30T16:30:00Z"))).toBe("2026-10-01");
    expect(campaignToday(new Date("2026-09-30T15:30:00Z"))).toBe("2026-09-30");
  });
});

describe("terms version", () => {
  it("matches public.current_creator_terms_version() in the latest migration", () => {
    const dir = join(process.cwd(), "supabase", "migrations");
    const definitions = readdirSync(dir)
      .filter((file) => file.endsWith(".sql"))
      .sort()
      .map((file) => readFileSync(join(dir, file), "utf8"))
      .flatMap((sql) => [
        ...sql.matchAll(
          /function public\.current_creator_terms_version\(\)[\s\S]*?select '([^']+)'::text/g,
        ),
      ]);
    expect(definitions.length).toBeGreaterThan(0);
    expect(definitions.at(-1)?.[1]).toBe(CREATOR_TERMS_VERSION);
  });
});
