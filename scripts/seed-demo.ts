/**
 * Demo data for local development, staging and the end-to-end test
 * (PRD section 11, phase 7): 1 campus with a contact, 8 creators and 1 draft
 * campaign, so the whole flow of section 5.2 can be run from the start.
 *
 *   npm run seed:demo
 *
 * Idempotent: fixed ids, upserts. It refuses to run against a non-local
 * Supabase unless ALLOW_DEMO_SEED=1, so demo data never lands in production.
 * The names, phone numbers and domains are fictitious.
 */
import { readFileSync } from "node:fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

config({ path: ".env.local", quiet: true });

export const DEMO = {
  clientId: "de300000-0000-4000-8000-000000000001",
  campaignId: "de300000-0000-4000-8000-0000000000c1",
  campaignCode: "DEMO-PMB-2026",
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
        id: "de300000-0000-4000-8000-0000000000b1",
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

  console.log(
    `Demo data ready: 1 client, ${CREATORS.length} creators, campaign ${DEMO.campaignCode}.`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
