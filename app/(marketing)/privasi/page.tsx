import type { Metadata } from "next";
import { LegalArticle, type LegalSection } from "@/components/marketing/legal-article";
import { publicEnv } from "@/lib/env";
import { whatsappDisplay } from "@/lib/marketing/contact";

/** The public site contacts the team on WhatsApp only (FR-M15-07). */
const WHATSAPP = whatsappDisplay(publicEnv.NEXT_PUBLIC_CONTACT_WA);

const DESCRIPTION =
  "Bagaimana kami menangani data anggota tim, kontak instansi, dan kreator mitra — serta mengapa kami tidak menyimpan data pribadi calon pendaftar.";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description: DESCRIPTION,
  alternates: { canonical: "/privasi" },
  openGraph: {
    title: "Kebijakan Privasi",
    description: DESCRIPTION,
    url: "/privasi",
    type: "article",
    locale: "id_ID",
  },
};

/**
 * Describes what the product actually does, so every claim here is checkable
 * against PRD Bagian 9 and the database it documents. The legal entity name
 * and address are deliberately absent until the founder settles them
 * (PRD 13.2 no. 1 dan no. 11).
 */
const SECTIONS: LegalSection[] = [
  {
    heading: "Ringkasnya",
    bullets: [
      "Kami mengumpulkan data pribadi seminimal mungkin, dan hanya dari orang yang memang bekerja dengan kami: anggota tim, kontak instansi klien, dan kreator mitra.",
      "Kami tidak menyimpan data pribadi calon pendaftar atau calon mahasiswa. Yang kami terima dari instansi hanya angka rekap.",
      "Situs publik ini tidak memuat formulir, tidak membuat akun, dan tidak memasang pelacak pihak ketiga.",
      "Kreator dapat meminta datanya dihapus.",
    ],
  },
  {
    heading: "Data yang kami kumpulkan",
    body: [
      "Data di bawah ini dicatat oleh tim di dalam aplikasi pengelolaan kampanye, bukan dikumpulkan dari situs publik ini.",
    ],
    bullets: [
      "Anggota tim internal: nama, alamat email, peran, dan zona waktu tampilan.",
      "Kontak instansi klien: nama, jabatan, nomor WhatsApp, dan alamat email, untuk koordinasi kampanye dan akses portal klien.",
      "Kreator mitra: nama, nama panggung, nomor WhatsApp, email, kota dan provinsi, tanggal lahir (untuk memastikan usia minimal 18 tahun), akun media sosial, serta tangkapan layar analitik audiens sebagai bukti sebaran audiens.",
      "Data rekening kreator: nama bank, nomor rekening, dan nama pemilik rekening, semata-mata untuk pembayaran honor.",
      "Catatan aktivitas: siapa melakukan tindakan penting apa dan kapan, sebagai jejak audit internal.",
    ],
  },
  {
    heading: "Data yang tidak kami kumpulkan",
    body: [
      "Kami tidak meminta dan tidak menyimpan nama, nomor telepon, alamat email, atau data pribadi lain dari calon pendaftar maupun calon mahasiswa instansi klien.",
      "Laporan jumlah pendaftar yang kami terima berbentuk angka rekap per kode referal atau tanpa kode, misalnya jumlah pendaftar pada satu periode. Sebelum laporan semacam itu diterima, tim mengonfirmasi bahwa kirimannya bebas data pribadi.",
    ],
  },
  {
    heading: "Kunjungan lewat tautan pelacakan",
    body: [
      "Setiap kreator mendapat tautan pelacakan unik yang meneruskan pengunjung ke halaman tujuan instansi. Kami mencatat kunjungan itu untuk menghitung klik per kreator.",
      "Alamat IP pengunjung tidak disimpan apa adanya. Nilainya diacak dengan kunci rahasia (hash) lalu hanya dipakai untuk menyaring klik berulang dan lalu lintas otomatis. Kami tidak membangun profil pengunjung dan tidak mengaitkannya dengan identitas siapa pun.",
    ],
  },
  {
    heading: "Situs publik ini",
    body: [
      "Halaman yang sedang Anda baca bersifat statis: tidak ada formulir, tidak ada pembuatan akun, dan tidak ada permintaan data ke basis data kami.",
      "Tidak ada layanan analitik atau pelacak pihak ketiga yang dipasang. Satu-satunya hal yang mungkin tersimpan di peramban Anda adalah pilihan tema terang atau gelap, yang berada di perangkat Anda sendiri dan tidak pernah dikirim ke kami.",
    ],
  },
  {
    heading: "Untuk apa data dipakai",
    bullets: [
      "Menjalankan kampanye: menyusun brief, menugaskan kreator, meninjau konten, dan menagih tenggat.",
      "Menghitung dan membayar honor kreator secara adil berdasarkan angka yang sudah diverifikasi.",
      "Menyusun laporan kampanye untuk instansi klien.",
      "Menjaga keamanan: membatasi akses sesuai peran dan menyimpan jejak audit tindakan penting.",
    ],
  },
  {
    heading: "Penyimpanan dan akses",
    body: [
      "Data disimpan pada basis data terkelola dan berkas diunggah ke penyimpanan privat yang hanya dapat dibuka lewat tautan bertanda waktu dan berumur pendek.",
      "Akses dibatasi per peran. Nomor rekening kreator dan bukti keuangan hanya dapat dilihat oleh owner; pengelola kampanye melihatnya dalam bentuk tersamar. Kreator dan kontak klien yang memakai portal hanya dapat melihat datanya sendiri.",
    ],
  },
  {
    heading: "Berapa lama disimpan",
    body: [
      "Data kampanye, konten, metrik, dan laporan disimpan selama masih dibutuhkan untuk pertanggungjawaban kepada instansi klien dan kewajiban pembukuan.",
      "Data kreator disimpan selama kemitraan berjalan, dan dihapus atau dianonimkan setelah permintaan penghapusan diproses, kecuali bagian yang wajib kami simpan sebagai bukti pembayaran.",
    ],
  },
  {
    heading: "Hak Anda",
    body: [
      "Anda dapat meminta penjelasan data apa yang kami simpan tentang Anda, meminta koreksi bila ada yang salah, dan meminta penghapusan data Anda.",
      "Permintaan disampaikan lewat kontak di bawah. Kami akan memverifikasi bahwa permintaan itu memang datang dari Anda sebelum menjalankannya.",
    ],
  },
  {
    heading: "Dasar dan kepatuhan",
    body: [
      "Kami memproses data berdasarkan persetujuan Anda dan kebutuhan pelaksanaan kerja sama, mengikuti ketentuan perlindungan data pribadi yang berlaku di Indonesia.",
      "Bila kebijakan ini berubah, tanggal pembaruan di bagian atas halaman akan disesuaikan.",
    ],
  },
  {
    heading: "Menghubungi kami",
    body: [
      WHATSAPP
        ? `Pertanyaan atau permintaan terkait data pribadi dapat disampaikan lewat WhatsApp ke ${WHATSAPP}.`
        : "Pertanyaan atau permintaan terkait data pribadi dapat disampaikan lewat WhatsApp tim, tombolnya ada di halaman utama.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalArticle
      title="Kebijakan Privasi"
      updatedAt="22 Sep 2026"
      intro={[
        `Halaman ini menjelaskan data apa yang dikumpulkan ${publicEnv.NEXT_PUBLIC_APP_NAME}, untuk apa data itu dipakai, dan siapa yang dapat melihatnya.`,
      ]}
      sections={SECTIONS}
      footnote="Dokumen ini menjelaskan praktik produk. Identitas badan hukum pengelola beserta alamat resminya dicantumkan setelah ditetapkan."
    />
  );
}
