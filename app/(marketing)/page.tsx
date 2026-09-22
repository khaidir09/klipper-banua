import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileBarChart2, MapPinned, ShieldCheck } from "lucide-react";
import { ContactCta } from "@/components/marketing/contact-cta";
import { ImagePlaceholder } from "@/components/marketing/image-placeholder";
import { FaqList, type FaqItem } from "@/components/marketing/faq-list";
import { Container, Section } from "@/components/marketing/section";
import { Button } from "@/components/ui/button";
import { publicEnv } from "@/lib/env";

const DESCRIPTION =
  "Kami mengelola kampanye promosi instansi di Kalimantan bersama kreator lokal terverifikasi: brief, persetujuan konten sebelum tayang, pelacakan hasil per kreator, dan laporan yang bisa dipertanggungjawabkan.";

const TITLE = `${publicEnv.NEXT_PUBLIC_APP_NAME} — Kampanye kreator lokal Kalimantan`;

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

/** PRD 1.2: the three things the platform promises. */
const PILLARS = [
  {
    icon: MapPinned,
    title: "Kreator lokal terverifikasi",
    summary: "Audiens Kalimantan dibuktikan, bukan diklaim.",
    body: "Setiap kreator diperiksa lebih dulu: akun media sosialnya, tangkapan layar analitik audiensnya, dan persentase audiens Kalimantan. Terverifikasi di sini berarti dibuktikan.",
  },
  {
    icon: ShieldCheck,
    title: "Konten disetujui sebelum tayang",
    summary: "Setiap draf melewati review tim lebih dulu.",
    body: "Tidak ada konten yang naik tanpa lolos review tim. Bila kampanye Anda mewajibkannya, Anda juga menyetujui setiap konten lebih dulu, lengkap dengan catatan revisi.",
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

/** PRD 5.2, diringkas untuk pembaca publik. */
const STEPS = [
  {
    title: "Kami susun kampanye bersama Anda",
    body: "Tujuan, periode, target konten, dan halaman tujuan disepakati lebih dulu, termasuk hal yang wajib dan yang dilarang dalam konten.",
  },
  {
    title: "Kreator lokal ditugaskan",
    body: "Tim memilih kreator yang audiensnya cocok. Setiap kreator mendapat kode referal dan tautan pelacakan sendiri, jadi hasilnya bisa dipisahkan per orang.",
  },
  {
    title: "Konten direview sebelum tayang",
    body: "Draf masuk ke antrean review: disetujui, diminta revisi dengan catatan, atau ditolak. Baru setelah lolos, konten boleh tayang.",
  },
  {
    title: "Hasil dilacak, lalu dilaporkan",
    body: "Views dicatat pada beberapa checkpoint beserta bukti tangkapan layar, klik tautan tercatat otomatis, dan jumlah pendaftar per kode dirangkum di laporan akhir.",
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
    question: "Apa bedanya dengan platform clipper yang menjual views murah?",
    answer:
      "Platform clipper mengejar views dari mana saja. Kami mengejar audiens Kalimantan: kreatornya diverifikasi lewat bukti analitik audiens, kontennya melewati persetujuan, dan hasilnya dilaporkan sampai ke jumlah pendaftar per kode kreator.",
  },
  {
    question: "Bagaimana hasil kampanye diukur?",
    answer:
      "Tiga angka: views per checkpoint (H+1, H+3, H+7, dan akhir kampanye) yang selalu disertai tangkapan layar bukti, klik pada tautan pelacakan unik tiap kreator, dan jumlah pendaftar per kode referal yang Anda laporkan. Setiap angka yang memengaruhi honor kreator diverifikasi tim lebih dulu.",
  },
  {
    question: "Bisakah kami menolak sebuah konten sebelum tayang?",
    answer:
      "Bisa. Semua draf melewati review tim, dan kampanye Anda dapat diatur agar setiap konten juga menunggu persetujuan Anda. Permintaan revisi wajib disertai catatan, dan konten tidak boleh ditandai tayang sebelum kedua tahap lulus.",
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
    question: "Bagaimana kreator dibayar?",
    answer:
      "Honor dasar per konten yang memenuhi syarat, ditambah bonus kinerja berdasarkan views dan pendaftar. Perhitungannya dilakukan sistem dari angka yang sudah diverifikasi, lalu disetujui dan ditandai terbayar oleh owner.",
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
                Kampanye kreator lokal, dikelola tim
              </p>
              <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                Promosi yang menjangkau audiens Kalimantan, dengan bukti yang bisa Anda serahkan.
              </h1>
              <p className="mt-5 max-w-[60ch] text-base text-pretty text-brand-panel-muted sm:text-lg">
                {DESCRIPTION}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <ContactCta intent="client" tone="brand" />
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

            <ImagePlaceholder tone="brand" label="Foto kampanye kreator lokal bersama instansi" />
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
        title="Empat langkah, satu jalur yang sama untuk setiap kampanye"
        description="Semua kampanye berjalan lewat urutan ini, jadi Anda selalu tahu posisi pekerjaan hari ini."
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
        eyebrow="Untuk kreator"
        title="Kreator di Kalimantan, kerja samanya jelas sejak awal"
        description="Kreator tidak melamar kampanye sendiri: tim yang menugaskan, dan syarat honornya disampaikan sebelum Anda mulai."
        layout="split"
        action={
          <Button asChild size="lg" className="h-11 px-5 text-sm">
            <Link href="/kreator" data-cta>
              Baca syarat untuk kreator
              <ArrowRight aria-hidden />
            </Link>
          </Button>
        }
      >
        <ImagePlaceholder label="Foto kreator lokal sedang membuat konten" />
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
              Ceritakan targetnya lewat WhatsApp. Kami jawab dengan perkiraan jumlah kreator,
              periode, dan bentuk laporan yang akan Anda terima.
            </p>
            <ContactCta intent="client" tone="brand" className="mt-7 sm:justify-center" />
          </div>
        </Container>
      </section>
    </>
  );
}
