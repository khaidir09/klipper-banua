# PRD — Platform Kampanye Kreator Lokal Kalimantan (MVP Internal)

| Info               | Keterangan                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Versi              | 0.6 (MVP rilis pilot; v1.1: tautan laporan klien dan pengingat Telegram; v2.0: portal kreator; v3.0: portal klien; v3.1: situs publik) |
| Tanggal            | 22 September 2026                                                                           |
| Status             | Fase 0–11 dan Fase 13 selesai (v2.0 lengkap; portal klien: akses dan pantau; situs publik v3.1); Fase 12 (persetujuan konten dan laporan pendaftar klien) dirancang, belum dikerjakan |
| Nama produk        | Belum ditetapkan. Di kode dipakai variabel `NEXT_PUBLIC_APP_NAME` agar mudah diganti        |
| Pengguna versi ini | Tim internal (`owner`, `manager`); kreator lewat portal sejak v2.0; klien lewat portal sejak v3.0; pengunjung anonim membaca situs publik sejak v3.1 |

---

## 0. Cara Memakai Dokumen Ini dengan Claude Code

1. Simpan `PRD.md` dan `CLAUDE.md` di root repositori.
2. Di awal sesi, minta Claude Code: _"Baca PRD.md dan CLAUDE.md. Susun rencana implementasi untuk Fase 0 saja. Jangan menulis kode sebelum rencana saya setujui."_
3. Kerjakan **satu fase per sesi**. Setelah fase selesai, cek kriteria penerimaan (acceptance criteria), lalu commit.
4. Jika pilot menghasilkan temuan yang mengubah kebutuhan, **perbarui PRD dulu**, baru minta Claude Code mengubah kode.
5. Jangan meminta fitur yang tercantum di bagian "Di Luar Cakupan" sebelum PRD diperbarui.

---

## 1. Latar Belakang dan Konteks Bisnis

### 1.1 Masalah

- Instansi regional di Kalimantan (dimulai dari **kampus swasta**) butuh promosi yang menjangkau **audiens lokal**, bukan views nasional yang tidak relevan.
- Mereka dinilai dari **hasil yang bisa dilaporkan** (contoh: jumlah pendaftar PMB), tetapi promosi lewat kreator biasanya hanya dilaporkan sebagai views atau tangkapan layar yang tercecer.
- Kreator lokal dengan audiens Kalimantan sulit ditemukan, dikoordinasikan, diverifikasi, dan dibayar secara adil berdasarkan kinerja.
- Platform clipper nasional berfokus pada views murah dari mana saja, tidak pada jangkauan lokal, keamanan citra instansi, maupun laporan yang siap dipertanggungjawabkan.

### 1.2 Solusi (tahap MVP)

Aplikasi web **internal** untuk tim pengelola kampanye (model _managed marketplace_):

- menyimpan data klien dan kreator lokal terverifikasi (termasuk bukti audiens Kalimantan),
- mengelola kampanye, brief, dan materi,
- meninjau dan menyetujui konten sebelum tayang (_brand safety_),
- melacak kinerja: views per checkpoint, klik tautan unik, dan pendaftar per kode kreator,
- menghitung honor kreator (honor dasar + bonus kinerja),
- menghasilkan laporan kampanye yang siap diserahkan ke klien.

Klien dan kreator **belum login** di versi ini. Mereka dilayani tim melalui WhatsApp, dan seluruh data dicatat tim di aplikasi.

Sejak **v3.1** ada **situs publik** (M15) yang memperkenalkan platform kepada calon klien dan calon kreator, lalu mengarahkan mereka menghubungi tim. Situs itu statis, tidak terhubung ke database, dan tidak menggantikan satu pun alur kerja di aplikasi.

### 1.3 Model bisnis yang didukung aplikasi

- Klien membeli **paket kampanye harga tetap** dengan target (konten, views, pendaftar).
- Kreator dibayar **honor dasar per konten + bonus per 1.000 views + bonus per pendaftar** (nilai dapat diatur per kampanye dan per kreator).
- Pendapatan platform = harga paket − total honor kreator − biaya lain.

---

## 2. Tujuan dan Metrik Keberhasilan MVP

### 2.1 Tujuan produk

1. Menggantikan spreadsheet dan catatan manual pilot dengan satu sumber data.
2. Memangkas waktu operasional per kampanye (review, rekap metrik, hitung honor, laporan).
3. Menghasilkan data bisnis yang dibutuhkan untuk meyakinkan klien berikutnya dan investor.

### 2.2 Metrik keberhasilan

| Metrik                                                             | Target                                                   |
| ------------------------------------------------------------------ | -------------------------------------------------------- |
| Data kampanye pilot ke-2 dan seterusnya tercatat penuh di aplikasi | 100%, tanpa spreadsheet pendamping                       |
| Waktu menyusun laporan akhir kampanye                              | < 15 menit                                               |
| Selisih hitungan honor dengan hitungan manual                      | 0                                                        |
| Konten tayang tanpa melalui persetujuan                            | 0                                                        |
| Metrik bisnis yang dapat ditarik per kampanye                      | Views, klik, pendaftar, biaya per pendaftar, CPM, margin |
| Percakapan masuk yang berasal dari situs publik (v3.1)             | Dicatat manual oleh tim; dipakai menilai apakah situs perlu dikembangkan |

---

## 3. Pengguna dan Peran

| Peran     | Siapa              | Hak akses                                                                                                                                                                                    |
| --------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `owner`   | Founder / direktur | Semua fitur, termasuk kelola pengguna internal, data rekening kreator, persetujuan dan status pembayaran honor                                                                               |
| `manager` | Pengelola kampanye | Semua fitur operasional (klien, kreator, kampanye, konten, metrik, laporan). **Tidak bisa** melihat nomor rekening lengkap (tampil tersamar), mengelola pengguna, atau menyetujui pembayaran |
| `creator` | Kreator mitra _(v2.0)_ | Hanya portal kreator di `/portal`, hanya data penugasannya sendiri. **Tidak punya akses** ke aplikasi internal, data klien, kreator lain, harga paket, margin, atau log aktivitas |
| `client`  | Kontak klien _(v3.0)_  | Hanya portal klien di `/klien`, hanya kampanye milik instansinya. Memantau capaian, menyetujui konten bila kampanye mewajibkannya, mengunduh laporan, dan melaporkan jumlah pendaftar. **Tidak melihat** honor kreator, margin, biaya internal, data pribadi kreator, klien lain, atau log aktivitas |
| `anonim`  | Pengunjung situs publik _(v3.1)_ | Hanya halaman publik M15 (`/`, `/kreator`, `/privasi`, `/syarat`) dan redirect pelacakan `/r/<slug>`. **Tanpa akun, tanpa sesi, dan tanpa satu pun bacaan database** |

- Pendaftaran publik **dinonaktifkan**. Akun tim dibuat lewat undangan oleh `owner`; akun kreator lewat undangan dari halaman kreator (v2.0); akun klien lewat undangan dari halaman klien (v3.0). Situs publik v3.1 hanya menampilkan tombol hubungi tim: tidak ada formulir pendaftaran maupun pembuatan akun dari situs.
- Pengguna yang dinonaktifkan (`is_active = false`) tidak bisa mengakses data apa pun.
- Peran `creator` dan `client` bukan anggota internal: setiap pemeriksaan "anggota internal" di database (`is_active_member()`) menolak keduanya.

---

## 4. Ruang Lingkup

### 4.1 Dalam cakupan (MVP)

| Kode | Modul                                               | Prioritas     |
| ---- | --------------------------------------------------- | ------------- |
| M1   | Autentikasi dan pengguna internal                   | Wajib         |
| M2   | Klien dan kontak klien                              | Wajib         |
| M3   | Kreator, akun media sosial, bukti audiens, rekening | Wajib         |
| M4   | Kampanye, brief, materi                             | Wajib         |
| M5   | Penugasan kreator, kode referal, tautan pelacakan   | Wajib         |
| M6   | Konten dan alur review                              | Wajib         |
| M7   | Metrik (snapshot views, klik, laporan pendaftar)    | Wajib         |
| M8   | Honor kreator dan pembayaran klien                  | Wajib         |
| M9   | Laporan kampanye (cetak/PDF + CSV)                  | Wajib         |
| M10  | Dasbor dan pengingat                                | Wajib         |
| M11  | Log aktivitas (audit)                               | Wajib         |
| M12  | Catatan waktu operasional                           | Sebaiknya ada |
| M13  | Portal kreator (akses, brief, kiriman, honor)       | v2.0          |
| M14  | Portal klien (pantau, persetujuan konten, laporan)  | v3.0          |
| M15  | Situs publik pengenalan platform                     | v3.1          |

### 4.2 Di luar cakupan (JANGAN dibangun di MVP)

- Marketplace terbuka dan fitur di luar daftar modul. Portal **kreator** masuk cakupan sejak v2.0 (M13), portal **klien** sejak v3.0 (M14), dan **situs publik pengenalan platform** sejak v3.1 (M15).
- Kreator melamar kampanye sendiri (tetap ditugaskan tim).
- Payment gateway, top-up saldo, atau transfer honor otomatis.
- Integrasi API TikTok, Instagram, YouTube, atau Facebook untuk menarik metrik otomatis.
- Notifikasi WhatsApp/email otomatis. Pengecualian sejak v1.1: pengingat Telegram harian **untuk owner internal** (FR-M10-05).
- Penyimpanan data pribadi calon mahasiswa/pendaftar.
- Aplikasi mobile native, multi-bahasa, multi-tenant.
- Di situs publik (M15): formulir atau penyimpanan data calon klien/kreator, blog atau CMS, harga paket yang ditampilkan publik, multi-bahasa, analitik dan pelacak pihak ketiga, logo/nama/testimoni klien tanpa izin tertulis, serta pembuatan akun sendiri.
- Fitur AI.

---

## 5. Alur Utama

### 5.0 Dari situs publik ke tim _(v3.1)_

1. Calon klien atau calon kreator membaca situs publik (M15) dan memahami cara kerja, batasan, serta syaratnya.
2. Mereka menekan tombol hubungi (WhatsApp atau email). Tim melanjutkan ke alur 5.1 (kreator baru) atau 5.2 (kampanye baru) dan mencatat sendiri datanya di aplikasi.

Tidak ada jalur otomatis dari situs publik ke database: situs tidak menyimpan apa pun dan tidak membuat akun.

### 5.1 Onboarding kreator

1. Tim menambahkan kreator (status `prospek`) beserta akun media sosialnya.
2. Tim mengunggah tangkapan layar analitik audiens dan mengisi persentase audiens Kalimantan.
3. Tim mencatat persetujuan kreator atas syarat kerja sama (tanggal persetujuan).
4. `owner` atau `manager` memverifikasi → status `terverifikasi`.
5. `owner` mengisi data rekening kreator.

### 5.2 Siklus kampanye

1. Tim membuat klien (jika belum ada) dan kampanye berstatus `draft`: paket, target, brief, larangan, skema honor, URL tujuan (misalnya halaman pendaftaran PMB).
2. Tim mengunggah atau menautkan materi kampanye.
3. Tim menugaskan kreator. Sistem membuat **kode referal** dan **tautan pelacakan** unik per kreator.
4. Kampanye diubah menjadi `aktif`.
5. Kreator mengirim draf konten lewat WhatsApp → tim mencatatnya sebagai konten `menunggu_review`.
6. Tim meninjau: `disetujui`, `revisi` (dengan catatan), atau `ditolak`.
6b. _(v3.0, bila kampanye mewajibkan)_ Klien menyetujui konten yang sudah lolos review tim, atau meminta revisi dengan catatan.
7. Kreator memposting konten yang disetujui → tim mengisi URL dan waktu tayang.
8. Pada checkpoint H+1, H+3, H+7, dan akhir kampanye, tim memasukkan snapshot metrik beserta tangkapan layar bukti.
9. Klik tautan pelacakan tercatat otomatis.
10. Klien melaporkan jumlah pendaftar per kode kreator lewat WhatsApp → tim memasukkan angka agregatnya; sejak v3.0 klien dapat mengirimkannya sendiri dari portal untuk diverifikasi tim.
11. Kampanye selesai → sistem menghitung honor → `owner` menyetujui dan menandai pembayaran.
12. Tim mencetak laporan kampanye untuk klien.

---

## 6. Kebutuhan Fungsional

> Format ID kebutuhan: `FR-<modul>-<nomor>`. Setiap fase implementasi merujuk ID ini.

### M1 — Autentikasi dan Pengguna Internal

- **FR-M1-01** Login dengan email dan kata sandi (Supabase Auth). Pendaftaran publik dimatikan.
- **FR-M1-02** `owner` dapat mengundang pengguna baru, menetapkan peran, serta menonaktifkan/mengaktifkan pengguna.
- **FR-M1-03** Semua halaman selain `/login` dan `/r/[slug]` wajib login. Pengguna nonaktif diarahkan keluar.
- **FR-M1-04** Fitur lupa kata sandi.

### M2 — Klien

- **FR-M2-01** CRUD klien: nama, jenis (`kampus_swasta`, `sekolah_swasta`, `bank_daerah`, `bumd`, `pemda`, `event_organizer`, `umkm`, `lainnya`), kota, provinsi, alamat, catatan.
- **FR-M2-02** CRUD kontak klien: nama, jabatan, nomor WhatsApp, email. Satu klien dapat memiliki banyak kontak; satu ditandai kontak utama.
- **FR-M2-03** Halaman detail klien menampilkan riwayat kampanye beserta total nilai kontrak.

### M3 — Kreator

- **FR-M3-01** CRUD kreator: nama lengkap, nama panggung, nomor WhatsApp, email, kota, provinsi, tanggal lahir, niche (multi-pilih), tier (`nano`, `mikro`, `menengah`), status (`prospek`, `terverifikasi`, `aktif`, `nonaktif`, `diblokir`), catatan.
- **FR-M3-02** Validasi usia: kreator **wajib berusia ≥ 18 tahun** saat didaftarkan. Tampilkan pesan penolakan jika kurang.
- **FR-M3-03** CRUD akun media sosial per kreator: platform (`tiktok`, `instagram`, `youtube`, `facebook`), handle, URL profil, jumlah pengikut, persentase audiens Kalimantan (0–100), kota audiens teratas (teks), unggahan bukti analitik (gambar), tanggal verifikasi terakhir.
- **FR-M3-04** Pencatatan persetujuan syarat kerja sama: tanggal persetujuan dan versi syarat.
- **FR-M3-05** Verifikasi kreator: tombol "Verifikasi" mencatat `verified_at` dan `verified_by`. Kreator hanya bisa diverifikasi jika memiliki minimal satu akun sosial dengan bukti audiens dan persetujuan syarat sudah tercatat.
- **FR-M3-06** Data rekening (nama bank, nomor rekening, nama pemilik) disimpan di tabel terpisah yang **hanya dapat diakses `owner`**. `manager` hanya melihat 4 digit terakhir.
- **FR-M3-07** Daftar kreator dapat difilter berdasarkan provinsi, kota, niche, tier, status, platform, dan persentase audiens Kalimantan minimum.
- **FR-M3-08** Halaman detail kreator menampilkan riwayat kampanye, total views, total pendaftar, dan total honor yang diterima.

### M4 — Kampanye

- **FR-M4-01** CRUD kampanye:
  - identitas: klien, kode kampanye unik (contoh `PMB-KAMPUSX-2026-01`), nama, tujuan (`pendaftar`, `awareness`, `event`);
  - brief: deskripsi, daftar yang wajib, daftar larangan, hashtag, kewajiban label konten berbayar (default: wajib);
  - URL tujuan (`landing_url`) untuk tautan pelacakan;
  - periode: tanggal mulai, tanggal selesai, minimal hari konten tetap tayang (default 30);
  - komersial: harga paket (Rupiah), target jumlah konten, target views, target pendaftar;
  - skema honor default: honor dasar per konten, bonus per 1.000 views, bonus per pendaftar, batas maksimal bonus views per kreator (opsional).
- **FR-M4-02** Status kampanye: `draft` → `aktif` → `selesai`, atau `dibatalkan`. Kampanye tidak bisa diaktifkan tanpa `landing_url` (untuk tujuan `pendaftar`) dan minimal satu kreator.
- **FR-M4-03** Materi kampanye: judul, jenis (`video`, `foto`, `dokumen`, `tautan`), berkas unggahan **atau** URL eksternal (misalnya Google Drive untuk video besar), catatan.
- **FR-M4-04** Halaman detail kampanye dengan tab: Ringkasan, Brief & Materi, Kreator, Konten, Metrik, Keuangan, Laporan.

### M5 — Penugasan Kreator dan Tautan Pelacakan

- **FR-M5-01** Menambahkan kreator ke kampanye. Hanya kreator berstatus `terverifikasi` atau `aktif` yang bisa dipilih.
- **FR-M5-02** Per penugasan: status (`diundang`, `bergabung`, `mundur`, `selesai`), jumlah konten yang disepakati, serta override skema honor (jika kosong, memakai default kampanye).
- **FR-M5-03** Sistem membuat **kode referal** unik otomatis (huruf kapital + angka, 6–8 karakter, mudah dibaca, tanpa karakter ambigu seperti O/0 dan I/1). Kode dapat diedit manual selama tetap unik.
- **FR-M5-04** Sistem membuat **slug pelacakan** unik. Tautan berbentuk `https://<domain>/r/<slug>`.
- **FR-M5-05** Endpoint publik `GET /r/[slug]`:
  - mencatat klik (waktu, referrer, user agent, hash IP dengan salt rahasia, penanda bot sederhana berdasarkan user agent);
  - mengarahkan (HTTP 302) ke `landing_url` kampanye dengan tambahan parameter `utm_source`, `utm_medium=kreator`, `utm_campaign=<kode kampanye>`, dan `ref=<kode referal>`;
  - **hanya** mengarahkan ke `landing_url` yang tersimpan di database (bukan dari parameter URL) untuk mencegah open redirect;
  - jika slug tidak ditemukan atau kampanye `dibatalkan`, tampilkan halaman 404 sederhana.
- **FR-M5-06** Tombol salin tautan pelacakan dan kode referal, serta teks brief siap kirim ke WhatsApp kreator (berisi brief, larangan, kode, dan tautan).

### M6 — Konten dan Review

- **FR-M6-01** Mencatat konten per penugasan: platform, tautan draf (URL) atau berkas draf, draf caption.
- **FR-M6-02** Status review: `menunggu_review` → `disetujui` / `revisi` / `ditolak`. Status `revisi` wajib disertai catatan. Konten yang direvisi kembali ke `menunggu_review` saat draf baru dicatat, dan `revision_count` bertambah.
- **FR-M6-03** Checklist review yang wajib dicentang sebelum menyetujui: sesuai brief, tidak melanggar larangan, ada label konten berbayar (jika diwajibkan), tidak ada informasi keliru tentang klien.
- **FR-M6-04** Setelah `disetujui`, tim dapat mengisi URL tayang dan waktu tayang → status tayang `tayang`. URL tayang **tidak bisa** diisi untuk konten yang belum disetujui. _(v3.0)_ Pada kampanye yang mewajibkan persetujuan klien, URL tayang juga baru dapat diisi setelah klien menyetujui (FR-M14-04).
- **FR-M6-05** Status tayang: `belum_tayang`, `tayang`, `dihapus`. Jika ditandai `dihapus`, catat tanggal penghapusan.
- **FR-M6-06** Riwayat review (siapa, kapan, keputusan, catatan) disimpan dan ditampilkan.

### M7 — Metrik

- **FR-M7-01** Input snapshot metrik per konten tayang: checkpoint (`H+1`, `H+3`, `H+7`, `akhir`, `lainnya`), waktu pengambilan, views, likes, komentar, share, simpan, unggahan tangkapan layar bukti (wajib).
- **FR-M7-02** Views sebuah konten = nilai views dari snapshot **terbaru** (berdasarkan `captured_at`). Sistem memberi peringatan jika views snapshot baru lebih kecil dari snapshot sebelumnya.
- **FR-M7-03** Klik tautan dihitung otomatis dari tabel klik. Tampilkan total klik dan klik non-bot.
- **FR-M7-04** Input laporan pendaftar dari klien: per penugasan (kode kreator) atau "tanpa kode", periode, jumlah pendaftar (angka agregat), bukti opsional, catatan. **Tidak menyimpan nama atau data pribadi pendaftar.** _(v3.0)_ Klien dapat mengirim angka ini sendiri dari portal sebagai usulan; hanya yang diterima tim menjadi laporan resmi (FR-M14-06).
- **FR-M7-05** Tab Metrik kampanye menampilkan: total views, klik, pendaftar, perbandingan dengan target, grafik views kumulatif per checkpoint, dan tabel per kreator.

### M8 — Keuangan

- **FR-M8-01** Sistem menghitung usulan honor per penugasan sesuai aturan di Bagian 8. Hasil disimpan sebagai `payout` berstatus `draf`.
- **FR-M8-02** Tim dapat menambahkan penyesuaian (positif/negatif) dengan alasan wajib.
- **FR-M8-03** Hanya `owner` yang dapat mengubah status `draf` → `disetujui` → `dibayar`. Status `dibayar` wajib disertai tanggal bayar dan bukti transfer.
- **FR-M8-04** Hitung ulang honor hanya diperbolehkan untuk payout berstatus `draf`.
- **FR-M8-05** Pembayaran klien: nomor invoice, nominal, tanggal jatuh tempo, status (`belum_dibayar`, `sebagian`, `lunas`), tanggal bayar, bukti.
- **FR-M8-06** Tab Keuangan kampanye menampilkan: harga paket, total diterima dari klien, total honor, margin kotor (Rp dan %), biaya per pendaftar, dan CPM.

### M9 — Laporan Kampanye

- **FR-M9-01** Halaman laporan siap cetak (ukuran A4, CSS khusus cetak) yang bisa disimpan sebagai PDF lewat fitur cetak browser.
- **FR-M9-02** Isi laporan: identitas kampanye dan klien, periode, ringkasan capaian vs target, grafik views, tabel per kreator (nama panggung, platform, jumlah konten, views, klik, pendaftar), daftar tautan konten tayang, dan catatan penutup yang dapat diedit.
- **FR-M9-03** Laporan untuk klien **tidak menampilkan** data keuangan internal (honor kreator, margin).
- **FR-M9-04** Ekspor CSV: daftar konten beserta metrik terbaru, serta rekap per kreator.
- **FR-M9-05** _(v1.1)_ Tautan laporan baca-saja untuk klien, tanpa login:
  - dibuat dan dicabut oleh `owner` atau `manager` dari tab Laporan, untuk kampanye berstatus `aktif` atau `selesai`; satu tautan aktif per kampanye;
  - token acak 32 byte; database hanya menyimpan hash SHA-256, sehingga tautan ditampilkan sekali saat dibuat ("Buat ulang" mencabut tautan lama);
  - berlaku sampai dicabut, dengan tanggal kedaluwarsa opsional; tautan dicabut, kedaluwarsa, salah, atau kampanye dibatalkan menampilkan halaman tidak ditemukan yang sama;
  - isi sama dengan laporan cetak (FR-M9-02) dan tetap tanpa data keuangan (FR-M9-03); halaman `noindex`, tanpa referrer, dengan rate limit per IP;
  - mencatat jumlah dan waktu terakhir dilihat tanpa menyimpan IP; pembuatan dan pencabutan tercatat di log aktivitas;
  - tetap berlaku setelah portal klien (v3.0) ada, untuk pihak klien yang tidak punya akun (pimpinan, yayasan, panitia).

### M10 — Dasbor dan Pengingat

- **FR-M10-01** Kartu ringkasan: kampanye aktif, konten menunggu review, snapshot metrik yang jatuh tempo, honor belum dibayar, invoice klien belum lunas, dan _(v2.0)_ kiriman kreator yang menunggu verifikasi (usulan tayang dan usulan metrik) lintas kampanye.
- **FR-M10-02** Daftar **snapshot jatuh tempo**: konten tayang yang sudah melewati H+1, H+3, atau H+7 dari `posted_at` tetapi belum memiliki snapshot untuk checkpoint tersebut. Diurutkan dari yang paling lama terlambat.
- **FR-M10-03** Daftar konten `menunggu_review` diurutkan dari yang paling lama menunggu.
- **FR-M10-04** Peringatan konten `dihapus` sebelum memenuhi minimal hari tayang.
- **FR-M10-05** _(v1.1)_ Pengingat harian snapshot jatuh tempo ke akun Telegram `owner`:
  - aplikasi menyediakan endpoint internal yang dilindungi token (`REMINDER_API_TOKEN`) dan mengembalikan daftar FR-M10-02 beserta teks pesan siap kirim;
  - jadwal dan pengiriman diatur di n8n (Schedule → HTTP Request → Telegram); token bot dan chat ID hanya disimpan di n8n;
  - pesan hanya berisi kode kampanye, nama panggung kreator, platform, checkpoint, dan jumlah hari terlambat; dikirim hanya bila ada item;
  - endpoint tidak dapat diakses dari internet (diblokir di reverse proxy; n8n memanggilnya lewat jaringan Docker internal).

### M11 — Log Aktivitas

- **FR-M11-01** Mencatat otomatis aksi penting: buat/ubah/hapus data utama, perubahan status kampanye, keputusan review, perubahan status payout, akses data rekening oleh `owner`.
- **FR-M11-02** `owner` dapat melihat dan memfilter log aktivitas.

### M12 — Catatan Waktu Operasional

- **FR-M12-01** Pengguna mencatat waktu kerja per kampanye: aktivitas (`review`, `rekap_metrik`, `koordinasi_kreator`, `koordinasi_klien`, `pembayaran`, `laporan`, `lainnya`), durasi (menit), tanggal, catatan.
- **FR-M12-02** Rekap total jam per aktivitas per kampanye, untuk menentukan fitur yang paling perlu diotomasi berikutnya.

### M13 — Portal Kreator _(v2.0)_

Portal memindahkan pekerjaan input yang sekarang dikerjakan tim lewat WhatsApp kepada kreator. **Keputusan tetap di tim**: review konten, verifikasi metrik, dan persetujuan honor tidak pernah dilakukan dari portal.

**Fase 9 — akses dan brief**

- **FR-M13-01** `owner` atau `manager` mengundang kreator ke portal dari halaman detail kreator. Email kreator wajib terisi. Undangan memakai Supabase Auth (`invite`) dan tercatat di log aktivitas. Undangan dapat dikirim ulang.
- **FR-M13-02** Kreator login di halaman login yang sama, lalu diarahkan ke `/portal`. Kreator tidak dapat membuka satu pun rute internal; anggota internal yang membuka `/portal` diarahkan kembali ke `/dashboard`.
- **FR-M13-03** Dasbor portal: daftar penugasan kreator tersebut beserta status penugasan, status kampanye, periode, dan jumlah konten yang disepakati.
- **FR-M13-04** Halaman penugasan menampilkan: brief kampanye (isi brief, wajib dilakukan, larangan, hashtag, kewajiban label berbayar), materi kampanye (unduh lewat signed URL), kode referal dan tautan pelacakan `/r/<slug>` yang dapat disalin, skema honor yang berlaku baginya (honor dasar, bonus per 1.000 views, bonus per pendaftar, batas bonus views), serta minimal hari tayang.
- **FR-M13-08** `owner` dapat mencabut atau mengaktifkan kembali akses portal seorang kreator (`profiles.is_active`). Akses yang dicabut langsung memutus sesi berikutnya.

**Fase 10 — kiriman kreator**

- **FR-M13-05** Kreator mengirim draf konten (tautan atau berkas + draf caption) untuk penugasannya di kampanye berstatus `aktif`; draf masuk sebagai `contents` berstatus `menunggu_review`, yaitu antrean review yang sama dengan draf yang dicatat tim. Kreator dapat memperbaiki draf selama belum direview, melihat keputusan review beserta catatan revisi, lalu mengirim draf perbaikan (FR-M6-02). Kreator tidak dapat mengubah draf yang sudah direview, menyetujui kontennya sendiri, atau menghapus konten.
- **FR-M13-06** Kreator mengunggah bukti metrik (checkpoint, waktu pengambilan, views, likes, komentar, share, simpan, tangkapan layar wajib) sebagai **usulan**. Tim memverifikasi (terima/tolak dengan alasan); hanya usulan yang diterima menjadi `metric_snapshots` resmi. Angka yang memengaruhi honor tidak pernah masuk tanpa verifikasi tim.
- **FR-M13-07** Kreator melihat rincian honornya sendiri untuk setiap penugasan: honor dasar, bonus views, bonus pendaftar, penyesuaian beserta alasannya, total, dan status (`draf` ditampilkan sebagai "sedang dihitung dan masih bisa berubah", `disetujui`, `dibayar` beserta tanggal bayar). **Bukti transfer dan rincian perhitungan internal tetap hanya untuk `owner`.** Honor kreator lain tidak pernah terlihat.
- **FR-M13-09** Setelah kontennya disetujui, kreator melaporkan konten sudah tayang dengan mengirim URL tayang dan waktu tayang sebagai **usulan** (`contents.proposed_posted_url`, `proposed_posted_at`). Usulan tidak mengubah status tayang; tim mengonfirmasi dengan satu tindakan, dan saat itulah aturan FR-M6-04 berlaku (URL tayang hanya untuk konten yang sudah disetujui). Tim tetap dapat mengisi sendiri tanpa usulan.

**Aturan keamanan M13 (berlaku untuk kedua fase)**

- Kreator tidak pernah diberi kebijakan RLS atas tabel dasar. Seluruh bacaan portal lewat view `creator_portal_*` yang memfilter kreator yang sedang login dan hanya memuat kolom yang aman.
- Harga paket, target kampanye, margin, data klien, data kreator lain, catatan internal, dan rekening bank tidak pernah keluar lewat portal.
- Setiap tulisan dari portal lewat Server Action yang memvalidasi Zod, memeriksa kepemilikan penugasan di server, lalu ditegakkan ulang oleh RLS dan trigger database.

### M14 — Portal Klien _(v3.0)_

Portal klien memindahkan tiga percakapan WhatsApp ke aplikasi: "sudah sampai mana kampanyenya?", "boleh minta persetujuan konten ini?", dan "berapa pendaftar bulan ini?". Prinsipnya sama dengan M13: **klien memutuskan hal yang memang haknya; angka tetap diverifikasi tim.**

**Fase 11 — akses dan pantau**

- **FR-M14-01** `owner` atau `manager` mengundang kontak klien ke portal dari halaman klien. Undangan memakai Supabase Auth (`invite`) dan ditautkan ke baris `client_contacts` (FR-M2-02), sehingga setiap orang punya akun sendiri dan jejak persetujuan jelas siapa yang memutuskan. Undangan dapat dikirim ulang; `owner` dapat mencabut atau mengaktifkan kembali akses. Semuanya tercatat di log aktivitas.
- **FR-M14-02** Klien login di halaman login yang sama lalu diarahkan ke `/klien`. Klien tidak dapat membuka satu pun rute internal maupun portal kreator, dan hanya melihat kampanye milik instansinya sendiri.
- **FR-M14-03** Dasbor klien: daftar kampanye instansinya beserta status, periode, dan capaian vs target (views, klik non-bot, pendaftar). Halaman kampanye menampilkan grafik views per checkpoint, daftar konten tayang beserta tautannya, dan rekap per kreator memakai **nama panggung saja**.

**Fase 12 — persetujuan konten, laporan, dan laporan pendaftar**

- **FR-M14-04** Persetujuan konten dua tahap, **opsional per kampanye** (`campaigns.client_approval_required`). Bila diwajibkan: konten yang sudah `disetujui` tim berpindah ke antrean klien dengan `client_review_status = menunggu_klien`; klien memilih `disetujui` atau `revisi` (catatan wajib). Permintaan revisi klien mengembalikan konten ke alur revisi tim (FR-M6-02). Konten hanya boleh ditandai tayang setelah kedua tahap lulus.
- **FR-M14-05** Klien membuka laporan kampanye (isi sama dengan FR-M9-02, tanpa data keuangan internal sesuai FR-M9-03), mencetaknya sebagai PDF, dan mengunduh CSV yang sama dengan FR-M9-04 — tanpa perlu tautan rahasia.
- **FR-M14-06** Klien mengirim laporan jumlah pendaftar per kode referal atau "tanpa kode": periode, jumlah (angka agregat), bukti opsional, catatan. Kiriman masuk sebagai **usulan**; hanya yang diterima tim menjadi `registrant_reports` resmi, sehingga angka yang memengaruhi metrik dan bonus kreator tidak pernah masuk tanpa verifikasi. Penolakan wajib disertai alasan.
- **FR-M14-07** Bukti yang diunggah klien tetap tunduk pada FR-M7-04: hanya angka rekap, dengan konfirmasi bebas data pribadi pendaftar sebelum kiriman diterima.

**Aturan keamanan M14**

- Peran `client` tidak diberi kebijakan RLS atas tabel dasar kecuali baris yang memang miliknya dan perlu ditulis dari portal (keputusan persetujuan, usulan laporan pendaftar). Bacaan portal lewat view `client_portal_*` yang memfilter klien yang sedang login dan hanya memuat kolom aman.
- Honor kreator, margin, harga paket, biaya per pendaftar, catatan internal, data pribadi kreator (nama lengkap, WhatsApp, rekening), klien lain, dan log aktivitas tidak pernah keluar lewat portal klien.
- Ekspresi kebijakan tidak boleh menyentuh tabel ber-RLS lain; pakai helper `security definer` seperti pada M13.
- Setiap tulisan dari portal klien lewat Server Action yang memvalidasi Zod, memeriksa kepemilikan kampanye di server, lalu ditegakkan ulang oleh RLS dan trigger.

### M15 — Situs Publik _(v3.1)_

Situs publik memperkenalkan platform kepada **calon klien** (pesan utama) dan **calon kreator** (jalur kedua), lalu mengarahkan keduanya menghubungi tim. Prinsipnya satu: situs ini **lapisan pemasaran statis**, bukan pintu masuk baru ke data. Tidak ada tabel baru, tidak ada kueri database, dan tidak ada penyimpanan data calon.

**Fase 13 — halaman publik**

- **FR-M15-01** `/` menjadi halaman landing publik untuk semua pengunjung, dirender statis dan tanpa membaca cookie sesi. Tombol utama "Masuk" mengarah ke `/login`; pengguna yang sudah punya sesi diteruskan oleh guard yang ada ke area masing-masing, sehingga halaman tetap dapat di-cache penuh. Pengalihan `/login` bagi sesi yang sudah ada wajib memakai `homePathFor(role)` agar kreator dan klien tidak memantul lewat `/dashboard`.
- **FR-M15-02** Landing memuat, berurutan: proposisi nilai; masalah yang diangkat (Bagian 1.1); cara kerja dalam empat langkah (ringkasan Bagian 5.2); alasan memilih kreator lokal (bukti audiens Kalimantan, persetujuan konten sebelum tayang, laporan yang bisa dipertanggungjawabkan); untuk siapa platform ini; cuplikan jalur kreator beserta tautan ke `/kreator`; FAQ; ajakan menghubungi tim; footer berisi tautan legal dan "Masuk".
- **FR-M15-03** `/kreator` menjelaskan syarat bergabung (usia minimal 18 tahun, mayoritas audiens di Kalimantan, akun media sosial aktif), alur onboarding (Bagian 5.1), dan skema honor secara konseptual (honor dasar per konten + bonus per 1.000 views + bonus per pendaftar) **tanpa angka rupiah**. Halaman menyatakan tegas bahwa kreator ditugaskan oleh tim: tidak ada pendaftaran akun sendiri dan tidak ada fitur melamar kampanye (Bagian 4.2).
- **FR-M15-04** `/privasi` dan `/syarat` berisi konten statis yang disetujui `owner`. Halaman privasi wajib menyebut bahwa platform tidak menyimpan data pribadi pendaftar atau calon mahasiswa (Bagian 9), mencatat persetujuan kreator, dan menyediakan penghapusan data kreator atas permintaan.
- **FR-M15-05** Indeksasi selektif: layout grup `(marketing)` menimpa `robots` bawaan aplikasi menjadi `index, follow`; `app/robots.ts` hanya mengizinkan empat rute publik dan melarang `/dashboard`, `/portal`, `/klien`, `/laporan`, `/r`, `/api`, `/login`, `/lupa-sandi`, dan `/atur-sandi`; `app/sitemap.ts` hanya memuat rute publik. `public/robots.txt` dihapus agar tidak bertabrakan dengan `app/robots.ts`.
- **FR-M15-06** Klaim, angka, dan nama di situs publik hanya berupa konten statis yang disetujui `owner`. Tidak ada angka kampanye, nama, atau logo klien yang ditarik dari database; nama dan logo klien hanya tampil dengan izin tertulis. Studi kasus berangka tidak masuk fase ini.
- **FR-M15-07** Ajakan menghubungi memakai WhatsApp (`wa.me` dengan pesan awal berbeda untuk calon klien dan calon kreator) serta email, dari `NEXT_PUBLIC_CONTACT_WA` dan `NEXT_PUBLIC_CONTACT_EMAIL`. Tanpa formulir, tanpa penyimpanan, tanpa pelacak.
- **FR-M15-08** Nama rute pemasaran tidak boleh bertabrakan dengan area ber-sesi: `/portal`, `/klien`, `/laporan`, `/r`, `/api`, dan seluruh rute `(app)` terlarang sebagai nama halaman publik.

**Aturan keamanan M15**

- Grup `(marketing)` tidak mengimpor `lib/supabase/*`, `lib/auth/*`, maupun modul `server-only` apa pun. Halaman publik nol kueri: tidak ada bacaan, jadi tidak ada yang bisa bocor.
- `proxy.ts` hanya menambahkan rute publik M15 ke daftar yang boleh diakses tanpa sesi. Seluruh rute lain tetap tertutup seperti sebelumnya.
- Tidak ada skrip, font, atau pelacak pihak ketiga selain yang sudah dipakai aplikasi, sesuai batasan privasi Bagian 9.
- Situs publik tidak membuat akun, tidak mengirim undangan, dan tidak menulis ke `activity_logs`.

---

## 7. Model Data

> Konvensi: nama tabel dan kolom memakai bahasa Inggris (`snake_case`). Nilai enum memakai bahasa Indonesia sesuai istilah di UI. Semua tabel memiliki `id uuid` (default `gen_random_uuid()`), `created_at` dan `updated_at` (`timestamptz`). Nominal uang memakai `bigint` dalam Rupiah utuh (tanpa desimal).

> M15 (situs publik, v3.1) tidak menambah tabel, kolom, view, maupun kebijakan RLS: halaman publik tidak membaca database sama sekali.

| Tabel                     | Kolom utama                                                                                                                                                                                                                                                                                                                                                                                                    | Catatan                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `profiles`                | `id` (= `auth.users.id`), `full_name`, `email`, `role` (`owner`/`manager`/`creator`), `is_active`, `timezone`                                                                                                                                                                                                                                                                                                  | Dibuat saat undangan diterima. `creator` = akun portal (v2.0), bukan anggota internal |
| `clients`                 | `name`, `type`, `city`, `province`, `address`, `notes`                                                                                                                                                                                                                                                                                                                                                         |                                                                                    |
| `client_contacts`         | `client_id`, `name`, `position`, `phone_wa`, `email`, `is_primary`, `profile_id`, `portal_invited_at`                                                                                                                                                                                                                                                                                                                                             | `profile_id` (unik) = akun portal klien v3.0 |
| `creators`                | `full_name`, `stage_name`, `phone_wa`, `email`, `city`, `province`, `birth_date`, `niches text[]`, `tier`, `status`, `terms_version`, `terms_agreed_at`, `verified_at`, `verified_by`, `notes`, `profile_id`, `portal_invited_at`                                                                                                                                                                                                            | Usia ≥ 18 divalidasi di aplikasi. `profile_id` (unik) = akun portal v2.0           |
| `creator_bank_accounts`   | `creator_id` (unik), `bank_name`, `account_number`, `account_holder`                                                                                                                                                                                                                                                                                                                                           | **RLS: hanya `owner`**. `manager` membaca lewat view/fungsi yang menyamarkan nomor |
| `creator_social_accounts` | `creator_id`, `platform`, `handle`, `profile_url`, `followers_count`, `kalimantan_audience_pct numeric(5,2)`, `top_cities`, `audience_proof_path`, `last_verified_at`                                                                                                                                                                                                                                          | Unik (`platform`, `handle`)                                                        |
| `campaigns`               | `client_id`, `code` (unik), `name`, `objective`, `brief`, `must_do`, `must_not`, `hashtags`, `paid_label_required`, `landing_url`, `start_date`, `end_date`, `min_live_days`, `status`, `package_price`, `target_contents`, `target_views`, `target_registrants`, `default_base_fee`, `default_bonus_per_1000_views`, `default_bonus_per_registrant`, `default_views_bonus_cap`, `closing_notes`, `client_approval_required`, `created_by` |                                                                                    |
| `campaign_assets`         | `campaign_id`, `title`, `type`, `file_path`, `external_url`, `notes`                                                                                                                                                                                                                                                                                                                                           | Salah satu dari `file_path`/`external_url` wajib                                   |
| `campaign_creators`       | `campaign_id`, `creator_id`, `status`, `contents_committed`, `base_fee`, `bonus_per_1000_views`, `bonus_per_registrant`, `views_bonus_cap`, `referral_code` (unik global), `tracking_slug` (unik global), `joined_at`                                                                                                                                                                                          | Unik (`campaign_id`, `creator_id`). Kolom honor `null` = pakai default kampanye    |
| `contents`                | `campaign_creator_id`, `platform`, `draft_url`, `draft_file_path`, `caption_draft`, `review_status`, `revision_count`, `posted_url`, `posted_at`, `live_status`, `removed_at`, `proposed_posted_url`, `proposed_posted_at`, `proposed_at`, `client_review_status` | `client_review_status`: `tidak_perlu` / `menunggu_klien` / `disetujui` / `revisi` (v3.0) |
| `content_reviews`         | `content_id`, `decision`, `checklist jsonb`, `notes`, `reviewer_id`                                                                                                                                                                                                                                                                                                                                            | Riwayat, tidak diubah setelah dibuat                                               |
| `metric_snapshots`        | `content_id`, `checkpoint`, `captured_at`, `views`, `likes`, `comments`, `shares`, `saves`, `proof_path`, `entered_by`                                                                                                                                                                                                                                                                                         | Unik (`content_id`, `checkpoint`) kecuali `lainnya`                                |
| `link_clicks`             | `campaign_creator_id`, `clicked_at`, `referrer`, `user_agent`, `ip_hash`, `is_bot`                                                                                                                                                                                                                                                                                                                             | Insert hanya lewat route server `/r/[slug]`                                        |
| `registrant_reports`      | `campaign_id`, `campaign_creator_id` (nullable = tanpa kode), `period_start`, `period_end`, `registrant_count`, `proof_path`, `notes`, `entered_by`                                                                                                                                                                                                                                                            | Hanya angka agregat                                                                |
| `payouts`                 | `campaign_creator_id` (unik), `base_amount`, `views_bonus`, `registrant_bonus`, `adjustment_amount`, `adjustment_reason`, `total_amount`, `calculation_snapshot jsonb`, `status`, `approved_by`, `approved_at`, `paid_at`, `transfer_proof_path`                                                                                                                                                               | `calculation_snapshot` menyimpan input perhitungan                                 |
| `client_payments`         | `campaign_id`, `invoice_number` (unik), `amount`, `due_date`, `status`, `paid_amount`, `paid_at`, `proof_path`                                                                                                                                                                                                                                                                                                 |                                                                                    |
| `ops_time_logs`           | `campaign_id`, `user_id`, `activity`, `minutes`, `log_date`, `notes`                                                                                                                                                                                                                                                                                                                                           |                                                                                    |
| `report_share_links`      | `campaign_id`, `token_hash` (unik), `expires_at`, `created_by`, `revoked_at`, `revoked_by`, `last_viewed_at`, `view_count` | v1.1 (FR-M9-05); satu tautan aktif per kampanye; tidak dapat dihapus |
| `activity_logs`           | `actor_id`, `entity_type`, `entity_id`, `action`, `details jsonb`                                                                                                                                                                                                                                                                                                                                              | Append-only                                                                        |
| `metric_submissions`      | `content_id`, `checkpoint`, `captured_at`, `views`, `likes`, `comments`, `shares`, `saves`, `proof_path`, `status` (`menunggu`/`diterima`/`ditolak`), `review_notes`, `submitted_by`, `reviewed_by`, `reviewed_at`, `snapshot_id`                                                                                                                                                                              | v2.0 Fase 10 (FR-M13-06); usulan metrik dari kreator, resmi hanya setelah diterima |
| `client_content_reviews`  | `content_id`, `decision` (`disetujui`/`revisi`), `notes`, `reviewer_id`, `created_at` | v3.0 (FR-M14-04); riwayat keputusan klien, tidak diubah setelah dibuat |
| `registrant_submissions`  | `campaign_id`, `campaign_creator_id` (nullable), `period_start`, `period_end`, `registrant_count`, `proof_path`, `proof_confirmed_no_personal_data`, `notes`, `status`, `review_notes`, `submitted_by`, `reviewed_by`, `reviewed_at`, `report_id` | v3.0 (FR-M14-06); usulan pendaftar dari klien, resmi hanya setelah diterima |

**View portal kreator (v2.0).** Kreator tidak memiliki kebijakan RLS atas tabel mana pun. Portal membaca lewat view berikut; semuanya memfilter kreator yang sedang login (`current_creator_id()`), hanya memuat kolom yang aman, dan hanya dapat dibaca oleh peran `authenticated` (bukan `anon`).

| View                          | Isi                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `creator_portal_profile`      | Data diri kreator sendiri, tanpa `notes` internal                                                            |
| `creator_portal_assignments`  | Penugasan miliknya + kolom kampanye yang aman + skema honor efektif. Tanpa `package_price`, target, dan margin |
| `creator_portal_assets`       | Materi kampanye untuk kampanye yang ditugaskan kepadanya                                                     |
| `creator_portal_contents`     | Konten miliknya beserta status review (Fase 10)                                                              |
| `creator_portal_reviews`      | Riwayat keputusan review atas kontennya (Fase 10)                                                            |
| `creator_portal_metrics`      | Snapshot metrik resmi atas kontennya sendiri (Fase 10)                                                       |
| `creator_portal_submissions`  | Usulan metrik yang ia kirim beserta status verifikasinya (Fase 10)                                           |
| `creator_portal_payouts`      | Rincian honornya sendiri, tanpa `transfer_proof_path` (Fase 10)                                              |

**View portal klien (v3.0).** Aturan yang sama: peran `client` membaca lewat view yang memfilter klien yang sedang login, hanya kolom yang aman, dan hanya dapat dibaca peran `authenticated`.

| View                        | Isi                                                                                                        |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `client_portal_campaigns`   | Kampanye instansinya: status, periode, target, dan capaian. Tanpa harga paket, honor, dan margin (Fase 11) |
| `client_portal_contents`    | Konten kampanyenya beserta status review, status persetujuan klien, dan tautan tayang (Fase 11–12)         |
| `client_portal_creators`    | Rekap per kreator dengan nama panggung saja (Fase 11)                                                      |
| `client_portal_metrics`     | Snapshot resmi per konten untuk grafik dan rekap (Fase 11)                                                 |
| `client_portal_submissions` | Usulan laporan pendaftar yang ia kirim beserta status verifikasinya (Fase 12)                              |

### 7.1 Penyimpanan berkas (Supabase Storage)

Semua bucket **privat**, diakses dengan signed URL berumur pendek.

| Bucket            | Isi                                                                            |
| ----------------- | ------------------------------------------------------------------------------ |
| `audience-proofs` | Bukti analitik audiens kreator                                                 |
| `campaign-assets` | Materi kampanye (maks. 50 MB per berkas; video besar memakai tautan eksternal) |
| `content-drafts`  | Draf konten                                                                    |
| `metric-proofs`   | Tangkapan layar metrik                                                         |
| `finance-proofs`  | Bukti transfer honor dan pembayaran klien (hanya `owner`)                      |

---

## 8. Aturan Bisnis dan Perhitungan

Semua perhitungan ditempatkan di modul murni `lib/calculations/` dan **wajib memiliki unit test**.

### 8.1 Nilai efektif skema honor

`nilai_efektif = campaign_creators.<kolom> ?? campaigns.default_<kolom>`

### 8.2 Konten yang memenuhi syarat honor

Konten dihitung jika **semua** kondisi terpenuhi:

1. `review_status = 'disetujui'`;
2. memiliki `posted_url` dan `posted_at`;
3. `live_status = 'tayang'`, **atau** `live_status = 'dihapus'` dengan `removed_at − posted_at ≥ min_live_days`.

### 8.3 Rumus honor per penugasan

```
konten_valid     = min(jumlah konten memenuhi syarat, contents_committed)
base_amount      = konten_valid × base_fee
total_views      = Σ views snapshot terbaru dari konten memenuhi syarat
views_bonus_raw  = floor(total_views / 1000) × bonus_per_1000_views
views_bonus      = views_bonus_cap ? min(views_bonus_raw, views_bonus_cap) : views_bonus_raw
registrant_bonus = Σ registrant_count (laporan untuk kode kreator ini) × bonus_per_registrant
total_amount     = base_amount + views_bonus + registrant_bonus + adjustment_amount
```

- Semua hasil dibulatkan ke bawah ke Rupiah utuh.
- `total_amount` tidak boleh negatif (minimal 0).
- Payout hanya dapat dibuat jika kampanye berstatus `selesai`.

### 8.4 Metrik kampanye

```
total_views          = Σ views snapshot terbaru semua konten tayang
total_clicks_valid   = jumlah link_clicks dengan is_bot = false
total_registrants    = Σ registrant_count (termasuk tanpa kode)
cpm                  = package_price / total_views × 1000        (tampilkan "–" jika total_views = 0)
cost_per_registrant  = package_price / total_registrants        (tampilkan "–" jika 0)
gross_margin         = package_price − Σ payouts.total_amount
gross_margin_pct     = gross_margin / package_price × 100
```

### 8.5 Aturan lain

- Kampanye `selesai` atau `dibatalkan` tidak dapat diubah kecuali oleh `owner`, dan setiap perubahan dicatat di log.
- Kreator berstatus `diblokir` tidak dapat ditugaskan ke kampanye mana pun.
- Kode referal dan slug tidak boleh diubah setelah ada klik atau laporan pendaftar yang terkait.
- Checkpoint jatuh tempo dihitung dari `posted_at` dalam zona waktu tampilan.
- _(v3.0)_ Pada kampanye dengan `client_approval_required`, konten baru boleh ditandai tayang setelah disetujui tim **dan** klien. Syarat honor (8.2) tetap dihitung dari konten yang benar-benar tayang, jadi menunggu persetujuan klien tidak merugikan kreator selama kontennya akhirnya tayang dan memenuhi `min_live_days`.

---

## 9. Kebutuhan Non-Fungsional

| Aspek            | Kebutuhan                                                                                                                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bahasa           | Seluruh antarmuka dalam Bahasa Indonesia. Kode, nama tabel, dan komentar teknis dalam bahasa Inggris                                                                                         |
| Zona waktu       | Simpan sebagai `timestamptz` (UTC). Tampilan default **WITA (`Asia/Makassar`)**, dapat diubah ke WIB (`Asia/Jakarta`) di pengaturan pengguna karena Kalimantan Barat dan Tengah memakai WIB  |
| Format           | Mata uang `Rp 1.500.000`; tanggal `17 Sep 2026`; angka besar dengan pemisah titik                                                                                                            |
| Responsif        | Nyaman dipakai di ponsel (tim sering bekerja dari HP), terutama dasbor, input snapshot, dan review konten                                                                                    |
| Keamanan         | RLS aktif di **semua** tabel; kunci `service_role` hanya di server; validasi input dengan Zod di server; bucket privat; batasi ukuran dan tipe berkas; rate limit sederhana pada `/r/[slug]` |
| Privasi (UU PDP) | Kumpulkan data pribadi seminimal mungkin; tidak menyimpan data pendaftar; catat persetujuan kreator; hash IP klik dengan salt rahasia; sediakan fungsi hapus data kreator atas permintaan    |
| Keandalan        | Migrasi database lewat file SQL berversi; ekspor CSV untuk cadangan manual                                                                                                                   |
| Kinerja          | Halaman daftar dengan paginasi di server; target muat halaman < 2 detik untuk data pilot. Halaman publik M15 dirender statis tanpa kueri; target LCP < 2,5 detik pada jaringan 4G           |
| Aksesibilitas    | Kontras cukup, label pada setiap input, dapat dioperasikan dengan keyboard                                                                                                                   |
| SEO (v3.1)       | Hanya halaman publik M15 yang diindeks: metadata per halaman, gambar Open Graph, `sitemap.xml`, dan `robots.txt` yang melarang seluruh area ber-sesi                                        |

---

## 10. Arsitektur dan Tech Stack

### 10.1 Stack

| Lapisan         | Pilihan                                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------ |
| Framework       | Next.js (App Router) + TypeScript (strict)                                                                   |
| UI              | Tailwind CSS + shadcn/ui, ikon lucide-react                                                                  |
| Form & validasi | React Hook Form + Zod                                                                                        |
| Tabel           | TanStack Table                                                                                               |
| Grafik          | Recharts                                                                                                     |
| Tanggal         | date-fns + date-fns-tz                                                                                       |
| Backend & DB    | Supabase: PostgreSQL, Auth, Storage, Row Level Security                                                      |
| Akses data      | `@supabase/ssr`; mutasi lewat Server Actions; route handler untuk `/r/[slug]` dan ekspor CSV                 |
| Migrasi         | Supabase CLI (`supabase/migrations/*.sql`) + tipe TypeScript hasil generate                                  |
| Pengujian       | Vitest untuk `lib/calculations` dan util; Playwright untuk alur kritis (opsional, Fase 7)                    |
| Hosting         | Vercel (gunakan paket berbayar untuk penggunaan komersial) atau VPS dengan Docker; Supabase region Singapura |

Gunakan versi stabil terbaru setiap pustaka saat proyek dibuat dan ikuti dokumentasi resminya.

### 10.2 Struktur folder yang diharapkan

```
app/
  (auth)/login/
  (app)/dashboard/
  (app)/clients/
  (app)/creators/
  (app)/campaigns/[id]/{overview,brief,creators,contents,metrics,finance,report}/
  (app)/settings/{users,profile}/
  (app)/activity/
  (portal)/portal/{penugasan,profil}/   # v2.0, peran `creator`
  (client)/klien/{kampanye,laporan}/    # v3.0, peran `client`
  (marketing)/{kreator,privasi,syarat}/ # v3.1, publik (landing di (marketing)/page.tsx)
  r/[slug]/route.ts
  api/export/[type]/route.ts
  robots.ts                            # v3.1, hanya rute publik yang diizinkan
  sitemap.ts
  opengraph-image.tsx
components/{ui,forms,tables,charts,layout,marketing}/
lib/
  supabase/{server,client,middleware}.ts
  calculations/{payout,campaign-metrics}.ts (+ .test.ts)
  validation/        # skema Zod
  auth/              # guard peran
  format/            # rupiah, tanggal, zona waktu
  referral/          # generator kode & slug
supabase/
  migrations/
  seed.sql
types/database.ts
```

### 10.3 Variabel lingkungan

`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLICK_IP_HASH_SALT`, `DEFAULT_TIMEZONE=Asia/Makassar`, dan sejak v1.1 `REMINDER_API_TOKEN` (opsional; tanpa nilai ini endpoint pengingat nonaktif). Sejak v3.1: `NEXT_PUBLIC_CONTACT_WA` dan `NEXT_PUBLIC_CONTACT_EMAIL`, dipakai tombol hubungi di situs publik (M15).

---

## 11. Rencana Implementasi Bertahap

Kerjakan berurutan. Satu fase = satu atau beberapa sesi Claude Code = satu commit/PR yang bisa diuji.

### Fase 0 — Fondasi

**Cakupan:** inisialisasi Next.js + TypeScript + Tailwind + shadcn/ui; koneksi Supabase; migrasi `profiles` + RLS; login, logout, lupa kata sandi; middleware proteksi rute; layout aplikasi (sidebar + header responsif); util format Rupiah dan tanggal WITA; seed akun `owner`. (FR-M1-01, FR-M1-03, FR-M1-04)
**Kriteria penerimaan:**

- [ ] `owner` hasil seed dapat login dan logout.
- [ ] Tidak ada halaman registrasi publik; rute `(app)` mengarahkan ke `/login` jika belum login.
- [ ] Pengguna dengan `is_active = false` tidak dapat mengakses rute `(app)`.
- [ ] `npm run build`, lint, dan typecheck lulus tanpa error.

### Fase 1 — Pengguna, Klien, dan Kreator

**Cakupan:** undangan dan kelola pengguna (FR-M1-02); M2; M3 lengkap termasuk unggah bukti audiens dan tabel rekening khusus `owner`; log aktivitas dasar (M11) untuk entitas ini.
**Kriteria penerimaan:**

- [ ] `manager` tidak dapat membaca `creator_bank_accounts` langsung (diuji lewat query dengan sesi `manager`).
- [ ] Kreator berusia < 18 tahun ditolak dengan pesan yang jelas.
- [ ] Kreator tidak dapat diverifikasi tanpa bukti audiens dan persetujuan syarat.
- [ ] Filter daftar kreator berjalan sesuai FR-M3-07.

### Fase 2 — Kampanye, Penugasan, dan Tautan Pelacakan

**Cakupan:** M4; M5 termasuk generator kode/slug, endpoint `/r/[slug]`, dan teks brief siap kirim WhatsApp.
**Kriteria penerimaan:**

- [ ] Kode referal dan slug unik, dengan unit test generator.
- [ ] Mengunjungi `/r/<slug>` mencatat klik dan mengarahkan ke `landing_url` dengan parameter UTM dan `ref`.
- [ ] Mengubah parameter URL tidak dapat membelokkan tujuan redirect.
- [ ] Kampanye tidak bisa diaktifkan tanpa syarat FR-M4-02.

### Fase 3 — Konten dan Review

**Cakupan:** M6 lengkap beserta riwayat review dan checklist.
**Kriteria penerimaan:**

- [ ] URL tayang tidak dapat diisi sebelum konten disetujui.
- [ ] Keputusan `revisi` tanpa catatan ditolak.
- [ ] Riwayat review tampil berurutan dan tidak dapat diedit.

### Fase 4 — Metrik dan Dasbor

**Cakupan:** M7 dan M10.
**Kriteria penerimaan:**

- [ ] Views konten mengambil snapshot terbaru; muncul peringatan jika views menurun.
- [ ] Daftar snapshot jatuh tempo tepat untuk H+1, H+3, H+7 (unit test dengan contoh tanggal dan zona waktu).
- [ ] Laporan pendaftar tersimpan tanpa data pribadi.

### Fase 5 — Keuangan

**Cakupan:** M8 dan modul `lib/calculations`.
**Kriteria penerimaan:**

- [ ] Unit test mencakup: override vs default, batas bonus views, konten dihapus sebelum/sesudah `min_live_days`, konten melebihi `contents_committed`, penyesuaian negatif, dan pembagian nol.
- [ ] Hanya `owner` yang dapat menyetujui dan menandai `dibayar`.
- [ ] Payout non-`draf` tidak dapat dihitung ulang.

### Fase 6 — Laporan dan Waktu Operasional

**Cakupan:** M9 dan M12.
**Kriteria penerimaan:**

- [ ] Laporan tercetak rapi di A4 (uji cetak ke PDF dari Chrome), tanpa data keuangan internal.
- [ ] Ekspor CSV terbuka benar di Excel/Google Sheets (UTF-8 dengan BOM).
- [ ] Rekap waktu per aktivitas tampil di kampanye.

### Fase 7 — Pengerasan dan Rilis Pilot

**Cakupan:** melengkapi log aktivitas (FR-M11-01 dan FR-M11-02), rate limit `/r/[slug]`, seed data demo (1 kampus, 8 kreator, 1 kampanye), pemeriksaan RLS menyeluruh, halaman error/404, deploy produksi, dan uji alur kritis end-to-end.
**Kriteria penerimaan:**

- [ ] Seluruh alur di Bagian 5.2 dapat dijalankan dari awal sampai laporan akhir menggunakan data demo.
- [ ] Setiap tabel memiliki kebijakan RLS yang teruji untuk `owner`, `manager`, dan pengguna anonim.
- [ ] Aplikasi berjalan di domain produksi dengan HTTPS.

### Fase 8 — v1.1: Tautan Laporan Klien dan Pengingat Telegram

**Cakupan:** FR-M9-05 dan FR-M10-05. Pengingat WhatsApp ditunda ke versi berikutnya.
**Kriteria penerimaan:**

- [ ] Klien dapat membuka laporan lewat tautan tanpa login dan tidak melihat data keuangan internal.
- [ ] Tautan yang dicabut atau kedaluwarsa langsung tidak dapat dibuka.
- [ ] Tabel `report_share_links` tercakup dalam pemeriksaan RLS untuk `owner`, `manager`, dan anonim.
- [ ] Owner menerima pesan Telegram harian berisi snapshot yang jatuh tempo, lewat workflow n8n.

### Fase 9 — v2.0: Akses Portal Kreator dan Brief

**Cakupan:** FR-M13-01 sampai FR-M13-04 dan FR-M13-08. Peran `creator` pada `user_role`; `public.is_active_member()` diperketat menjadi anggota internal saja; `creators.profile_id` dan `portal_invited_at`; view `creator_portal_profile`, `creator_portal_assignments`, `creator_portal_assets`; kebijakan storage `campaign-assets` untuk kreator yang ditugaskan; undangan dan pencabutan akses dari halaman kreator; rute `(portal)` beserta dasbor, daftar penugasan, halaman brief, dan halaman profil.
**Kriteria penerimaan:**

- [ ] Kreator yang diundang dapat menetapkan kata sandi lalu masuk ke `/portal`.
- [ ] Kreator tidak dapat membuka rute internal mana pun; anggota internal yang membuka `/portal` diarahkan ke `/dashboard`.
- [ ] Dengan sesi `creator`, kueri langsung ke `campaigns`, `creators`, `creator_bank_accounts`, `payouts`, dan `activity_logs` mengembalikan nol baris.
- [ ] `creator_portal_assignments` tidak memuat `package_price`, target kampanye, maupun data kreator lain; diuji di `scripts/rls-check.sql`.
- [ ] Kreator hanya dapat mengunduh materi kampanye yang ditugaskan kepadanya.
- [ ] Akses portal yang dicabut `owner` langsung menutup akses kreator.

### Fase 10 — v2.0: Kiriman Draf, Laporan Tayang, Bukti Metrik, dan Status Honor

**Cakupan:** FR-M13-05 sampai FR-M13-07 dan FR-M13-09, serta kartu kiriman pada FR-M10-01. Kolom usulan tayang di `contents`; tabel `metric_submissions` beserta fungsi verifikasi tim; view `creator_portal_contents`, `creator_portal_reviews`, `creator_portal_metrics`, `creator_portal_submissions`, `creator_portal_payouts`; kebijakan storage `content-drafts` dan `metric-proofs` untuk kreator; halaman kiriman di portal, panel verifikasi di tab Konten dan Metrik, kartu kiriman di dasbor, dan kampanye demo kedua berstatus `aktif` untuk melatih alur portal.
**Kriteria penerimaan:**

- [ ] Draf yang dikirim kreator muncul di antrean review tim sebagai `menunggu_review`.
- [ ] Kreator tidak dapat mengubah draf yang sudah direview, menyetujui kontennya sendiri, atau mengisi `posted_url` secara langsung.
- [ ] Laporan tayang dari kreator baru berlaku setelah tim mengonfirmasi.
- [ ] Usulan metrik tidak memengaruhi metrik kampanye maupun honor sebelum diterima tim; penolakan wajib disertai alasan.
- [ ] Kreator melihat rincian honornya sendiri tanpa bukti transfer, dan tidak melihat honor kreator lain.
- [ ] Setiap tabel dan view baru tercakup di `scripts/rls-check.sql` untuk `owner`, `manager`, `creator`, dan anonim.

### Fase 11 — v3.0: Akses Portal Klien dan Pantau Kampanye

**Cakupan:** FR-M14-01 sampai FR-M14-03. Peran `client` pada `user_role`; `client_contacts.profile_id` dan `portal_invited_at`; undangan dan pencabutan akses dari halaman klien; rute `(client)` di `/klien` beserta dasbor kampanye, halaman kampanye (capaian, grafik, konten tayang, rekap per kreator); view `client_portal_campaigns`, `client_portal_contents`, `client_portal_creators`, `client_portal_metrics`.
**Kriteria penerimaan:**

- [ ] Kontak klien yang diundang dapat menetapkan kata sandi lalu masuk ke `/klien`.
- [ ] Klien tidak dapat membuka rute internal maupun `/portal`; anggota internal yang membuka `/klien` diarahkan ke `/dashboard`.
- [ ] Dengan sesi `client`, kueri langsung ke `campaigns`, `creators`, `payouts`, `client_payments`, dan `activity_logs` mengembalikan nol baris.
- [ ] Klien hanya melihat kampanye instansinya sendiri; kampanye klien lain tidak muncul di view mana pun.
- [ ] Harga paket, honor, margin, dan nama lengkap kreator tidak muncul di portal klien (diuji di `scripts/rls-check.sql` dan uji E2E).
- [ ] Akses yang dicabut `owner` langsung menutup akses klien.

### Fase 12 — v3.0: Persetujuan Konten, Laporan, dan Laporan Pendaftar

**Cakupan:** FR-M14-04 sampai FR-M14-07 dan penyesuaian FR-M6-04. Kolom `campaigns.client_approval_required` dan `contents.client_review_status`; tabel `client_content_reviews` dan `registrant_submissions` beserta alur verifikasi tim; view `client_portal_submissions`; antrean persetujuan di portal klien; panel status persetujuan klien di tab Konten dan kartu kiriman klien di dasbor tim; halaman laporan dan unduhan CSV untuk klien.
**Kriteria penerimaan:**

- [ ] Pada kampanye yang mewajibkan persetujuan klien, konten yang disetujui tim muncul di antrean klien dan **tidak** dapat ditandai tayang sebelum klien menyetujui.
- [ ] Permintaan revisi dari klien wajib disertai catatan dan mengembalikan konten ke alur revisi tim.
- [ ] Kampanye tanpa `client_approval_required` berjalan persis seperti sebelumnya.
- [ ] Usulan laporan pendaftar dari klien tidak memengaruhi metrik kampanye maupun bonus kreator sebelum diterima tim; penolakan wajib beralasan.
- [ ] Laporan dan CSV yang diunduh klien tidak memuat data keuangan internal (FR-M9-03).
- [ ] Setiap tabel dan view baru tercakup di `scripts/rls-check.sql` untuk `owner`, `manager`, `creator`, `client`, dan anonim.

### Fase 13 — v3.1: Situs Publik Pengenalan Platform

**Cakupan:** FR-M15-01 sampai FR-M15-08. Grup rute `app/(marketing)` berisi `/`, `/kreator`, `/privasi`, dan `/syarat` beserta layout, header, dan footer publik; `app/robots.ts`, `app/sitemap.ts`, `app/opengraph-image.tsx`; komponen di `components/marketing/`; penambahan rute publik di `lib/supabase/middleware.ts` dan perbaikan pengalihan `/login` memakai `homePathFor()`; variabel `NEXT_PUBLIC_CONTACT_WA` dan `NEXT_PUBLIC_CONTACT_EMAIL`. **Tanpa migrasi database.**
**Kriteria penerimaan:**

- [ ] Pengunjung anonim dapat membuka `/`, `/kreator`, `/privasi`, dan `/syarat` tanpa dialihkan ke `/login`.
- [ ] Pengunjung anonim tetap ditolak di `/dashboard`, `/portal`, `/klien`, `/laporan` tanpa token, dan `/api/reminders/*`.
- [ ] Halaman publik tidak melakukan satu pun kueri Supabase: keempat rute berstatus statis pada keluaran build dan tidak ada impor `lib/supabase/*` atau `lib/auth/*` di `app/(marketing)`.
- [ ] `robots.txt` hanya mengizinkan rute publik M15 dan `sitemap.xml` tidak memuat rute ber-sesi; area `(app)`, `(portal)`, dan `(client)` tetap `noindex`.
- [ ] Tidak ada berkas migrasi baru; `npm run db:rls-check` dan `npm run db:guards-check` tetap lulus tanpa entri tambahan.
- [ ] Sesi `owner`, `creator`, dan `client` yang membuka `/` tetap melihat landing, dan tombol "Masuk" mengantar ke area yang benar dalam satu langkah.
- [ ] Tidak ada nama, logo, atau angka klien nyata di halaman publik.
- [ ] Checklist design system terpenuhi: kontras ≥ 4.5:1 di mode terang dan gelap, hierarki heading berurutan, 375/768/1024/1440px tanpa scroll horizontal, `prefers-reduced-motion` dihormati.
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build` lulus.

---

## 12. Peta Jalan Setelah Pilot (Indikatif)

Urutan final ditentukan oleh data catatan waktu operasional (M12) dan masukan klien.

| Versi | Fitur                                                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1.1   | Tautan laporan baca-saja untuk klien (token rahasia, tanpa login); pengingat Telegram harian ke owner via n8n untuk snapshot jatuh tempo (Fase 8) |
| 1.2   | Pengingat WhatsApp otomatis ke tim (ditunda dari 1.1) |
| 2.0   | Portal kreator: login, lihat brief, kirim draf, unggah bukti metrik, lihat status honor (M13; Fase 9 dan Fase 10) — **sedang dikerjakan** |
| 3.0   | Portal klien: pantau kampanye berjalan, setujui konten, unduh laporan, kirim laporan pendaftar (M14; Fase 11 dan Fase 12) — **sedang dikerjakan** |
| 3.1   | Situs publik pengenalan platform: landing, halaman kreator, dan halaman legal (M15; Fase 13) — **selesai** |
| 4.0   | Integrasi API resmi platform media sosial untuk metrik otomatis (bergantung persetujuan akses API)                               |
| 5.0   | Pembayaran honor terintegrasi; perluasan ke segmen bank daerah, BUMD, dan Pemda (invoice, dokumen pengadaan)                     |

---

## 13. Asumsi dan Pertanyaan Terbuka

### 13.1 Asumsi yang dipakai di PRD ini

1. Klien pilot adalah kampus swasta dengan tujuan menambah pendaftar PMB.
2. Kampus bersedia menambahkan kolom "kode referal" pada formulir pendaftarannya dan melaporkan jumlah pendaftar per kode.
3. Kreator yang diterima berusia minimal 18 tahun dan sudah memiliki pengikut dengan mayoritas audiens di Kalimantan.
4. Metrik media sosial diinput manual dari tangkapan layar kreator.
5. Tim internal berjumlah 2–4 orang.

### 13.2 Pertanyaan yang harus dijawab (ditandai pemilik jawabannya)

| No  | Pertanyaan                                                                                | Dijawab lewat              |
| --- | ----------------------------------------------------------------------------------------- | -------------------------- |
| 1   | Nama produk dan domain — **penghalang rilis Fase 13** (situs publik)                      | Founder                    |
| 2   | Checkpoint metrik yang paling praktis (apakah H+1, H+3, H+7 terlalu banyak?)              | Pilot                      |
| 3   | Berapa minimal hari konten wajib tayang yang wajar bagi kreator?                          | Wawancara kreator          |
| 4   | Apakah bonus per pendaftar menarik bagi kreator, atau lebih suka honor tetap lebih besar? | Pilot                      |
| 5   | Kewajiban pemotongan pajak atas honor kreator dan kebutuhan NPWP                          | Konsultan pajak            |
| 6   | Isi syarat kerja sama kreator (label iklan, larangan, hak pakai konten oleh klien)        | Founder + konsultasi hukum |
| 7   | Bagaimana kampus mencatat pendaftar dan seberapa cepat mereka bisa melapor?               | Wawancara kampus           |
| 8   | Hosting: Vercel berbayar atau VPS sendiri?                                                | Founder                    |
| 9   | Berapa lama tenggat wajar persetujuan konten oleh klien sebelum tim menagih atau melanjutkan? | Pilot v3.0             |
| 10  | Apakah klien bersedia mengisi laporan pendaftar sendiri di portal, atau tetap lewat WhatsApp? | Pilot v3.0             |
| 11  | Isi halaman Kebijakan Privasi dan Syarat Layanan publik                                   | Founder + konsultasi hukum |
| 12  | Apakah kisaran harga paket boleh ditampilkan di situs publik?                              | Founder                    |

---

## 14. Riwayat Perubahan

| Versi | Tanggal     | Perubahan                                  |
| ----- | ----------- | ------------------------------------------ |
| 0.1   | 17 Sep 2026 | Draf awal berdasarkan diskusi validasi ide |
| 0.2   | 19 Sep 2026 | v1.1: FR-M9-05 (tautan laporan klien), FR-M10-05 (pengingat Telegram via n8n menggantikan WhatsApp), tabel `report_share_links`, Fase 8 |
| 0.3   | 20 Sep 2026 | v2.0: modul M13 (portal kreator), peran `creator`, view `creator_portal_*`, tabel `metric_submissions`, Fase 9 dan Fase 10. Portal kreator keluar dari daftar "di luar cakupan"; portal klien tetap di luar cakupan |
| 0.4   | 20 Sep 2026 | Fase 10: FR-M13-09 (laporan tayang dari kreator sebagai usulan), kartu kiriman kreator pada FR-M10-01, kolom `contents.proposed_posted_*`, view `creator_portal_submissions` |
| 0.5   | 20 Sep 2026 | v3.0: modul M14 (portal klien), peran `client`, persetujuan konten dua tahap opsional (FR-M14-04, penyesuaian FR-M6-04), usulan laporan pendaftar dari klien (FR-M14-06, penyesuaian FR-M7-04), tabel `client_content_reviews` dan `registrant_submissions`, view `client_portal_*`, Fase 11 dan Fase 12. Tautan laporan v1.1 tetap berlaku berdampingan |
| 0.6   | 22 Sep 2026 | v3.1: modul M15 (situs publik), peran pengunjung `anonim`, alur 5.0, NFR SEO, grup rute `app/(marketing)` beserta `robots.ts`/`sitemap.ts`, variabel `NEXT_PUBLIC_CONTACT_WA` dan `NEXT_PUBLIC_CONTACT_EMAIL`, Fase 13. Situs publik keluar dari daftar "di luar cakupan"; formulir dan penyimpanan data calon tetap di luar cakupan. Tanpa tabel, migrasi, atau perubahan RLS |
