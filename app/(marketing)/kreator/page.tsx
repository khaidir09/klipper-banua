import type { Metadata } from "next";
import { BadgeCheck, Banknote, TrendingUp, UserCheck } from "lucide-react";
import { ContactCta } from "@/components/marketing/contact-cta";
import { ImagePlaceholder } from "@/components/marketing/image-placeholder";
import { FaqList, type FaqItem } from "@/components/marketing/faq-list";
import { Container, Section } from "@/components/marketing/section";

const DESCRIPTION =
  "Syarat bergabung sebagai kreator mitra di Kalimantan: usia minimal 18 tahun, mayoritas audiens di Kalimantan, dan akun media sosial yang aktif. Honor terdiri dari honor dasar per konten ditambah bonus kinerja.";

export const metadata: Metadata = {
  title: "Untuk Kreator",
  description: DESCRIPTION,
  alternates: { canonical: "/kreator" },
  openGraph: {
    title: "Untuk Kreator",
    description: DESCRIPTION,
    url: "/kreator",
    type: "website",
    locale: "id_ID",
  },
};

const REQUIREMENTS = [
  {
    icon: UserCheck,
    title: "Usia minimal 18 tahun",
    body: "Kerja sama ini melibatkan honor dan kesepakatan tertulis, jadi kami hanya bekerja dengan kreator dewasa.",
  },
  {
    icon: BadgeCheck,
    title: "Mayoritas audiens di Kalimantan",
    body: "Kami meminta tangkapan layar analitik audiens Anda untuk melihat sebaran kotanya. Angka pengikut besar dari luar Kalimantan tidak menjadi nilai tambah di sini.",
  },
  {
    icon: TrendingUp,
    title: "Akun media sosial yang aktif",
    body: "TikTok, Instagram, YouTube, atau Facebook. Yang kami lihat adalah konsistensi unggahan dan kecocokan gaya konten dengan instansi, bukan sekadar jumlah pengikut.",
  },
];

/** PRD 8.3, dijelaskan tanpa angka: nominal ditetapkan per kampanye. */
const FEE_PARTS = [
  {
    title: "Honor dasar per konten",
    body: "Dibayarkan untuk setiap konten yang memenuhi syarat: sudah disetujui, tayang, dan bertahan minimal sejumlah hari yang disepakati di brief.",
  },
  {
    title: "Bonus views",
    body: "Dihitung per 1.000 views dari angka checkpoint yang sudah diverifikasi tim. Setiap kampanye dapat menetapkan batas maksimal bonus views.",
  },
  {
    title: "Bonus pendaftar",
    body: "Dihitung dari jumlah pendaftar yang masuk memakai kode referal Anda, berdasarkan laporan instansi yang sudah diverifikasi tim.",
  },
];

/** PRD 5.1. */
const STAGES = [
  "Tim mencatat data Anda beserta akun media sosial yang akan dipakai.",
  "Anda mengirim tangkapan layar analitik audiens; tim mengisi persentase audiens Kalimantan.",
  "Tim menyampaikan syarat kerja sama, lalu mencatat tanggal persetujuan Anda.",
  "Tim memverifikasi data Anda; status Anda berubah menjadi kreator terverifikasi.",
  "Owner mencatat data rekening untuk pembayaran honor, dan Anda siap ditugaskan pada kampanye.",
];

const GOOD_TO_KNOW = [
  "Kreator tidak melamar kampanye. Tim yang menugaskan, sesuai kecocokan audiens dan kebutuhan instansi.",
  "Tidak ada pendaftaran akun mandiri. Akun portal diberikan lewat undangan setelah Anda menjadi mitra terverifikasi.",
  "Angka views dan pendaftar yang memengaruhi honor selalu diverifikasi tim lebih dulu. Kiriman bukti Anda berstatus usulan sampai diterima.",
  "Honor dihitung sistem, lalu disetujui dan ditandai terbayar oleh owner. Anda dapat melihat statusnya sendiri di portal.",
  "Konten wajib mengikuti brief: hal yang wajib dilakukan, larangan, hashtag, dan kewajiban label berbayar bila diminta instansi.",
];

const FAQ: FaqItem[] = [
  {
    question: "Berapa nominal honornya?",
    answer:
      "Nominalnya ditetapkan per kampanye dan per kreator, lalu disampaikan sebelum Anda mulai mengerjakan, bukan setelah konten tayang. Karena itu tidak ada daftar harga di halaman ini.",
  },
  {
    question: "Apakah saya harus punya pengikut dalam jumlah besar?",
    answer:
      "Tidak. Yang kami cari adalah audiens yang benar-benar berada di Kalimantan dan gaya konten yang cocok dengan instansi klien. Kreator dengan pengikut menengah sering justru lebih pas.",
  },
  {
    question: "Apa yang terjadi kalau konten saya diminta revisi?",
    answer:
      "Anda menerima catatan revisi yang jelas, lalu mengirim draf perbaikan. Konten hanya boleh tayang setelah disetujui, jadi revisi sebelum tayang adalah hal yang normal dan tidak mengurangi honor dasar Anda.",
  },
  {
    question: "Kapan honor dibayarkan?",
    answer:
      "Setelah kampanye selesai dan angkanya diverifikasi, sistem menghitung honor Anda. Owner menyetujui, lalu menandai pembayaran beserta tanggalnya. Status itu terlihat di portal Anda.",
  },
];

export default function CreatorPage() {
  return (
    <>
      <section className="bg-brand-panel text-brand-panel-foreground">
        <Container className="py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)] lg:items-center lg:gap-16">
            <div>
              <p className="text-sm font-medium text-brand-panel-muted">Untuk kreator</p>
              <h1 className="mt-3 text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
                Kerja sama kreator lokal: syaratnya jelas, honornya disampaikan sebelum Anda mulai.
              </h1>
              <p className="mt-5 max-w-[60ch] text-base text-pretty text-brand-panel-muted">
                Kami mengelola kampanye untuk instansi di Kalimantan dan menugaskan kreator yang
                audiensnya memang di sini. Halaman ini menjelaskan siapa yang kami cari, bagaimana
                honor dihitung, dan apa saja tahapannya.
              </p>
              <ContactCta
                intent="creator"
                tone="brand"
                className="mt-8"
                whatsappLabel="Daftar jadi kreator lewat WhatsApp"
              />
            </div>

            <ImagePlaceholder tone="brand" label="Foto kreator lokal Kalimantan" />
          </div>
        </Container>
      </section>

      <Section
        id="syarat"
        eyebrow="Syarat"
        title="Tiga hal yang kami periksa lebih dulu"
        description="Semuanya diverifikasi tim sebelum Anda bisa ditugaskan pada kampanye."
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
        tone="muted"
        eyebrow="Honor"
        title="Honor dasar, ditambah bonus kinerja"
        description="Tiga komponen ini yang dipakai di setiap penugasan. Nominalnya ditetapkan per kampanye dan disampaikan sebelum Anda mengerjakan."
      >
        <ul className="grid gap-4 sm:grid-cols-3">
          {FEE_PARTS.map((part) => (
            <li key={part.title} className="rounded-xl border bg-card p-5">
              <span
                aria-hidden
                className="flex size-9 items-center justify-center rounded-lg bg-success-soft text-success-soft-foreground"
              >
                <Banknote className="size-4.5" />
              </span>
              <p className="mt-4 font-medium">{part.title}</p>
              <p className="mt-2 text-sm text-pretty text-muted-foreground">{part.body}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="tahapan" eyebrow="Tahapan" title="Lima langkah sampai Anda siap ditugaskan">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.75fr)] lg:items-start lg:gap-16">
          <ol className="space-y-4">
            {STAGES.map((stage, index) => (
              <li key={stage} className="flex gap-4">
                <span
                  aria-hidden
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-info-soft text-sm font-semibold text-info-soft-foreground"
                >
                  {index + 1}
                </span>
                <p className="pt-1.5 text-sm text-pretty text-muted-foreground">{stage}</p>
              </li>
            ))}
          </ol>

          <ImagePlaceholder label="Foto kreator saat verifikasi audiens" />
        </div>
      </Section>

      <Section
        id="perlu-diketahui"
        tone="muted"
        eyebrow="Perlu diketahui"
        title="Hal yang sering ditanyakan sebelum menandatangani apa pun"
      >
        <ul className="max-w-full space-y-3">
          {GOOD_TO_KNOW.map((item) => (
            <li key={item} className="flex gap-3 rounded-xl border bg-card p-4">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-border" />
              <p className="text-sm text-pretty text-muted-foreground">{item}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="faq-kreator"
        eyebrow="Tanya jawab"
        title="Pertanyaan dari kreator"
        description="Pertanyaan lain bisa langsung ditanyakan ke tim."
        layout="split"
        action={<ContactCta intent="creator" whatsappLabel="Tanya lewat WhatsApp" />}
      >
        <FaqList items={FAQ} />
      </Section>

      <section className="border-t bg-brand-panel text-brand-panel-foreground">
        <Container className="py-16 lg:py-20">
          <div className="mx-auto max-w-[55ch] text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
              Audiens Anda di Kalimantan?
            </h2>
            <p className="mt-3 text-base text-pretty text-brand-panel-muted">
              Kirim tautan akun media sosial dan tangkapan layar analitik audiens Anda. Tim akan
              mengabari bila ada kampanye yang cocok.
            </p>
            <ContactCta
              intent="creator"
              tone="brand"
              className="mt-7 sm:justify-center"
              whatsappLabel="Kirim profil lewat WhatsApp"
            />
          </div>
        </Container>
      </section>
    </>
  );
}
