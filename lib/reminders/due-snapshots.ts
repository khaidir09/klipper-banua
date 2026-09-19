import { CHECKPOINT_LABELS, type MetricCheckpoint } from "@/lib/constants/metrics";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/constants/creators";
import { formatDate } from "@/lib/format/date";
import { formatNumber } from "@/lib/format/number";

/**
 * Daily Telegram reminder for due metric snapshots (FR-M10-05). The app only
 * builds the message; n8n schedules it and sends it with its own bot token.
 * Messages use Telegram's HTML parse mode.
 */

export type ReminderItem = {
  campaignCode: string;
  campaignName: string;
  /** Stage name only; the reminder never carries a creator's legal name. */
  stageName: string;
  platform: SocialPlatform;
  checkpoint: MetricCheckpoint;
  daysOverdue: number;
};

export type DueSnapshotReminder = { count: number; text: string };

/** Keeps the message well under Telegram's 4096-character limit. */
export const REMINDER_MAX_LINES = 40;

export function escapeTelegramHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function lateness(daysOverdue: number): string {
  return daysOverdue === 0 ? "jatuh tempo hari ini" : `terlambat ${daysOverdue} hari`;
}

/**
 * Groups the items (already sorted most overdue first) by campaign, keeping
 * the order in which each campaign first appears.
 */
export function buildDueSnapshotReminder(
  items: ReminderItem[],
  options: { now: Date; timezone: string; dashboardUrl: string },
): DueSnapshotReminder {
  const date = formatDate(options.now, options.timezone);
  const header = `<b>Snapshot metrik jatuh tempo · ${escapeTelegramHtml(date)}</b>`;

  if (items.length === 0) {
    return { count: 0, text: `${header}\nTidak ada snapshot yang jatuh tempo.` };
  }

  const shown = items.slice(0, REMINDER_MAX_LINES);
  const groups = new Map<string, { name: string; lines: string[] }>();
  for (const item of shown) {
    const group = groups.get(item.campaignCode) ?? { name: item.campaignName, lines: [] };
    const creator = item.stageName ? `@${item.stageName.replace(/^@/, "")}` : "Kreator";
    group.lines.push(
      `• ${escapeTelegramHtml(creator)} · ${SOCIAL_PLATFORM_LABELS[item.platform]} · ${CHECKPOINT_LABELS[item.checkpoint]} · ${lateness(item.daysOverdue)}`,
    );
    groups.set(item.campaignCode, group);
  }

  const sections = [...groups].map(
    ([code, group]) =>
      `<b>${escapeTelegramHtml(code)}</b> ${escapeTelegramHtml(group.name)}\n${group.lines.join("\n")}`,
  );

  const rest = items.length - shown.length;
  const lines = [
    header,
    `${formatNumber(items.length)} snapshot perlu diinput.`,
    ...sections,
    ...(rest > 0 ? [`…dan ${formatNumber(rest)} lainnya.`] : []),
    `<a href="${escapeTelegramHtml(options.dashboardUrl)}">Buka dasbor</a>`,
  ];

  return { count: items.length, text: lines.join("\n\n") };
}
