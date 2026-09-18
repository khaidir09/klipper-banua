import {
  cumulativeViewsByCheckpoint,
  latestSnapshot,
  progressPercent,
  totalRegistrants,
  totalViews,
  type CumulativePoint,
  type SnapshotPoint,
} from "@/lib/calculations/campaign-metrics";
import type { AssignmentStatus } from "@/lib/constants/campaigns";
import type { LiveStatus } from "@/lib/constants/contents";
import type { SocialPlatform } from "@/lib/constants/creators";

/**
 * Client report (FR-M9-02, FR-M9-04). The model only carries reach and
 * results; it has no money fields at all, so internal finance (creator fees,
 * margin) cannot leak into the printout or the CSV files (FR-M9-03).
 */

export type ReportSnapshot = SnapshotPoint & {
  likes: number | null;
  comments: number | null;
  shares: number | null;
  saves: number | null;
};

export type ReportInput = {
  targets: { contents: number; views: number; registrants: number };
  assignments: {
    id: string;
    name: string;
    referralCode: string;
    status: AssignmentStatus;
  }[];
  /** Content that went live (`posted_at` set), in any live status. */
  contents: {
    id: string;
    assignmentId: string;
    platform: SocialPlatform;
    posted_url: string | null;
    posted_at: string;
    live_status: LiveStatus;
    snapshots: ReportSnapshot[];
  }[];
  clicks: { assignmentId: string; human: number }[];
  reports: { assignmentId: string | null; registrant_count: number }[];
};

export type ReportTarget = { actual: number; target: number; pct: number | null };

export type ReportCreatorRow = {
  assignmentId: string;
  name: string;
  referralCode: string;
  platforms: SocialPlatform[];
  contents: number;
  views: number;
  clicks: number;
  registrants: number;
};

export type ReportContentRow = {
  id: string;
  creatorName: string;
  referralCode: string;
  platform: SocialPlatform;
  postedUrl: string | null;
  postedAt: string;
  liveStatus: LiveStatus;
  latest: ReportSnapshot | null;
  views: number;
};

export type CampaignReport = {
  summary: {
    contents: ReportTarget;
    views: ReportTarget;
    registrants: ReportTarget;
    /** PRD 8.4 `total_clicks_valid`: clicks not flagged as bots. */
    validClicks: number;
  };
  chart: CumulativePoint[];
  creators: ReportCreatorRow[];
  /** Registrants reported without a referral code (PRD 8.4 counts them). */
  registrantsWithoutCode: number;
  contents: ReportContentRow[];
};

const target = (actual: number, goal: number): ReportTarget => ({
  actual,
  target: goal,
  pct: progressPercent(actual, goal),
});

export function buildCampaignReport(input: ReportInput): CampaignReport {
  const posted = input.contents.map((content) => ({ ...content, posted: true }));
  const views = totalViews(posted);
  const registrants = totalRegistrants(input.reports);
  const validClicks = input.clicks.reduce((sum, row) => sum + row.human, 0);

  const creators = input.assignments.flatMap((assignment): ReportCreatorRow[] => {
    const own = posted.filter((content) => content.assignmentId === assignment.id);
    const row = {
      assignmentId: assignment.id,
      name: assignment.name,
      referralCode: assignment.referralCode,
      platforms: [...new Set(own.map((content) => content.platform))],
      contents: own.length,
      views: totalViews(own),
      clicks: input.clicks.find((c) => c.assignmentId === assignment.id)?.human ?? 0,
      registrants: totalRegistrants(
        input.reports.filter((report) => report.assignmentId === assignment.id),
      ),
    };
    // A creator who withdrew without any result is noise for the client.
    const withdrewEmpty =
      assignment.status === "mundur" && !row.contents && !row.clicks && !row.registrants;
    return withdrewEmpty ? [] : [row];
  });

  const byId = new Map(input.assignments.map((assignment) => [assignment.id, assignment]));
  const contents = [...input.contents]
    .sort((a, b) => a.posted_at.localeCompare(b.posted_at))
    .map((content) => {
      const latest = latestSnapshot(content.snapshots);
      return {
        id: content.id,
        creatorName: byId.get(content.assignmentId)?.name ?? "–",
        referralCode: byId.get(content.assignmentId)?.referralCode ?? "",
        platform: content.platform,
        postedUrl: content.posted_url,
        postedAt: content.posted_at,
        liveStatus: content.live_status,
        latest,
        views: latest?.views ?? 0,
      };
    });

  return {
    summary: {
      contents: target(input.contents.length, input.targets.contents),
      views: target(views, input.targets.views),
      registrants: target(registrants, input.targets.registrants),
      validClicks,
    },
    chart: cumulativeViewsByCheckpoint(posted),
    creators,
    registrantsWithoutCode: totalRegistrants(
      input.reports.filter((report) => report.assignmentId === null),
    ),
    contents,
  };
}
