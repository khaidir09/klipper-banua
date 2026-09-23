/**
 * Demo data for local development, staging and the end-to-end test
 * (PRD section 11, phase 7): 1 campus with a contact, 8 creators and 1 draft
 * campaign, so the whole flow of section 5.2 can be run from the start, plus
 * a second running campaign for the creator portal (phase 10). With
 * SEED_CREATOR_EMAIL/PASSWORD set, the first creator also gets a portal
 * account (phase 9, M13).
 *
 *   npm run seed:demo
 *
 * Idempotent: fixed ids, upserts. It refuses to run against a non-local
 * Supabase unless ALLOW_DEMO_SEED=1, so demo data never lands in production.
 * The names, phone numbers and domains are fictitious.
 */
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

config({ path: ".env.local", quiet: true });

export const DEMO = {
  clientId: "de300000-0000-4000-8000-000000000001",
  campaignId: "de300000-0000-4000-8000-0000000000c1",
  campaignCode: "DEMO-PMB-2026",
  // Second campaign, always running, so the creator portal (M13) has a brief
  // to work on: the first one is closed by the end-to-end owner flow.
  portalCampaignId: "de300000-0000-4000-8000-0000000000c2",
  portalCampaignCode: "DEMO-PORTAL-2026",
  portalAssignmentId: "de300000-0000-4000-8000-0000000000b2",
  portalLiveContentId: "de300000-0000-4000-8000-0000000000d1",
  portalRevisionContentId: "de300000-0000-4000-8000-0000000000d2",
  /** Primary contact of the demo client, who gets the client portal account. */
  contactId: "de300000-0000-4000-8000-0000000000b1",
} as const;

const creatorId = (n: number) => `de300000-0000-4000-8000-0000000000a${n}`;
const TERMS_VERSION = "SKK-2026.1";

type CreatorSeed = {
  n: number;
  full_name: string;
  stage_name: string;
  city: string;
  province: string;
  birth_date: string;
  niches: string[];
  tier: Database["public"]["Enums"]["creator_tier"];
  status: Database["public"]["Enums"]["creator_status"];
  platform: Database["public"]["Enums"]["social_platform"];
  followers: number;
  kalimantanPct: number;
  topCities: string;
  bank?: { bank_name: string; account_number: string };
};

const CREATORS: CreatorSeed[] = [
  {
    n: 1,
    full_name: "Rina Aulia",
    stage_name: "rina.kuliner",
    city: "Banjarmasin",
    province: "Kalimantan Selatan",
    birth_date: "2001-03-14",
    niches: ["kuliner", "gaya_hidup"],
    tier: "mikro",
    status: "aktif",
    platform: "tiktok",
    followers: 25400,
    kalimantanPct: 78.5,
    topCities: "Banjarmasin, Banjarbaru, Martapura",
    bank: { bank_name: "Bank Kalsel", account_number: "0012345601" },
  },
  {
    n: 2,
    full_name: "Ahmad Fauzi",
    stage_name: "fauzi.kampus",
    city: "Banjarbaru",
    province: "Kalimantan Selatan",
    birth_date: "2000-08-02",
    niches: ["pendidikan"],
    tier: "mikro",
    status: "terverifikasi",
    platform: "instagram",
    followers: 12800,
    kalimantanPct: 82,
    topCities: "Banjarbaru, Banjarmasin",
    bank: { bank_name: "BRI", account_number: "0012345602" },
  },
  {
    n: 3,
    full_name: "Dewi Lestari",
    stage_name: "dewi.lifestyle",
    city: "Samarinda",
    province: "Kalimantan Timur",
    birth_date: "1998-11-21",
    niches: ["gaya_hidup", "kecantikan"],
    tier: "menengah",
    status: "terverifikasi",
    platform: "instagram",
    followers: 48200,
    kalimantanPct: 64,
    topCities: "Samarinda, Balikpapan, Tenggarong",
    bank: { bank_name: "Bank Kaltimtara", account_number: "0012345603" },
  },
  {
    n: 4,
    full_name: "Yusuf Ramadhan",
    stage_name: "yusufgaming",
    city: "Balikpapan",
    province: "Kalimantan Timur",
    birth_date: "2002-01-09",
    niches: ["hiburan", "teknologi"],
    tier: "nano",
    status: "terverifikasi",
    platform: "tiktok",
    followers: 8300,
    kalimantanPct: 71,
    topCities: "Balikpapan, Samarinda",
  },
  {
    n: 5,
    full_name: "Nur Hasanah",
    stage_name: "nurhasanah.edu",
    city: "Pontianak",
    province: "Kalimantan Barat",
    birth_date: "1999-06-30",
    niches: ["pendidikan", "keluarga"],
    tier: "nano",
    status: "aktif",
    platform: "youtube",
    followers: 3100,
    kalimantanPct: 88,
    topCities: "Pontianak, Kubu Raya",
  },
  {
    n: 6,
    full_name: "Bagus Pratama",
    stage_name: "bagus.olahraga",
    city: "Palangka Raya",
    province: "Kalimantan Tengah",
    birth_date: "2001-12-05",
    niches: ["olahraga"],
    tier: "mikro",
    status: "prospek",
    platform: "tiktok",
    followers: 15600,
    kalimantanPct: 69,
    topCities: "Palangka Raya, Sampit",
  },
  {
    n: 7,
    full_name: "Maya Sari",
    stage_name: "mayasari.beauty",
    city: "Tarakan",
    province: "Kalimantan Utara",
    birth_date: "2000-04-18",
    niches: ["kecantikan"],
    tier: "mikro",
    status: "prospek",
    platform: "instagram",
    followers: 30100,
    kalimantanPct: 58,
    topCities: "Tarakan, Tanjung Selor",
  },
  {
    n: 8,
    full_name: "Rizky Hidayat",
    stage_name: "rizky.h",
    city: "Banjarmasin",
    province: "Kalimantan Selatan",
    birth_date: "1997-09-12",
    niches: ["hiburan"],
    tier: "nano",
    status: "diblokir",
    platform: "tiktok",
    followers: 5200,
    kalimantanPct: 75,
    topCities: "Banjarmasin",
  },
];

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
    process.exit(1);
  }
  return value;
}

function isLocal(url: string) {
  const host = new URL(url).hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

type PortalRole = "creator" | "client";

/**
 * Creates or repairs a portal account and links it to the row it belongs to:
 * a creator (M13, FR-M13-01) or a client contact (M14, FR-M14-01). Skipped
 * when the matching SEED_*_EMAIL/PASSWORD pair is unset.
 */
async function seedPortalAccount(
  admin: SupabaseClient<Database>,
  options: { role: PortalRole; rowId: string; fullName: string },
): Promise<string | null> {
  const prefix = options.role === "creator" ? "SEED_CREATOR" : "SEED_CLIENT";
  const email = process.env[`${prefix}_EMAIL`];
  const password = process.env[`${prefix}_PASSWORD`];
  if (!email || !password) return null;

  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) throw new Error(`portal account: ${listError.message}`);

  const existing = list.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  const metadata = { full_name: options.fullName };
  // The role lives in app_metadata: handle_new_user ignores user_metadata.role.
  const appMetadata = { role: options.role };

  let userId: string;
  if (existing) {
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: metadata,
      app_metadata: appMetadata,
    });
    if (error) throw new Error(`portal account: ${error.message}`);
    userId = existing.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: metadata,
      app_metadata: appMetadata,
    });
    if (error || !data.user) throw new Error(`portal account: ${error?.message ?? "unknown"}`);
    userId = data.user.id;
  }

  // The auth trigger created the profile; make sure the role stuck and the
  // account is active, then link it to its row.
  const { error: profileError } = await admin
    .from("profiles")
    .update({ full_name: options.fullName, role: options.role, is_active: true })
    .eq("id", userId);
  if (profileError) throw new Error(`portal profile: ${profileError.message}`);

  const table = options.role === "creator" ? "creators" : "client_contacts";
  const { error: linkError } = await admin
    .from(table)
    .update({ profile_id: userId, portal_invited_at: new Date().toISOString() })
    .eq("id", options.rowId);
  if (linkError) throw new Error(`portal link: ${linkError.message}`);

  return email;
}

/**
 * A running campaign for the creator portal (M13, phase 10): two assignments,
 * one approved content that is already live (ready for a metric submission)
 * and one waiting for a new draft after a revision request.
 */
async function seedPortalCampaign(
  admin: SupabaseClient<Database>,
  ownerId: string | null,
  proof: Buffer,
  now: Date,
) {
  const check = (label: string, error: { message: string } | null) => {
    if (error) throw new Error(`${label}: ${error.message}`);
  };
  const postedAt = addDays(now, -3);

  check(
    "portal campaign",
    (
      await admin.from("campaigns").upsert({
        id: DEMO.portalCampaignId,
        client_id: DEMO.clientId,
        code: DEMO.portalCampaignCode,
        name: "Open House Universitas Demo Borneo",
        objective: "pendaftar",
        brief:
          "Ajak siswa kelas 12 di Banjarmasin dan sekitarnya datang ke open house kampus. Tunjukkan fasilitas, jurusan favorit, dan cara mendaftar lewat kode referalmu.",
        must_do: [
          "Sebutkan tanggal open house di video",
          "Cantumkan tautan pendaftaran di bio",
          "Tandai akun kampus di caption",
        ],
        must_not: ["Menjanjikan beasiswa penuh", "Memakai musik tanpa izin"],
        hashtags: ["#OpenHouseDemoBorneo", "#KuliahDiBanua"],
        paid_label_required: true,
        landing_url: "https://pmb.kampus-demo.example/open-house",
        start_date: iso(addDays(now, -10)),
        end_date: iso(addDays(now, 20)),
        min_live_days: 14,
        status: "aktif",
        package_price: 9_000_000,
        target_contents: 6,
        target_views: 80_000,
        target_registrants: 20,
        default_base_fee: 300_000,
        default_bonus_per_1000_views: 4_000,
        default_bonus_per_registrant: 20_000,
        default_views_bonus_cap: 200_000,
        created_by: ownerId,
      })
    ).error,
  );

  check(
    "portal asset",
    (
      await admin.from("campaign_assets").upsert({
        id: "de300000-0000-4000-8000-0000000000f1",
        campaign_id: DEMO.portalCampaignId,
        title: "Panduan open house (tautan)",
        type: "tautan",
        external_url: "https://kampus-demo.example/panduan-open-house",
        notes: "Baca sebelum membuat konten.",
        created_by: ownerId,
      })
    ).error,
  );

  check(
    "portal assignments",
    (
      await admin.from("campaign_creators").upsert([
        {
          id: DEMO.portalAssignmentId,
          campaign_id: DEMO.portalCampaignId,
          creator_id: creatorId(1),
          status: "bergabung",
          contents_committed: 2,
          referral_code: "DEMPRA",
          tracking_slug: "demo-portal-rina",
          joined_at: addDays(now, -9).toISOString(),
          // FR-M13-10: both demo creators accepted their brief in the portal.
          creator_confirmed_at: addDays(now, -9).toISOString(),
          created_by: ownerId,
        },
        {
          id: "de300000-0000-4000-8000-0000000000b3",
          campaign_id: DEMO.portalCampaignId,
          creator_id: creatorId(2),
          status: "bergabung",
          contents_committed: 1,
          referral_code: "DEMPFZ",
          tracking_slug: "demo-portal-fauzi",
          joined_at: addDays(now, -9).toISOString(),
          creator_confirmed_at: addDays(now, -9).toISOString(),
          created_by: ownerId,
        },
      ])
    ).error,
  );

  // Content is created the way the app creates it - waiting for review - and
  // the review rows below move it to its demo state. Review history is
  // append-only, so this whole block runs only on a fresh demo campaign.
  const { data: liveContent } = await admin
    .from("contents")
    .select("id")
    .eq("id", DEMO.portalLiveContentId)
    .maybeSingle();

  if (!liveContent) {
    check(
      "portal contents",
      (
        await admin.from("contents").insert([
          {
            id: DEMO.portalLiveContentId,
            campaign_creator_id: DEMO.portalAssignmentId,
            platform: "tiktok",
            draft_url: "https://drive.example/demo-open-house-draft",
            caption_draft: "Open house kampus impianmu! Pakai kode DEMPRA saat daftar ya.",
            created_by: ownerId,
          },
          {
            id: DEMO.portalRevisionContentId,
            campaign_creator_id: DEMO.portalAssignmentId,
            platform: "instagram",
            draft_url: "https://drive.example/demo-open-house-draft-2",
            caption_draft: "Jangan lupa datang ke open house!",
            created_by: ownerId,
          },
        ])
      ).error,
    );

    check(
      "portal review (disetujui)",
      (
        await admin.from("content_reviews").insert({
          content_id: DEMO.portalLiveContentId,
          decision: "disetujui",
          checklist: {
            sesuai_brief: true,
            tanpa_larangan: true,
            label_berbayar: true,
            info_akurat: true,
          },
          notes: "Sudah sesuai brief, silakan tayang.",
          reviewer_id: ownerId,
        })
      ).error,
    );

    check(
      "portal live fields",
      (
        await admin
          .from("contents")
          .update({
            posted_url: "https://www.tiktok.com/@rina.kuliner/video/demo-open-house",
            posted_at: postedAt.toISOString(),
            live_status: "tayang",
          })
          .eq("id", DEMO.portalLiveContentId)
      ).error,
    );

    check(
      "portal review (revisi)",
      (
        await admin.from("content_reviews").insert({
          content_id: DEMO.portalRevisionContentId,
          decision: "revisi",
          checklist: {},
          notes:
            "Tolong sebutkan tanggal open house di detik pertama dan tambahkan label berbayar.",
          reviewer_id: ownerId,
        })
      ).error,
    );
  }

  // One official snapshot so the portal shows a verified number and the H+3
  // checkpoint is the one still waiting for the creator.
  const metricProofPath = `${DEMO.portalCampaignId}/demo-metric.png`;
  check(
    "portal metric proof",
    (
      await admin.storage
        .from("metric-proofs")
        .upload(metricProofPath, proof, { contentType: "image/png", upsert: true })
    ).error,
  );

  const { data: snapshot } = await admin
    .from("metric_snapshots")
    .select("id")
    .eq("content_id", DEMO.portalLiveContentId)
    .eq("checkpoint", "H+1")
    .maybeSingle();

  if (!snapshot) {
    check(
      "portal snapshot",
      (
        await admin.from("metric_snapshots").insert({
          content_id: DEMO.portalLiveContentId,
          checkpoint: "H+1",
          captured_at: addDays(postedAt, 1).toISOString(),
          views: 8_200,
          likes: 640,
          comments: 48,
          shares: 31,
          saves: 96,
          proof_path: metricProofPath,
          entered_by: ownerId,
        })
      ).error,
    );
  }
}

const iso = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);

async function main() {
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  if (!isLocal(url) && process.env.ALLOW_DEMO_SEED !== "1") {
    console.error(`Refusing to seed demo data into ${url}. Set ALLOW_DEMO_SEED=1 for staging.`);
    process.exit(1);
  }

  const admin = createClient<Database>(url, required("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const check = (label: string, error: { message: string } | null) => {
    if (error) throw new Error(`${label}: ${error.message}`);
  };

  const { data: owner } = await admin
    .from("profiles")
    .select("id")
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  check(
    "client",
    (
      await admin.from("clients").upsert({
        id: DEMO.clientId,
        name: "Universitas Demo Borneo",
        type: "kampus_swasta",
        city: "Banjarmasin",
        province: "Kalimantan Selatan",
        address: "Jl. Contoh Raya No. 1, Banjarmasin",
        notes: "Klien demo untuk pelatihan dan uji alur. Bukan instansi sungguhan.",
        created_by: owner?.id ?? null,
      })
    ).error,
  );
  check(
    "client contact",
    (
      await admin.from("client_contacts").upsert({
        id: DEMO.contactId,
        client_id: DEMO.clientId,
        name: "Siti Marlina",
        position: "Kepala Humas dan PMB",
        phone_wa: "6281200000001",
        email: "pmb@kampus-demo.example",
        is_primary: true,
      })
    ).error,
  );

  const proof = readFileSync("scripts/assets/demo-audience-proof.png");
  const now = new Date();

  for (const creator of CREATORS) {
    const id = creatorId(creator.n);
    const verified = creator.status !== "prospek";
    check(
      `creator ${creator.stage_name}`,
      (
        await admin.from("creators").upsert({
          id,
          full_name: creator.full_name,
          stage_name: creator.stage_name,
          phone_wa: `6281200001${String(creator.n).padStart(3, "0")}`,
          email: `${creator.stage_name.replace(/[^a-z]/g, "")}@kreator-demo.example`,
          city: creator.city,
          province: creator.province,
          birth_date: creator.birth_date,
          niches: creator.niches,
          tier: creator.tier,
          status: creator.status,
          terms_version: verified ? TERMS_VERSION : null,
          terms_agreed_at: verified ? addDays(now, -30).toISOString() : null,
          verified_at: verified ? addDays(now, -28).toISOString() : null,
          verified_by: verified ? (owner?.id ?? null) : null,
          notes:
            creator.status === "diblokir"
              ? "Demo: diblokir karena menghapus konten sebelum masa tayang di kampanye lain."
              : "",
          // v4.0 (FR-M3-09): a block always carries its reason.
          blocked_reason:
            creator.status === "diblokir"
              ? "Menghapus konten sebelum masa tayang minimum di kampanye lain."
              : null,
          created_by: owner?.id ?? null,
          anonymized_at: null,
        })
      ).error,
    );

    // Prospects have no audience proof yet, so verification is still blocked.
    let proofPath: string | null = null;
    if (verified) {
      proofPath = `${id}/demo-proof.png`;
      check(
        `proof ${creator.stage_name}`,
        (
          await admin.storage
            .from("audience-proofs")
            .upload(proofPath, proof, { contentType: "image/png", upsert: true })
        ).error,
      );
    }

    check(
      `social ${creator.stage_name}`,
      (
        await admin.from("creator_social_accounts").upsert(
          {
            creator_id: id,
            platform: creator.platform,
            handle: creator.stage_name,
            profile_url: `https://www.${creator.platform}.com/@${creator.stage_name}`,
            followers_count: creator.followers,
            kalimantan_audience_pct: creator.kalimantanPct,
            top_cities: creator.topCities,
            audience_proof_path: proofPath,
            last_verified_at: verified ? addDays(now, -28).toISOString() : null,
          },
          { onConflict: "platform,handle" },
        )
      ).error,
    );

    if (creator.bank) {
      check(
        `bank ${creator.stage_name}`,
        (
          await admin.from("creator_bank_accounts").upsert(
            {
              creator_id: id,
              bank_name: creator.bank.bank_name,
              account_number: creator.bank.account_number,
              account_holder: creator.full_name,
            },
            { onConflict: "creator_id" },
          )
        ).error,
      );
    }
  }

  const portalEmail = await seedPortalAccount(admin, {
    role: "creator",
    rowId: creatorId(1),
    fullName: CREATORS[0]!.full_name,
  });
  const clientPortalEmail = await seedPortalAccount(admin, {
    role: "client",
    rowId: DEMO.contactId,
    fullName: "Siti Marlina",
  });

  // Draft campaign starting today: the E2E flow assigns creators, activates it
  // and runs it to the final report.
  const { data: existing } = await admin
    .from("campaigns")
    .select("status")
    .eq("id", DEMO.campaignId)
    .maybeSingle();
  if (existing && existing.status !== "draft") {
    console.log(
      `Campaign ${DEMO.campaignCode} is already ${existing.status}; left untouched. Run db:reset for a clean demo.`,
    );
  } else {
    check(
      "campaign",
      (
        await admin.from("campaigns").upsert({
          id: DEMO.campaignId,
          client_id: DEMO.clientId,
          code: DEMO.campaignCode,
          name: "PMB Universitas Demo Borneo 2026/2027",
          objective: "pendaftar",
          brief:
            "Ajak lulusan SMA/SMK di Kalimantan Selatan dan Timur mendaftar kuliah di Universitas Demo Borneo. Tonjolkan beasiswa jalur prestasi, biaya terjangkau, dan kehidupan kampus.",
          must_do: [
            "Sebutkan kode referal di caption dan video",
            "Cantumkan tautan pendaftaran di bio selama kampanye",
            "Tampilkan suasana kampus atau testimoni mahasiswa",
          ],
          must_not: [
            "Menjanjikan kelulusan atau pekerjaan",
            "Membandingkan dengan kampus lain secara negatif",
          ],
          hashtags: ["#PMBDemoBorneo", "#KuliahDiBanua"],
          paid_label_required: true,
          landing_url: "https://pmb.kampus-demo.example/daftar",
          start_date: iso(now),
          end_date: iso(addDays(now, 30)),
          min_live_days: 14,
          status: "draft",
          package_price: 15_000_000,
          target_contents: 12,
          target_views: 150_000,
          target_registrants: 40,
          default_base_fee: 350_000,
          default_bonus_per_1000_views: 5_000,
          default_bonus_per_registrant: 25_000,
          default_views_bonus_cap: 300_000,
          closing_notes: "",
          created_by: owner?.id ?? null,
        })
      ).error,
    );
  }

  await seedPortalCampaign(admin, owner?.id ?? null, proof, now);

  console.log(
    `Demo data ready: 1 client, ${CREATORS.length} creators, campaigns ${DEMO.campaignCode} and ${DEMO.portalCampaignCode}.`,
  );
  console.log(
    portalEmail
      ? `Creator portal account: ${portalEmail} (${CREATORS[0]!.full_name}).`
      : "No creator portal account: set SEED_CREATOR_EMAIL/PASSWORD in .env.local.",
  );
  console.log(
    clientPortalEmail
      ? `Client portal account: ${clientPortalEmail} (Siti Marlina).`
      : "No client portal account: set SEED_CLIENT_EMAIL/PASSWORD in .env.local.",
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
