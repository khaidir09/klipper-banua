import { describe, expect, it } from "vitest";
import type { z } from "zod";
import {
  assetSchema,
  assignmentCreateSchema,
  assignmentUpdateSchema,
  campaignSchema,
} from "@/lib/validation/campaigns";
import { clientContactSchema, clientSchema } from "@/lib/validation/clients";
import { bankAccountSchema, creatorSchema, termsSchema } from "@/lib/validation/creators";

/**
 * Forms validate on the client and submit Zod's *output* to Server Actions,
 * which validate again. Every form schema must therefore accept its own
 * output unchanged: parse(parse(x)) === parse(x).
 */
function expectIdempotent(schema: z.ZodType, input: unknown) {
  const once = schema.parse(input);
  expect(schema.parse(once)).toEqual(once);
}

const uuid = "3f6f2a57-6f5d-4f0f-9d8a-2a8a2f0b8c11";

describe("form schemas are idempotent", () => {
  it("campaign, with and without optional values", () => {
    const base = {
      client_id: uuid,
      code: "pmb x 2026",
      name: "PMB",
      brief: "",
      must_do: "a\nb",
      must_not: "",
      hashtags: "#a b",
      paid_label_required: true,
      landing_url: "",
      start_date: "2026-11-01",
      end_date: "2026-11-30",
      min_live_days: "30",
      package_price: "Rp 12.500.000",
      target_contents: "10",
      target_views: "100.000",
      target_registrants: "",
      default_base_fee: "300.000",
      default_bonus_per_1000_views: "",
      default_bonus_per_registrant: "",
      default_views_bonus_cap: "",
      access: "terbuka",
      rate_per_1000_views: "10.000",
      creator_budget: "",
      max_payout_per_clip: "",
      max_payout_per_creator: "",
      min_views_to_earn: "0",
      max_clips_per_creator: "3",
      allowed_platforms: ["instagram", "tiktok"],
      local_only: true,
      claim_grace_days: "3",
    };
    expectIdempotent(campaignSchema, base);
    expectIdempotent(campaignSchema, {
      ...base,
      landing_url: "https://pmb.x.ac.id",
      default_views_bonus_cap: "1.000.000",
      max_payout_per_clip: "250.000",
    });
  });

  it("assignments with generated and manual codes", () => {
    const base = {
      creator_id: uuid,
      status: "diundang",
      contents_committed: "1",
      base_fee: "",
      bonus_per_1000_views: "",
      bonus_per_registrant: "",
      views_bonus_cap: "",
      referral_code: "",
      tracking_slug: "",
    };
    expectIdempotent(assignmentCreateSchema, base);
    expectIdempotent(assignmentCreateSchema, {
      ...base,
      referral_code: "kmps-26",
      tracking_slug: "Siti-PMB",
      base_fee: "400.000",
    });
    const { creator_id: _creatorId, ...update } = base;
    void _creatorId;
    expectIdempotent(assignmentUpdateSchema, update);
  });

  it("asset", () => {
    expectIdempotent(assetSchema, {
      title: "Video",
      type: "tautan",
      external_url: "https://drive.x/y",
      notes: "",
    });
    expectIdempotent(assetSchema, { title: "Foto", type: "foto", external_url: "", notes: "" });
  });

  it("phase 1 forms", () => {
    expectIdempotent(clientSchema, {
      name: "Kampus",
      type: "instansi",
      city: "",
      province: "Kalimantan Selatan",
      address: "",
      notes: "",
    });
    expectIdempotent(clientContactSchema, {
      name: "Bu Ratna",
      position: "",
      phone_wa: "0812 3456 7890",
      email: "Ratna@X.id",
      is_primary: true,
    });
    expectIdempotent(creatorSchema, {
      full_name: "Siti",
      stage_name: "",
      phone_wa: "",
      email: "",
      city: "",
      province: "Kalimantan Selatan",
      birth_date: "1999-05-20",
      niches: ["kuliner"],
      tier: "nano",
      status: "prospek",
      notes: "",
    });
    expectIdempotent(termsSchema, { terms_version: "v1", terms_agreed_at: "2026-09-15" });
    expectIdempotent(bankAccountSchema, {
      bank_name: "Bank Kalsel",
      account_number: "1234-5678-90",
      account_holder: "Siti",
    });
  });
});
