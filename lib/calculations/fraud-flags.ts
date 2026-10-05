import { FRAUD_THRESHOLDS } from "@/lib/constants/clips";

/**
 * Risk flags for the verification queue (FR-M18-07). Pure hints for the
 * verifier: nothing here approves, rejects or cancels a clip.
 */

export type FraudFlagCode =
  "views_spike" | "low_engagement" | "views_decreased" | "posted_soon_after_join";

export type FraudFlag = { code: FraudFlagCode; message: string };

export type FraudFlagInput = {
  /** The submission being verified. */
  claim: { views: number; likes: number; comments: number; shares: number };
  /** Views of the last accepted submission of this clip, if any. */
  previousViews: number | null;
  postedAt: Date | string;
  /** When the kliper joined the campaign; null for team-made assignments. */
  joinedAt: Date | string | null;
};

const formatter = new Intl.NumberFormat("id-ID");

export function fraudFlags(
  input: FraudFlagInput,
  thresholds: typeof FRAUD_THRESHOLDS = FRAUD_THRESHOLDS,
): FraudFlag[] {
  const flags: FraudFlag[] = [];
  const { claim, previousViews } = input;

  if (previousViews !== null && previousViews > 0) {
    const gain = claim.views - previousViews;
    if (claim.views >= previousViews * thresholds.spikeRatio && gain >= thresholds.spikeMinGain) {
      flags.push({
        code: "views_spike",
        message: `Lonjakan views: dari ${formatter.format(previousViews)} menjadi ${formatter.format(claim.views)}.`,
      });
    }
  }

  if (previousViews !== null && claim.views < previousViews) {
    flags.push({
      code: "views_decreased",
      message: `Views menurun dari ${formatter.format(previousViews)} (terverifikasi sebelumnya).`,
    });
  }

  if (claim.views >= thresholds.engagementMinViews) {
    const interactions = claim.likes + claim.comments + claim.shares;
    const rate = interactions / claim.views;
    if (rate < thresholds.minEngagementRate) {
      const pct = (rate * 100).toLocaleString("id-ID", { maximumFractionDigits: 2 });
      flags.push({
        code: "low_engagement",
        message: `Interaksi hanya ${pct}% dari views (atau tidak diisi); periksa halaman klip.`,
      });
    }
  }

  if (input.joinedAt) {
    const minutes =
      (new Date(input.postedAt).getTime() - new Date(input.joinedAt).getTime()) / 60_000;
    if (minutes < thresholds.postedSoonAfterJoinMinutes) {
      flags.push({
        code: "posted_soon_after_join",
        message:
          "Tayang kurang dari 30 menit setelah bergabung; cek tanggal unggah asli di platform.",
      });
    }
  }

  return flags;
}
