# PRD — Platform Kampanye Kreator Lokal Kalimantan (MVP Internal)

| Info               | Keterangan                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Versi              | 0.2 (MVP rilis pilot; tambahan v1.1: tautan laporan klien dan pengingat Telegram)           |
| Tanggal            | 17 September 2026                                                                           |
| Status             | Siap dipakai untuk memulai pengembangan Fase 0–2; bagian lain direvisi setelah temuan pilot |
| Nama produk        | Belum ditetapkan. Di kode dipakai variabel `NEXT_PUBLIC_APP_NAME` agar mudah diganti        |
| Pengguna versi ini | Tim internal saja (admin)                                                                   |

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

---

## 3. Pengguna dan Peran

| Peran     | Siapa              | Hak akses                                                                                                                                                                                    |
| --------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `owner`   | Founder / direktur | Semua fitur, termasuk kelola pengguna internal, data rekening kreator, persetujuan dan status pembayaran honor                                                                               |
| `manager` | Pengelola kampanye | Semua fitur operasional (klien, kreator, kampanye, konten, metrik, laporan). **Tidak bisa** melihat nomor rekening lengkap (tampil tersamar), mengelola pengguna, atau menyetujui pembayaran |

- Pendaftaran publik **dinonaktifkan**. Akun hanya dibuat lewat undangan oleh `owner`.
- Pengguna yang dinonaktifkan (`is_active = false`) tidak bisa mengakses data apa pun.

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

### 4.2 Di luar cakupan (JANGAN dibangun di MVP)

- Login dan portal untuk kreator maupun klien.
- Marketplace terbuka (kreator melamar kampanye sendiri).
- Payment gateway, top-up saldo, atau transfer honor otomatis.
- Integrasi API TikTok, Instagram, YouTube, atau Facebook untuk menarik metrik otomatis.
- Notifikasi WhatsApp/email otomatis. Pengecualian sejak v1.1: pengingat Telegram harian **untuk owner internal** (FR-M10-05).
- Penyimpanan data pribadi calon mahasiswa/pendaftar.
- Aplikasi mobile native, multi-bahasa, multi-tenant.
- Fitur AI.

---

## 5. Alur Utama

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
7. Kreator memposting konten yang disetujui → tim mengisi URL dan waktu tayang.
8. Pada checkpoint H+1, H+3, H+7, dan akhir kampanye, tim memasukkan snapshot metrik beserta tangkapan layar bukti.
9. Klik tautan pelacakan tercatat otomatis.
10. Klien melaporkan jumlah pendaftar per kode kreator → tim memasukkan angka agregatnya.
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
- **FR-M6-04** Setelah `disetujui`, tim dapat mengisi URL tayang dan waktu tayang → status tayang `tayang`. URL tayang **tidak bisa** diisi untuk konten yang belum disetujui.
- **FR-M6-05** Status tayang: `belum_tayang`, `tayang`, `dihapus`. Jika ditandai `dihapus`, catat tanggal penghapusan.
- **FR-M6-06** Riwayat review (siapa, kapan, keputusan, catatan) disimpan dan ditampilkan.

### M7 — Metrik

- **FR-M7-01** Input snapshot metrik per konten tayang: checkpoint (`H+1`, `H+3`, `H+7`, `akhir`, `lainnya`), waktu pengambilan, views, likes, komentar, share, simpan, unggahan tangkapan layar bukti (wajib).
- **FR-M7-02** Views sebuah konten = nilai views dari snapshot **terbaru** (berdasarkan `captured_at`). Sistem memberi peringatan jika views snapshot baru lebih kecil dari snapshot sebelumnya.
- **FR-M7-03** Klik tautan dihitung otomatis dari tabel klik. Tampilkan total klik dan klik non-bot.
- **FR-M7-04** Input laporan pendaftar dari klien: per penugasan (kode kreator) atau "tanpa kode", periode, jumlah pendaftar (angka agregat), bukti opsional, catatan. **Tidak menyimpan nama atau data pribadi pendaftar.**
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
  - mencatat jumlah dan waktu terakhir dilihat tanpa menyimpan IP; pembuatan dan pencabutan tercatat di log aktivitas.

### M10 — Dasbor dan Pengingat

- **FR-M10-01** Kartu ringkasan: kampanye aktif, konten menunggu review, snapshot metrik yang jatuh tempo, honor belum dibayar, invoice klien belum lunas.
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

---

## 7. Model Data

> Konvensi: nama tabel dan kolom memakai bahasa Inggris (`snake_case`). Nilai enum memakai bahasa Indonesia sesuai istilah di UI. Semua tabel memiliki `id uuid` (default `gen_random_uuid()`), `created_at` dan `updated_at` (`timestamptz`). Nominal uang memakai `bigint` dalam Rupiah utuh (tanpa desimal).

| Tabel                     | Kolom utama                                                                                                                                                                                                                                                                                                                                                                                                    | Catatan                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `profiles`                | `id` (= `auth.users.id`), `full_name`, `role` (`owner`/`manager`), `is_active`                                                                                                                                                                                                                                                                                                                                 | Dibuat saat undangan diterima                                                      |
| `clients`                 | `name`, `type`, `city`, `province`, `address`, `notes`                                                                                                                                                                                                                                                                                                                                                         |                                                                                    |
| `client_contacts`         | `client_id`, `name`, `position`, `phone_wa`, `email`, `is_primary`                                                                                                                                                                                                                                                                                                                                             |                                                                                    |
| `creators`                | `full_name`, `stage_name`, `phone_wa`, `email`, `city`, `province`, `birth_date`, `niches text[]`, `tier`, `status`, `terms_version`, `terms_agreed_at`, `verified_at`, `verified_by`, `notes`                                                                                                                                                                                                                 | Constraint usia ≥ 18 divalidasi di aplikasi                                        |
| `creator_bank_accounts`   | `creator_id` (unik), `bank_name`, `account_number`, `account_holder`                                                                                                                                                                                                                                                                                                                                           | **RLS: hanya `owner`**. `manager` membaca lewat view/fungsi yang menyamarkan nomor |
| `creator_social_accounts` | `creator_id`, `platform`, `handle`, `profile_url`, `followers_count`, `kalimantan_audience_pct numeric(5,2)`, `top_cities`, `audience_proof_path`, `last_verified_at`                                                                                                                                                                                                                                          | Unik (`platform`, `handle`)                                                        |
| `campaigns`               | `client_id`, `code` (unik), `name`, `objective`, `brief`, `must_do`, `must_not`, `hashtags`, `paid_label_required`, `landing_url`, `start_date`, `end_date`, `min_live_days`, `status`, `package_price`, `target_contents`, `target_views`, `target_registrants`, `default_base_fee`, `default_bonus_per_1000_views`, `default_bonus_per_registrant`, `default_views_bonus_cap`, `closing_notes`, `created_by` |                                                                                    |
| `campaign_assets`         | `campaign_id`, `title`, `type`, `file_path`, `external_url`, `notes`                                                                                                                                                                                                                                                                                                                                           | Salah satu dari `file_path`/`external_url` wajib                                   |
| `campaign_creators`       | `campaign_id`, `creator_id`, `status`, `contents_committed`, `base_fee`, `bonus_per_1000_views`, `bonus_per_registrant`, `views_bonus_cap`, `referral_code` (unik global), `tracking_slug` (unik global), `joined_at`                                                                                                                                                                                          | Unik (`campaign_id`, `creator_id`). Kolom honor `null` = pakai default kampanye    |
| `contents`                | `campaign_creator_id`, `platform`, `draft_url`, `draft_file_path`, `caption_draft`, `review_status`, `revision_count`, `posted_url`, `posted_at`, `live_status`, `removed_at`                                                                                                                                                                                                                                  |                                                                                    |
| `content_reviews`         | `content_id`, `decision`, `checklist jsonb`, `notes`, `reviewer_id`                                                                                                                                                                                                                                                                                                                                            | Riwayat, tidak diubah setelah dibuat                                               |
| `metric_snapshots`        | `content_id`, `checkpoint`, `captured_at`, `views`, `likes`, `comments`, `shares`, `saves`, `proof_path`, `entered_by`                                                                                                                                                                                                                                                                                         | Unik (`content_id`, `checkpoint`) kecuali `lainnya`                                |
| `link_clicks`             | `campaign_creator_id`, `clicked_at`, `referrer`, `user_agent`, `ip_hash`, `is_bot`                                                                                                                                                                                                                                                                                                                             | Insert hanya lewat route server `/r/[slug]`                                        |
| `registrant_reports`      | `campaign_id`, `campaign_creator_id` (nullable = tanpa kode), `period_start`, `period_end`, `registrant_count`, `proof_path`, `notes`, `entered_by`                                                                                                                                                                                                                                                            | Hanya angka agregat                                                                |
| `payouts`                 | `campaign_creator_id` (unik), `base_amount`, `views_bonus`, `registrant_bonus`, `adjustment_amount`, `adjustment_reason`, `total_amount`, `calculation_snapshot jsonb`, `status`, `approved_by`, `approved_at`, `paid_at`, `transfer_proof_path`                                                                                                                                                               | `calculation_snapshot` menyimpan input perhitungan                                 |
| `client_payments`         | `campaign_id`, `invoice_number` (unik), `amount`, `due_date`, `status`, `paid_amount`, `paid_at`, `proof_path`                                                                                                                                                                                                                                                                                                 |                                                                                    |
| `ops_time_logs`           | `campaign_id`, `user_id`, `activity`, `minutes`, `log_date`, `notes`                                                                                                                                                                                                                                                                                                                                           |                                                                                    |
| `report_share_links`      | `campaign_id`, `token_hash` (unik), `expires_at`, `created_by`, `revoked_at`, `revoked_by`, `last_viewed_at`, `view_count` | v1.1 (FR-M9-05); satu tautan aktif per kampanye; tidak dapat dihapus |
| `activity_logs`           | `actor_id`, `entity_type`, `entity_id`, `action`, `details jsonb`                                                                                                                                                                                                                                                                                                                                              | Append-only                                                                        |

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
| Kinerja          | Halaman daftar dengan paginasi di server; target muat halaman < 2 detik untuk data pilot                                                                                                     |
| Aksesibilitas    | Kontras cukup, label pada setiap input, dapat dioperasikan dengan keyboard                                                                                                                   |

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
  r/[slug]/route.ts
  api/export/[type]/route.ts
components/{ui,forms,tables,charts,layout}/
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

`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLICK_IP_HASH_SALT`, `DEFAULT_TIMEZONE=Asia/Makassar`, dan sejak v1.1 `REMINDER_API_TOKEN` (opsional; tanpa nilai ini endpoint pengingat nonaktif).

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

---

## 12. Peta Jalan Setelah Pilot (Indikatif)

Urutan final ditentukan oleh data catatan waktu operasional (M12) dan masukan klien.

| Versi | Fitur                                                                                                                            |
| ----- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1.1   | Tautan laporan baca-saja untuk klien (token rahasia, tanpa login); pengingat Telegram harian ke owner via n8n untuk snapshot jatuh tempo (Fase 8) |
| 1.2   | Pengingat WhatsApp otomatis ke tim (ditunda dari 1.1) |
| 2.0   | Portal kreator: login, lihat brief, kirim draf, unggah bukti metrik, lihat status honor                                          |
| 3.0   | Portal klien: pantau kampanye berjalan, setujui konten, unduh laporan                                                            |
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
| 1   | Nama produk dan domain                                                                    | Founder                    |
| 2   | Checkpoint metrik yang paling praktis (apakah H+1, H+3, H+7 terlalu banyak?)              | Pilot                      |
| 3   | Berapa minimal hari konten wajib tayang yang wajar bagi kreator?                          | Wawancara kreator          |
| 4   | Apakah bonus per pendaftar menarik bagi kreator, atau lebih suka honor tetap lebih besar? | Pilot                      |
| 5   | Kewajiban pemotongan pajak atas honor kreator dan kebutuhan NPWP                          | Konsultan pajak            |
| 6   | Isi syarat kerja sama kreator (label iklan, larangan, hak pakai konten oleh klien)        | Founder + konsultasi hukum |
| 7   | Bagaimana kampus mencatat pendaftar dan seberapa cepat mereka bisa melapor?               | Wawancara kampus           |
| 8   | Hosting: Vercel berbayar atau VPS sendiri?                                                | Founder                    |

---

## 14. Riwayat Perubahan

| Versi | Tanggal     | Perubahan                                  |
| ----- | ----------- | ------------------------------------------ |
| 0.1   | 17 Sep 2026 | Draf awal berdasarkan diskusi validasi ide |
| 0.2   | 19 Sep 2026 | v1.1: FR-M9-05 (tautan laporan klien), FR-M10-05 (pengingat Telegram via n8n menggantikan WhatsApp), tabel `report_share_links`, Fase 8 |
