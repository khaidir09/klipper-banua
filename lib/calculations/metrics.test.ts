import { describe, expect, it } from "vitest";
import {
  contentViews,
  decreasedSnapshotIds,
  cumulativeViewsByCheckpoint,
  latestSnapshot,
  metricsByAssignment,
  progressPercent,
  totalRegistrants,
  totalViews,
  viewsWarnings,
  type SnapshotPoint,
} from "@/lib/calculations/campaign-metrics";
import {
  checkpointDueDate,
  dueSnapshots,
  localDate,
  suggestCheckpoint,
} from "@/lib/calculations/checkpoints";
import { liveDays, removedBeforeMinLiveDays } from "@/lib/calculations/live-duration";

const snap = (
  checkpoint: SnapshotPoint["checkpoint"],
  captured_at: string,
  views: number,
  id?: string,
): SnapshotPoint => ({
  id,
  checkpoint,
  captured_at,
  views,
});

describe("latest snapshot (FR-M7-02)", () => {
  it("picks the most recent capture time, not the entry order", () => {
    const snapshots = [
      snap("H+3", "2026-10-08T02:00:00Z", 3000),
      snap("H+1", "2026-10-06T02:00:00Z", 1200),
      snap("H+7", "2026-10-12T02:00:00Z", 5200),
    ];
    expect(latestSnapshot(snapshots)?.checkpoint).toBe("H+7");
    expect(contentViews(snapshots)).toBe(5200);
  });

  it("uses creation time to break ties", () => {
    const a = {
      ...snap("lainnya", "2026-10-06T02:00:00Z", 100),
      created_at: "2026-10-06T03:00:00Z",
    };
    const b = {
      ...snap("lainnya", "2026-10-06T02:00:00Z", 150),
      created_at: "2026-10-06T04:00:00Z",
    };
    expect(latestSnapshot([b, a])?.views).toBe(150);
  });

  it("is 0 without snapshots", () => {
    expect(contentViews([])).toBe(0);
  });
});

describe("viewsWarnings (FR-M7-02)", () => {
  const existing = [
    snap("H+1", "2026-10-06T02:00:00Z", 1200, "a"),
    snap("H+7", "2026-10-12T02:00:00Z", 5200, "c"),
  ];

  it("warns when views drop below the previous snapshot", () => {
    expect(viewsWarnings(existing, { captured_at: "2026-10-08T02:00:00Z", views: 900 })).toEqual([
      { kind: "lower_than_previous", previousViews: 1200, previousCheckpoint: "H+1" },
    ]);
  });

  it("warns when a back-filled snapshot exceeds the next one", () => {
    expect(viewsWarnings(existing, { captured_at: "2026-10-08T02:00:00Z", views: 6000 })).toEqual([
      { kind: "higher_than_next", nextViews: 5200, nextCheckpoint: "H+7" },
    ]);
  });

  it("is quiet for a normal increase and ignores the snapshot being edited", () => {
    expect(viewsWarnings(existing, { captured_at: "2026-10-08T02:00:00Z", views: 3000 })).toEqual(
      [],
    );
    expect(
      viewsWarnings(existing, { id: "a", captured_at: "2026-10-06T02:00:00Z", views: 10 }),
    ).toEqual([]);
  });
});

describe("campaign totals (PRD 8.4)", () => {
  const contents = [
    {
      posted: true,
      snapshots: [
        snap("H+1", "2026-10-06T02:00:00Z", 1000),
        snap("H+3", "2026-10-08T02:00:00Z", 2500),
      ],
    },
    { posted: true, snapshots: [snap("H+1", "2026-10-07T02:00:00Z", 800)] },
    // Never went live: never counts, even with stray data.
    { posted: false, snapshots: [snap("H+1", "2026-10-07T02:00:00Z", 999)] },
  ];

  it("sums the latest views of content that went live", () => {
    expect(totalViews(contents)).toBe(3300);
  });

  it("sums registrants including reports without a code", () => {
    expect(totalRegistrants([{ registrant_count: 3 }, { registrant_count: 2 }])).toBe(5);
  });

  it("reports progress against a target", () => {
    expect(progressPercent(3300, 10000)).toBeCloseTo(33);
    expect(progressPercent(5, 0)).toBeNull();
  });
});

describe("cumulativeViewsByCheckpoint (FR-M7-05)", () => {
  it("carries the last known value forward per content", () => {
    const points = cumulativeViewsByCheckpoint([
      {
        posted: true,
        snapshots: [
          snap("H+1", "2026-10-06T02:00:00Z", 1000),
          snap("H+7", "2026-10-12T02:00:00Z", 4000),
        ],
      },
      {
        posted: true,
        snapshots: [
          snap("H+1", "2026-10-07T02:00:00Z", 500),
          snap("H+3", "2026-10-09T02:00:00Z", 900),
        ],
      },
      { posted: false, snapshots: [] },
    ]);
    expect(points).toEqual([
      { checkpoint: "H+1", views: 1500 },
      { checkpoint: "H+3", views: 1900 },
      { checkpoint: "H+7", views: 4900 },
      { checkpoint: "akhir", views: 4900 },
    ]);
  });
});

describe("metricsByAssignment (FR-M7-05)", () => {
  it("groups content, clicks and registrants per creator", () => {
    const [row] = metricsByAssignment({
      assignmentIds: ["x"],
      contents: [
        { assignmentId: "x", posted: true, snapshots: [snap("H+1", "2026-10-06T02:00:00Z", 1000)] },
        { assignmentId: "x", posted: false, snapshots: [] },
        { assignmentId: "y", posted: true, snapshots: [snap("H+1", "2026-10-06T02:00:00Z", 50)] },
      ],
      clicks: [
        { assignmentId: "x", total: 2, human: 1 },
        { assignmentId: "y", total: 1, human: 1 },
      ],
      reports: [
        { assignmentId: "x", registrant_count: 4 },
        { assignmentId: null, registrant_count: 9 },
      ],
    });
    expect(row).toEqual({
      assignmentId: "x",
      liveContents: 1,
      views: 1000,
      clicks: 2,
      humanClicks: 1,
      registrants: 4,
    });
  });
});

describe("snapshot due dates (FR-M10-02, PRD 8.5)", () => {
  // Posted 5 Oct 2026, 23:30 WITA = 15:30 UTC; in WIB it is 22:30 on 5 Oct.
  const lateNight = "2026-10-05T15:30:00Z";
  // Posted 6 Oct 2026, 00:30 WITA = 5 Oct 16:30 UTC = 5 Oct 23:30 WIB.
  const afterMidnightWita = "2026-10-05T16:30:00Z";

  it("reads the posting day in the display timezone", () => {
    expect(localDate(afterMidnightWita, "Asia/Makassar")).toBe("2026-10-06");
    expect(localDate(afterMidnightWita, "Asia/Jakarta")).toBe("2026-10-05");
  });

  it("computes H+1, H+3 and H+7 as calendar days after posting", () => {
    expect(checkpointDueDate(lateNight, 1, "Asia/Makassar")).toBe("2026-10-06");
    expect(checkpointDueDate(lateNight, 3, "Asia/Makassar")).toBe("2026-10-08");
    expect(checkpointDueDate(lateNight, 7, "Asia/Makassar")).toBe("2026-10-12");
    // A post at 00:30 WITA on 6 Oct is still 5 Oct (23:30) in WIB, so its
    // H+1 falls a day earlier for WIB users.
    expect(checkpointDueDate(afterMidnightWita, 1, "Asia/Makassar")).toBe("2026-10-07");
    expect(checkpointDueDate(afterMidnightWita, 1, "Asia/Jakarta")).toBe("2026-10-06");
  });

  const content = (overrides: Partial<Parameters<typeof dueSnapshots>[0][number]> = {}) => ({
    id: "c1",
    posted_at: lateNight,
    live_status: "tayang" as const,
    checkpoints: [] as ("H+1" | "H+3" | "H+7")[],
    ...overrides,
  });

  it("lists nothing before H+1 arrives", () => {
    // 5 Oct 23:59 WITA
    expect(dueSnapshots([content()], new Date("2026-10-05T15:59:00Z"), "Asia/Makassar")).toEqual(
      [],
    );
  });

  it("lists H+1 from the start of the next local day", () => {
    // 6 Oct 00:05 WITA
    expect(dueSnapshots([content()], new Date("2026-10-05T16:05:00Z"), "Asia/Makassar")).toEqual([
      { contentId: "c1", checkpoint: "H+1", dueDate: "2026-10-06", daysOverdue: 0 },
    ]);
  });

  it("respects the user's timezone at the day boundary", () => {
    // 6 Oct 00:05 WITA is still 5 Oct 23:05 WIB: nothing due yet for WIB users.
    expect(dueSnapshots([content()], new Date("2026-10-05T16:05:00Z"), "Asia/Jakarta")).toEqual([]);
  });

  it("lists every missing checkpoint, most overdue first", () => {
    // 12 Oct 09:00 WITA: H+1 six days late, H+3 four days late, H+7 due today.
    const due = dueSnapshots([content()], new Date("2026-10-12T01:00:00Z"), "Asia/Makassar");
    expect(due.map((d) => [d.checkpoint, d.daysOverdue])).toEqual([
      ["H+1", 6],
      ["H+3", 4],
      ["H+7", 0],
    ]);
  });

  it("skips recorded checkpoints and content that is not live", () => {
    const now = new Date("2026-10-12T01:00:00Z");
    expect(dueSnapshots([content({ checkpoints: ["H+1", "H+3", "H+7"] })], now)).toEqual([]);
    expect(dueSnapshots([content({ live_status: "dihapus" })], now)).toEqual([]);
    expect(dueSnapshots([content({ posted_at: null, live_status: "belum_tayang" })], now)).toEqual(
      [],
    );
  });

  it("orders across contents by lateness", () => {
    const due = dueSnapshots(
      [
        content({ id: "new", posted_at: "2026-10-10T02:00:00Z" }),
        content({ id: "old", posted_at: "2026-10-01T02:00:00Z", checkpoints: ["H+1", "H+3"] }),
      ],
      new Date("2026-10-12T01:00:00Z"),
      "Asia/Makassar",
    );
    expect(due.map((d) => `${d.contentId}:${d.checkpoint}:${d.daysOverdue}`)).toEqual([
      "old:H+7:4", // posted 1 Oct → H+7 on 8 Oct → 4 days late on 12 Oct
      "new:H+1:1",
    ]);
  });
});

describe("suggestCheckpoint", () => {
  const now = new Date("2026-10-12T01:00:00Z");

  it("suggests the earliest due, missing checkpoint", () => {
    expect(
      suggestCheckpoint({ posted_at: "2026-10-05T15:30:00Z", checkpoints: ["H+1"] }, now),
    ).toBe("H+3");
  });

  it("falls back to akhir, then lainnya", () => {
    const all = ["H+1", "H+3", "H+7"] as const;
    expect(
      suggestCheckpoint({ posted_at: "2026-10-05T15:30:00Z", checkpoints: [...all] }, now),
    ).toBe("akhir");
    expect(
      suggestCheckpoint({ posted_at: "2026-10-05T15:30:00Z", checkpoints: [...all, "akhir"] }, now),
    ).toBe("lainnya");
  });
});

describe("removedBeforeMinLiveDays (FR-M10-04, PRD 8.2)", () => {
  const posted = "2026-10-05T02:00:00Z";

  it("flags content removed before the minimum", () => {
    expect(removedBeforeMinLiveDays(posted, "2026-10-20T02:00:00Z", 30)).toBe(true);
    expect(liveDays(posted, "2026-10-20T02:00:00Z")).toBe(15);
  });

  it("accepts content that stayed exactly the minimum or longer", () => {
    expect(removedBeforeMinLiveDays(posted, "2026-11-04T02:00:00Z", 30)).toBe(false);
    expect(removedBeforeMinLiveDays(posted, "2026-11-04T01:59:59Z", 30)).toBe(true);
  });
});

describe("decreasedSnapshotIds (FR-M7-02)", () => {
  it("flags snapshots lower than the one captured just before", () => {
    const flagged = decreasedSnapshotIds([
      snap("H+7", "2026-10-12T02:00:00Z", 4800, "c"),
      snap("H+1", "2026-10-06T02:00:00Z", 1200, "a"),
      snap("H+3", "2026-10-08T02:00:00Z", 5000, "b"),
    ]);
    expect([...flagged]).toEqual(["c"]);
  });

  it("flags nothing for a rising series", () => {
    expect(
      decreasedSnapshotIds([
        snap("H+1", "2026-10-06T02:00:00Z", 1, "a"),
        snap("H+3", "2026-10-08T02:00:00Z", 1, "b"),
      ]).size,
    ).toBe(0);
  });
});
