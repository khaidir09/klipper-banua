# Klipper Banua

Aplikasi web internal untuk mengelola kampanye promosi instansi regional di Kalimantan
bersama kreator lokal. Kebutuhan produk ada di [`PRD.md`](./PRD.md), aturan kerja di
[`CLAUDE.md`](./CLAUDE.md).

Status: **Fase 7 — Pengerasan dan Rilis Pilot** selesai di sisi kode: log aktivitas untuk owner
(`/activity`), anonimisasi data kreator, rate limit `/r/[slug]`, data demo, matriks uji RLS
seluruh tabel, halaman error/404, header keamanan, image Docker + Caddy, dan uji E2E Playwright.
Deploy ke domain produksi mengikuti [`DEPLOY.md`](./DEPLOY.md). Fase 0–6: autentikasi, pengguna,
klien, kreator, kampanye, penugasan, tautan pelacakan, konten dan review, metrik dan dasbor,
keuangan, laporan dan waktu operasional.

## Prasyarat

- Node.js 22+
- Docker Desktop (untuk Supabase lokal)

## Menjalankan di lokal

```bash
npm install
npm run db:start          # menyalakan Supabase lokal, mencetak URL dan kunci
cp .env.example .env.local # lalu isi nilainya dari keluaran db:start
npm run seed:owner        # membuat akun owner pertama
npm run seed:demo         # opsional: 1 kampus, 8 kreator, 1 kampanye draft
npm run dev               # http://localhost:3000
```

Nilai yang dipakai di `.env.local`:

| Variabel                                       | Sumber                                               |
| ---------------------------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                     | `API URL` dari `npm run db:start`                    |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                | `anon key`                                           |
| `SUPABASE_SERVICE_ROLE_KEY`                    | `service_role key` (hanya dipakai di server)         |
| `CLICK_IP_HASH_SALT`                           | string acak bebas, mis. hasil `openssl rand -hex 32` |
| `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`     | akun owner yang akan dibuat                          |
| `SEED_MANAGER_EMAIL` / `SEED_MANAGER_PASSWORD` | (opsional) akun manager untuk menguji RLS            |

Email lokal (undangan, lupa kata sandi) dapat dibaca di Mailpit: <http://127.0.0.1:55324>.

## Templat email Supabase

Tautan undangan dan pemulihan harus mengarah ke `/auth/callback?token_hash=…&type=…` agar
sesi dibuat di sisi server (cookie), bukan di hash URL. Templat lokal ada di
`supabase/templates/` dan diaktifkan lewat `supabase/config.toml`. **Sebelum rilis**, salin isi
templat yang sama ke _Authentication → Email Templates_ di dashboard proyek Supabase hosted.

## Uji RLS dan aturan bisnis

`npm run db:rls-check` menjalankan `scripts/rls-check.sql`: matriks SELECT/INSERT/UPDATE/DELETE
untuk **setiap tabel dan bucket Storage** sebagai `owner`, `manager`, anggota nonaktif, dan `anon`,
dibandingkan dengan hasil yang diharapkan (348 kasus). Skrip gagal (exit code bukan 0) bila ada
yang tidak cocok atau bila ada tabel `public` tanpa RLS, tanpa kebijakan, atau belum masuk
matriks, sehingga tabel baru tidak bisa lolos tanpa diuji. Juga memeriksa bahwa manager hanya
melihat nomor rekening tersamar.

`npm run db:guards-check` menjalankan `scripts/guards-check.sql`: aktivasi tanpa URL tujuan/kreator,
penugasan kreator prospek/diblokir, kode ambigu, insert klik oleh manager, transisi status mundur,
perubahan kode setelah ada klik, kampanye tertutup, serta alur review konten (URL tayang sebelum
disetujui, revisi tanpa catatan, checklist tidak lengkap, draf yang sudah direview, dan perubahan
riwayat review), serta metrik (snapshot untuk konten belum tayang, sebelum waktu tayang, tanpa
bukti, checkpoint ganda; laporan dengan kode kampanye lain atau bukti tanpa konfirmasi bebas data
pribadi; kode referal setelah ada laporan), serta keuangan (honor untuk kampanye belum selesai,
persetujuan/pembayaran oleh manager, hitung ulang honor yang sudah disetujui, dibayar tanpa bukti,
penyesuaian tanpa alasan, lompatan status), serta waktu operasional (mencatat atas nama orang lain,
durasi di luar 1–1.440 menit, memindahkan catatan ke pengguna lain), serta anonimisasi kreator
(oleh manager, mengubah atau menambah rekening setelah dianonimkan, anonimisasi ganda) —
masing-masing harus ditolak database.

## Data demo dan uji E2E

`npm run seed:demo` mengisi Universitas Demo Borneo (fiktif), 8 kreator dengan status beragam,
dan kampanye draft `DEMO-PMB-2026`, sehingga alur PRD Bagian 5.2 bisa dilatih dari awal. Skrip
menolak URL Supabase non-lokal. `npm run seed:demo:reset` mengembalikan kampanye demo ke draft.

`npm run test:e2e` (Playwright, memakai Chrome terpasang) menjalankan alur kritis sebagai owner:
tugaskan kreator → aktifkan → draf, revisi, setujui → tayang → snapshot dengan bukti, laporan
pendaftar, klik tautan → selesaikan → hitung, setujui, bayar honor → invoice lunas → laporan
cetak A4 dan CSV → log aktivitas. Lalu memeriksa batas akses manager. Data demo di-reset otomatis
sebelum setiap run. Butuh `npm run db:start` dan akun dari `seed:owner` (termasuk manager).

## Laporan dan ekspor

Tab **Laporan** menampilkan pratinjau, tombol ke versi cetak (buka lalu _Cetak → Simpan sebagai
PDF_, ukuran A4), dan dua unduhan CSV. CSV memakai UTF-8 dengan BOM dan pemisah titik koma agar
langsung terbaca rapi di Excel berbahasa Indonesia maupun Google Sheets. Laporan dan CSV dibangun dari
model yang sama (`lib/calculations/campaign-report.ts`) yang sama sekali tidak memuat honor, harga
paket, atau margin.

## Tautan pelacakan

`GET /r/<slug>` (`app/r/[slug]/route.ts`) mencatat klik (IP di-hash dengan `CLICK_IP_HASH_SALT`,
bot ditandai dari user agent) lalu mengarahkan (302) **hanya** ke `landing_url` kampanye di database
ditambah `utm_source`, `utm_medium=kreator`, `utm_campaign`, dan `ref`. Query string pada tautan
tidak pernah dibaca. Slug tak dikenal atau kampanye dibatalkan → 404. Rute ini dikecualikan dari
`proxy.ts`.

## Perintah

| Perintah                       | Kegunaan                                                |
| ------------------------------ | ------------------------------------------------------- |
| `npm run dev`                  | Menjalankan server pengembangan                         |
| `npm run build`                | Build produksi                                          |
| `npm run start`                | Menjalankan hasil build                                 |
| `npm run lint`                 | ESLint                                                  |
| `npm run typecheck`            | `tsc --noEmit`                                          |
| `npm run test`                 | Unit test Vitest                                        |
| `npm run db:start` / `db:stop` | Menyalakan/mematikan Supabase lokal                     |
| `npm run db:reset`             | Reset database lokal dan jalankan ulang seluruh migrasi |
| `npm run db:push`              | Menerapkan migrasi ke proyek Supabase terhubung         |
| `npm run db:types`             | Regenerasi `types/database.ts` dari database lokal      |
| `npm run seed:owner`           | Membuat/memperbarui akun `owner` (dan `manager`)        |
| `npm run seed:demo`            | Data demo lokal (1 kampus, 8 kreator, 1 kampanye)       |
| `npm run seed:demo:reset`      | Kembalikan kampanye demo ke draft                       |
| `npm run test:e2e`             | Uji alur kritis end-to-end (Playwright)                 |
| `npm run db:rls-check`         | Uji kebijakan RLS di database lokal                     |
| `npm run db:guards-check`      | Uji aturan kampanye/penugasan di database lokal         |

## Struktur

```
app/(auth)/     halaman masuk, lupa & atur kata sandi
app/(app)/      halaman yang wajib login: dashboard, clients, creators, settings
components/     ui (shadcn), layout, tables (TanStack), forms, creators
lib/data/       query daftar/detail per modul (server-only)
lib/activity/   penulisan log aktivitas (M11)
lib/calculations/ fungsi murni honor & metrik (+ unit test)
lib/referral/   generator kode referal & slug
lib/tracking/   helper redirect /r/[slug]
app/keluar/     route handler logout
proxy.ts        proteksi rute (pengganti middleware.ts di Next.js 16)
lib/            supabase, auth, validation, format
supabase/       migrasi SQL dan seed
types/          tipe hasil generate dari skema database
```
