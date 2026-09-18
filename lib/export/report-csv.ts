import { formatInTimeZone } from "date-fns-tz";
import type { CampaignReport } from "@/lib/calculations/campaign-report";
import { LIVE_STATUS_LABELS } from "@/lib/constants/contents";
import { SOCIAL_PLATFORM_LABELS } from "@/lib/constants/creators";
import { CHECKPOINT_LABELS } from "@/lib/constants/metrics";
import { resolveTimezone } from "@/lib/format/timezone";
import { toCsv, type CsvCell } from "./csv";

/** FR-M9-04: CSV files built from the client report model (no finance data). */

const stamp = (value: string, timezone?: string | null) =>
  formatInTimeZone(value, resolveTimezone(timezone), "yyyy-MM-dd HH:mm");

export function contentsCsv(report: CampaignReport, timezone?: string | null): string {
  return toCsv(
    [
      "Kreator",
      "Kode referal",
      "Platform",
      "URL tayang",
      "Waktu tayang",
      "Status tayang",
      "Checkpoint terakhir",
      "Waktu snapshot",
      "Views",
      "Suka",
      "Komentar",
      "Bagikan",
      "Simpan",
    ],
    report.contents.map((content) => [
      content.creatorName,
      content.referralCode,
      SOCIAL_PLATFORM_LABELS[content.platform],
      content.postedUrl,
      stamp(content.postedAt, timezone),
      LIVE_STATUS_LABELS[content.liveStatus],
      content.latest ? CHECKPOINT_LABELS[content.latest.checkpoint] : null,
      content.latest ? stamp(content.latest.captured_at, timezone) : null,
      content.views,
      content.latest?.likes,
      content.latest?.comments,
      content.latest?.shares,
      content.latest?.saves,
    ]),
  );
}

export function creatorsCsv(report: CampaignReport): string {
  const rows = report.creators.map((creator): CsvCell[] => [
    creator.name,
    creator.referralCode,
    creator.platforms.map((platform) => SOCIAL_PLATFORM_LABELS[platform]).join(", "),
    creator.contents,
    creator.views,
    creator.clicks,
    creator.registrants,
  ]);
  if (report.registrantsWithoutCode > 0) {
    rows.push(["Tanpa kode referal", null, null, null, null, null, report.registrantsWithoutCode]);
  }
  const { summary } = report;
  rows.push([
    "Total",
    null,
    null,
    summary.contents.actual,
    summary.views.actual,
    summary.validClicks,
    summary.registrants.actual,
  ]);

  return toCsv(
    ["Kreator", "Kode referal", "Platform", "Konten tayang", "Views", "Klik valid", "Pendaftar"],
    rows,
  );
}
