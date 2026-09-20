import { describe, expect, it } from "vitest";
import {
  canDeleteContent,
  canEditDraft,
  canMarkPosted,
  canMarkRemoved,
  canCreatorEditDraft,
  canProposePosted,
  canReview,
  canSubmitMetric,
  canSubmitNewDraft,
  checklistItemsFor,
  isChecklistComplete,
} from "@/lib/contents/review";
import { formatDateTimeInput, zonedInputToUtc } from "@/lib/format/date";
import {
  contentCreateSchema,
  draftUpdateSchema,
  postedSchema,
  proposedPostedSchema,
  removedSchema,
  reviewSchema,
} from "@/lib/validation/contents";

const full = { sesuai_brief: true, tanpa_larangan: true, label_berbayar: true, info_akurat: true };

describe("review checklist (FR-M6-03)", () => {
  it("includes the paid-label item only when the campaign requires it", () => {
    expect(checklistItemsFor(true).map((i) => i.key)).toContain("label_berbayar");
    expect(checklistItemsFor(false).map((i) => i.key)).not.toContain("label_berbayar");
  });

  it("is complete only when every applicable item is checked", () => {
    expect(isChecklistComplete(full, true)).toBe(true);
    expect(isChecklistComplete({ ...full, label_berbayar: false }, true)).toBe(false);
    expect(isChecklistComplete({ ...full, label_berbayar: false }, false)).toBe(true);
    expect(isChecklistComplete({ ...full, info_akurat: undefined }, false)).toBe(false);
  });
});

describe("content state rules", () => {
  it("reviews only pending content", () => {
    expect(canReview("menunggu_review")).toBe(true);
    expect(canReview("revisi")).toBe(false);
    expect(canReview("disetujui")).toBe(false);
  });

  it("accepts a new draft only after a revision request", () => {
    expect(canSubmitNewDraft("revisi")).toBe(true);
    expect(canSubmitNewDraft("ditolak")).toBe(false);
    expect(canEditDraft("menunggu_review")).toBe(true);
    expect(canEditDraft("disetujui")).toBe(false);
  });

  it("fills the live URL only for approved content (FR-M6-04)", () => {
    expect(canMarkPosted("disetujui")).toBe(true);
    expect(canMarkPosted("menunggu_review")).toBe(false);
    expect(canMarkPosted("revisi")).toBe(false);
    expect(canMarkPosted("ditolak")).toBe(false);
  });

  it("marks removal only for live content", () => {
    expect(canMarkRemoved("disetujui", "tayang")).toBe(true);
    expect(canMarkRemoved("disetujui", "belum_tayang")).toBe(false);
    expect(canMarkRemoved("disetujui", "dihapus")).toBe(false);
  });

  it("deletes only content that was never reviewed", () => {
    expect(canDeleteContent("menunggu_review", 0)).toBe(true);
    expect(canDeleteContent("menunggu_review", 1)).toBe(false);
    expect(canDeleteContent("ditolak", 0)).toBe(false);
  });
});

describe("zonedInputToUtc", () => {
  it("reads wall-clock time in WITA by default", () => {
    expect(zonedInputToUtc("2026-10-05T10:00")).toBe("2026-10-05T02:00:00.000Z");
  });

  it("reads wall-clock time in WIB for WIB users", () => {
    expect(zonedInputToUtc("2026-10-05T10:00", "Asia/Jakarta")).toBe("2026-10-05T03:00:00.000Z");
  });

  it("crosses the day boundary correctly", () => {
    expect(zonedInputToUtc("2026-10-05T06:30")).toBe("2026-10-04T22:30:00.000Z");
  });

  it("round-trips with formatDateTimeInput", () => {
    const utc = zonedInputToUtc("2026-10-05T23:45", "Asia/Jakarta");
    expect(formatDateTimeInput(utc, "Asia/Jakarta")).toBe("2026-10-05T23:45");
  });

  it("rejects anything but a datetime-local value", () => {
    expect(() => zonedInputToUtc("2026-10-05")).toThrow(TypeError);
    expect(() => zonedInputToUtc("2026-10-05T10:00:00Z")).toThrow(TypeError);
  });
});

const assignment = "3f6f2a57-6f5d-4f0f-9d8a-2a8a2f0b8c11";

describe("contentCreateSchema (FR-M6-01)", () => {
  it("accepts a draft link or an uploaded file", () => {
    expect(
      contentCreateSchema.safeParse({
        campaign_creator_id: assignment,
        platform: "tiktok",
        draft_url: "https://drive.google.com/x",
        draft_file_path: "",
        caption_draft: "Kuliah di Banua!",
      }).success,
    ).toBe(true);
    expect(
      contentCreateSchema.safeParse({
        campaign_creator_id: assignment,
        platform: "instagram",
        draft_url: "",
        draft_file_path: `${assignment}/draf.mp4`,
        caption_draft: "",
      }).success,
    ).toBe(true);
  });

  it("requires one of the two draft sources", () => {
    const result = contentCreateSchema.safeParse({
      campaign_creator_id: assignment,
      platform: "tiktok",
      draft_url: "",
      draft_file_path: "",
      caption_draft: "",
    });
    expect(result.success).toBe(false);
  });

  it("is idempotent for server re-validation", () => {
    const once = draftUpdateSchema.parse({
      platform: "tiktok",
      draft_url: "https://drive.google.com/x",
      draft_file_path: "",
      caption_draft: " caption ",
    });
    expect(draftUpdateSchema.parse(once)).toEqual(once);
  });
});

describe("reviewSchema (FR-M6-02)", () => {
  it("rejects a revision request without notes", () => {
    const result = reviewSchema.safeParse({ decision: "revisi", checklist: {}, notes: "   " });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["notes"]);
  });

  it("accepts a revision with notes and defaults unchecked items to false", () => {
    const result = reviewSchema.parse({
      decision: "revisi",
      checklist: {},
      notes: "Tambah label.",
    });
    expect(result.checklist.sesuai_brief).toBe(false);
  });

  it("is idempotent for server re-validation", () => {
    const once = reviewSchema.parse({ decision: "disetujui", checklist: full, notes: "" });
    expect(reviewSchema.parse(once)).toEqual(once);
  });
});

describe("posted and removed forms", () => {
  it("requires a live URL and a local date-time", () => {
    expect(
      postedSchema.safeParse({
        posted_url: "https://tiktok.com/@x/1",
        posted_at: "2026-10-05T10:00",
      }).success,
    ).toBe(true);
    expect(postedSchema.safeParse({ posted_url: "", posted_at: "2026-10-05T10:00" }).success).toBe(
      false,
    );
    expect(
      postedSchema.safeParse({ posted_url: "https://tiktok.com/@x/1", posted_at: "" }).success,
    ).toBe(false);
    expect(removedSchema.safeParse({ removed_at: "2026-10-40T10:00" }).success).toBe(false);
  });
});

describe("creator portal rules (M13)", () => {
  it("lets a creator work on a draft only before it is reviewed", () => {
    expect(canCreatorEditDraft("menunggu_review")).toBe(true);
    expect(canCreatorEditDraft("revisi")).toBe(true);
    expect(canCreatorEditDraft("disetujui")).toBe(false);
    expect(canCreatorEditDraft("ditolak")).toBe(false);
  });

  it("allows a live report only for approved content that is not live (FR-M13-09)", () => {
    expect(canProposePosted("disetujui", "belum_tayang")).toBe(true);
    expect(canProposePosted("disetujui", "tayang")).toBe(false);
    expect(canProposePosted("menunggu_review", "belum_tayang")).toBe(false);
  });

  it("allows metric submissions only for live content (FR-M13-06)", () => {
    expect(canSubmitMetric("disetujui", "tayang")).toBe(true);
    // Removed content still had a life worth reporting on.
    expect(canSubmitMetric("disetujui", "dihapus")).toBe(true);
    expect(canSubmitMetric("disetujui", "belum_tayang")).toBe(false);
    expect(canSubmitMetric("revisi", "tayang")).toBe(false);
  });
});

describe("proposedPostedSchema (FR-M13-09)", () => {
  const contentId = "de300000-0000-4000-8000-0000000000d1";

  it("accepts a live URL with a wall-clock time", () => {
    const parsed = proposedPostedSchema.safeParse({
      content_id: contentId,
      proposed_posted_url: "https://www.tiktok.com/@a/video/1",
      proposed_posted_at: "2026-10-05T19:30",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an empty URL or a missing time", () => {
    expect(
      proposedPostedSchema.safeParse({
        content_id: contentId,
        proposed_posted_url: "",
        proposed_posted_at: "2026-10-05T19:30",
      }).success,
    ).toBe(false);
    expect(
      proposedPostedSchema.safeParse({
        content_id: contentId,
        proposed_posted_url: "https://www.tiktok.com/@a/video/1",
        proposed_posted_at: "",
      }).success,
    ).toBe(false);
  });
});
