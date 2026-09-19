import { describe, expect, it } from "vitest";
import {
  REMINDER_MAX_LINES,
  buildDueSnapshotReminder,
  escapeTelegramHtml,
  type ReminderItem,
} from "./due-snapshots";

const options = {
  // 19 Sep 2026 08:00 WITA
  now: new Date("2026-09-19T00:00:00Z"),
  timezone: "Asia/Makassar",
  dashboardUrl: "https://app.contoh.id/dashboard",
};

function item(overrides: Partial<ReminderItem> = {}): ReminderItem {
  return {
    campaignCode: "PMB-2026-01",
    campaignName: "PMB Gelombang 1",
    stageName: "banua.kreator",
    platform: "tiktok",
    checkpoint: "H+3",
    daysOverdue: 2,
    ...overrides,
  };
}

describe("buildDueSnapshotReminder", () => {
  it("reports nothing due with a zero count", () => {
    const reminder = buildDueSnapshotReminder([], options);
    expect(reminder.count).toBe(0);
    expect(reminder.text).toContain("19 Sep 2026");
    expect(reminder.text).toContain("Tidak ada snapshot yang jatuh tempo.");
  });

  it("groups lines by campaign in first-seen order", () => {
    const reminder = buildDueSnapshotReminder(
      [
        item({ daysOverdue: 4 }),
        item({
          campaignCode: "EVT-2026-02",
          campaignName: "Expo",
          stageName: "@kalsel.vlog",
          platform: "instagram",
          checkpoint: "H+1",
          daysOverdue: 3,
        }),
        item({ stageName: "", checkpoint: "H+7", daysOverdue: 0 }),
      ],
      options,
    );

    expect(reminder.count).toBe(3);
    expect(reminder.text).toBe(
      [
        "<b>Snapshot metrik jatuh tempo · 19 Sep 2026</b>",
        "3 snapshot perlu diinput.",
        "<b>PMB-2026-01</b> PMB Gelombang 1\n• @banua.kreator · TikTok · H+3 · terlambat 4 hari\n• Kreator · TikTok · H+7 · jatuh tempo hari ini",
        "<b>EVT-2026-02</b> Expo\n• @kalsel.vlog · Instagram · H+1 · terlambat 3 hari",
        '<a href="https://app.contoh.id/dashboard">Buka dasbor</a>',
      ].join("\n\n"),
    );
  });

  it("escapes names so they cannot break Telegram's HTML", () => {
    const reminder = buildDueSnapshotReminder(
      [item({ campaignName: "Promo <b>&</b> Diskon", stageName: "a<i>b" })],
      options,
    );
    expect(reminder.text).toContain("PMB-2026-01</b> Promo &lt;b&gt;&amp;&lt;/b&gt; Diskon");
    expect(reminder.text).toContain("@a&lt;i&gt;b");
  });

  it("caps the list and says how many were left out", () => {
    const items = Array.from({ length: REMINDER_MAX_LINES + 5 }, (_, i) =>
      item({ stageName: `kreator${i}` }),
    );
    const reminder = buildDueSnapshotReminder(items, options);
    expect(reminder.count).toBe(REMINDER_MAX_LINES + 5);
    expect(reminder.text.match(/^• /gm)).toHaveLength(REMINDER_MAX_LINES);
    expect(reminder.text).toContain("…dan 5 lainnya.");
    expect(reminder.text.length).toBeLessThan(4096);
  });
});

describe("escapeTelegramHtml", () => {
  it("escapes the characters Telegram treats as markup", () => {
    expect(escapeTelegramHtml(`<a href="x">&</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;",
    );
  });
});
