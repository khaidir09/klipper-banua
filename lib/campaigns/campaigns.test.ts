import { describe, expect, it } from "vitest";
import { activationBlockers, canTransition, isCampaignLocked } from "@/lib/campaigns/status";
import { buildWhatsappBrief } from "@/lib/campaigns/whatsapp-brief";

describe("canTransition", () => {
  it("allows the forward lifecycle and cancellation", () => {
    expect(canTransition("draft", "aktif")).toBe(true);
    expect(canTransition("draft", "dibatalkan")).toBe(true);
    expect(canTransition("aktif", "selesai")).toBe(true);
    expect(canTransition("aktif", "dibatalkan")).toBe(true);
  });

  it("blocks going backwards or skipping activation", () => {
    expect(canTransition("aktif", "draft")).toBe(false);
    expect(canTransition("draft", "selesai")).toBe(false);
    expect(canTransition("selesai", "aktif")).toBe(false);
    expect(canTransition("dibatalkan", "draft")).toBe(false);
  });
});

describe("activationBlockers (FR-M4-02)", () => {
  it("requires a landing URL for registration campaigns", () => {
    const blockers = activationBlockers({
      objective: "pendaftar",
      landingUrl: "  ",
      assignmentStatuses: ["bergabung"],
    });
    expect(blockers).toHaveLength(1);
    expect(blockers[0]).toContain("URL tujuan");
  });

  it("does not require a landing URL for awareness campaigns", () => {
    expect(
      activationBlockers({
        objective: "awareness",
        landingUrl: null,
        assignmentStatuses: ["diundang"],
      }),
    ).toEqual([]);
  });

  it("requires at least one creator who has not withdrawn", () => {
    expect(
      activationBlockers({
        objective: "awareness",
        landingUrl: null,
        assignmentStatuses: ["mundur"],
      }),
    ).toHaveLength(1);
    expect(
      activationBlockers({ objective: "pendaftar", landingUrl: null, assignmentStatuses: [] }),
    ).toHaveLength(2);
  });
});

describe("isCampaignLocked", () => {
  it("locks closed campaigns only", () => {
    expect(isCampaignLocked("selesai")).toBe(true);
    expect(isCampaignLocked("dibatalkan")).toBe(true);
    expect(isCampaignLocked("aktif")).toBe(false);
    expect(isCampaignLocked("draft")).toBe(false);
  });
});

describe("buildWhatsappBrief", () => {
  const base = {
    creatorName: "Siti",
    campaignName: "PMB 2026",
    campaignCode: "PMB-UBS-2026-01",
    clientName: "Universitas Banua Sejahtera",
    startDate: "1 Okt 2026",
    endDate: "31 Okt 2026",
    brief: "Ceritakan pengalaman kuliah.",
    mustDo: ["Sebut beasiswa", "Tunjukkan kampus"],
    mustNot: ["Menyebut kampus lain"],
    hashtags: ["#PMBUBS", "#KuliahDiBanua"],
    paidLabelRequired: true,
    minLiveDays: 30,
    contentsCommitted: 2,
    referralCode: "KMPS26",
    trackingUrl: "https://app.example/r/siti-a2b3",
  };

  it("contains the brief, rules, code and link", () => {
    const text = buildWhatsappBrief(base);
    expect(text).toContain("PMB-UBS-2026-01");
    expect(text).toContain("• Sebut beasiswa");
    expect(text).toContain("*Larangan*\n• Menyebut kampus lain");
    expect(text).toContain("#PMBUBS #KuliahDiBanua");
    expect(text).toContain("KMPS26");
    expect(text).toContain("https://app.example/r/siti-a2b3");
    expect(text).toContain("label konten berbayar");
  });

  it("omits empty sections", () => {
    const text = buildWhatsappBrief({
      ...base,
      brief: "",
      mustDo: [],
      mustNot: [],
      hashtags: [],
      paidLabelRequired: false,
    });
    expect(text).not.toContain("*Brief*");
    expect(text).not.toContain("*Wajib*");
    expect(text).not.toContain("*Larangan*");
    expect(text).not.toContain("*Hashtag*");
    expect(text).not.toContain("label konten berbayar");
  });
});
