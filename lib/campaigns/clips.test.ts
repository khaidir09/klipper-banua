import { describe, expect, it } from "vitest";
import {
  claimDeadline,
  clipDetailProblems,
  clipPeriod,
  clipSubmissionBlockers,
  viewsUpdateState,
  type ClipCheckInput,
} from "./clips";

const ok: ClipCheckInput = {
  creatorStatus: "aktif",
  termsVersion: "2026-10",
  currentTermsVersion: "2026-10",
  assignmentStatus: "bergabung",
  campaignStatus: "aktif",
  endDate: "2026-10-31",
  today: "2026-10-10",
  budgetExhausted: false,
  maxClipsPerCreator: 3,
  activeClipCount: 2,
};

describe("clipSubmissionBlockers (FR-M18-02)", () => {
  it("lets an active, joined klipper send", () => {
    expect(clipSubmissionBlockers(ok)).toEqual([]);
  });

  it("stops at the clip limit, counting only clips that were not rejected", () => {
    expect(clipSubmissionBlockers({ ...ok, activeClipCount: 3 })).toEqual(["limit_reached"]);
  });

  it("closes after the end date and when the budget is used up", () => {
    expect(clipSubmissionBlockers({ ...ok, today: "2026-11-01" })).toEqual(["campaign_closed"]);
    expect(clipSubmissionBlockers({ ...ok, budgetExhausted: true })).toEqual(["budget_exhausted"]);
  });

  it("needs a joined assignment, an active account and the current terms", () => {
    expect(
      clipSubmissionBlockers({
        ...ok,
        assignmentStatus: "mundur",
        creatorStatus: "prospek",
        termsVersion: "v1",
      }),
    ).toEqual(["creator_not_active", "terms_outdated", "not_joined"]);
  });
});

describe("clipPeriod", () => {
  it("starts when the klipper joined and ends after end_date in WITA", () => {
    const period = clipPeriod({
      joinedAt: "2026-10-05T03:00:00Z",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
    expect(period.start.toISOString()).toBe("2026-10-05T03:00:00.000Z");
    // 1 Nov 00:00 WITA = 31 Oct 16:00 UTC.
    expect(period.end.toISOString()).toBe("2026-10-31T16:00:00.000Z");
  });

  it("starts at the minute of joining, as precise as the posting-time input", () => {
    const period = clipPeriod({
      joinedAt: "2026-10-05T03:00:42Z",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
    expect(period.start.toISOString()).toBe("2026-10-05T03:00:00.000Z");
  });

  it("never starts before the campaign does", () => {
    const period = clipPeriod({
      joinedAt: "2026-09-20T00:00:00Z",
      startDate: "2026-10-01",
      endDate: "2026-10-31",
    });
    expect(period.start.toISOString()).toBe("2026-09-30T16:00:00.000Z");
  });
});

describe("clipDetailProblems", () => {
  const period = { start: new Date("2026-10-05T00:00:00Z"), end: new Date("2026-10-31T16:00:00Z") };
  const now = new Date("2026-10-10T00:00:00Z");
  const base = {
    platform: "tiktok" as const,
    postedAt: new Date("2026-10-09T00:00:00Z"),
    now,
    allowedPlatforms: ["tiktok", "instagram"] as const,
    registeredPlatforms: ["tiktok"] as const,
    period,
  };

  it("accepts a clip inside the period on a registered platform", () => {
    expect(clipDetailProblems(base)).toEqual({});
  });

  it("rejects a platform the campaign does not allow, or one without an account", () => {
    expect(clipDetailProblems({ ...base, platform: "youtube" }).platform).toMatch(/tidak menerima/);
    expect(clipDetailProblems({ ...base, platform: "instagram" }).platform).toMatch(
      /Tambahkan akun/,
    );
  });

  it("rejects a posting time in the future or outside the period", () => {
    expect(
      clipDetailProblems({ ...base, postedAt: new Date("2026-10-11T00:00:00Z") }).posted_at,
    ).toMatch(/masa depan/);
    expect(
      clipDetailProblems({ ...base, postedAt: new Date("2026-10-04T23:59:00Z") }).posted_at,
    ).toMatch(/bergabung/);
  });
});

describe("viewsUpdateState (FR-M18-05)", () => {
  const base = {
    reviewStatus: "disetujui" as const,
    liveStatus: "tayang" as const,
    campaignStatus: "aktif" as const,
    endDate: "2026-10-31",
    claimGraceDays: 3,
    today: "2026-10-10",
    lastSubmittedAt: "2026-10-09T00:00:00Z",
    hasPendingSubmission: false,
    now: new Date("2026-10-10T01:00:00Z"),
  };

  it("allows an update 24 hours after the last submission", () => {
    expect(viewsUpdateState(base)).toEqual({ allowed: true });
  });

  it("says when the next update is possible", () => {
    const state = viewsUpdateState({ ...base, now: new Date("2026-10-09T12:00:00Z") });
    expect(state).toEqual({
      allowed: false,
      reason: "too_soon",
      nextAt: new Date("2026-10-10T00:00:00Z"),
    });
  });

  it("stays open through the claim grace days, then closes", () => {
    expect(viewsUpdateState({ ...base, today: "2026-11-03" })).toEqual({ allowed: true });
    expect(viewsUpdateState({ ...base, today: "2026-11-04" })).toEqual({
      allowed: false,
      reason: "closed",
    });
    expect(claimDeadline("2026-10-31", 3)).toBe("2026-11-03");
  });

  it("needs an approved clip that is still live and no open submission", () => {
    expect(viewsUpdateState({ ...base, reviewStatus: "menunggu_review" })).toMatchObject({
      reason: "not_approved",
    });
    expect(viewsUpdateState({ ...base, liveStatus: "dihapus" })).toMatchObject({
      reason: "not_live",
    });
    expect(viewsUpdateState({ ...base, hasPendingSubmission: true })).toMatchObject({
      reason: "pending",
    });
  });
});
