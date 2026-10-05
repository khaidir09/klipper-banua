# PRD — Platform Kliper Lokal Kalimantan (Marketplace Terbuka)

| Info               | Keterangan                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------- |
| Versi dokumen      | 1.7 — produk **v4.0: marketplace kliper terbuka** (menggantikan model _managed_ v0.1–v3.2) |
| Tanggal            | 26 September 2026                                                                           |
| Status             | Fase 0–11 dan 13–18 selesai: **Tahap A (kliper mandiri) lengkap** — fondasi internal, portal kreator, portal klien baca, situs publik, konfirmasi penugasan, pendaftaran kliper mandiri, kampanye terbuka dan katalog, kiriman klip dan verifikasi views, saldo dan penarikan. Tahap B (klien mandiri) baru garis besar. Fase 12 direvisi (lihat M14) |
| Nama produk        | Belum ditetapkan. Di kode dipakai variabel `NEXT_PUBLIC_APP_NAME` agar mudah diganti        |
| Acuan model        | ayoklip.com (kliper daftar sendiri → pilih kampanye → posting → kirim tautan + bukti views → diverifikasi → saldo → tarik) dengan pembeda lokal Kalimantan |
| Pengguna versi ini | Tim internal (`owner`, `manager`); **kliper mendaftar sendiri** (peran `creator`); klien lewat undangan (Tahap A) dan mendaftar sendiri (Tahap B); pengunjung anonim membaca situs publik |

---

## 0. Cara Memakai Dokumen Ini dengan Claude Code

1. Simpan `PRD.md` dan `CLAUDE.md` di root repositori.
2. Di awal sesi, minta Claude Code: _"Baca PRD.md dan CLAUDE.md. Susun rencana implementasi untuk Fase <n> saja. Jangan menulis kode sebelum rencana saya setujui."_
3. Kerjakan **satu fase per sesi**. Setelah fase selesai, cek kriteria penerimaan, lalu commit.
4. Jika pilot menghasilkan temuan yang mengubah kebutuhan, **perbarui PRD dulu**, baru minta Claude Code mengubah kode.
5. Jangan meminta fitur yang tercantum di bagian "Di Luar Cakupan" sebelum PRD diperbarui.

**Istilah.** Di UI dan dokumen ini, orang yang membuat dan memposting klip disebut **kliper**. Di kode dan database namanya tetap `creator` (peran `creator`, tabel `creators`, view `creator_portal_*`) agar tidak ada migrasi penggantian nama. "Kreator" pada bagian lama berarti hal yang sama.

---

## 1. Latar Belakang dan Konteks Bisnis

### 1.1 Masalah

- Brand bisnis, UMKM, instansi, maupun personal di Kalimantan butuh promosi yang menjangkau **audiens lokal** dan bisa dipertanggungjawabkan (contoh: klik tautan, kode referal, atau pendaftar/pembeli yang dilaporkan klien), bukan views nasional yang tidak relevan.
- Model _managed_ (v0.1–v3.2), yaitu tim yang merekrut, menugaskan, dan mengoordinasikan setiap kreator lewat WhatsApp, tidak bisa diperbesar: jumlah kliper dan kampanye dibatasi oleh jam kerja tim 2–4 orang.
- Banyak anak muda Kalimantan mampu memotong video dan punya akun media sosial, tetapi tidak punya jalur untuk dibayar dari keterampilan itu.
- Platform clipper nasional (misalnya ayoklip.com) membuktikan model terbuka berjalan, tetapi tidak menawarkan jangkauan lokal, kode referal per kliper, maupun laporan kampanye yang siap diserahkan ke klien.

### 1.2 Solusi (v4.0)

**Marketplace kliper terbuka** dengan pembeda lokal:

- siapa pun, tanpa batas usia, dapat **mendaftar sendiri** sebagai kliper dari halaman publik;
- kliper melihat **katalog kampanye**, bergabung sendiri, mengunduh materi, lalu membuat dan memposting klip di akunnya;
- kliper mengirim **tautan klip + tangkapan layar views**; tim memverifikasi kepemilikan, kepatuhan brief, dan keaslian views **setelah tayang**;
- klip yang disetujui menambah **saldo** kliper sebesar **tarif per 1.000 views** yang terverifikasi, dibatasi anggaran kampanye;
- kliper menarik saldo ke rekeningnya; `owner` mentransfer **manual** dan mengunggah bukti;
- pembeda lokal tetap ada: **lencana Kliper Lokal** (bukti audiens Kalimantan) yang bisa diwajibkan per kampanye, tautan pelacakan dan kode referal per kliper, serta laporan kampanye untuk klien.

Peluncuran bertahap:

| Tahap | Isi | Status |
| ----- | --- | ------ |
| **A — Kliper mandiri** | Pendaftaran kliper, katalog dan gabung kampanye, kiriman klip dan verifikasi, saldo dan penarikan. Klien dan kampanye masih dibuat oleh tim | Dirinci di PRD ini (Fase 15–18) |
| **B — Klien mandiri** | Klien mendaftar sendiri, deposit anggaran, membuat kampanye, memantau hasil | Garis besar saja (Bagian 12); PRD diperbarui sebelum dikerjakan |

### 1.3 Model bisnis

- **Tahap A:** klien membeli **paket kampanye** dari tim (harga tetap `package_price`). Tim menetapkan **anggaran kliper** (`creator_budget`) dan **tarif per 1.000 views** untuk kampanye itu. Pendapatan platform = harga paket − honor kliper yang terpakai − biaya lain.
- **Tahap B (rencana):** klien menyetor anggaran + biaya platform (mengacu ayoklip: 5% dari anggaran); sisa anggaran yang tidak terpakai dikembalikan atau dipakai kampanye berikutnya.
- Kliper dibayar **hanya dari views terverifikasi**: `honor = views × tarif / 1.000`, dengan batas per klip, per kliper, dan per kampanye. Tidak ada honor dasar dan tidak ada bonus pendaftar di kampanye baru.

---

## 2. Tujuan dan Metrik Keberhasilan

### 2.1 Tujuan produk

1. Membuka pasokan kliper tanpa menambah beban onboarding tim.
2. Mengubah pekerjaan tim dari koordinasi (WhatsApp) menjadi **verifikasi** (antrean di aplikasi).
3. Membayar kliper dengan cepat dan adil berdasarkan views asli.
4. Tetap menghasilkan data yang bisa dipertanggungjawabkan kepada klien.

### 2.2 Metrik keberhasilan

| Metrik                                                         | Target Tahap A                                   |
| -------------------------------------------------------------- | ------------------------------------------------ |
| Kliper terdaftar yang mengirim ≥ 1 klip dalam 30 hari         | ≥ 30%                                            |
| Median waktu dari kiriman klip sampai keputusan verifikasi     | ≤ 24 jam                                         |
| Median waktu dari pengajuan penarikan sampai `dibayar`         | ≤ 1 hari kerja                                   |
| Pengeluaran honor yang melebihi anggaran kampanye              | 0 (dijamin sistem)                               |
| Selisih saldo kliper dengan jumlah buku besar                 | 0                                                |
| Klip disetujui yang kemudian dibatalkan karena kecurangan      | Dipantau; dasar penyesuaian aturan anti-kecurangan |
| Jam tim per 100 klip (M12)                                     | Turun dibanding pilot model _managed_            |

---

## 3. Pengguna dan Peran

| Peran     | Siapa              | Hak akses                                                                                                                                                                                    |
| --------- | ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `owner`   | Founder / direktur | Semua fitur, termasuk kelola pengguna internal, data rekening lengkap, **pemrosesan penarikan saldo**, penyesuaian saldo, dan pemblokiran kliper                                              |
| `manager` | Pengelola kampanye | Semua fitur operasional: klien, kampanye, **verifikasi klip dan views**, lencana lokal, laporan. **Tidak bisa** melihat nomor rekening lengkap, memproses penarikan, membuat penyesuaian saldo, atau mengelola pengguna |
| `creator` | Kliper            | Portal `/portal`: profil dan akun sosialnya, katalog kampanye, penugasannya sendiri, kiriman klip, saldo, rekening, dan penarikan miliknya. **Tidak punya akses** ke aplikasi internal, harga paket, margin, klien lain di luar katalog, data kliper lain, atau log aktivitas |
| `client`  | Kontak klien _(v3.0)_ | Portal `/klien`: kampanye milik kliennya sendiri. Tidak melihat honor kliper, margin, data pribadi kliper, klien lain, atau log aktivitas |
| `anonim`  | Pengunjung         | Situs publik M15, halaman pendaftaran kliper `/daftar`, dan redirect pelacakan `/r/<slug>`. Satu-satunya bacaan database di situs publik adalah daftar kampanye terbuka lewat view `public_campaign_catalog` (FR-M15-09, v1.6) |

- **Pendaftaran publik (v4.0) hanya untuk kliper.** Akun `owner`/`manager` tetap lewat undangan `owner`; akun `client` lewat undangan dari halaman klien sampai Tahap B.
- **Peran tidak pernah ditentukan oleh input pengguna.** Pendaftaran mandiri selalu menghasilkan peran `creator`; peran lain hanya dapat diberikan lewat undangan dari server (lihat FR-M16-03).
- Pengguna nonaktif (`is_active = false`) tidak bisa mengakses data apa pun. Kliper berstatus `diblokir` tetap dapat masuk untuk melihat status dan saldonya, tetapi tidak dapat bergabung, mengirim, atau menarik saldo.
- Peran `creator` dan `client` bukan anggota internal: `is_active_member()` menolak keduanya.

---

## 4. Ruang Lingkup

### 4.1 Dalam cakupan

| Kode | Modul                                               | Status / versi |
| ---- | --------------------------------------------------- | -------------- |
| M1   | Autentikasi dan pengguna internal                   | Selesai; diubah v4.0 (FR-M1-01) |
| M2   | Klien dan kontak klien                              | Selesai        |
| M3   | Kreator/kliper, akun media sosial, bukti audiens, rekening | Selesai; diubah v4.0 |
| M4   | Kampanye, brief, materi                             | Selesai; diubah v4.0 (M17) |
| M5   | Penugasan, kode referal, tautan pelacakan           | Selesai; diubah v4.0 (gabung mandiri) |
| M6   | Konten dan alur review                              | Selesai; kampanye `per_views` memakai verifikasi pasca-tayang (M18) |
| M7   | Metrik                                              | Selesai        |
| M8   | Honor kreator dan pembayaran klien                  | Selesai; `payouts` hanya untuk kampanye `paket` lama |
| M9   | Laporan kampanye                                    | Selesai        |
| M10  | Dasbor dan pengingat                                | Selesai; kartu baru v4.0 |
| M11  | Log aktivitas                                       | Selesai; aksi baru v4.0 |
| M12  | Catatan waktu operasional                           | Selesai        |
| M13  | Portal kreator                                      | Selesai; diperluas M16–M19 |
| M14  | Portal klien                                        | Fase 11 selesai; Fase 12 direvisi |
| M15  | Situs publik                                        | Selesai; diubah v4.0 (ajakan daftar) |
| **M16** | **Pendaftaran kliper mandiri**                  | **v4.0 Tahap A — Fase 15** |
| **M17** | **Kampanye terbuka dan katalog**                 | **v4.0 Tahap A — Fase 16** |
| **M18** | **Kiriman klip dan verifikasi views**            | **v4.0 Tahap A — Fase 17** |
| **M19** | **Saldo, rekening, dan penarikan**               | **v4.0 Tahap A — Fase 18** |

### 4.2 Di luar cakupan (JANGAN dibangun sebelum PRD diperbarui)

- **Pendaftaran klien mandiri, deposit/top-up anggaran oleh klien, dan pembuatan kampanye oleh klien** (Tahap B).
- Payment gateway, e-wallet, dan transfer honor otomatis. Penarikan diproses manual oleh `owner`.
- Verifikasi KTP atau unggahan dokumen identitas.
- Integrasi API TikTok, Instagram, YouTube, atau Facebook untuk metrik otomatis.
- Katalog kampanye yang bisa dibaca tanpa login, papan peringkat (_leaderboard_), forum, blog, atau CMS.
- Program referal kliper-mengajak-kliper, tingkatan/level kliper, dan kampanye eksklusif berbasis pengajuan (selain `undangan` oleh tim).
- Notifikasi WhatsApp/email otomatis, kecuali email bawaan Supabase Auth (konfirmasi, pemulihan), pengingat Telegram untuk owner (FR-M10-05), dan email pemberitahuan ke kliper (FR-M18-09, FR-M19-09).
- Penyimpanan data pribadi pendaftar, pembeli, atau konsumen klien.
- Aplikasi mobile native, multi-bahasa, multi-tenant, fitur AI.
- Skrip, pelacak, atau captcha pihak ketiga (lihat pertanyaan terbuka 13.2 no. 14).

---

## 5. Alur Utama

### 5.0 Dari situs publik

1. Pengunjung membaca situs publik (M15).
2. **Calon kliper** menekan "Daftar jadi Kliper" → `/daftar` (alur 5.1).
3. **Calon klien** (Tahap A) menekan tombol WhatsApp; tim membuat klien dan kampanye di aplikasi (alur 5.2).

### 5.1 Pendaftaran dan aktivasi kliper _(v4.0)_

1. Calon kliper mengisi `/daftar`: email, kata sandi, nama lengkap, nama panggung, nomor WhatsApp, kota, provinsi; mencentang persetujuan Syarat Kliper (versi tercatat). Tanggal lahir tidak diminta saat mendaftar.
2. Sistem mengirim email konfirmasi. Tautan konfirmasi membuka `/auth/callback` lalu `/portal/mulai`.
3. Kliper menambahkan minimal satu akun media sosial (platform, handle, URL profil, jumlah pengikut). Setelah itu status menjadi `aktif`.
4. Portal menampilkan **kode verifikasi** pribadi kliper (contoh `KB-7XK2QM`). Kode ini wajib ditulis di caption/deskripsi setiap klip sebagai bukti kepemilikan akun.
5. _(Opsional)_ Kliper mengajukan **lencana Kliper Lokal** dengan mengunggah tangkapan layar analitik audiens dan persentase audiens Kalimantan; tim memverifikasi.

Tidak ada langkah persetujuan manual sebelum kliper boleh bekerja. Kepemilikan akun dibuktikan di setiap klip (FR-M18-03).

### 5.2 Siklus kampanye terbuka _(v4.0, Tahap A)_

1. Tim membuat klien dan kampanye `draft`: brief, larangan, hashtag, materi mentah untuk dipotong, platform yang diizinkan, **anggaran kliper, tarif per 1.000 views, batas per klip, batas per kliper**, minimum views, jumlah klip maksimal per kliper, dan opsi "khusus Kliper Lokal".
2. Tim mengaktifkan kampanye → kampanye `terbuka` muncul di katalog portal.
3. Kliper membaca brief lalu menekan **Gabung** (satu tindakan yang sekaligus mengonfirmasi brief, FR-M13-10). Sistem membuat kode referal dan tautan pelacakan untuknya.
4. Kliper mengunduh materi, membuat klip, lalu memposting di akunnya sendiri dengan kode verifikasi, hashtag wajib, dan label konten berbayar.
5. Kliper **mengirim klip**: platform, URL tayang, waktu tayang, views saat ini, dan tangkapan layar views.
6. Tim memverifikasi di antrean: kepemilikan (kode verifikasi di caption), kepatuhan brief, waktu tayang di dalam periode, dan keaslian views → **setujui** dengan views terverifikasi, **minta perbaikan** (misalnya kode verifikasi belum dicantumkan), atau **tolak** dengan alasan.
7. Klip disetujui → sistem menghitung honor dan **menambah saldo** kliper (dibatasi batas per klip, per kliper, dan sisa anggaran).
8. Selama masa klaim, kliper dapat mengirim **pembaruan views** untuk klipnya; setiap pembaruan yang diterima menambah saldo sebesar selisihnya.
9. Kiriman klip baru ditutup ketika kampanye melewati `end_date` atau anggaran habis; pembaruan views ditutup setelah `end_date + claim_grace_days`. Tim menandai kampanye `selesai`.
10. Kliper mengajukan **penarikan** saldo (≥ minimum) ke rekening terdaftar → `owner` mentransfer manual dan mengunggah bukti → `dibayar`.
11. Tim atau klien membuka laporan kampanye (M9/M14).

Kampanye `undangan` berjalan sama, tetapi hanya kliper yang ditambahkan tim yang dapat melihat dan mengirim klip.

### 5.3 Kampanye lama (`paket`)

Kampanye yang dibuat sebelum v4.0 memakai `payout_model = paket` dan alur v3.2 (review draf sebelum tayang, honor dasar + bonus, `payouts`). Alur ini dipertahankan hanya untuk menyelesaikan dan melaporkan kampanye lama; kampanye baru tidak dapat memilih `paket`.

---

## 6. Kebutuhan Fungsional

> Format ID: `FR-<modul>-<nomor>`. Kebutuhan yang diubah v4.0 ditandai _(diubah v4.0)_.

### M1 — Autentikasi dan Pengguna Internal

- **FR-M1-01** _(diubah v4.0)_ Login dengan email dan kata sandi (Supabase Auth). Pendaftaran publik **hanya** lewat `/daftar` dan hanya menghasilkan peran `creator` (M16).
- **FR-M1-02** `owner` dapat mengundang pengguna internal, menetapkan peran, serta menonaktifkan/mengaktifkan pengguna.
- **FR-M1-03** Semua halaman selain situs publik M15, `/login`, `/daftar`, alur pemulihan/konfirmasi, `/laporan/<token>`, dan `/r/[slug]` wajib login. Pengguna nonaktif diarahkan keluar.
- **FR-M1-04** Fitur lupa kata sandi.

### M2 — Klien

- **FR-M2-01** _(diubah v1.4)_ CRUD klien: nama, jenis (`brand`, `umkm`, `instansi`, `personal`, `lainnya`), kota, provinsi, alamat, catatan. Jenis lama dipetakan: `kampus_swasta`, `sekolah_swasta`, `bank_daerah`, `bumd`, `pemda` → `instansi`; `event_organizer` → `brand`.
- **FR-M2-02** CRUD kontak klien: nama, jabatan, nomor WhatsApp, email. Satu ditandai kontak utama.
- **FR-M2-03** Halaman detail klien menampilkan riwayat kampanye beserta total nilai kontrak.

### M3 — Kreator / Kliper

- **FR-M3-01** _(diubah v4.0)_ Data kliper: nama lengkap, nama panggung, WhatsApp, email, kota, provinsi, tanggal lahir, niche, tier, status, catatan internal, `signup_source` (`undangan`/`mandiri`), dan `verification_code`. Status: `prospek` (akun dibuat, belum ada akun sosial), `aktif`, `nonaktif`, `diblokir`. Nilai lama `terverifikasi` diperlakukan sama dengan `aktif`; lencana lokal kini dibaca dari `verified_at` (FR-M3-05).
- **FR-M3-02** _(diubah v4.2)_ Usia **bukan syarat** menjadi kliper. Tanggal lahir opsional saat tim mendaftarkan dan tidak diminta saat kliper mendaftar sendiri; kliper wajib melengkapinya sendiri (sekali, dari portal) sebelum mengajukan penarikan pertama (FR-M19-05). Perubahan setelahnya lewat tim.
- **FR-M3-03** _(diubah v4.0)_ Akun media sosial per kliper: platform (`tiktok`, `instagram`, `youtube`, `facebook`), handle, URL profil, jumlah pengikut, persentase audiens Kalimantan, kota audiens teratas, bukti analitik, tanggal verifikasi terakhir. **Kliper menambah dan mengubah akunnya sendiri dari portal**; tim tetap dapat mengubahnya. Pasangan (`platform`, `handle`) unik lintas kliper.
- **FR-M3-04** Persetujuan syarat kerja sama: tanggal dan versi. Sejak v4.0 dicatat otomatis saat mendaftar dari `/daftar`; saat versi syarat naik, portal meminta persetujuan ulang sebelum kliper dapat bergabung atau mengirim klip.
- **FR-M3-05** _(diubah v4.0)_ **Lencana Kliper Lokal**: tim memverifikasi pengajuan lencana (minimal satu akun sosial dengan bukti analitik audiens dan persentase audiens Kalimantan ≥ ambang, default 50%). Tindakan ini mengisi `verified_at` dan `verified_by`. Lencana dapat dicabut dengan alasan. Lencana tidak wajib untuk bekerja, kecuali pada kampanye `local_only`.
- **FR-M3-06** _(diubah v4.0)_ Rekening (nama bank/e-wallet, nomor, nama pemilik) disimpan di `creator_bank_accounts`. Kliper **mengisi dan mengubah rekeningnya sendiri** dari portal (M19). `owner` membaca lengkap; `manager` dan kliper sendiri hanya melihat 4 digit terakhir setelah tersimpan.
- **FR-M3-07** Daftar kliper dapat difilter berdasarkan provinsi, kota, niche, tier, status, platform, lencana lokal, sumber pendaftaran, dan persentase audiens Kalimantan minimum.
- **FR-M3-08** _(diubah v4.0)_ Detail kliper menampilkan riwayat kampanye, jumlah klip disetujui/ditolak, total views terverifikasi, total honor, saldo saat ini, riwayat penarikan, dan riwayat pemblokiran.
- **FR-M3-09** _(v4.0)_ `owner` atau `manager` dapat memblokir kliper dengan alasan wajib; `owner` dapat membuka blokir. Kliper diblokir tidak dapat bergabung, mengirim klip, atau mengajukan penarikan; saldo dibekukan sampai `owner` memutuskan (dibayarkan atau dibatalkan lewat penyesuaian, FR-M19-06).

### M4 — Kampanye

- **FR-M4-01** _(diubah v1.3)_ CRUD kampanye: identitas (klien, kode unik, nama); brief (deskripsi, wajib, larangan, hashtag, label berbayar); `landing_url`; periode dan `min_live_days`; komersial (`package_price`, target konten, views, pendaftar). Kolom baru v4.0 ada di M17. **Tujuan** (`pendaftar`/`awareness`/`event`) hanya milik kampanye `paket` lama: nilainya dipertahankan untuk laporan, tidak diisi pada kampanye `per_views` (selalu kosong), dan tidak lagi tampil di formulir, daftar kampanye, maupun portal kliper.
- **FR-M4-02** Status kampanye: `draft` → `aktif` → `selesai`, atau `dibatalkan`. _(diubah v4.0)_ Kampanye `terbuka` dapat diaktifkan **tanpa** kliper; syarat aktivasinya ada di FR-M17-02. Kampanye `undangan` tetap butuh minimal satu kliper.
- **FR-M4-03** Materi kampanye: judul, jenis (`video`, `foto`, `dokumen`, `tautan`), berkas **atau** URL eksternal, catatan. Untuk klip, materi utamanya adalah video mentah panjang; video besar memakai URL eksternal.
- **FR-M4-04** Detail kampanye dengan tab: Ringkasan, Brief & Materi, Kliper, Klip, Metrik, Keuangan, Laporan.

### M5 — Penugasan dan Tautan Pelacakan

- **FR-M5-01** _(diubah v4.0)_ Penugasan terjadi dengan dua cara: **kliper bergabung sendiri** ke kampanye `terbuka` (FR-M17-04), atau **tim menambahkan** kliper ke kampanye mana pun. Kliper `diblokir`, `nonaktif`, atau `prospek` tidak dapat ditugaskan.
- **FR-M5-02** Per penugasan: status (`diundang`, `bergabung`, `mundur`, `selesai`) dan jumlah konten. Pada kampanye `paket` berlaku override skema honor; pada kampanye `per_views` penugasan tidak memiliki kolom honor sendiri.
- **FR-M5-03** Kode referal unik otomatis (huruf kapital + angka, 6–8 karakter, tanpa O/0/I/1). Dapat diedit tim selama unik dan belum ada klik atau laporan pendaftar.
- **FR-M5-04** Slug pelacakan unik; tautan `https://<domain>/r/<slug>`.
- **FR-M5-05** Endpoint publik `GET /r/[slug]`: mencatat klik (waktu, referrer, user agent, hash IP bersalt, penanda bot); 302 ke `landing_url` dari database dengan `utm_source`, `utm_medium=kreator`, `utm_campaign`, `ref`; tidak pernah memakai tujuan dari parameter URL; slug tidak dikenal atau kampanye `dibatalkan` → 404.
- **FR-M5-06** Tombol salin tautan pelacakan dan kode referal di portal dan halaman tim.

### M6 — Konten dan Review

Berlaku penuh untuk kampanye `paket`. Kampanye `per_views` memakai verifikasi pasca-tayang (M18) di atas tabel yang sama.

- **FR-M6-01** Mencatat konten per penugasan: platform, tautan/berkas draf, caption.
- **FR-M6-02** Status review: `menunggu_review` → `disetujui` / `revisi` / `ditolak`. `revisi` wajib beralasan; kiriman ulang menaikkan `revision_count`.
- **FR-M6-03** Checklist review sebelum menyetujui. _(diubah v4.0)_ Untuk kampanye `per_views`, isi checklist mengikuti FR-M18-04.
- **FR-M6-04** Kampanye `paket`: URL tayang hanya untuk konten disetujui. Kampanye `per_views`: URL tayang dikirim bersama klip, sehingga persetujuan terjadi setelah tayang.
- **FR-M6-05** Status tayang: `belum_tayang`, `tayang`, `dihapus` (dengan tanggal penghapusan).
- **FR-M6-06** Riwayat review disimpan dan ditampilkan, tidak dapat diubah.

### M7 — Metrik

- **FR-M7-01** Snapshot metrik per konten tayang: checkpoint, waktu pengambilan, views, likes, komentar, share, simpan, tangkapan layar bukti (wajib).
- **FR-M7-02** Views konten = snapshot **terbaru**; peringatan jika views menurun.
- **FR-M7-03** Klik tautan dihitung otomatis; tampilkan total dan non-bot.
- **FR-M7-04** Laporan pendaftar agregat per kode referal atau "tanpa kode", tanpa data pribadi. _(diubah v4.0)_ Pada kampanye `per_views`, pendaftar adalah **metrik untuk klien**, bukan dasar honor.
- **FR-M7-05** Tab Metrik: total views, klik, pendaftar, perbandingan target, grafik kumulatif, tabel per kliper.

### M8 — Keuangan

- **FR-M8-01** _(diubah v4.0)_ Honor kampanye `paket` dihitung sebagai `payouts` sesuai 8.3 (tidak berubah). Honor kampanye `per_views` dicatat per klip di buku besar saldo (M19) dan **tidak** membuat `payouts`.
- **FR-M8-02** Penyesuaian payout (kampanye `paket`) dengan alasan wajib.
- **FR-M8-03** Hanya `owner` yang mengubah payout `draf` → `disetujui` → `dibayar` (dengan tanggal dan bukti).
- **FR-M8-04** Hitung ulang hanya untuk payout `draf`.
- **FR-M8-05** Pembayaran klien: nomor invoice, nominal, jatuh tempo, status, tanggal bayar, bukti.
- **FR-M8-06** _(diubah v4.0)_ Tab Keuangan: harga paket, diterima dari klien, **anggaran kliper, honor terpakai, sisa anggaran**, margin kotor (Rp dan %), biaya per pendaftar, CPM, dan biaya efektif per 1.000 views.

### M9 — Laporan Kampanye

- **FR-M9-01** Halaman laporan siap cetak A4.
- **FR-M9-02** Isi: identitas kampanye dan klien, periode, capaian vs target, grafik views, tabel per kliper (**nama panggung saja**), daftar klip tayang, catatan penutup.
- **FR-M9-03** Tanpa data keuangan internal (honor, anggaran kliper, margin).
- **FR-M9-04** Ekspor CSV konten + metrik dan rekap per kliper.
- **FR-M9-05** Tautan laporan baca-saja tanpa login (v1.1), tidak berubah.

### M10 — Dasbor dan Pengingat

- **FR-M10-01** _(diubah v4.0)_ Kartu ringkasan: kampanye aktif, **klip menunggu verifikasi**, **pembaruan views menunggu**, **pengajuan lencana lokal**, **penarikan menunggu** (hanya `owner`), **kliper baru 7 hari terakhir**, **kampanye dengan sisa anggaran < 10%** (per kampanye: nominal terpakai dan sisa), invoice klien belum lunas, dan antrean lama kampanye `paket`.
- **FR-M10-02** Snapshot jatuh tempo (kampanye `paket`), diurutkan dari yang paling lama terlambat.
- **FR-M10-03** _(diubah v4.0)_ Antrean verifikasi klip diurutkan dari yang paling lama menunggu, dengan penanda kiriman yang melewati 24 jam.
- **FR-M10-04** Peringatan konten `dihapus` sebelum `min_live_days`.
- **FR-M10-05** Pengingat Telegram harian ke owner via n8n (v1.1). _(v4.0)_ Isi pesan ditambah jumlah klip menunggu verifikasi > 24 jam dan jumlah penarikan menunggu.

### M11 — Log Aktivitas

- **FR-M11-01** _(diubah v4.0)_ Mencatat otomatis: perubahan data utama, status kampanye, keputusan review/verifikasi, perubahan payout, akses rekening oleh `owner`, serta sejak v4.0: **pendaftaran kliper, persetujuan ulang syarat, bergabung ke kampanye, keputusan verifikasi klip dan views, setiap entri buku besar saldo, pengajuan dan pemrosesan penarikan, perubahan rekening, pemberian/pencabutan lencana, pemblokiran**.
- **FR-M11-02** `owner` dapat melihat dan memfilter log.

### M12 — Catatan Waktu Operasional

- **FR-M12-01** Catat waktu kerja per kampanye. _(v4.0)_ Nilai aktivitas baru: `verifikasi_klip`, `penarikan`.
- **FR-M12-02** Rekap jam per aktivitas per kampanye.

### M13 — Portal Kreator/Kliper

FR-M13-01 sampai FR-M13-10 (v2.0–v3.2) tetap berlaku untuk kampanye `paket` dan kliper undangan. Perubahan v4.0:

- **FR-M13-01** _(diubah v4.0)_ Undangan portal dari halaman kreator tetap ada untuk kliper yang didaftarkan tim; kliper baru umumnya masuk lewat `/daftar`.
- **FR-M13-03** _(diubah v4.0)_ Dasbor portal: ringkasan saldo (tersedia, sedang ditarik), kampanye yang diikuti, klip menunggu verifikasi, keputusan terbaru, dan pintasan ke katalog.
- **FR-M13-10** _(diubah v4.0)_ Pada kampanye `terbuka`, konfirmasi brief terjadi pada tindakan **Gabung** (FR-M17-04); pada kampanye `undangan`, alur `diundang` → `bergabung` tetap seperti v3.2.
- Menu portal v4.0: **Beranda, Kampanye (katalog), Kampanye Saya, Klip Saya, Saldo, Profil** (data diri, akun sosial, kode verifikasi, lencana lokal, rekening).

**Aturan keamanan M13 (tetap berlaku)**

- Kliper tidak diberi kebijakan RLS atas tabel dasar, kecuali baris miliknya yang memang ditulis dari portal (`contents`, `metric_submissions`, `creator_social_accounts`, `campaign_creators` untuk bergabung). Bacaan lewat view `creator_portal_*`.
- Harga paket, target internal, margin, catatan internal, dan data kliper lain tidak pernah keluar lewat portal.
- Setiap tulisan lewat Server Action (Zod + pemeriksaan peran dan kepemilikan) lalu ditegakkan ulang oleh RLS dan trigger.

### M14 — Portal Klien _(v3.0)_

- **FR-M14-01 – FR-M14-03** (Fase 11) tetap berlaku. Rekap per kliper memakai nama panggung saja.
- **FR-M14-04** _(ditunda v4.0)_ Persetujuan konten oleh klien sebelum tayang **tidak berlaku** pada kampanye `per_views` karena klip diposting sebelum diverifikasi. Pengganti yang direncanakan (Tahap B): klien dapat **menandai klip bermasalah** untuk ditinjau tim. Kolom `client_approval_required` tidak dibangun.
- **FR-M14-05 – FR-M14-07** (laporan, CSV, dan usulan laporan pendaftar) tetap direncanakan sebagai Fase 12, tanpa persetujuan konten.

### M15 — Situs Publik _(v3.1, diubah v4.0)_

FR-M15-01 sampai FR-M15-08 tetap berlaku, dengan perubahan berikut:

- **FR-M15-02** _(diubah v4.0)_ Landing menampilkan dua jalur setara: **"Daftar jadi Kliper"** (→ `/daftar`) dan **"Pasang Kampanye"** (→ WhatsApp, Tahap A). Cara kerja ditulis dari sisi kliper (daftar → pilih kampanye → posting dan kirim → tarik saldo) dan dari sisi klien.
- **FR-M15-03** _(diubah v4.0)_ `/kreator` menjelaskan: syarat (punya akun media sosial aktif; tanpa batas usia), cara kerja empat langkah, cara menghitung honor (tarif per 1.000 views, contoh hitungan dengan angka ilustrasi yang disetujui `owner`), kode verifikasi, aturan anti-kecurangan, lencana Kliper Lokal, dan cara menarik saldo. Tombol utama "Daftar jadi Kliper".
- **FR-M15-05** _(diubah v4.0)_ `robots.ts` dan `sitemap.ts` menambahkan `/daftar`.
- **FR-M15-07** _(diubah v4.0)_ Kontak WhatsApp tetap untuk calon klien dan bantuan. Satu-satunya formulir yang menerima data pengunjung adalah `/daftar` (di luar grup `(marketing)`).
- **FR-M15-09** _(baru v1.6)_ **Kampanye yang lagi buka** di `/kampanye` (publik, diindeks, masuk `robots.ts` dan `sitemap.ts`) menampilkan kampanye yang sama dengan katalog portal (FR-M17-03: `aktif` + `terbuka` + `per_views`, belum lewat `end_date`) dalam bentuk ringkas: _(v1.7)_ gambar sampul kampanye, nama kampanye, nama klien, platform (sebagai ikon logo), tarif per 1.000 views, _(v1.7)_ minimum views klaim (`min_views_to_earn`), batas per klip, kuota klip, tenggat, penanda "Khusus Kliper Lokal", sisa anggaran kliper dalam persen dan Rupiah (total, terpakai, sisa), dan status "Anggaran habis". **Tidak** memuat brief, poin wajib/larangan, hashtag, materi, harga paket, target, atau catatan internal: semua itu tetap di portal setelah login. Tiap kartu mengajak "Daftar untuk gabung" (→ `/daftar`) dan "Masuk untuk lihat brief" (→ `/login?next=/portal/kampanye/<id>`). Landing menampilkan hingga 3 kampanye terbaru yang anggarannya belum habis dengan tautan ke `/kampanye`; bagian itu disembunyikan bila tidak ada kampanye.
- Grup `(marketing)` tetap tanpa sesi, tanpa cookie, dan tanpa formulir. Pengecualian satu-satunya (v1.6): `/kampanye` dan landing membaca view `public_campaign_catalog` dengan kunci anon (tanpa sesi, tanpa service role) lewat `lib/marketing/campaigns.ts`, di-cache ISR 5 menit. Bila database tidak terjangkau, halaman tetap tampil dengan pesan, bukan error.

### M16 — Pendaftaran Kliper Mandiri _(v4.0, Fase 15)_

- **FR-M16-01** Halaman `/daftar` (grup `(auth)`) berisi: email, kata sandi (min. 8 karakter), nama lengkap, nama panggung, nomor WhatsApp, kota, provinsi, centang Syarat Kliper (menautkan `/syarat`, versi dari konstanta aplikasi), dan centang Kebijakan Privasi. Validasi Zod di server. _(diubah v4.2)_ Tanggal lahir dan pernyataan usia tidak lagi diminta (FR-M3-02).
- **FR-M16-02** Pendaftaran memakai Supabase Auth `signUp` dengan **konfirmasi email wajib**. Templat email konfirmasi `supabase/templates/confirmation.html` memakai pola `token_hash` seperti undangan dan dipasang juga di dashboard hosted. Sebelum email dikonfirmasi, akun tidak dapat masuk.
- **FR-M16-03** **Peran tidak boleh berasal dari input pengguna.** Trigger pembuat profil (`handle_new_user`) wajib diubah: peran dibaca dari `raw_app_meta_data` (hanya dapat diisi service role saat undangan), dan pengguna tanpa peran di `app_metadata` selalu menjadi `creator`. `raw_user_meta_data.role` diabaikan. Undangan internal, kreator, dan klien yang ada disesuaikan agar menulis peran ke `app_metadata`.
- **FR-M16-04** Pendaftaran membuat baris `creators` terhubung (`profile_id`) dengan `signup_source = mandiri`, status `prospek`, `terms_version`/`terms_agreed_at`, dan `verification_code` unik (format `KB-` + 6 karakter tanpa O/0/I/1) yang dibuat server/database. Satu email = satu kliper; email yang sudah dipakai kreator undangan menampilkan pesan umum tanpa membocorkan keberadaan akun.
- **FR-M16-05** Setelah konfirmasi email, kliper diarahkan ke `/portal/mulai`: tambah minimal satu akun sosial (FR-M3-03). Menyimpan akun sosial pertama mengubah status `prospek` → `aktif`. Selama `prospek`, katalog terlihat tetapi tombol Gabung dinonaktifkan dengan penjelasan.
- **FR-M16-06** Perlindungan penyalahgunaan tanpa pihak ketiga: rate limit pendaftaran per IP (hash bersalt) di memori server, memakai pembatas yang sama dengan `/r/[slug]` (5 per jam); pembatasan bawaan Supabase Auth; dan penolakan domain email sekali pakai dari daftar statis. Nomor WhatsApp dinormalisasi ke format `62…` dan unik lintas kliper; nomor yang sudah terdaftar ditolak dengan pesan umum agar nomor tidak bisa ditebak lewat API. Pemanggilan Auth API langsung (tanpa formulir) hanya dibatasi Supabase dan divalidasi ulang oleh trigger; pendaftaran tanpa data kliper menghasilkan akun `creator` tanpa baris kreator yang tidak dapat membuka portal.
- **FR-M16-07** Profil portal menampilkan kode verifikasi dengan tombol salin dan petunjuk menaruhnya di caption. Kode tidak dapat diubah kliper; tim dapat membuat ulang kode (tercatat di log).
- **FR-M16-08** Pengajuan lencana lokal dari portal: pilih akun sosial, unggah bukti analitik (bucket `audience-proofs`, jalur milik kliper), isi persentase audiens Kalimantan dan kota teratas → masuk antrean tim (FR-M3-05).
- **FR-M16-09** Kliper dapat meminta penghapusan akun dari portal. Permintaan masuk ke `owner`; penghapusan memakai fungsi anonimisasi yang sudah ada dan hanya boleh diproses ketika saldo = 0 dan tidak ada penarikan berjalan.

### M17 — Kampanye Terbuka dan Katalog _(v4.0, Fase 16)_

- **FR-M17-01** Kolom kampanye baru:
  - `access`: `terbuka` (muncul di katalog, kliper bergabung sendiri) atau `undangan` (hanya kliper yang ditambahkan tim);
  - `payout_model`: `per_views` (default untuk kampanye baru, tidak dapat diubah setelah aktif) atau `paket` (kampanye lama, di-backfill oleh migrasi);
  - `rate_per_1000_views` (Rp), `creator_budget` (anggaran honor kliper, Rp), `max_payout_per_clip` (opsional), `max_payout_per_creator` (opsional), `min_views_to_earn` (default 0), `max_clips_per_creator` (default 3);
  - `allowed_platforms` (subset `social_platform`, minimal satu), `local_only` (hanya pemegang lencana lokal), `claim_grace_days` (default 3), `published_at`.
- **FR-M17-02** Syarat aktivasi kampanye `per_views`: brief terisi, minimal satu materi, `rate_per_1000_views > 0`, `creator_budget > 0`, `end_date ≥ hari ini`, dan `allowed_platforms` tidak kosong. `landing_url` opsional _(diubah v1.3)_; syarat `landing_url` hanya berlaku bagi kampanye `paket` lama bertujuan `pendaftar`. Ditegakkan di action dan trigger.
- **FR-M17-03** **Katalog** di `/portal/kampanye` menampilkan kampanye `aktif` + `terbuka` yang belum lewat `end_date`: nama kampanye, nama klien, platform, tarif per 1.000 views, batas per klip, **sisa anggaran kliper dalam persen dan Rupiah** _(diubah v1.2)_: total `creator_budget`, honor terpakai, dan sisa, tanpa harga paket, tenggat, jumlah klip maksimal, penanda "Khusus Kliper Lokal", dan status "Anggaran habis". Filter: platform, khusus lokal _(tujuan dihapus v1.3)_; urut: terbaru, tarif tertinggi, tenggat terdekat. Detail kampanye menampilkan brief lengkap dan materi **sebelum** bergabung.
- **FR-M17-04** **Gabung**: satu tindakan yang menyatakan kliper telah membaca brief, poin wajib, dan larangan. Sistem membuat `campaign_creators` berstatus `bergabung` dengan `creator_confirmed_at` dan `joined_at` dari waktu server, beserta kode referal dan slug. Ditolak bila: kliper bukan `aktif`, syarat versi terbaru belum disetujui, kampanye bukan `aktif`/`terbuka`, lewat `end_date`, anggaran habis, atau `local_only` tanpa lencana. Bergabung dua kali ke kampanye yang sama tidak mungkin (unik).
- **FR-M17-05** Kliper dapat **mundur** dari kampanye selama belum punya klip disetujui; klip yang menunggu verifikasi ikut dibatalkan.
- **FR-M17-06** **Anggaran habis**: bila `sisa_anggaran < rate_per_1000_views` (tidak cukup membayar 1.000 views), kampanye otomatis ditandai "anggaran habis" di katalog, tidak menerima kliper baru maupun klip baru, dan tim mendapat kartu dasbor. Pembaruan views untuk klip yang sudah disetujui tetap diterima, tetapi honornya hanya dibayar sampai sisa anggaran (8.6).
- **FR-M17-07** Tim dapat menaikkan `creator_budget` kampanye aktif (tercatat di log), tetapi tidak dapat menurunkannya di bawah honor yang sudah terpakai. `rate_per_1000_views` tidak dapat diubah setelah ada klip disetujui.

### M18 — Kiriman Klip dan Verifikasi Views _(v4.0, Fase 17)_

- **FR-M18-01** **Kirim klip** (portal, per penugasan berstatus `bergabung`): platform (harus termasuk `allowed_platforms` dan akun sosial terdaftar milik kliper), URL tayang, waktu tayang, views saat ini, likes/komentar/share (opsional), tangkapan layar views (wajib, bucket `metric-proofs`), dan pernyataan bahwa kode verifikasi ada di caption. Kiriman membuat `contents` (`review_status = menunggu_review`, URL dan waktu tayang dari kiriman) dan satu `metric_submissions` awal dalam satu transaksi.
- **FR-M18-02** Aturan kiriman yang ditegakkan server dan database: waktu tayang di antara `joined_at` dan `end_date`; waktu tayang tidak di masa depan; jumlah klip milik kliper di kampanye itu (tidak termasuk yang ditolak) ≤ `max_clips_per_creator`; URL tayang yang dinormalisasi (`posted_url_normalized`) **unik global**, sehingga satu video tidak dapat diklaim dua kali di kampanye berbeda atau oleh kliper berbeda; kampanye `aktif` dan anggaran belum habis.
- **FR-M18-03** **Bukti kepemilikan**: caption/deskripsi klip wajib memuat `verification_code` kliper. Tim memeriksanya secara manual saat verifikasi; klip tanpa kode dikembalikan sebagai `revisi` (kliper menambah kode di caption lalu mengirim ulang tanpa mengubah URL).
- **FR-M18-04** **Verifikasi tim** (antrean di dasbor dan tab Klip) dengan checklist: kode verifikasi ada di caption, akun sesuai akun sosial terdaftar, isi sesuai brief dan tidak melanggar larangan, hashtag dan label berbayar ada, tayang di periode kampanye, views pada bukti cocok dengan halaman klip, tidak ada tanda views palsu. Keputusan:
  - **setujui** → tim memasukkan **views terverifikasi** (boleh lebih kecil dari klaim); klip menjadi `disetujui`/`tayang`, usulan metrik menjadi snapshot resmi, dan honor dikreditkan ke saldo (FR-M19-02);
  - **revisi** → catatan wajib; kliper dapat memperbaiki caption lalu mengirim ulang;
  - **tolak** → alasan wajib dari daftar (`bukan_pemilik`, `langgar_brief`, `di_luar_periode`, `duplikat`, `views_tidak_wajar`, `lainnya`) + catatan.
- **FR-M18-05** **Pembaruan views**: untuk klip `disetujui`, kliper dapat mengirim pembaruan (views + tangkapan layar) paling cepat 24 jam setelah kiriman terakhirnya untuk klip itu, sampai `end_date + claim_grace_days`. Tim menerima (dengan views terverifikasi) atau menolak dengan alasan. Setiap pembaruan yang diterima mengkreditkan **selisih** honor (8.6).
- **FR-M18-06** **Klip dihapus atau diprivat**: bila tim menemukan klip `dihapus` sebelum `min_live_days`, tim menandainya `dihapus` dan sistem membuat entri `pembatalan` sebesar seluruh honor klip itu. Setelah `min_live_days`, honor tetap milik kliper.
- **FR-M18-07** **Anti-kecurangan**: `lib/calculations/` menyediakan penanda risiko murni (lonjakan views antar kiriman, rasio interaksi/views di bawah ambang, views menurun, klip diunggah jauh sebelum bergabung) yang ditampilkan sebagai peringatan di antrean, bukan keputusan otomatis. Kecurangan terbukti → tolak klip, batalkan honor terkait (entri `pembatalan`), dan pertimbangkan pemblokiran (FR-M3-09).
- **FR-M18-08** Kampanye `paket` tetap memakai alur draf M6 dan M13; formulir kirim klip hanya muncul untuk kampanye `per_views`.
- **FR-M18-09** _(v4.1)_ **Email hasil verifikasi**: setelah tim memutuskan klip (setujui, revisi, tolak) atau pembaruan views (terima, tolak), sistem mengirim email ke `creators.email` berisi nama kampanye, keputusan, views terverifikasi dan honor yang dikreditkan (bila disetujui/diterima), catatan atau alasan (bila revisi/ditolak), dan tautan ke portal. Email hanya pemberitahuan: dikirim lewat SMTP dari server setelah respons, gagal kirim tidak membatalkan keputusan dan hanya dicatat di log server, kliper teranonimkan tidak dikirimi, dan email tidak memuat data rekening. SMTP tidak dikonfigurasi = email tidak dikirim.

### M19 — Saldo, Rekening, dan Penarikan _(v4.0, Fase 18)_

- **FR-M19-01** **Buku besar saldo** `creator_ledger_entries` (append-only, tidak dapat diubah atau dihapus): jenis `honor_klip` (+), `pembatalan` (−), `penyesuaian` (±, hanya `owner`, alasan wajib), `penarikan` (−), `pengembalian_penarikan` (+, saat penarikan ditolak). Setiap entri merujuk kliper dan, bila relevan, kampanye, konten, atau penarikan.
- **FR-M19-02** Honor dikreditkan **pada saat tim menyetujui** klip atau pembaruan views, dihitung di `lib/calculations/` (8.6). Fungsi database yang mencatat kredit **mengunci baris kampanye** dan menolak bila total honor kampanye akan melebihi `creator_budget` atau batas per kliper, sehingga dua verifikasi bersamaan tidak dapat membobol anggaran.
- **FR-M19-03** Saldo tersedia = Σ `creator_ledger_entries.amount`. Portal menampilkan saldo tersedia, total pernah diterima, riwayat entri (tanggal, kampanye, klip, jenis, nominal), dan penarikan berjalan.
- **FR-M19-04** **Rekening**: kliper mengisi sendiri nama bank/e-wallet (daftar tetap: bank umum + DANA, OVO, GoPay, ShopeePay), nomor, dan nama pemilik. Nama pemilik wajib sama dengan nama lengkap akun; perbedaan ditandai untuk diperiksa `owner`. Perubahan rekening tercatat di log dan menahan pengajuan penarikan baru selama 24 jam.
- **FR-M19-05** **Pengajuan penarikan**: nominal ≥ minimum penarikan (`platform_settings.min_withdrawal`, default **Rp 100.000** = 10.000 views pada tarif Rp 10.000; diubah `owner` di Pengaturan → Penarikan dan tercatat di log) dan ≤ saldo tersedia; hanya satu penarikan `diajukan`/`diproses` per kliper; kliper tidak `diblokir`; rekening terisi; _(v4.2)_ tanggal lahir terisi (FR-M3-02). Pengajuan membuat `withdrawals` dengan salinan data rekening saat itu dan entri `penarikan` di buku besar **dalam satu transaksi yang mengunci baris kliper**, sehingga saldo tidak dapat ditarik dua kali.
- **FR-M19-06** **Pemrosesan** (hanya `owner`): `diajukan` → `diproses` → `dibayar` (tanggal transfer + bukti wajib, bucket `finance-proofs`; `owner` mencatat **biaya transfer** yang ditanggung kliper, sehingga yang diterima = nominal − biaya; buku besar tetap mendebit nominal penuh), atau `ditolak` (alasan wajib) yang otomatis membuat entri `pengembalian_penarikan`. Target: diproses ≤ 1 hari kerja. `owner` juga membuat penyesuaian saldo dengan alasan.
- **FR-M19-07** Kliper melihat status penarikannya beserta tanggal bayar, tanpa bukti transfer. Nomor rekening di portal dan untuk `manager` hanya tampil 4 digit terakhir.
- **FR-M19-08** Halaman `owner` "Penarikan": antrean, filter status, ekspor CSV (untuk transfer massal manual), dan total per periode.
- **FR-M19-09** _(v4.1)_ **Email penarikan dibayar**: saat `owner` menandai penarikan `dibayar`, kliper menerima email berisi nominal, biaya transfer, jumlah diterima, tanggal transfer, dan tautan ke halaman Saldo, tanpa nomor rekening dan tanpa bukti transfer. Aturan pengiriman sama dengan FR-M18-09.

---

## 7. Model Data

> Konvensi: tabel/kolom bahasa Inggris `snake_case`; nilai enum bahasa Indonesia; `id uuid`, `created_at`, `updated_at` `timestamptz`; uang `bigint` Rupiah utuh.

### 7.1 Tabel yang sudah ada (ringkas)

| Tabel                     | Kolom utama                                                                                  | Perubahan v4.0 |
| ------------------------- | -------------------------------------------------------------------------------------------- | -------------- |
| `profiles`                | `id`, `full_name`, `email`, `role` (`owner`/`manager`/`creator`/`client`), `is_active`, `timezone` | Trigger pembuat profil membaca peran dari `app_metadata` (FR-M16-03) |
| `clients`, `client_contacts` | Lihat M2, M14                                                                             | — |
| `creators`                | `full_name`, `stage_name`, `phone_wa`, `email`, `city`, `province`, `birth_date`, `niches`, `tier`, `status`, `terms_version`, `terms_agreed_at`, `verified_at`, `verified_by`, `notes`, `profile_id`, `portal_invited_at` | + `signup_source` (`undangan`/`mandiri`), `verification_code` (unik), `blocked_at`, `blocked_reason`, `deletion_requested_at`; `phone_wa` unik setelah normalisasi; `verified_at` = lencana lokal |
| `creator_bank_accounts`   | `creator_id` (unik), `bank_name`, `account_number`, `account_holder`                          | Kliper menulis barisnya sendiri; bacaan tersamar lewat view |
| `creator_social_accounts` | `creator_id`, `platform`, `handle`, `profile_url`, `followers_count`, `kalimantan_audience_pct`, `top_cities`, `audience_proof_path`, `last_verified_at` | Kliper menulis barisnya sendiri; + `badge_requested_at` |
| `campaigns`               | Lihat M4                                                                                     | + kolom FR-M17-01 |
| `campaign_assets`         | Lihat M4                                                                                     | — |
| `campaign_creators`       | `campaign_id`, `creator_id`, `status`, `contents_committed`, kolom honor override, `referral_code`, `tracking_slug`, `joined_at`, `creator_confirmed_at` | + `join_source` (`mandiri`/`tim`), `withdrawn_at` |
| `contents`                | Lihat M6 + `proposed_posted_*`                                                                | + `posted_url_normalized` (unik), `verified_views`, `rejection_reason`, `caption_code_checked` |
| `content_reviews`         | Riwayat review                                                                               | `checklist` memuat butir FR-M18-04 untuk `per_views` |
| `metric_snapshots`, `metric_submissions` | Lihat M7, M13                                                                  | `metric_submissions` + `verified_views`; dipakai untuk kiriman awal dan pembaruan views |
| `link_clicks`, `registrant_reports`, `registrant_submissions` | Lihat M5, M7, M14                                   | — |
| `payouts`                 | Honor kampanye `paket`                                                                       | Tidak dipakai untuk `per_views` |
| `client_payments`, `ops_time_logs`, `report_share_links`, `activity_logs` | Lihat M8, M12, M9, M11                   | `ops_activity` + `verifikasi_klip`, `penarikan` |

### 7.2 Tabel baru v4.0

| Tabel                     | Kolom utama | Catatan |
| ------------------------- | ----------- | ------- |
| `creator_ledger_entries`  | `creator_id`, `entry_type` (`honor_klip`/`pembatalan`/`penyesuaian`/`penarikan`/`pengembalian_penarikan`), `amount` (bigint bertanda), `campaign_id`, `content_id`, `metric_submission_id`, `withdrawal_id`, `notes`, `created_by`, `created_at` | Append-only; insert hanya lewat fungsi `security definer` yang mengunci kampanye/kliper. RLS: `owner` dan `manager` baca; kliper lewat view |
| `withdrawals`             | `creator_id`, `amount`, `bank_name`, `account_number`, `account_holder` (salinan), `status` (`diajukan`/`diproses`/`dibayar`/`ditolak`), `requested_at`, `processed_by`, `processed_at`, `paid_at`, `transfer_proof_path`, `rejection_reason` | **RLS tabel dasar: hanya `owner`.** Kliper membaca lewat view tersamar; insert lewat fungsi `request_withdrawal()` |

**Enum baru:** `campaign_access` (`terbuka`, `undangan`), `payout_model` (`per_views`, `paket`), `signup_source` (`undangan`, `mandiri`), `ledger_entry_type`, `withdrawal_status`, `clip_rejection_reason` (`bukan_pemilik`, `langgar_brief`, `di_luar_periode`, `duplikat`, `views_tidak_wajar`, `lainnya`).

### 7.3 View portal kliper

View lama (`creator_portal_profile`, `_assignments`, `_assets`, `_contents`, `_reviews`, `_metrics`, `_submissions`, `_payouts`) tetap. Tambahan v4.0 — semuanya memfilter `current_creator_id()` (kecuali katalog), hanya kolom aman, hanya untuk peran `authenticated`:

| View                               | Isi |
| ---------------------------------- | --- |
| `creator_portal_catalog`           | Kampanye `aktif` + `terbuka`: kolom brief, materi ringkas, tarif, batas, platform, `local_only`, tenggat, sisa anggaran dalam **persen dan Rupiah** (`budget_total`, `budget_used`, `budget_remaining`), status bergabung kliper yang sedang login. Tanpa `package_price`, target internal, dan catatan internal. Hanya terbaca oleh kliper berstatus `aktif`/`prospek` |
| `creator_portal_ledger`            | Entri buku besar miliknya |
| `creator_portal_balance`           | Saldo tersedia, total diterima, total ditarik |
| `creator_portal_withdrawals`       | Penarikannya, nomor rekening tersamar, tanpa `transfer_proof_path` |
| `creator_portal_bank_account`      | Rekeningnya, nomor tersamar |
| `creator_portal_social_accounts`   | Akun sosialnya beserta status lencana |
| `public_campaign_catalog` _(v1.6)_ | **Publik** (`anon` dan `authenticated`, hanya baca), untuk FR-M15-09: kampanye yang sama dengan `creator_portal_catalog`, tetapi hanya kolom ringkas (nama, nama klien, platform, tarif, batas per klip, kuota klip, _(v1.7)_ `min_views_to_earn` dan `cover_image_path`, `local_only`, tenggat, `published_at`, anggaran dalam persen dan Rupiah, `budget_exhausted`). Tanpa brief, aturan, materi, status penugasan, `package_price`, target, dan catatan internal. Baris berasal dari fungsi `security definer` `public_campaign_catalog_rows()`, sehingga `anon` tidak memanggil helper anggaran secara langsung |

### 7.4 Penyimpanan berkas

Semua bucket **privat**, signed URL berumur pendek.

| Bucket            | Isi | Perubahan v4.0 |
| ----------------- | --- | -------------- |
| `audience-proofs` | Bukti analitik audiens | Kliper mengunggah ke jalur `<creator_id>/…` miliknya |
| `campaign-assets` | Materi kampanye (maks. 50 MB; video besar lewat tautan) | Kliper `aktif` dapat mengunduh materi kampanye `terbuka` yang sedang aktif |
| `content-drafts`  | Draf konten (kampanye `paket`) | — |
| `metric-proofs`   | Tangkapan layar views | Dipakai kiriman klip dan pembaruan views |
| `finance-proofs`  | Bukti transfer honor, penarikan, dan pembayaran klien (hanya `owner`) | — |

---

## 8. Aturan Bisnis dan Perhitungan

Semua perhitungan di `lib/calculations/` sebagai fungsi murni **dengan unit test**. Fungsi database hanya menegakkan invarian (anggaran, saldo), tidak menghitung ulang rumus.

### 8.1–8.3 Kampanye `paket` (tidak berubah)

- Nilai efektif: `campaign_creators.<kolom> ?? campaigns.default_<kolom>`.
- Konten memenuhi syarat: `disetujui`, punya `posted_url`/`posted_at`, dan `tayang` atau `dihapus` setelah `min_live_days`.
- Rumus honor (dibulatkan ke bawah, minimal 0, hanya untuk kampanye `selesai`):

```
konten_valid     = min(jumlah konten memenuhi syarat, contents_committed)
base_amount      = konten_valid × base_fee
views_bonus      = min(floor(total_views / 1000) × bonus_per_1000_views, views_bonus_cap?)
registrant_bonus = Σ registrant_count × bonus_per_registrant
total_amount     = base_amount + views_bonus + registrant_bonus + adjustment_amount
```

### 8.4 Metrik kampanye

```
total_views          = Σ views snapshot terbaru semua konten tayang (per_views: hanya klip disetujui)
total_clicks_valid   = jumlah link_clicks dengan is_bot = false
total_registrants    = Σ registrant_count (termasuk tanpa kode)
creator_cost         = paket: Σ payouts.total_amount | per_views: Σ ledger (honor_klip + pembatalan) kampanye
cpm                  = package_price / total_views × 1000       ("–" jika 0)
cost_per_registrant  = package_price / total_registrants       ("–" jika 0)
gross_margin         = package_price − creator_cost
gross_margin_pct     = gross_margin / package_price × 100
budget_remaining     = creator_budget − creator_cost             (per_views)
budget_used_pct      = creator_cost / creator_budget × 100
```

### 8.5 Aturan lain

- Kampanye `selesai`/`dibatalkan` hanya dapat diubah `owner`, tercatat di log.
- Kliper `diblokir`/`nonaktif`/`prospek` tidak dapat bergabung atau mengirim klip.
- Kode referal dan slug tidak boleh diubah setelah ada klik atau laporan pendaftar.
- Checkpoint jatuh tempo dihitung dari `posted_at` dalam zona waktu tampilan.

### 8.6 Honor klip `per_views` _(v4.0)_

Untuk satu klip dengan `verified_views` terbaru yang diterima tim:

```
eligible_views   = verified_views ≥ min_views_to_earn ? verified_views : 0
clip_earning     = floor(eligible_views × rate_per_1000_views / 1000)
clip_earning     = max_payout_per_clip ? min(clip_earning, max_payout_per_clip) : clip_earning
already_credited = Σ ledger honor_klip + pembatalan untuk klip ini
delta            = max(clip_earning − already_credited, 0)
creator_room     = max_payout_per_creator ? max_payout_per_creator − Σ honor kliper di kampanye ini : ∞
budget_room      = creator_budget − creator_cost kampanye
credit           = min(delta, creator_room, budget_room)     → entri honor_klip bila credit > 0
```

- Semua hasil dibulatkan ke bawah ke Rupiah utuh; tidak ada float.
- Views yang turun **tidak** otomatis mengurangi saldo (`delta` minimal 0). Pengurangan hanya lewat `pembatalan` (FR-M18-06, FR-M18-07) atau `penyesuaian` `owner`.
- `credit` yang terpotong oleh `creator_room` atau `budget_room` ditampilkan ke tim dan kliper sebagai "dibatasi batas kampanye".
- Invarian database: Σ `honor_klip` + `pembatalan` per kampanye ≤ `creator_budget`; saldo kliper setelah `penarikan` ≥ 0.
- Contoh: tarif Rp 10.000/1.000 views, 23.450 views terverifikasi → Rp 234.500. Pembaruan ke 41.000 views → kredit tambahan Rp 175.500.

### 8.7 Saldo dan penarikan _(v4.0)_

```
saldo_tersedia = Σ creator_ledger_entries.amount (kliper)
boleh_tarik    = status ≠ diblokir ∧ rekening terisi ∧ rekening tidak diubah < 24 jam
                 ∧ tidak ada penarikan diajukan/diproses ∧ min_withdrawal ≤ nominal ≤ saldo_tersedia
```

Saldo boleh negatif hanya akibat `pembatalan` setelah penarikan; selama negatif, kliper tidak dapat menarik dan kredit berikutnya menutup kekurangan lebih dahulu.

---

## 9. Kebutuhan Non-Fungsional

| Aspek            | Kebutuhan |
| ---------------- | --------- |
| Bahasa           | UI Bahasa Indonesia ("kliper" di UI); kode, tabel, komentar bahasa Inggris |
| Zona waktu       | `timestamptz` UTC; tampilan default WITA (`Asia/Makassar`), dapat diubah ke WIB |
| Format           | `Rp 1.500.000`; `17 Sep 2026`; pemisah ribuan titik |
| Responsif        | Portal kliper **mobile-first** (mayoritas kliper memakai HP): katalog, kirim klip, dan saldo nyaman di layar 375px; antrean verifikasi tim nyaman di HP |
| Keamanan         | RLS di semua tabel dan view portal; peran hanya dari `app_metadata`; service role hanya di server; Zod di setiap action; invarian uang ditegakkan database dengan penguncian baris; rate limit `/daftar` dan `/r/[slug]`; bucket privat |
| Privasi (UU PDP) | Data kliper minimum (tanpa KTP); persetujuan syarat dan privasi dicatat berversi; rekening hanya `owner` lengkap; hash IP bersalt; penghapusan akun atas permintaan; tidak menyimpan data pendaftar |
| Skala            | Target Tahap A: 2.000 kliper, 50 kampanye aktif, 500 kiriman/hari tanpa penurunan kinerja; daftar dan antrean dengan paginasi server |
| Keandalan        | Migrasi SQL berversi; buku besar append-only sebagai sumber kebenaran saldo; ekspor CSV |
| Kinerja          | Muat halaman < 2 detik; situs publik statis (daftar kampanye lewat ISR, FR-M15-09), LCP < 2,5 detik di 4G |
| Aksesibilitas    | Kontras cukup, label setiap input, dapat dioperasikan keyboard |
| SEO              | Hanya situs publik M15 dan `/daftar` yang diindeks |

---

## 10. Arsitektur dan Tech Stack

### 10.1 Stack

| Lapisan         | Pilihan |
| --------------- | ------- |
| Framework       | Next.js (App Router) + TypeScript strict |
| UI              | Tailwind CSS + shadcn/ui, lucide-react |
| Form & validasi | React Hook Form + Zod |
| Tabel           | TanStack Table |
| Grafik          | Recharts |
| Tanggal         | date-fns + date-fns-tz |
| Backend & DB    | Supabase: PostgreSQL, Auth (konfirmasi email aktif untuk `/daftar`), Storage, RLS |
| Akses data      | `@supabase/ssr`; mutasi lewat Server Actions; fungsi `security definer` untuk operasi uang |
| Migrasi         | Supabase CLI + tipe TypeScript hasil generate |
| Pengujian       | Vitest (`lib/calculations`, util); Playwright (alur kritis); `scripts/rls-check.sql`, `scripts/guards-check.sql` |
| Hosting         | VPS dengan Docker atau Vercel berbayar; Supabase region Singapura |

### 10.2 Struktur folder (tambahan v4.0 ditandai)

```
app/
  (auth)/{login,lupa-sandi,atur-sandi,daftar}/   # daftar: v4.0
  (app)/dashboard/ clients/ creators/ campaigns/[id]/ settings/ activity/
  (app)/verifikasi/                               # v4.0 antrean klip & views
  (app)/penarikan/                                # v4.0 hanya owner
  (portal)/portal/{mulai,kampanye,penugasan,klip,saldo,profil}/  # v4.0 diperluas
  (client)/klien/
  (marketing)/{kreator,privasi,syarat}/
  r/[slug]/route.ts
lib/
  calculations/{payout,campaign-metrics,clip-earning,balance,fraud-flags}.ts (+ .test.ts)
  validation/  auth/  format/  referral/
supabase/
  migrations/  templates/{invite,recovery,confirmation}.html
```

### 10.3 Variabel lingkungan

Tetap: `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `CLICK_IP_HASH_SALT`, `DEFAULT_TIMEZONE`, `REMINDER_API_TOKEN`, `NEXT_PUBLIC_CONTACT_WA`. Konstanta v4.0 (`CREATOR_TERMS_VERSION`, ambang lencana lokal, ambang penanda kecurangan) disimpan di kode (`lib/constants/`), bukan env, agar teruji. Minimum penarikan disimpan di tabel `platform_settings` agar `owner` dapat mengubahnya tanpa rilis.

---

## 11. Rencana Implementasi Bertahap

### 11.1 Fase yang sudah selesai

| Fase | Versi | Cakupan | Status |
| ---- | ----- | ------- | ------ |
| 0 | MVP | Fondasi, login, layout, seed owner | Selesai |
| 1 | MVP | Pengguna, klien, kreator, rekening, log dasar | Selesai |
| 2 | MVP | Kampanye, penugasan, `/r/[slug]` | Selesai |
| 3 | MVP | Konten dan review | Selesai |
| 4 | MVP | Metrik dan dasbor | Selesai |
| 5 | MVP | Keuangan (`payouts`) | Selesai |
| 6 | MVP | Laporan dan waktu operasional | Selesai |
| 7 | MVP | Pengerasan, RLS, demo, deploy | Selesai |
| 8 | v1.1 | Tautan laporan klien, pengingat Telegram | Selesai |
| 9–10 | v2.0 | Portal kreator: akses, brief, kiriman, honor | Selesai |
| 11 | v3.0 | Portal klien: akses dan pantau | Selesai |
| 12 | v3.0 | Laporan dan usulan pendaftar klien (**tanpa** persetujuan konten, lihat FR-M14-04) | Belum; dijadwalkan setelah Tahap A |
| 13 | v3.1 | Situs publik | Selesai |
| 14 | v3.2 | Konfirmasi penugasan oleh kreator | Selesai |

Rincian kriteria penerimaan fase lama ada di riwayat git (`PRD.md` v0.7).

### 11.2 Tahap A — Kliper Mandiri (v4.0)

Kerjakan berurutan. Setiap fase wajib: migrasi baru (tidak mengedit migrasi lama), regenerasi `types/database.ts`, tabel dan view baru masuk `scripts/rls-check.sql` (termasuk persona `creator` mandiri dan `anon`), trigger baru masuk `scripts/guards-check.sql`, lalu `npm run lint && npm run typecheck && npm run test && npm run build`.

### Fase 15 — v4.0: Pendaftaran Kliper Mandiri

**Cakupan:** M16 (FR-M16-01 s.d. FR-M16-09), FR-M1-01, FR-M1-03, FR-M3-01 s.d. FR-M3-05, FR-M3-09. Perbaikan trigger `handle_new_user` dan semua jalur undangan ke `app_metadata`; kolom baru `creators`; normalisasi dan keunikan WhatsApp; rate limit di memori; halaman `/daftar`, `/portal/mulai`, profil portal (akun sosial, kode verifikasi, pengajuan lencana, permintaan hapus akun); templat email konfirmasi; antrean lencana lokal dan pemblokiran di aplikasi tim; perubahan M15 (ajakan daftar, `/kreator`, robots, sitemap).
**Kriteria penerimaan:**

- [x] Pengunjung dapat mendaftar di `/daftar`, menerima email konfirmasi, lalu masuk ke `/portal/mulai`; sebelum konfirmasi tidak dapat masuk.
- [x] `signUp` dengan `options.data.role = 'owner'` (atau `manager`/`client`) tetap menghasilkan profil `creator` — diuji di `scripts/rls-check.sql` atau `guards-check.sql` dengan menyisipkan `auth.users` bermetadata palsu.
- [x] Undangan internal, kreator, dan klien yang sudah ada tetap menghasilkan peran yang benar.
- [x] Email sekali pakai, WhatsApp ganda, dan pendaftaran berulang melewati batas per IP ditolak dengan pesan yang jelas.
- [x] Kliper baru berstatus `prospek`, menjadi `aktif` setelah menambah akun sosial pertama, dan memiliki `verification_code` unik.
- [x] Kliper hanya dapat membaca dan menulis akun sosial serta bukti audiensnya sendiri.
- [x] Tim dapat memberi/mencabut lencana lokal dan memblokir/membuka blokir dengan alasan; semuanya tercatat di log.
- [x] Situs publik tetap statis tanpa kueri; `/daftar` masuk sitemap; area ber-sesi tetap `noindex`.

_Catatan implementasi:_ kliper berstatus `diblokir` masih dikeluarkan dari portal (seperti v3.2) karena `current_creator_id()` menjadi dasar seluruh kebijakan tulis portal; akses baca saldo bagi kliper yang diblokir (FR-M3-09) dibuka di Fase 18. Provinsi pendaftaran memakai daftar provinsi Kalimantan yang sudah ada.

### Fase 16 — v4.0: Kampanye Terbuka dan Katalog

**Cakupan:** M17 (FR-M17-01 s.d. FR-M17-07), FR-M4-02, FR-M5-01, FR-M13-03, FR-M13-10. Enum `campaign_access`, `payout_model`; kolom kampanye baru dengan backfill `paket`/`undangan` untuk kampanye lama; formulir kampanye tim; trigger aktivasi; view `creator_portal_catalog`; kebijakan gabung pada `campaign_creators` (insert oleh kliper hanya untuk dirinya, trigger mengisi status, konfirmasi, kode, slug, dan mengunci kolom honor); aturan storage materi untuk kampanye terbuka; halaman katalog, detail, Gabung, Mundur, dan Kampanye Saya di portal.
**Kriteria penerimaan:**

- [x] Kampanye lama tetap berjalan sebagai `paket` + `undangan` tanpa perubahan perilaku.
- [x] Kampanye `per_views` tidak dapat diaktifkan tanpa syarat FR-M17-02 (action dan trigger).
- [x] Katalog hanya menampilkan kampanye `aktif` + `terbuka`, tanpa `package_price`, target internal, atau nominal anggaran (diuji di `rls-check.sql`).
- [x] Gabung ditolak untuk kliper `prospek`/`diblokir`, syarat versi lama, kampanye lewat tenggat, anggaran habis, atau `local_only` tanpa lencana — di action dan di database.
- [x] Kliper tidak dapat menyisipkan penugasan untuk kliper lain atau mengisi kolom honor/kode/slug sendiri.
- [x] Kliper dapat mengunduh materi kampanye terbuka yang aktif, tetapi tidak materi kampanye `undangan` yang tidak diikutinya.

_Catatan implementasi:_ honor terpakai dibaca dari fungsi `campaign_creator_cost()` yang mengembalikan 0 sampai buku besar dibuat di Fase 17 (fungsi itu yang diganti; aturan "anggaran habis", batas penurunan anggaran, dan persentase sisa di katalog sudah memakainya). Pembatalan otomatis klip yang menunggu verifikasi saat kliper mundur (FR-M17-05) dikerjakan di Fase 17 bersama siklus klip; di Fase 16 mundur hanya ditolak bila ada konten `disetujui`. Kliper yang sudah mundur tidak dapat bergabung lagi ke kampanye yang sama. Versi syarat terbaru di database ada di `current_creator_terms_version()` dan diuji sama dengan `CREATOR_TERMS_VERSION`; persetujuan ulang lewat `accept_creator_terms()`. Formulir kirim klip untuk penugasan `per_views` menyusul di Fase 17.

### Fase 17 — v4.0: Kiriman Klip dan Verifikasi Views

**Cakupan:** M18 (FR-M18-01 s.d. FR-M18-08), FR-M6-03, FR-M6-04, FR-M10-01, FR-M10-03. Kolom baru `contents` dan `metric_submissions`; normalisasi URL + unik global; trigger aturan kiriman (periode, batas klip, platform, anggaran); formulir kirim klip dan pembaruan views di portal; halaman `(app)/verifikasi` dengan checklist, penanda risiko, dan keputusan; `lib/calculations/clip-earning.ts` dan `fraud-flags.ts` dengan unit test. **Pengkreditan saldo di fase ini memakai `creator_ledger_entries` minimal** (tabel + fungsi kredit ber-kunci); tampilan saldo dan penarikan menyusul di Fase 18.
**Kriteria penerimaan:**

- [x] Kliper dapat mengirim klip hanya untuk penugasan `bergabung` di kampanye `per_views` aktif; kiriman membuat konten + usulan metrik dalam satu transaksi.
- [x] URL yang sama (setelah normalisasi: huruf kecil, tanpa parameter pelacak, tanpa garis miring akhir) tidak dapat dikirim dua kali, termasuk oleh kliper lain.
- [x] Waktu tayang di luar `joined_at`–`end_date`, platform tidak diizinkan, dan kelebihan `max_clips_per_creator` ditolak di action dan trigger.
- [x] Persetujuan membuat snapshot resmi dan satu entri `honor_klip` sesuai 8.6; pembaruan views hanya mengkreditkan selisih.
- [x] Unit test 8.6 mencakup: di bawah `min_views_to_earn`, batas per klip, batas per kliper, sisa anggaran, views menurun, pembulatan, dan kredit nol.
- [x] Dua persetujuan bersamaan yang total kreditnya melebihi anggaran: satu berhasil, satu ditolak oleh database (diuji di `guards-check.sql`).
- [x] Revisi dan penolakan wajib beralasan; kliper melihat alasannya di portal.
- [x] Klip `dihapus` sebelum `min_live_days` menghasilkan entri `pembatalan`.

_Catatan implementasi:_ selama menunggu verifikasi, URL dan waktu tayang klip disimpan di `contents.proposed_posted_*`; persetujuan memindahkannya ke `posted_*` (status `tayang`), sehingga constraint FR-M6-04 tetap utuh dan metrik/laporan hanya menghitung klip disetujui (8.4). Kiriman lewat `submit_clip()` (_security invoker_: RLS dan trigger tetap berlaku) dengan trigger ditunda `contents_clip_needs_submission`; keputusan tim lewat `verify_clip()`, `verify_views_update()`, dan `cancel_clip()` (_security definer_, mengunci baris kampanye). Rumus 8.6 hanya di `lib/calculations/clip-earning.ts`; database menegakkan invarian (anggaran, batas per kliper, dan kredit tidak melebihi hasil views terverifikasi yang dibatasi per klip) — action menghitung ulang sekali bila ditolak `BUDGET_EXCEEDED`. "Dua persetujuan bersamaan" diuji di `guards-check.sql` P17-20 sebagai kredit yang dihitung sebelum persetujuan pertama tercatat. URL unik global kecuali klip `ditolak` (agar pemilik asli tetap bisa mengirim), tetapi kliper yang sama tidak dapat mengirim ulang URL yang pernah ditolak untuknya. Pembatalan karena kecurangan (FR-M18-07) hanya `owner`; klip menjadi `ditolak` dan tidak lagi tayang. Mundur (FR-M17-05) kini otomatis menolak klip yang masih menunggu dengan alasan `lainnya`. Penanda "diunggah jauh sebelum bergabung" diterapkan sebagai "tayang < 30 menit setelah bergabung" karena waktu tayang sebelum `joined_at` sudah ditolak. Kirim ulang setelah revisi memakai klaim views semula. Kliper melihat honor per klip lewat `creator_portal_contents.earned_amount`; `creator_portal_ledger` dan halaman Saldo di Fase 18. Kartu dasbor penarikan dan isi pengingat Telegram (FR-M10-05) juga di Fase 18. Fixture kampanye fase lama di `guards-check.sql` kini eksplisit `paket` + `undangan`.

### Fase 18 — v4.0: Saldo, Rekening, dan Penarikan

**Cakupan:** M19 (FR-M19-01 s.d. FR-M19-08), FR-M3-06, FR-M3-08, FR-M8-06, FR-M11-01, FR-M12-01. Tabel `withdrawals`; fungsi `request_withdrawal()`, `process_withdrawal()`, `adjust_balance()`; rekening oleh kliper; view `creator_portal_ledger`, `_balance`, `_withdrawals`, `_bank_account`; halaman Saldo di portal; halaman `(app)/penarikan` untuk `owner` dengan ekspor CSV; kartu dasbor dan isi pengingat Telegram; tab Keuangan kampanye `per_views`; `lib/calculations/balance.ts`.
**Kriteria penerimaan:**

- [x] Saldo portal = Σ buku besar; entri tidak dapat diubah atau dihapus oleh peran mana pun.
- [x] Penarikan di bawah minimum, melebihi saldo, saat ada penarikan berjalan, tanpa rekening, < 24 jam setelah ganti rekening, atau oleh kliper `diblokir` ditolak.
- [x] Dua pengajuan bersamaan tidak dapat menarik melebihi saldo (diuji di `guards-check.sql`).
- [x] Hanya `owner` yang membaca `withdrawals` dan nomor rekening lengkap; `manager` dan kliper melihat 4 digit terakhir.
- [x] Penarikan `ditolak` otomatis mengembalikan saldo; `dibayar` wajib tanggal dan bukti transfer.
- [x] Tab Keuangan kampanye `per_views` menampilkan anggaran, terpakai, sisa, dan margin sesuai 8.4.
- [x] Uji E2E alur penuh: daftar → konfirmasi → tambah akun sosial → gabung → kirim klip → disetujui → saldo bertambah → isi rekening → tarik → `owner` menandai dibayar.

_Catatan implementasi:_ minimum penarikan disimpan di `platform_settings` (satu baris; RLS: tim membaca, `owner` mengubah; kliper membaca lewat `current_min_withdrawal()`), bukan konstanta kode, atas keputusan owner. Rekening kliper disimpan lewat `save_creator_bank_account()` sehingga nomor lengkap tidak pernah terbaca dari portal; trigger `track_bank_account_change` menandai nama pemilik yang berbeda dari nama lengkap dan mencatat `changed_at` (penahanan 24 jam hanya untuk perubahan, bukan pengisian pertama). Kliper `diblokir` masuk portal hanya untuk halaman Saldo lewat `current_creator_account_id()` dan `requireCreatorAccount()`; semua jalur tulis tetap memakai `current_creator_id()`. Penghapusan akun (FR-M16-09) kini ditolak database bila saldo ≠ 0 atau ada penarikan berjalan. Akses `owner` ke nomor rekening lengkap di halaman Penarikan dan ekspor CSV dicatat di log (FR-M11-01). Awal periode klip dibulatkan ke menit bergabung (perbaikan Fase 17: waktu tayang diisi dengan presisi menit). Biaya transfer ditanggung kliper (keputusan owner): `withdrawals.transfer_fee` diisi `owner` saat menandai dibayar (< nominal), kliper melihat biaya dan jumlah diterima, dan ekspor CSV memuat keduanya.

---

## 12. Peta Jalan (Indikatif)

| Versi | Fitur |
| ----- | ----- |
| 1.1–3.2 | Tautan laporan, pengingat Telegram, portal kreator, portal klien, situs publik, konfirmasi penugasan — **selesai** (kecuali Fase 12) |
| **4.0** | **Tahap A — kliper mandiri** (Fase 15–18) — **selesai** |
| 4.0.x | Fase 12 yang direvisi: laporan dan usulan pendaftar dari portal klien |
| **4.1** | **Tahap B — klien mandiri** (garis besar, PRD dirinci sebelum dikerjakan): pendaftaran klien (brand, UMKM, instansi, personal) dengan verifikasi tim; dompet klien dengan **deposit manual** (transfer + bukti, dikonfirmasi `owner`); klien membuat kampanye `per_views` sendiri (anggaran, tarif, brief, materi) yang ditinjau tim sebelum tayang di katalog; biaya platform (acuan 5%) dan add-on (khusus Kliper Lokal); anggaran terkunci saat kampanye aktif dan sisa dikembalikan ke dompet saat selesai; klien menandai klip bermasalah; invoice/kuitansi otomatis |
| 4.2 | Penarikan terjadwal (batch) dan pengingat penarikan; papan peringkat di portal (nama panggung) |
| 5.0 | Integrasi API resmi platform media sosial untuk verifikasi views otomatis |
| 6.0 | Payment gateway untuk deposit klien dan disbursement honor |

---

## 13. Asumsi dan Pertanyaan Terbuka

### 13.1 Asumsi

1. Klien Tahap A adalah siapa pun yang ingin menjangkau audiens Kalimantan lewat klip pendek (brand bisnis, UMKM, instansi, maupun personal) dan membeli paket lewat tim.
2. Materi kampanye berupa video panjang milik klien yang boleh dipotong dan diposting ulang oleh kliper (hak pakai diatur di Syarat Kliper dan kontrak klien).
3. Views diverifikasi manual oleh tim dari halaman klip dan tangkapan layar; tim sanggup memverifikasi ≤ 24 jam pada volume Tahap A.
4. Kliper dibayar ke rekening bank atau e-wallet atas nama sendiri, ditransfer manual.
5. Tim internal 2–4 orang; `owner` memproses penarikan setiap hari kerja.

### 13.2 Pertanyaan yang harus dijawab

| No  | Pertanyaan | Dijawab lewat |
| --- | ---------- | ------------- |
| 1   | Nama produk dan domain | Founder |
| 2   | Tarif per 1.000 views yang wajar untuk pasar Kalimantan, dan apakah kampanye "khusus lokal" dibayar lebih tinggi | Founder + uji coba |
| 3   | ~~Nominal minimum penarikan~~ — **terjawab 24 Sep 2026:** Rp 100.000 (setara 10.000 views pada tarif Rp 10.000), dapat diubah `owner` dari aplikasi. Biaya transfer antarbank/e-wallet **ditanggung kliper** (diputuskan 24 Sep 2026): dipotong dari nominal yang ditransfer | Founder |
| 4   | Kewajiban PPh 21/23 atas honor kliper di model terbuka (kliper tanpa NPWP, pemotongan saat penarikan?) — **diputuskan 24 Sep 2026:** belum dihitung selama uji coba rilis; PPh mulai diterapkan setelah platform diterima baik dan legalitas usaha berdiri (PRD diperbarui saat itu). Bukan lagi penghalang rilis | Founder, lalu konsultan pajak |
| 5   | ~~Isi Syarat Kliper: hak pakai materi, larangan bot/engagement palsu, sanksi, masa tayang minimum, penanganan saldo saat diblokir~~ — **terjawab 23 Sep 2026:** isi `/syarat` (Syarat Kliper versi `2026-10`) disetujui owner | Founder + konsultasi hukum |
| 6   | ~~Pembaruan Kebijakan Privasi untuk pendaftaran mandiri dan penyimpanan rekening oleh kliper~~ — **terjawab 23 Sep 2026:** isi `/privasi` disetujui owner | Founder + konsultasi hukum |
| 7   | Ambang persentase audiens Kalimantan untuk lencana lokal (usulan 50%) | Pilot |
| 8   | Default `max_clips_per_creator`, `claim_grace_days`, dan `min_live_days` untuk kampanye `per_views` | Pilot |
| 9   | Apakah nama klien boleh tampil di katalog kliper, atau perlu opsi nama samaran per kampanye — **sebagian terjawab 25 Sep 2026:** nama klien tampil di katalog portal dan katalog publik (FR-M15-09), disetujui founder. Opsi nama samaran per kampanye masih terbuka | Klien pilot |
| 10  | Kapasitas verifikasi tim: pada volume berapa perlu verifikator paruh waktu atau pengecekan sampel | Data M12 |
| 11  | Apakah klien menerima klip yang tidak ditinjau sebelum tayang, atau perlu kampanye "review draf" di Tahap B | Wawancara klien |
| 12  | Hosting: Vercel berbayar atau VPS sendiri | Founder |
| 13  | Model Tahap B: deposit di muka vs invoice, persentase biaya platform, dan kebijakan pengembalian sisa anggaran | Founder |
| 14  | Apakah perlu captcha (mis. Cloudflare Turnstile) bila rate limit tidak cukup menahan pendaftaran bot — memerlukan pengecualian aturan pihak ketiga | Data Fase 15 |

---

## 14. Riwayat Perubahan

| Versi | Tanggal     | Perubahan |
| ----- | ----------- | --------- |
| 0.1   | 17 Sep 2026 | Draf awal berdasarkan diskusi validasi ide |
| 0.2   | 19 Sep 2026 | v1.1: tautan laporan klien, pengingat Telegram via n8n, Fase 8 |
| 0.3   | 20 Sep 2026 | v2.0: portal kreator (M13), peran `creator`, view `creator_portal_*`, `metric_submissions`, Fase 9–10 |
| 0.4   | 20 Sep 2026 | Fase 10: laporan tayang dari kreator sebagai usulan |
| 0.5   | 20 Sep 2026 | v3.0: portal klien (M14), peran `client`, Fase 11–12 |
| 0.6   | 22 Sep 2026 | v3.1: situs publik (M15), Fase 13 |
| 0.7   | 23 Sep 2026 | v3.2: konfirmasi penugasan oleh kreator (FR-M13-10), Fase 14 |
| 1.0 | 23 Sep 2026 | **v4.0 — perubahan arah ke marketplace kliper terbuka (acuan ayoklip.com).** Pendaftaran kliper mandiri (M16), kampanye terbuka dan katalog (M17), kiriman klip dengan verifikasi pasca-tayang (M18), saldo dan penarikan manual (M19). Honor kampanye baru = tarif per 1.000 views terverifikasi dengan batas per klip/kliper/anggaran (8.6); skema honor dasar + bonus dipertahankan hanya untuk kampanye `paket` lama. Peran hanya dari `app_metadata`. Lencana Kliper Lokal menggantikan verifikasi wajib. Persetujuan konten oleh klien (FR-M14-04) ditunda. Klien mandiri dijadwalkan sebagai Tahap B (v4.1). Kriteria fase 0–14 diringkas menjadi tabel |
| 1.1 | 24 Sep 2026 | Tahap A selesai (Fase 17–18). Minimum penarikan Rp 100.000 dan dapat diubah `owner` (`platform_settings`); PPh atas honor kliper ditunda sampai uji coba rilis berhasil dan legalitas usaha berdiri; biaya transfer ditanggung kliper (13.2 no. 3–4) |
| 1.2 | 24 Sep 2026 | FR-M17-03: katalog portal menampilkan anggaran kliper dalam Rupiah (total, terpakai, sisa) di samping persentase, disetujui founder; harga paket tetap tersembunyi. FR-M10-01: kartu anggaran menipis di dasbor menampilkan nominal terpakai dan sisa |
| 1.3 | 24 Sep 2026 | Tujuan kampanye (`pendaftar`/`awareness`/`event`) hanya untuk kampanye `paket` lama, disetujui founder: kampanye `per_views` tidak memilikinya, `landing_url` opsional, dan badge/filter tujuan dihapus dari katalog portal (FR-M4-01, FR-M17-02, FR-M17-03) |
| 1.4 | 24 Sep 2026 | Fokus klien diperluas dari instansi regional (kampus swasta, bank daerah, Pemda) menjadi umum: brand bisnis, UMKM, instansi, dan personal. Jenis klien (FR-M2-01) diganti menjadi `brand`/`umkm`/`instansi`/`personal`/`lainnya` lewat migrasi yang memetakan nilai lama |
| 1.5 | 24 Sep 2026 | v4.2: batas usia kliper ≥ 18 tahun dihapus, disetujui founder. `/daftar` tidak lagi meminta tanggal lahir dan pernyataan usia; tanggal lahir wajib dilengkapi kliper sebelum penarikan pertama (FR-M3-02, FR-M15-03, FR-M16-01, FR-M19-05) |
| **1.6** | 25 Sep 2026 | Katalog kampanye publik, disetujui founder: `/kampanye` dan bagian di landing menampilkan kampanye terbuka (nama klien, tarif, batas, platform, tenggat, sisa anggaran dalam persen dan Rupiah) tanpa brief dan materi (FR-M15-09). View baru `public_campaign_catalog` dapat dibaca `anon`; aturan "situs publik tanpa kueri" dilonggarkan hanya untuk view ini (peran `anonim`, M15, 7.3, 13.2 no. 9) |
| **1.7** | 26 Sep 2026 | Kartu kampanye publik (FR-M15-09): **gambar sampul** kampanye, **minimum views klaim**, dan platform tampil sebagai ikon logo. Kolom baru `campaigns.cover_image_path`; sampul diunggah tim di tab Brief & materi ke bucket publik `campaign-covers` (PNG/JPG/WebP, maks. 2 MB), terpisah dari materi yang tetap privat. `public_campaign_catalog` menambah `min_views_to_earn` dan `cover_image_path` |
