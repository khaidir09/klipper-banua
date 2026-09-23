import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileBarChart2, MapPinned, ShieldCheck } from "lucide-react";
import { ContactCta } from "@/components/marketing/contact-cta";
import { MarketingIllustration } from "@/components/marketing/illustration";
import { FaqList, type FaqItem } from "@/components/marketing/faq-list";
import { Container, Section } from "@/components/marketing/section";
import { SignupCta } from "@/components/marketing/signup-cta";
import { Button } from "@/components/ui/button";
import { publicEnv } from "@/lib/env";

const DESCRIPTION =
  "Instansi di Kalimantan memasang kampanye, klipper lokal memotong dan memposting videonya, dan setiap views diverifikasi sebelum dibayar. Hasilnya dilacak per klipper sampai ke laporan yang bisa dipertanggungjawabkan.";

const TITLE = `${publicEnv.NEXT_PUBLIC_APP_NAME} — Klipper lokal Kalimantan`;

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

/** PRD 1.2 (v4.0): the three things the platform promises. */
const PILLARS = [
  {
    icon: MapPinned,
    title: "Klipper lokal berlencana",
    summary: "Audiens Kalimantan dibuktikan, bukan diklaim.",
    body: "Klipper dengan lencana Klipper Lokal sudah menunjukkan analitik audiensnya kepada tim. Kampanye Anda bisa dibatasi hanya untuk mereka.",
  },
  {
    icon: ShieldCheck,
    title: "Setiap klip diverifikasi",
    summary: "Kepemilikan, brief, dan views diperiksa tim.",
    body: "Klip hanya dibayar bila diposting dari akun klipper sendiri, sesuai brief, dan views-nya wajar. Klip yang melanggar ditolak dan honornya tidak dibayarkan.",
  },
  {
    icon: FileBarChart2,
    title: "Laporan siap diserahkan",
    summary: "Views, klik, dan pendaftar dalam satu dokumen.",
    body: "Views per checkpoint, klik tautan, dan jumlah pendaftar per kode kreator dirangkum dalam satu laporan yang bisa dicetak atau diunduh sebagai CSV.",
  },
];

/** PRD 1.1. */
const PROBLEMS = [
  {
    title: "Views nasional yang tidak relevan",
    body: "Promosi yang ramai di luar Kalimantan tidak menambah pendaftar dari Kalimantan.",
  },
  {
    title: "Bukti yang tercecer",
    body: "Hasil kampanye kreator biasanya berupa tangkapan layar di banyak percakapan, bukan satu laporan.",
  },
  {
    title: "Kreator lokal sulit dikoordinasikan",
    body: "Mencari, memverifikasi, menjadwalkan, dan membayar kreator satu per satu memakan waktu tim Anda.",
  },
  {
    title: "Citra instansi ikut dipertaruhkan",
    body: "Tanpa proses persetujuan, satu konten yang keliru bisa merugikan nama instansi.",
  },
];

/** PRD 5.2 (v4.0), diringkas untuk pembaca publik. */
const STEPS = [
  {
    title: "Kampanye disusun bersama tim",
    body: "Materi video, brief, hal yang wajib dan dilarang, anggaran, serta tarif per 1.000 views disepakati lebih dulu.",
  },
  {
    title: "Klipper bergabung sendiri",
    body: "Kampanye tampil di katalog klipper. Setiap klipper yang bergabung mendapat kode referal dan tautan pelacakan sendiri.",
  },
  {
    title: "Klip diverifikasi sebelum dibayar",
    body: "Klipper memposting lalu mengirim tautan dan bukti views. Tim memeriksa kepemilikan akun, kepatuhan brief, dan keaslian views.",
  },
  {
    title: "Hasil dilacak, lalu dilaporkan",
    body: "Views terverifikasi, klik tautan, dan pendaftar per kode dirangkum di laporan akhir. Anggaran tidak pernah terpakai melebihi kesepakatan.",
  },
];

const AUDIENCES = [
  {
    title: "Kampus swasta",
    body: "Fokus kami sekarang: menambah pendaftar penerimaan mahasiswa baru dengan promosi yang terukur per kreator dan per kode referal.",
    current: true,
  },
  {
    title: "Instansi regional lain",
    body: "Bank daerah, BUMD, dan pemerintah daerah kami layani kasus per kasus, sambil kebutuhan dokumen dan pengadaannya kami siapkan.",
    current: false,
  },
];

const FAQ: FaqItem[] = [
  {
    question: "Apa bedanya dengan platform clipper nasional?",
    answer:
      "Cara kerjanya mirip: klipper memilih kampanye dan dibayar dari views terverifikasi. Bedanya, kami fokus pada audiens Kalimantan. Kampanye bisa dibatasi untuk klipper berlencana lokal, dan hasilnya dilaporkan sampai ke jumlah pendaftar per kode klipper.",
  },
  {
    question: "Bagaimana hasil kampanye diukur?",
    answer:
      "Tiga angka: views per checkpoint (H+1, H+3, H+7, dan akhir kampanye) yang selalu disertai tangkapan layar bukti, klik pada tautan pelacakan unik tiap kreator, dan jumlah pendaftar per kode referal yang Anda laporkan. Setiap angka yang memengaruhi honor kreator diverifikasi tim lebih dulu.",
  },
  {
    question: "Bagaimana kalau ada klip yang tidak sesuai?",
    answer:
      "Klip diverifikasi tim setelah tayang dan sebelum dibayar. Klip yang melanggar brief atau larangan ditolak, honornya tidak dibayarkan, dan klipper yang berulang kali melanggar diblokir. Brief yang jelas sejak awal adalah pengaman terbaik.",
  },
  {
    question: "Apakah data pribadi calon pendaftar disimpan di sistem ini?",
    answer:
      "Tidak. Kami hanya menerima angka rekap per kode referal, misalnya 12 pendaftar untuk kode ABC pada Oktober. Nama, nomor, dan data pribadi pendaftar tidak pernah kami minta maupun kami simpan.",
  },
  {
    question: "Bagaimana kami memantau kampanye yang sedang berjalan?",
    answer:
      "Tim memberi akun portal klien kepada kontak instansi Anda. Dari sana Anda melihat capaian terhadap target, konten yang sudah tayang, rekap per kreator, serta mengunduh laporan dan CSV-nya.",
  },
  {
    question: "Bagaimana klipper dibayar?",
    answer:
      "Dari views terverifikasi dikali tarif per 1.000 views, dengan batas per klip dan per klipper. Honor diambil dari anggaran kampanye, dan sistem menjaga agar anggaran tidak pernah terlampaui.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero sits on the fixed brand surface, which does not flip with
          `--primary` in dark mode (design system §11). */}
      <section className="bg-brand-panel text-brand-panel-foreground">
        <Container className="py-16 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center lg:gap-16">
            <div>
              <p className="text-sm font-medium text-brand-panel-muted">
                Marketplace klipper lokal Kalimantan
              </p>
              <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                Klip lokal Kalimantan, dibayar dari views asli.
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
            {PILLARS.map((pillar) => (
              <li key={pillar.title} className="flex gap-3">
                <pillar.icon className="mt-0.5 size-5 shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-medium">{pillar.title}</p>
                  <p className="mt-1 text-sm text-pretty text-brand-panel-muted">
                    {pillar.summary}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <Section
        id="masalah"
        tone="muted"
        eyebrow="Masalahnya"
        title="Promosi kreator sering ramai, tapi sulit dipertanggungjawabkan"
        description="Empat hal yang berulang kali kami temui saat instansi regional memakai kreator tanpa proses yang rapi."
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {PROBLEMS.map((problem) => (
            <li key={problem.title} className="rounded-xl border bg-card p-5">
              <p className="font-medium">{problem.title}</p>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">{problem.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="cara-kerja"
        eyebrow="Cara kerja"
        title="Empat langkah dari brief sampai laporan"
        description="Instansi memasang kampanye, klipper lokal mengerjakannya, dan tim memverifikasi setiap klip sebelum honor dibayar."
      >
        <ol className="grid gap-4 sm:grid-cols-2">
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

        <ContactCta
          intent="client"
          whatsappLabel="Bicarakan kampanye Anda"
          className="mt-8 lg:justify-center"
        />
      </Section>

      <Section
        id="kenapa-lokal"
        tone="muted"
        eyebrow="Kenapa kreator lokal"
        title="Tiga hal yang kami jaga di setiap kampanye"
        description="Model terbuka seperti platform clipper nasional, dengan pengaman yang dibutuhkan instansi."
      >
        <ul className="grid gap-6 lg:grid-cols-3">
          {PILLARS.map((pillar) => (
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
      </Section>

      <Section
        id="untuk-siapa"
        eyebrow="Untuk siapa"
        title="Instansi regional yang dinilai dari hasil, bukan dari keramaian"
      >
        <ul className="grid gap-4 sm:grid-cols-2">
          {AUDIENCES.map((audience) => (
            <li key={audience.title} className="rounded-xl border bg-card p-5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{audience.title}</p>
                <span
                  className={
                    audience.current
                      ? "rounded-md bg-success-soft px-2 py-0.5 text-xs font-medium text-success-soft-foreground"
                      : "rounded-md bg-neutral-soft px-2 py-0.5 text-xs font-medium text-neutral-soft-foreground"
                  }
                >
                  {audience.current ? "Fokus saat ini" : "Menyusul"}
                </span>
              </div>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">{audience.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="kreator"
        tone="muted"
        eyebrow="Untuk klipper"
        title="Bisa memotong video? Jadikan honor"
        description="Daftar gratis, pilih kampanye dari katalog, posting klip di akunmu sendiri, lalu tarik honornya ke rekening. Tidak perlu pengikut banyak: yang dibayar adalah views."
        layout="split"
        action={
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <SignupCta />
            <Button asChild variant="outline" size="lg" className="h-11 px-5 text-sm">
              <Link href="/kreator" data-cta>
                Cara kerja klipper
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        }
      >
        <MarketingIllustration name="konten" />
      </Section>

      <Section
        id="faq"
        eyebrow="Tanya jawab"
        title="Pertanyaan yang paling sering masuk"
        description="Belum terjawab? Kirim pertanyaannya langsung ke tim."
        layout="split"
        action={<ContactCta intent="client" />}
      >
        <FaqList items={FAQ} />
      </Section>

      <section className="border-t bg-brand-panel text-brand-panel-foreground">
        <Container className="py-16 lg:py-20">
          <div className="mx-auto max-w-[55ch] text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Punya target yang harus dilaporkan periode ini?
            </h2>
            <p className="mt-3 text-base text-pretty text-brand-panel-muted">
              Ceritakan targetnya lewat WhatsApp. Kami jawab dengan perkiraan anggaran, tarif per
              1.000 views, periode, dan bentuk laporan yang akan Anda terima.
            </p>
            <ContactCta intent="client" tone="brand" className="mt-7 sm:justify-center" />
          </div>
        </Container>
      </section>
    </>
  );
}
