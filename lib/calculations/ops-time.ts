import { OPS_ACTIVITIES, type OpsActivity } from "@/lib/constants/ops";

/**
 * FR-M12-02: time spent per activity on a campaign, to see which work is
 * worth automating next. Pure; minutes are whole numbers.
 */

export type OpsTimeRecapRow = {
  activity: OpsActivity;
  minutes: number;
  entries: number;
  /** Share of the campaign total in percent; null when nothing was logged. */
  sharePct: number | null;
};

export type OpsTimeRecap = {
  rows: OpsTimeRecapRow[];
  totalMinutes: number;
  totalEntries: number;
};

export function opsTimeRecap(entries: { activity: OpsActivity; minutes: number }[]): OpsTimeRecap {
  const totalMinutes = entries.reduce((sum, entry) => sum + entry.minutes, 0);

  const rows = OPS_ACTIVITIES.map((activity) => {
    const matching = entries.filter((entry) => entry.activity === activity);
    const minutes = matching.reduce((sum, entry) => sum + entry.minutes, 0);
    return {
      activity,
      minutes,
      entries: matching.length,
      sharePct: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : null,
    };
  })
    // Most time-consuming first; ties keep the fixed activity order.
    .sort((a, b) => b.minutes - a.minutes);

  return { rows, totalMinutes, totalEntries: entries.length };
}

/** `95` → `1 jam 35 menit`, `60` → `1 jam`, `45` → `45 menit`. */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) return `${rest} menit`;
  return rest === 0 ? `${hours} jam` : `${hours} jam ${rest} menit`;
}
