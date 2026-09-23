import type { Metadata } from "next";
import { BadgeCheck, Hash, ShieldAlert, UserCheck, Wallet } from "lucide-react";
import { ContactCta } from "@/components/marketing/contact-cta";
import { MarketingIllustration } from "@/components/marketing/illustration";
import { FaqList, type FaqItem } from "@/components/marketing/faq-list";
import { Container, Section } from "@/components/marketing/section";
import { SignupCta } from "@/components/marketing/signup-cta";

const DESCRIPTION =
  "Jadi klipper kampanye instansi di Kalimantan: daftar gratis, pilih kampanye, posting klip di akunmu sendiri, dan dapat honor dari views yang terverifikasi.";

export const metadata: Metadata = {
  title: "Untuk Klipper",
  description: DESCRIPTION,
  alternates: { canonical: "/kreator" },
  openGraph: {
    title: "Untuk Klipper",
    description: DESCRIPTION,
    url: "/kreator",
    type: "website",
    locale: "id_ID",
  },
};

/** PRD 5.1 and 5.2 (v4.0), from the klipper's side. */
const STEPS = [
  {
    title: "Daftar gratis",
    body: "Isi data diri, konfirmasi email, lalu tambahkan akun TikTok, Instagram, YouTube, atau Facebook yang kamu pakai.",
  },
  {
    title: "Pilih kampanye",
    body: "Baca brief, hal yang wajib dan yang dilarang, lalu tekan Gabung. Materi video siap kamu unduh dan potong.",
  },
  {
    title: "Posting, lalu kirim klip",
    body: "Posting klip di akunmu dengan kode verifikasi di caption. Kirim tautannya beserta tangkapan layar views.",
  },
  {
    title: "Honor masuk saldo",
    body: "Setelah tim memverifikasi, honor dari views masuk ke saldo. Tarik ke rekening bank atau e-wallet atas namamu.",
  },
];

const REQUIREMENTS = [
  {
    icon: UserCheck,
    title: "Usia minimal 18 tahun",
    body: "Pekerjaan ini melibatkan honor dan persetujuan syarat, jadi hanya untuk klipper dewasa.",
  },
  {
    icon: Hash,
    title: "Akun media sosial milik sendiri",
    body: "Klip dihitung hanya bila diposting dari akun yang kamu daftarkan, dengan kode verifikasi pribadimu di caption.",
  },
  {
    icon: ShieldAlert,
    title: "Views asli, tanpa bot",
    body: "Views dari bot, jual-beli engagement, atau akun palsu membuat klip ditolak, honornya dibatalkan, dan akun diblokir.",
  },
];

/** PRD 8.6, with illustrative figures only: every campaign sets its own rate. */
const FEE_RULES = [
  "Setiap kampanye menetapkan tarif per 1.000 views. Honor klip = views terverifikasi × tarif ÷ 1.000.",
  "Views bisa kamu perbarui selama masa klaim kampanye; yang dibayar adalah selisihnya.",
  "Ada batas honor per klip dan per klipper, dan honor berhenti saat anggaran kampanye habis.",
  "Klip yang dihapus sebelum masa tayang minimum selesai, honornya dibatalkan.",
];

const FAQ: FaqItem[] = [
  {
    question: "Apakah harus punya banyak pengikut?",
    answer:
      "Tidak. Yang dibayar adalah views klipmu, bukan jumlah pengikut. Akun kecil dengan klip yang bagus tetap bisa mendapat honor.",
  },
  {
    question: "Apa itu kode verifikasi?",
    answer:
      "Kode pribadi seperti KB-7XK2QM yang muncul di profil portalmu. Tulis di caption atau deskripsi setiap klip, supaya tim tahu klip itu benar-benar diposting dari akunmu.",
  },
  {
    question: "Apa itu lencana Klipper Lokal?",
    answer:
      "Lencana untuk akun yang mayoritas audiensnya di Kalimantan, dibuktikan dengan tangkapan layar analitik. Sebagian kampanye instansi hanya terbuka untuk pemegang lencana ini.",
  },
  {
    question: "Kapan honor bisa ditarik?",
    answer:
      "Begitu klip disetujui, honornya langsung masuk saldo. Kamu bisa mengajukan penarikan kapan saja setelah saldo mencapai batas minimum, lalu owner mentransfer ke rekeningmu.",
  },
  {
    question: "Kenapa klip saya ditolak?",
    answer:
      "Alasannya selalu tertulis di portal: misalnya kode verifikasi tidak ada di caption, klip tidak sesuai brief, diposting di luar periode kampanye, atau views tidak wajar. Bila hanya caption yang kurang, kamu bisa memperbaikinya lalu mengirim ulang.",
  },
];

export default function CreatorPage() {
  return (
    <>
      <section className="bg-brand-panel text-brand-panel-foreground">
        <Container className="py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center lg:gap-16">
            <div>
              <p className="text-sm font-medium text-brand-panel-muted">Untuk klipper</p>
              <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
                Potong video kampanye, posting di akunmu, dibayar dari views asli.
              </h1>
              <p className="mt-5 max-w-[60ch] text-base text-pretty text-brand-panel-muted">
                Instansi di Kalimantan menyediakan materi video dan tarif per 1.000 views. Kamu
                memilih kampanye sendiri, membuat klip, dan menarik honornya ke rekeningmu.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <SignupCta tone="brand" />
              </div>
            </div>

            <MarketingIllustration name="kreator" tone="brand" />
          </div>
        </Container>
      </section>

      <Section
        id="cara-kerja"
        eyebrow="Cara kerja"
        title="Empat langkah dari daftar sampai tarik saldo"
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
      </Section>

      <Section
        id="syarat"
        tone="muted"
        eyebrow="Syarat"
        title="Tiga hal yang wajib dipenuhi"
        description="Tidak ada wawancara atau seleksi di awal. Kepatuhan diperiksa di setiap klip yang kamu kirim."
      >
        <ul className="grid gap-6 lg:grid-cols-3">
          {REQUIREMENTS.map((item) => (
            <li key={item.title} className="rounded-xl border bg-card p-5">
              <span
                aria-hidden
                className="flex size-9 items-center justify-center rounded-lg bg-info-soft text-info-soft-foreground"
              >
                <item.icon className="size-4.5" />
              </span>
              <p className="mt-4 font-medium">{item.title}</p>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="honor"
        eyebrow="Honor"
        title="Dibayar per 1.000 views yang terverifikasi"
        description="Tarif, batas, dan masa klaim tertulis di setiap kampanye sebelum kamu bergabung."
        layout="split"
        action={
          <div className="rounded-xl border bg-card p-5 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <Wallet className="size-4 text-success" aria-hidden />
              Contoh hitungan (ilustrasi)
            </p>
            <p className="mt-3 text-muted-foreground">
              Tarif Rp10.000 per 1.000 views, klip terverifikasi 23.450 views:
            </p>
            <p className="mt-1 font-medium tabular-nums">23.450 × Rp10.000 ÷ 1.000 = Rp234.500</p>
            <p className="mt-3 text-muted-foreground">
              Seminggu kemudian views naik ke 41.000 dan diverifikasi lagi: saldo bertambah
              Rp175.500.
            </p>
          </div>
        }
      >
        <ul className="space-y-3">
          {FEE_RULES.map((rule) => (
            <li key={rule} className="flex gap-3 rounded-xl border bg-card p-4">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-border" />
              <p className="text-sm text-pretty text-muted-foreground">{rule}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="lencana"
        tone="muted"
        eyebrow="Lencana Klipper Lokal"
        title="Audiensmu di Kalimantan? Buka kampanye khusus lokal"
        description="Ajukan dari portal dengan tangkapan layar analitik audiens. Setelah tim memeriksa, lencana muncul di profilmu."
        layout="split"
        action={
          <p className="flex items-center gap-2 text-sm font-medium">
            <BadgeCheck className="size-4 text-success" aria-hidden />
            Tidak wajib untuk kampanye umum
          </p>
        }
      >
        <MarketingIllustration name="verifikasi" />
      </Section>

      <Section
        id="faq-kreator"
        eyebrow="Tanya jawab"
        title="Pertanyaan dari klipper"
        description="Masih bingung? Tim bisa dihubungi lewat WhatsApp."
        layout="split"
        action={<ContactCta intent="creator" whatsappLabel="Tanya lewat WhatsApp" />}
      >
        <FaqList items={FAQ} />
      </Section>

      <section className="border-t bg-brand-panel text-brand-panel-foreground">
        <Container className="py-16 lg:py-20">
          <div className="mx-auto max-w-[55ch] text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Siap bikin klip pertamamu?
            </h2>
            <p className="mt-3 text-base text-pretty text-brand-panel-muted">
              Pendaftaran gratis dan selesai dalam beberapa menit.
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
