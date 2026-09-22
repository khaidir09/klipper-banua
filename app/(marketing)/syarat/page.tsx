import type { Metadata } from "next";
import { LegalArticle, type LegalSection } from "@/components/marketing/legal-article";
import { publicEnv } from "@/lib/env";
import { whatsappDisplay } from "@/lib/marketing/contact";

/** The public site contacts the team on WhatsApp only (FR-M15-07). */
const WHATSAPP = whatsappDisplay(publicEnv.NEXT_PUBLIC_CONTACT_WA);

const DESCRIPTION =
  "Ketentuan pemakaian layanan pengelolaan kampanye kreator lokal: siapa yang dapat mengakses aplikasi, kewajiban instansi klien dan kreator, serta bagaimana honor dan persetujuan konten diatur.";

export const metadata: Metadata = {
  title: "Syarat Layanan",
  description: DESCRIPTION,
  alternates: { canonical: "/syarat" },
  openGraph: {
    title: "Syarat Layanan",
    description: DESCRIPTION,
    url: "/syarat",
    type: "article",
    locale: "id_ID",
  },
};

/**
 * Mirrors the rules the application already enforces (PRD M1–M8), so nothing
 * here promises behaviour the product does not have. Campaign contracts remain
 * the more specific document; this page is the general frame.
 */
const SECTIONS: LegalSection[] = [
  {
    heading: "Tentang layanan ini",
    body: [
      "Kami mengelola kampanye promosi instansi regional bersama kreator lokal: menyusun brief, menugaskan kreator, meninjau konten sebelum tayang, melacak hasil, menghitung honor kreator, dan menyusun laporan untuk instansi.",
      "Layanan dijalankan oleh tim kami. Kami bukan marketplace terbuka: instansi tidak memilih kreator sendiri dari katalog, dan kreator tidak melamar kampanye sendiri.",
    ],
  },
  {
    heading: "Akses ke aplikasi",
    bullets: [
      "Pendaftaran akun publik dinonaktifkan. Akun dibuat lewat undangan: anggota tim diundang oleh owner, kreator diundang setelah terverifikasi, dan kontak instansi klien diundang untuk portal klien.",
      "Setiap orang memakai akunnya sendiri dan bertanggung jawab menjaga kerahasiaan kata sandinya.",
      "Akses dapat dicabut atau dinonaktifkan sewaktu-waktu, misalnya ketika kerja sama berakhir atau ada penyalahgunaan.",
      "Akun portal hanya memuat data milik pemakainya: kreator melihat penugasannya sendiri, kontak klien melihat kampanye instansinya sendiri.",
    ],
  },
  {
    heading: "Kewajiban instansi klien",
    bullets: [
      "Menyediakan materi, logo, dan informasi kampanye yang sah dipakai, termasuk izin atas merek dan aset yang diserahkan kepada kami.",
      "Menyampaikan brief, larangan, dan ketentuan label berbayar yang ingin diberlakukan pada konten kreator.",
      "Melaporkan jumlah pendaftar dalam bentuk angka rekap per kode referal, tanpa menyertakan data pribadi pendaftar.",
      "Membayar paket kampanye sesuai kesepakatan pada dokumen kampanye masing-masing.",
    ],
  },
  {
    heading: "Kewajiban kreator mitra",
    bullets: [
      "Mengikuti brief kampanye: hal yang wajib dilakukan, larangan, hashtag, dan kewajiban mencantumkan label berbayar bila diminta.",
      "Mengirim draf konten untuk ditinjau, dan hanya menayangkan konten yang sudah disetujui.",
      "Mempertahankan konten tayang minimal sejumlah hari yang disepakati di brief.",
      "Tidak menaikkan angka secara tidak wajar, termasuk membeli views, klik, atau interaksi. Pelanggaran dapat membatalkan hak atas bonus kinerja.",
      "Mengirim bukti metrik berupa tangkapan layar yang benar dan belum diubah.",
    ],
  },
  {
    heading: "Persetujuan konten",
    body: [
      "Setiap konten melewati review tim. Tim dapat menyetujui, meminta revisi dengan catatan, atau menolak.",
      "Kampanye dapat diatur agar konten yang sudah disetujui tim menunggu persetujuan instansi klien lebih dulu. Bila diatur demikian, konten baru boleh ditandai tayang setelah kedua tahap lulus.",
    ],
  },
  {
    heading: "Honor kreator dan pembayaran",
    body: [
      "Honor terdiri dari honor dasar per konten yang memenuhi syarat, ditambah bonus berdasarkan views dan pendaftar. Nominal dan batas bonus ditetapkan per kampanye dan disampaikan kepada kreator sebelum pekerjaan dimulai.",
      "Angka yang memengaruhi honor hanya sah setelah diverifikasi tim. Kiriman bukti dari kreator dan laporan pendaftar dari instansi berstatus usulan sampai diterima.",
      "Perhitungan dilakukan sistem, lalu disetujui dan ditandai terbayar oleh owner. Kewajiban perpajakan atas honor mengikuti ketentuan yang berlaku dan disampaikan sebelum pembayaran.",
    ],
  },
  {
    heading: "Hak pakai konten",
    body: [
      "Hak pakai konten oleh instansi klien, termasuk durasi dan kanal pemakaiannya, disepakati pada dokumen kampanye masing-masing. Halaman ini tidak memberikan hak pakai apa pun secara otomatis.",
    ],
  },
  {
    heading: "Larangan pemakaian",
    bullets: [
      "Memakai akses aplikasi untuk mengambil data yang bukan hak Anda, termasuk data kreator lain, instansi lain, atau angka keuangan internal.",
      "Membagikan akun, kata sandi, atau tautan laporan rahasia kepada pihak yang tidak berhak.",
      "Mencoba menembus pembatasan peran, memanipulasi angka metrik, atau mengganggu jalannya layanan.",
    ],
  },
  {
    heading: "Batasan tanggung jawab",
    body: [
      "Kami bekerja berdasarkan target yang disepakati, tetapi tidak menjamin jumlah pendaftar tertentu: hasil promosi dipengaruhi banyak faktor di luar kendali kami, termasuk algoritma platform media sosial dan keputusan calon pendaftar.",
      "Kami tidak bertanggung jawab atas kerugian yang timbul dari data yang tidak akurat yang diserahkan kepada kami, atau dari perubahan kebijakan platform pihak ketiga.",
    ],
  },
  {
    heading: "Perubahan ketentuan",
    body: [
      "Ketentuan ini dapat diperbarui. Tanggal pembaruan tercantum di bagian atas halaman, dan perubahan yang berdampak pada kerja sama yang sedang berjalan akan kami sampaikan lebih dulu.",
      "Bila ada perbedaan antara halaman ini dan dokumen kampanye yang ditandatangani, dokumen kampanye yang berlaku.",
    ],
  },
  {
    heading: "Hukum yang berlaku",
    body: [
      "Ketentuan ini tunduk pada hukum Republik Indonesia. Perselisihan diselesaikan terlebih dahulu secara musyawarah.",
    ],
  },
  {
    heading: "Menghubungi kami",
    body: [
      WHATSAPP
        ? `Pertanyaan mengenai ketentuan ini dapat disampaikan lewat WhatsApp ke ${WHATSAPP}.`
        : "Pertanyaan mengenai ketentuan ini dapat disampaikan lewat WhatsApp tim, tombolnya ada di halaman utama.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalArticle
      title="Syarat Layanan"
      updatedAt="22 Sep 2026"
      intro={[
        `Ketentuan umum pemakaian layanan dan aplikasi ${publicEnv.NEXT_PUBLIC_APP_NAME}. Ketentuan yang lebih rinci untuk satu kampanye berada di dokumen kampanye masing-masing.`,
      ]}
      sections={SECTIONS}
      footnote="Dokumen ini menjelaskan praktik produk. Identitas badan hukum pengelola beserta alamat resminya dicantumkan setelah ditetapkan."
    />
  );
}
