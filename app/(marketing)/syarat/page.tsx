import type { Metadata } from "next";
import { LegalArticle, type LegalSection } from "@/components/marketing/legal-article";
import { CREATOR_TERMS_VERSION, MINIMUM_CREATOR_AGE } from "@/lib/constants/creators";
import { publicEnv } from "@/lib/env";
import { whatsappDisplay } from "@/lib/marketing/contact";

/** The public site contacts the team on WhatsApp only (FR-M15-07). */
const WHATSAPP = whatsappDisplay(publicEnv.NEXT_PUBLIC_CONTACT_WA);

const DESCRIPTION =
  "Ketentuan pemakaian platform klipper lokal: pendaftaran klipper, kewajiban instansi klien dan klipper, verifikasi klip, honor per views, saldo, dan penarikan.";

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
 * Mirrors the rules the application enforces (PRD M1–M8, v4.0: M16–M19), so
 * nothing here promises behaviour the product does not have. A registration
 * at /daftar agrees to this page as version `CREATOR_TERMS_VERSION`; bump it
 * with any material change. Wording approved by the owner on 23 Sep 2026
 * (PRD 13.2 no. 5).
 */
const SECTIONS: LegalSection[] = [
  {
    heading: "Tentang layanan ini",
    body: [
      "Kami menjalankan platform yang mempertemukan instansi regional dengan klipper: orang yang memotong materi video kampanye menjadi klip pendek lalu mempostingnya di akun media sosialnya sendiri.",
      "Instansi memasang kampanye bersama tim kami. Klipper mendaftar sendiri, memilih kampanye dari katalog, dan dibayar dari views klip yang sudah diverifikasi tim.",
    ],
  },
  {
    heading: "Akses ke aplikasi",
    bullets: [
      `Klipper mendaftar sendiri di halaman Daftar jadi Klipper, wajib berusia minimal ${MINIMUM_CREATOR_AGE} tahun, dan mengonfirmasi alamat emailnya. Satu orang hanya boleh memiliki satu akun.`,
      "Akun anggota tim dan kontak instansi klien dibuat lewat undangan.",
      "Setiap orang memakai akunnya sendiri dan bertanggung jawab menjaga kerahasiaan kata sandinya.",
      "Akses dapat dicabut atau dinonaktifkan sewaktu-waktu, misalnya ketika kerja sama berakhir atau ada penyalahgunaan.",
      "Akun portal hanya memuat data milik pemakainya: klipper melihat kampanye, klip, dan saldonya sendiri; kontak klien melihat kampanye instansinya sendiri.",
    ],
  },
  {
    heading: "Kewajiban instansi klien",
    bullets: [
      "Menyediakan materi, logo, dan informasi kampanye yang sah dipakai, termasuk izin atas merek dan aset yang diserahkan kepada kami.",
      "Menyampaikan brief, larangan, dan ketentuan label berbayar yang ingin diberlakukan pada klip, serta menyetujui anggaran dan tarif per 1.000 views kampanye.",
      "Melaporkan jumlah pendaftar dalam bentuk angka rekap per kode referal, tanpa menyertakan data pribadi pendaftar.",
      "Membayar paket kampanye sesuai kesepakatan pada dokumen kampanye masing-masing.",
    ],
  },
  {
    heading: "Syarat Klipper",
    bullets: [
      "Memposting klip hanya dari akun media sosial yang terdaftar atas nama Anda di portal, dan menulis kode verifikasi pribadi Anda di caption atau deskripsi setiap klip.",
      "Mengikuti brief kampanye: hal yang wajib dilakukan, larangan, hashtag, dan kewajiban mencantumkan label berbayar bila diminta.",
      "Hanya memakai materi kampanye untuk kampanye tersebut, dan tidak mengklaim video yang sama di lebih dari satu kiriman.",
      "Mempertahankan klip tetap tayang minimal sejumlah hari yang tertulis di kampanye.",
      "Tidak menaikkan angka secara tidak wajar, termasuk memakai bot atau membeli views, klik, atau interaksi. Klip yang terbukti curang ditolak, honornya dibatalkan, dan akun dapat diblokir.",
      "Mengirim tangkapan layar views yang benar dan belum diubah.",
    ],
  },
  {
    heading: "Verifikasi klip",
    body: [
      "Klip diverifikasi tim setelah tayang: kepemilikan akun, kepatuhan brief, waktu tayang, dan keaslian views. Tim dapat menyetujui dengan jumlah views terverifikasi, meminta perbaikan, atau menolak dengan alasan tertulis.",
      "Kampanye lama yang dikelola dengan paket honor tetap memakai review draf sebelum tayang sebagaimana disepakati saat itu.",
    ],
  },
  {
    heading: "Honor, saldo, dan penarikan",
    body: [
      "Honor klip dihitung dari views terverifikasi dikali tarif per 1.000 views kampanye, dengan batas per klip dan per klipper yang tertulis di kampanye, dan tidak melebihi anggaran kampanye.",
      "Honor masuk ke saldo saat klip atau pembaruan views disetujui. Honor dapat dibatalkan bila klip dihapus sebelum masa tayang minimum atau terbukti curang.",
      "Penarikan diajukan dari portal ke rekening bank atau e-wallet atas nama Anda sendiri, dengan batas minimum yang tertera di portal, lalu ditransfer manual oleh owner.",
      "Kewajiban perpajakan atas honor mengikuti ketentuan yang berlaku dan disampaikan sebelum pembayaran.",
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
      "Memakai akses aplikasi untuk mengambil data yang bukan hak Anda, termasuk data klipper lain, instansi lain, atau angka keuangan internal.",
      "Membuat lebih dari satu akun klipper, atau memakai akun media sosial milik orang lain.",
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
      updatedAt="23 Sep 2026"
      intro={[
        `Ketentuan umum pemakaian layanan dan aplikasi ${publicEnv.NEXT_PUBLIC_APP_NAME}, termasuk Syarat Klipper versi ${CREATOR_TERMS_VERSION} yang disetujui saat mendaftar. Ketentuan yang lebih rinci untuk satu kampanye tertulis di kampanye masing-masing.`,
      ]}
      sections={SECTIONS}
      footnote="Dokumen ini menjelaskan praktik produk. Identitas badan hukum pengelola beserta alamat resminya dicantumkan setelah ditetapkan."
    />
  );
}
