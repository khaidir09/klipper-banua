import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileBarChart2,
  Hash,
  ListChecks,
  MapPinned,
  ShieldCheck,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";
import { PublicCampaignCard } from "@/components/marketing/campaign-card";
import { ContactCta } from "@/components/marketing/contact-cta";
import { MarketingIllustration } from "@/components/marketing/illustration";
import { FaqList, type FaqItem } from "@/components/marketing/faq-list";
import { Container, Section } from "@/components/marketing/section";
import { SignupCta } from "@/components/marketing/signup-cta";
import { Button } from "@/components/ui/button";
import { sortCatalog } from "@/lib/campaigns/open";
import { publicEnv } from "@/lib/env";
import { listPublicCampaigns } from "@/lib/marketing/campaigns";

/** FR-M15-09: the open campaigns section follows the catalog, like /kampanye. */
export const revalidate = 300;

/** How many open campaigns the landing page previews before linking to /kampanye. */
const FEATURED_CAMPAIGNS = 3;

const DESCRIPTION =
  "Brand, UMKM, instansi, sampai personal pasang kampanye lengkap dengan materi video dan tarif per 1.000 views. Kamu tinggal pilih kampanye, potong jadi klip, posting di akunmu, lalu tarik honornya ke rekening atau e-wallet.";

const TITLE = `${publicEnv.NEXT_PUBLIC_APP_NAME} — Klipper Kalimantan, dibayar dari views`;

export const metadata: Metadata = {
  // Absolute, so the landing page is not titled "Beranda · Nama Aplikasi".
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    type: "website",
    locale: "id_ID",
  },
};

/** The three things a klipper gets, shown under the hero. */
const PERKS = [
  {
    icon: Users,
    title: "Followers sedikit? Tetap bisa",
    summary: "Yang dihitung views klipmu, bukan jumlah followers.",
  },
  {
    icon: ListChecks,
    title: "Tarif jelas dari awal",
    summary: "Tarif per 1.000 views dan batas honor tertulis sebelum kamu gabung.",
  },
  {
    icon: WalletCards,
    title: "Tarik ke rekening atau e-wallet",
    summary: "Honor yang lolos verifikasi masuk saldo, atas namamu sendiri.",
  },
];

/** PRD 5.2 (v4.0), FR-M15-02: how it works, from the klipper's side. */
const STEPS = [
  {
    title: "Daftar, gratis",
    body: "Isi data diri, konfirmasi email, lalu tambahkan akun TikTok, Instagram, YouTube, atau Facebook yang kamu pakai.",
  },
  {
    title: "Pilih kampanye",
    body: "Buka katalog, baca brief-nya (apa yang wajib, apa yang dilarang), lalu klik Gabung. Materi videonya tinggal diunduh.",
  },
  {
    title: "Potong, posting, kirim",
    body: "Posting klip di akunmu dengan kode verifikasi di caption. Lalu kirim link-nya plus screenshot views.",
  },
  {
    title: "Honor masuk saldo",
    body: "Tim cek klipmu. Kalau lolos, honor dari views langsung masuk saldo dan siap ditarik.",
  },
];

/** What makes a clip pass verification (PRD 8.6, M18). */
const RULES = [
  {
    icon: Hash,
    title: "Pakai kode verifikasimu",
    body: "Tulis kode pribadimu (contohnya KB-7XK2QM) di caption. Dari situ tim tahu klip itu beneran diposting dari akunmu.",
  },
  {
    icon: ListChecks,
    title: "Ikuti brief-nya",
    body: "Setiap kampanye punya daftar hal yang wajib ada dan yang dilarang. Klip yang melenceng dari brief ditolak.",
  },
  {
    icon: ShieldCheck,
    title: "Views dari orang beneran",
    body: "Bot, beli views, atau akun palsu bikin klip ditolak, honornya batal, dan akunmu diblokir.",
  },
];

/** PRD 1.2 (v4.0): what the platform promises a client. */
const CLIENT_PILLARS = [
  {
    icon: MapPinned,
    title: "Klipper lokal berlencana",
    body: "Klipper berlencana Klipper Lokal sudah menunjukkan analitik audiensnya ke tim. Kampanye bisa dibatasi hanya untuk mereka.",
  },
  {
    icon: ShieldCheck,
    title: "Setiap klip diverifikasi",
    body: "Klip dibayar hanya bila diposting dari akun klipper sendiri, sesuai brief, dan views-nya wajar. Anggaran tidak pernah terpakai melebihi kesepakatan.",
  },
  {
    icon: FileBarChart2,
    title: "Laporan siap diserahkan",
    body: "Views terverifikasi, klik tautan, dan hasil per kode klipper (misalnya jumlah pendaftar atau pembeli) dirangkum dalam satu laporan yang bisa dicetak atau diunduh sebagai CSV.",
  },
];

const FAQ: FaqItem[] = [
  {
    question: "Harus punya banyak followers?",
    answer:
      "Nggak. Yang dibayar views klipmu, bukan jumlah followers. Akun kecil dengan klip yang bagus tetap bisa dapat honor.",
  },
  {
    question: "Berapa honor yang bisa aku dapat?",
    answer:
      "Tergantung kampanyenya. Tiap kampanye punya tarif per 1.000 views, batas honor per klip dan per klipper, serta anggaran total. Semuanya tertulis sebelum kamu gabung, dan honor berhenti saat anggaran kampanye habis.",
  },
  {
    question: "Kapan honornya bisa ditarik?",
    answer:
      "Begitu klip disetujui, honornya masuk saldo. Setelah saldo mencapai batas minimum, ajukan penarikan kapan saja, dan tim mentransfer ke rekening atau e-wallet atas namamu. Biaya transfer ditanggung klipper.",
  },
  {
    question: "Apa itu lencana Klipper Lokal?",
    answer:
      "Tanda untuk akun yang audiensnya mayoritas di Kalimantan, dibuktikan dengan screenshot analitik. Sebagian kampanye cuma terbuka untuk pemegang lencana ini. Untuk kampanye umum, lencana nggak wajib.",
  },
  {
    question: "Untuk pemilik kampanye: siapa saja yang bisa pasang kampanye?",
    answer:
      "Siapa pun yang ingin menjangkau audiens Kalimantan lewat klip pendek: brand bisnis, UMKM, instansi, maupun personal. Materi, brief, anggaran, dan tarif per 1.000 views disepakati bersama tim sebelum kampanye tayang di katalog klipper.",
  },
  {
    question: "Untuk pemilik kampanye: bagaimana hasilnya diukur?",
    answer:
      "Lewat tiga angka: views terverifikasi per klip (selalu dengan tangkapan layar bukti), klik pada tautan pelacakan unik tiap klipper, dan hasil per kode referal yang Anda laporkan, misalnya jumlah pendaftar atau pembeli. Anda memantaunya dari portal klien dan menerima laporan akhir.",
  },
  {
    question: "Untuk pemilik kampanye: apakah data pribadi pelanggan saya disimpan?",
    answer:
      "Tidak. Kami hanya menerima angka rekap per kode referal, misalnya 12 pembeli untuk kode ABC pada Oktober. Nama, nomor, dan data pribadi pelanggan atau pendaftar Anda tidak pernah diminta maupun disimpan.",
  },
];

export default async function LandingPage() {
  // Only campaigns that can still pay; the section disappears when there are
  // none or the database cannot be reached, and the rest of the page is static.
  const featured = sortCatalog(
    ((await listPublicCampaigns()) ?? []).filter((campaign) => !campaign.budget_exhausted),
    "terbaru",
  ).slice(0, FEATURED_CAMPAIGNS);

  return (
    <>
      {/* Hero sits on the fixed brand surface, which does not flip with
          `--primary` in dark mode (design system §11). */}
      <section className="bg-brand-panel text-brand-panel-foreground">
        <Container className="py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center lg:gap-16">
            <div>
              <p className="text-sm font-medium text-brand-panel-muted">
                Buat klipper Kalimantan, terbuka untuk umum
              </p>
              <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                Bisa edit video? Posting klip di akunmu, dapat honor dari views-nya.
              </h1>
              <p className="mt-5 max-w-[60ch] text-base text-pretty text-brand-panel-muted sm:text-lg">
                {DESCRIPTION}
              </p>

              {/* FR-M15-02: two equal ways in, one per side of the marketplace. */}
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <SignupCta tone="brand" />
                <ContactCta intent="client" tone="brand" whatsappLabel="Pasang kampanye" />
                <Button
                  asChild
                  variant="ghost"
                  size="lg"
                  className="h-11 px-4 text-sm text-brand-panel-foreground hover:bg-brand-panel-foreground/10 hover:text-brand-panel-foreground"
                >
                  <Link href="#cara-kerja" data-cta>
                    Lihat cara kerja
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
              </div>
            </div>

            <MarketingIllustration name="kampanye" tone="brand" />
          </div>

          <ul className="mt-14 grid gap-6 sm:grid-cols-3 sm:gap-8">
            {PERKS.map((perk) => (
              <li key={perk.title} className="flex gap-3">
                <perk.icon className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-medium">{perk.title}</p>
                  <p className="mt-1 text-sm text-pretty text-brand-panel-muted">{perk.summary}</p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {featured.length ? (
        <Section
          id="kampanye"
          tone="muted"
          eyebrow="Kampanye yang lagi buka"
          title="Pilih kampanye, mulai bikin klip"
          description="Tarif, batas honor, dan sisa anggaran tiap kampanye kelihatan dari awal. Brief lengkapnya bisa dibaca setelah kamu daftar."
        >
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((campaign) => (
              <li key={campaign.id} className="flex">
                <PublicCampaignCard campaign={campaign} />
              </li>
            ))}
          </ul>

          <div className="mt-8 flex lg:justify-center">
            <Button asChild variant="outline" size="lg" className="h-11 px-5 text-sm">
              <Link href="/kampanye" data-cta>
                Lihat semua kampanye
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </Section>
      ) : null}

      <Section
        id="cara-kerja"
        eyebrow="Cara kerja"
        title="Dari daftar sampai honor cair, cuma empat langkah"
        description="Nggak ada wawancara atau seleksi di awal. Yang dicek adalah setiap klip yang kamu kirim."
      >
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-info-soft text-sm font-semibold text-info-soft-foreground"
                >
                  {index + 1}
                </span>
                <p className="font-medium">{step.title}</p>
              </div>
              <p className="mt-3 text-sm text-pretty text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-center">
          <SignupCta />
          <Button asChild variant="outline" size="lg" className="h-11 px-5 text-sm">
            <Link href="/kreator" data-cta>
              Detail syarat dan honor
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        </div>
      </Section>

      <Section
        id="honor"
        tone="muted"
        eyebrow="Hitungan honor"
        title="Makin banyak views, makin besar honormu"
        description="Rumusnya: views terverifikasi × tarif ÷ 1.000. Tarif dan batas honornya beda di tiap kampanye, dan selalu tertulis sebelum kamu gabung."
        layout="split"
        action={
          <div className="rounded-xl border bg-card p-5 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Wallet className="size-4 text-success" aria-hidden />
              Contoh hitungan (ilustrasi)
            </p>
            <p className="mt-3 text-muted-foreground">
              Tarifnya Rp10.000 per 1.000 views, dan klipmu dapat 23.450 views terverifikasi:
            </p>
            <p className="mt-1 font-medium tabular-nums">23.450 × Rp10.000 ÷ 1.000 = Rp234.500</p>
            <p className="mt-3 text-muted-foreground">
              Seminggu kemudian views-nya naik ke 41.000 dan dicek lagi: saldomu nambah Rp175.500.
            </p>
          </div>
        }
      >
        <MarketingIllustration name="konten" />
      </Section>

      <Section
        id="aturan"
        eyebrow="Aturan main"
        title="Views asli, honor aman"
        description="Setiap klip dicek tim sebelum dibayar. Tiga hal ini yang bikin klipmu lolos."
      >
        <ul className="grid gap-6 lg:grid-cols-3">
          {RULES.map((rule) => (
            <li key={rule.title} className="rounded-xl border bg-card p-5">
              <span
                aria-hidden
                className="flex size-9 items-center justify-center rounded-lg bg-info-soft text-info-soft-foreground"
              >
                <rule.icon className="size-4.5" />
              </span>
              <p className="mt-4 font-medium">{rule.title}</p>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">{rule.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="pasang-kampanye"
        tone="muted"
        eyebrow="Untuk pemilik kampanye"
        title="Punya produk, usaha, atau program yang ingin dikenal di Kalimantan?"
        description="Brand bisnis, UMKM, instansi, maupun personal bisa pasang kampanye. Anda menyiapkan materi video dan anggaran, klipper lokal membuat klipnya, dan tim kami memeriksa setiap klip sebelum honor dibayar."
      >
        <ul className="grid gap-6 lg:grid-cols-3">
          {CLIENT_PILLARS.map((pillar) => (
            <li key={pillar.title} className="rounded-xl border bg-card p-5">
              <span
                aria-hidden
                className="flex size-9 items-center justify-center rounded-lg bg-info-soft text-info-soft-foreground"
              >
                <pillar.icon className="size-4.5" />
              </span>
              <p className="mt-4 font-medium">{pillar.title}</p>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">{pillar.body}</p>
            </li>
          ))}
        </ul>

        <ContactCta
          intent="client"
          whatsappLabel="Bicarakan kampanye Anda"
          className="mt-8 lg:justify-center"
        />
      </Section>

      <Section
        id="faq"
        eyebrow="Tanya jawab"
        title="Yang paling sering ditanyain"
        description="Belum ketemu jawabannya? Tanya langsung ke tim lewat WhatsApp."
        layout="split"
        action={<ContactCta intent="creator" whatsappLabel="Tanya lewat WhatsApp" />}
      >
        <FaqList items={FAQ} />
      </Section>

      <section className="border-t bg-brand-panel text-brand-panel-foreground">
        <Container className="py-16 lg:py-20">
          <div className="mx-auto max-w-[55ch] text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Punya HP dan akun medsos? Kamu sudah bisa mulai.
            </h2>
            <p className="mt-3 text-base text-pretty text-brand-panel-muted">
              Daftarnya gratis. Setelah akunmu aktif, pilih kampanye dari katalog dan mulai bikin
              klip pertamamu.
            </p>
            <div className="mt-7 flex justify-center">
              <SignupCta tone="brand" />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
