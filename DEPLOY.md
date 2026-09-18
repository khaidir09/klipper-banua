# Deploy produksi: VPS + Docker + Supabase Cloud

Panduan rilis pilot Klipper Banua. Aplikasi Next.js berjalan di VPS dalam Docker di belakang
**Caddy** (HTTPS otomatis dari Let's Encrypt). Database, Auth, dan Storage memakai **Supabase
Cloud** region Singapura.

Contoh domain di panduan ini: `app.contoh.id`. Ganti dengan domain Anda.

```
Pengguna ──HTTPS──▶ Caddy (VPS :443) ──▶ app (Next.js :3000) ──▶ Supabase Cloud (Singapura)
```

## 1. Yang perlu disiapkan

| Kebutuhan      | Catatan                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------- |
| VPS            | Ubuntu 22.04/24.04, minimal 2 vCPU / 2 GB RAM (build Next.js butuh ±2 GB; tambah swap bila 1 GB)   |
| Domain         | Akses ke pengaturan DNS untuk membuat record `A` ke IP VPS                                         |
| Supabase       | Akun supabase.com; paket Pro disarankan untuk backup harian dan tanpa jeda proyek                  |
| SMTP           | Layanan email transaksional (mis. Brevo, Mailgun, Amazon SES) dengan domain pengirim terverifikasi |
| Komputer lokal | Repositori ini, Node.js 22+, `npm install` sudah dijalankan                                        |

> Mailer bawaan Supabase hanya mengizinkan beberapa email per jam dan tidak untuk produksi.
> Tanpa SMTP sendiri, undangan anggota tim dan email lupa sandi bisa tidak terkirim.

## 2. Proyek Supabase

1. Buat proyek baru di dashboard Supabase, region **Southeast Asia (Singapore)**. Simpan kata
   sandi database di tempat aman.
2. Dari **Project Settings → API**, catat: `Project URL`, `anon public key`, `service_role key`.
3. Terapkan semua migrasi dari komputer lokal:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npm run db:push
   ```

   Migrasi membuat semua tabel, kebijakan RLS, trigger aturan bisnis, dan bucket Storage privat.

4. **Authentication → Sign In / Providers**
   - Matikan **Allow new users to sign up** (akun hanya lewat undangan owner).
   - Biarkan provider **Email** aktif (dibutuhkan untuk login dengan email dan kata sandi).
5. **Authentication → URL Configuration**
   - Site URL: `https://app.contoh.id`
   - Redirect URLs: `https://app.contoh.id/auth/callback`
6. **Authentication → Email Templates**. Salin isi berkas dari repositori:
   - _Invite user_ ← `supabase/templates/invite.html`
   - _Reset password_ ← `supabase/templates/recovery.html`

   Tanpa langkah ini, tautan undangan tidak membuat sesi di server dan pengguna gagal masuk.

7. **Authentication → SMTP Settings**: aktifkan _Custom SMTP_ dengan kredensial layanan email
   Anda. Pengirim, misalnya `Klipper Banua <no-reply@contoh.id>`.

## 3. Akun owner pertama

Jalankan dari komputer lokal. Variabel yang diberikan langsung di baris perintah menimpa
`.env.local`. Kosongkan `SEED_MANAGER_EMAIL` agar akun manager uji **tidak** ikut dibuat di
produksi.

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service_role key>" \
SEED_OWNER_EMAIL="owner@contoh.id" \
SEED_OWNER_PASSWORD="<kata sandi kuat>" \
SEED_OWNER_NAME="Nama Owner" \
SEED_MANAGER_EMAIL="" \
npm run seed:owner
```

Anggota tim lain diundang dari aplikasi (**Pengaturan → Pengguna**). Jangan menjalankan
`npm run seed:demo` ke produksi; skrip itu menolak URL non-lokal kecuali `ALLOW_DEMO_SEED=1`.

## 4. Server (VPS)

1. Pasang Docker Engine dan plugin Compose (lihat docs.docker.com/engine/install/ubuntu).
2. Arahkan DNS: record `A` untuk `app.contoh.id` ke IP publik VPS. Buka port 80 dan 443
   (TCP) serta 443 (UDP) di firewall. Tunggu sampai `ping app.contoh.id` mengarah ke VPS.
3. Salin kode ke server, misalnya `git clone <repo> /opt/klipper-banua && cd /opt/klipper-banua`.
4. Buat `/opt/klipper-banua/.env.production` (izin `chmod 600`):

   ```bash
   NEXT_PUBLIC_APP_NAME="Klipper Banua"
   NEXT_PUBLIC_APP_URL="https://app.contoh.id"
   NEXT_PUBLIC_SUPABASE_URL="https://<project-ref>.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon public key>"
   SUPABASE_SERVICE_ROLE_KEY="<service_role key>"
   CLICK_IP_HASH_SALT="<hasil: openssl rand -hex 32>"
   DEFAULT_TIMEZONE="Asia/Makassar"
   APP_DOMAIN="app.contoh.id"
   ```

   - `NEXT_PUBLIC_*` ditanam ke bundle browser saat build. Jika diubah, build ulang.
   - `SUPABASE_SERVICE_ROLE_KEY` dan `CLICK_IP_HASH_SALT` hanya dibaca server saat runtime dan
     tidak masuk ke image.
   - **Jangan ganti `CLICK_IP_HASH_SALT`** setelah kampanye berjalan; hash IP klik lama tidak
     akan cocok lagi.

5. Build dan jalankan:

   ```bash
   docker compose --env-file .env.production up -d --build
   docker compose ps          # app harus "healthy", caddy "running"
   docker compose logs -f caddy   # tunggu "certificate obtained successfully"
   ```

## 5. Verifikasi setelah rilis

- [ ] `https://app.contoh.id/healthz` membalas `{"status":"ok"}` dengan gembok HTTPS valid.
- [ ] `http://app.contoh.id` dialihkan otomatis ke HTTPS.
- [ ] Login owner berhasil; dasbor tampil dengan zona waktu WITA.
- [ ] Undang satu anggota tim: email diterima, tautan membuka halaman atur sandi, lalu login.
- [ ] Buat kampanye uji, tugaskan kreator, aktifkan, lalu buka `https://app.contoh.id/r/<slug>`:
      diarahkan ke URL tujuan kampanye dan klik tercatat di tab Metrik.
- [ ] Header keamanan ada: `curl -sI https://app.contoh.id/login` menampilkan
      `strict-transport-security`, `x-frame-options: DENY`, `x-content-type-options: nosniff`.
- [ ] Hapus atau batalkan data uji sebelum dipakai klien sungguhan.

## 6. Pembaruan versi

```bash
cd /opt/klipper-banua
git pull
npm run db:push        # dari komputer lokal yang sudah `supabase link`, jika ada migrasi baru
docker compose --env-file .env.production up -d --build
```

Terapkan migrasi **sebelum** menjalankan kode baru. Migrasi selalu berupa berkas baru; migrasi
lama tidak pernah diedit.

## 7. Cadangan dan pemulihan

- **Database:** paket Pro Supabase menyimpan backup harian (lihat _Database → Backups_). Sebagai
  tambahan, simpan dump mingguan di luar Supabase:

  ```bash
  npx supabase db dump --linked -f backup-$(date +%F).sql
  npx supabase db dump --linked --data-only -f data-$(date +%F).sql
  ```

- **Storage:** bukti audiens, materi, draf, dan bukti keuangan ada di bucket Supabase. Unduh
  berkala bila dibutuhkan untuk arsip.
- **Operasional:** ekspor CSV di tab Laporan setiap kampanye selesai (PRD Bagian 9, cadangan
  manual).
- **VPS:** tidak menyimpan data selain sertifikat Caddy (volume `caddy_data`). Server baru cukup
  diulang dari langkah 4.

## 8. Catatan operasional

- **Rate limit** `/r/[slug]`: 30 permintaan per menit per pengunjung, di memori proses. Hitungan
  kembali ke nol saat container restart. Cukup untuk satu VPS; jika kelak memakai lebih dari satu
  instance, pindahkan ke penyimpanan bersama.
- **IP pengunjung** dibaca dari `X-Forwarded-For` yang ditulis Caddy. Jangan memasang proxy lain
  di depan Caddy tanpa mengatur `trusted_proxies`.
- **Log** container dibatasi 5 × 10 MB per layanan (`docker compose logs app`).
- **Hapus data kreator** atas permintaan (UU PDP): owner membuka halaman kreator lalu memilih
  **Hapus** (belum pernah ditugaskan) atau **Anonimkan data** (sudah punya riwayat kampanye).
