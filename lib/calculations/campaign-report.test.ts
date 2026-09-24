import { describe, expect, it } from "vitest";
import { buildCampaignReport, type ReportInput } from "@/lib/calculations/campaign-report";
import { formatMinutes, opsTimeRecap } from "@/lib/calculations/ops-time";
import { OPS_ACTIVITIES } from "@/lib/constants/ops";
import { CSV_BOM, csvCell, csvFileName, toCsv } from "@/lib/export/csv";
import { contentsCsv, creatorsCsv } from "@/lib/export/report-csv";

const snapshot = (
  checkpoint: "H+1" | "H+3" | "H+7" | "akhir",
  captured_at: string,
  views: number,
) => ({ checkpoint, captured_at, views, likes: 10, comments: 2, shares: null, saves: null });

const input: ReportInput = {
  targets: { contents: 4, views: 20000, registrants: 0 },
  assignments: [
    { id: "a1", name: "Siti", referralCode: "SITI01", status: "selesai" },
    { id: "a2", name: "Budi", referralCode: "BUDI02", status: "bergabung" },
    { id: "a3", name: "Rina", referralCode: "RINA03", status: "mundur" },
  ],
  contents: [
    {
      id: "c2",
      assignmentId: "a1",
      platform: "tiktok",
      posted_url: "https://tiktok.com/@siti/2",
      posted_at: "2026-10-05T03:00:00Z",
      live_status: "dihapus",
      snapshots: [snapshot("H+1", "2026-10-06T03:00:00Z", 1000)],
    },
    {
      id: "c1",
      assignmentId: "a1",
      platform: "instagram",
      posted_url: "https://instagram.com/p/1",
      posted_at: "2026-10-02T03:00:00Z",
      live_status: "tayang",
      snapshots: [
        snapshot("H+1", "2026-10-03T03:00:00Z", 2000),
        snapshot("H+7", "2026-10-09T03:00:00Z", 8000),
      ],
    },
    {
      id: "c3",
      assignmentId: "a2",
      platform: "tiktok",
      posted_url: "https://tiktok.com/@budi/1",
      posted_at: "2026-10-04T03:00:00Z",
      live_status: "tayang",
      snapshots: [],
    },
  ],
  clicks: [
    { assignmentId: "a1", human: 40 },
    { assignmentId: "a2", human: 5 },
  ],
  reports: [
    { assignmentId: "a1", registrant_count: 7 },
    { assignmentId: null, registrant_count: 3 },
  ],
};

describe("campaign report (FR-M9-02)", () => {
  const report = buildCampaignReport(input);

  it("summarises results against targets; no target means no percentage", () => {
    expect(report.summary.contents).toEqual({ actual: 3, target: 4, pct: 75 });
    expect(report.summary.views).toEqual({ actual: 9000, target: 20000, pct: 45 });
    expect(report.summary.registrants).toEqual({ actual: 10, target: 0, pct: null });
    expect(report.summary.validClicks).toBe(45);
  });

  it("builds per-creator rows and drops a withdrawn creator without results", () => {
    expect(report.creators).toEqual([
      {
        assignmentId: "a1",
        name: "Siti",
        referralCode: "SITI01",
        platforms: ["tiktok", "instagram"],
        contents: 2,
        views: 9000,
        clicks: 40,
        registrants: 7,
      },
      {
        assignmentId: "a2",
        name: "Budi",
        referralCode: "BUDI02",
        platforms: ["tiktok"],
        contents: 1,
        views: 0,
        clicks: 5,
        registrants: 0,
      },
    ]);
    expect(report.registrantsWithoutCode).toBe(3);
  });

  it("lists live content by posting time with the latest snapshot", () => {
    expect(report.contents.map((c) => c.id)).toEqual(["c1", "c3", "c2"]);
    expect(report.contents[0]!.latest?.checkpoint).toBe("H+7");
    expect(report.contents[0]!.views).toBe(8000);
    expect(report.contents[1]!.latest).toBeNull();
  });

  it("carries no money fields anywhere (FR-M9-03)", () => {
    const keys = JSON.stringify(report).match(/"[A-Za-z_]+":/g) ?? [];
    for (const key of keys) {
      expect(key).not.toMatch(/amount|fee|price|margin|payout|bonus|cpm|cost/i);
    }
  });
});

describe("CSV export (FR-M9-04)", () => {
  it("starts with a UTF-8 BOM and uses ; with CRLF line endings", () => {
    const csv = toCsv(["A", "B"], [["x", 1]]);
    expect(csv.startsWith(CSV_BOM)).toBe(true);
    expect(csv).toBe(`${CSV_BOM}A;B\r\nx;1\r\n`);
  });

  it("quotes separators, quotes and new lines", () => {
    expect(csvCell("a;b")).toBe('"a;b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line\nbreak")).toBe('"line\nbreak"');
    expect(csvCell("a,b")).toBe("a,b");
  });

  it("neutralises spreadsheet formulas", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell("+62")).toBe("'+62");
    expect(csvCell("@me")).toBe("'@me");
    expect(csvCell("-5")).toBe("'-5");
  });

  it("writes numbers plainly and blanks for missing values", () => {
    expect(csvCell(1250000)).toBe("1250000");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
  });

  it("names files after the campaign code", () => {
    expect(csvFileName("PMB-UBS-2026-02", "konten")).toBe("PMB-UBS-2026-02-konten.csv");
    expect(csvFileName("A/B C", "kreator")).toBe("A-B-C-kreator.csv");
  });

  it("exports content rows in the display timezone", () => {
    const report = buildCampaignReport(input);
    const lines = contentsCsv(report, "Asia/Makassar").split("\r\n");
    expect(lines[1]).toBe(
      "Siti;SITI01;Instagram;https://instagram.com/p/1;2026-10-02 11:00;Tayang;H+7;2026-10-09 11:00;8000;10;2;;",
    );
    expect(contentsCsv(report, "Asia/Jakarta").split("\r\n")[1]).toContain("2026-10-02 10:00");
  });

  it("exports the creator recap with no-code registrants and a total row", () => {
    const lines = creatorsCsv(buildCampaignReport(input)).split("\r\n");
    expect(lines[0]).toBe(
      `${CSV_BOM}Kreator;Kode referal;Platform;Konten tayang;Views;Klik valid;Pendaftar`,
    );
    expect(lines[1]).toBe("Siti;SITI01;TikTok, Instagram;2;9000;40;7");
    expect(lines[3]).toBe("Tanpa kode referal;;;;;;3");
    expect(lines[4]).toBe("Total;;;3;9000;45;10");
  });
});

describe("operational time recap (FR-M12-02)", () => {
  it("sums minutes per activity, largest first, with shares", () => {
    const recap = opsTimeRecap([
      { activity: "review", minutes: 30 },
      { activity: "rekap_metrik", minutes: 90 },
      { activity: "review", minutes: 30 },
    ]);
    expect(recap.totalMinutes).toBe(150);
    expect(recap.totalEntries).toBe(3);
    expect(recap.rows[0]).toEqual({
      activity: "rekap_metrik",
      minutes: 90,
      entries: 1,
      sharePct: 60,
    });
    expect(recap.rows[1]).toEqual({ activity: "review", minutes: 60, entries: 2, sharePct: 40 });
    // Every activity gets a row, including the v4.0 ones (FR-M12-01).
    expect(recap.rows).toHaveLength(OPS_ACTIVITIES.length);
    expect(recap.rows.at(-1)!.minutes).toBe(0);
  });

  it("has no shares when nothing was logged", () => {
    const recap = opsTimeRecap([]);
    expect(recap.totalMinutes).toBe(0);
    expect(recap.rows.every((row) => row.sharePct === null)).toBe(true);
  });

  it("formats durations in hours and minutes", () => {
    expect(formatMinutes(45)).toBe("45 menit");
    expect(formatMinutes(60)).toBe("1 jam");
    expect(formatMinutes(95)).toBe("1 jam 35 menit");
  });
});
