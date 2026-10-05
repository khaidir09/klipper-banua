# Kliper Banua

Marketplace kliper lokal Kalimantan: brand bisnis, UMKM, instansi, dan personal memasang
kampanye, kliper lokal membuat dan memposting klipnya. Kebutuhan produk ada di [`PRD.md`](./PRD.md), aturan kerja di
[`CLAUDE.md`](./CLAUDE.md).

Status: **Fase 11 — v3.0** selesai: portal klien untuk memantau kampanye. v2.0 (Fase 9–10)
memberi kreator portal untuk brief dan kiriman; Fase 11 memberi kontak klien akses baca ke
kampanye miliknya sendiri.
Fase 8 (v1.1): tautan laporan baca-saja untuk klien (`/laporan/<token>`, dibuat dari tab Laporan
kampanye) dan pengingat Telegram harian snapshot jatuh tempo lewat n8n
(`/api/reminders/due-snapshots`, workflow di `docs/n8n/`). Fase 0–7 (MVP pilot): autentikasi,
pengguna, klien, kreator, kampanye, penugasan, tautan pelacakan, konten dan review, metrik dan
dasbor, keuangan, laporan, waktu operasional, log aktivitas, anonimisasi, rate limit, data demo,
uji RLS, Docker + Caddy, dan uji E2E Playwright. Deploy mengikuti [`DEPLOY.md`](./DEPLOY.md).

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

| Variabel                                       | Sumber                                                 |
| ---------------------------------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`                     | `API URL` dari `npm run db:start`                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`                | `anon key`                                             |
| `SUPABASE_SERVICE_ROLE_KEY`                    | `service_role key` (hanya dipakai di server)           |
| `CLICK_IP_HASH_SALT`                           | string acak bebas, mis. hasil `openssl rand -hex 32`   |
| `SEED_OWNER_EMAIL` / `SEED_OWNER_PASSWORD`     | akun owner yang akan dibuat                            |
| `SEED_MANAGER_EMAIL` / `SEED_MANAGER_PASSWORD` | (opsional) akun manager untuk menguji RLS              |
| `SEED_CREATOR_EMAIL` / `SEED_CREATOR_PASSWORD` | (opsional) akun portal kreator untuk data demo         |
| `SEED_CLIENT_EMAIL` / `SEED_CLIENT_PASSWORD`   | (opsional) akun portal klien untuk data demo           |
| `REMINDER_API_TOKEN`                           | (opsional) token n8n untuk pengingat, min. 32 karakter |

Email lokal (undangan, lupa kata sandi) dapat dibaca di Mailpit: <http://127.0.0.1:55324>.

## Templat email Supabase

Tautan undangan dan pemulihan harus mengarah ke `/auth/callback?token_hash=…&type=…` agar
sesi dibuat di sisi server (cookie), bukan di hash URL. Templat lokal ada di
`supabase/templates/` dan diaktifkan lewat `supabase/config.toml`. **Sebelum rilis**, salin isi
templat yang sama ke _Authentication → Email Templates_ di dashboard proyek Supabase hosted.

## Uji RLS dan aturan bisnis

`npm run db:rls-check` menjalankan `scripts/rls-check.sql`: matriks SELECT/INSERT/UPDATE/DELETE
untuk **setiap tabel, view, dan bucket Storage** sebagai `owner`, `manager`, anggota nonaktif,
akun portal `creator`, akun portal `client`, dan `anon`, dibandingkan dengan hasil yang
diharapkan (744 kasus). Skrip gagal (exit code bukan 0) bila ada
yang tidak cocok atau bila ada tabel `public` tanpa RLS, tanpa kebijakan, atau belum masuk
matriks (view wajib masuk matriks juga), sehingga tabel atau view baru tidak bisa lolos tanpa
diuji. Juga memeriksa bahwa manager hanya
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
(oleh manager, mengubah atau menambah rekening setelah dianonimkan, anonimisasi ganda), serta
portal kreator (kreator mengirim draf untuk penugasan orang lain, menandai kontennya tayang atau
menyetujui kontennya sendiri, mengirim metrik untuk konten belum tayang atau sebelum waktu tayang,
memverifikasi kiriman sendiri, tim menolak tanpa alasan, verifikasi ganda), serta portal klien
(klien memindahkan akunnya ke kontak lain, melihat kampanye klien lain atau kampanye draft,
membaca tabel internal, dan akses yang dicabut owner) — masing-masing harus ditolak database.

## Portal kreator (v2.0)

Kreator memakai halaman login yang sama lalu masuk ke `/portal`: daftar penugasan, brief lengkap,
materi kampanye, kode referal dan tautan pelacakan, serta skema honor yang berlaku baginya.
Undangan dikirim dari tab **Portal** di halaman kreator (status wajib terverifikasi atau aktif);
`owner` dapat mencabut atau mengaktifkan kembali aksesnya.

Dari portal kreator juga mengirim pekerjaannya, dengan prinsip **kreator mengisi, tim memutuskan**:

| Kreator mengirim                           | Yang terjadi                                                                                                                                                                           |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Draf konten (tautan atau berkas + caption) | Masuk ke antrean review tim yang sama seperti draf yang dicatat tim; kreator melihat keputusan dan catatan revisi, lalu dapat mengirim draf baru                                       |
| Laporan konten tayang (URL + waktu)        | Tersimpan sebagai usulan; baru menjadi status tayang setelah tim menekan **Konfirmasi tayang**                                                                                         |
| Bukti metrik (angka + tangkapan layar)     | Masuk ke `metric_submissions`; hanya usulan yang **diterima** tim menjadi snapshot resmi, jadi tidak ada angka yang memengaruhi honor tanpa diperiksa. Penolakan wajib disertai alasan |

Tim melihat antreannya di tab **Konten** dan **Metrik** kampanye, serta di kartu "Kiriman kreator"
pada dasbor. Kreator melihat rincian honornya sendiri (tanpa bukti transfer) di halaman penugasan.

Peran `creator` tidak punya kebijakan RLS atas tabel mana pun. Semua bacaan portal lewat view
`creator_portal_profile`, `creator_portal_assignments`, dan `creator_portal_assets` yang memfilter
`current_creator_id()` dan hanya memuat kolom aman — harga paket, target, margin, data klien, dan
data kreator lain tidak pernah keluar. `public.is_active_member()` sejak Fase 9 berarti anggota
internal saja, sehingga seluruh kebijakan lama otomatis menolak akun portal.

## Portal klien (v3.0)

Kontak klien diundang dari halaman klien (tab kontak) dan masuk ke `/klien`: daftar kampanye
miliknya beserta capaian vs target, lalu halaman kampanye berisi grafik views per checkpoint,
rekap per kreator (nama panggung dan kode referal), dan daftar konten tayang. `owner` dapat
mencabut atau mengaktifkan kembali akses tiap kontak.

Peran `client` membaca lewat view `client_portal_campaigns`, `client_portal_contents`,
`client_portal_creators`, dan `client_portal_metrics` yang memfilter `current_client_id()`.
Harga paket, skema honor, margin, data kreator selain nama panggung, klien lain, dan log aktivitas
tidak pernah keluar lewat portal ini. Kampanye `draft` dan `dibatalkan` juga tidak muncul.

## Data demo dan uji E2E

`npm run seed:demo` mengisi Universitas Demo Borneo (fiktif), 8 kreator dengan status beragam,
kampanye draft `DEMO-PMB-2026`, dan kampanye berjalan `DEMO-PORTAL-2026` (berisi konten disetujui,
konten yang diminta revisi, dan satu snapshot) untuk melatih portal kreator. Bila
`SEED_CREATOR_EMAIL`/`SEED_CREATOR_PASSWORD` diisi, kreator pertama juga mendapat akun portal.
Skrip menolak URL Supabase non-lokal. `npm run seed:demo:reset` mengembalikan kampanye demo ke draft.

`npm run test:e2e` (Playwright, memakai Chrome terpasang) menjalankan alur kritis sebagai owner:
tugaskan kreator → aktifkan → draf, revisi, setujui → tayang → snapshot dengan bukti, laporan
pendaftar, klik tautan → selesaikan → hitung, setujui, bayar honor → invoice lunas → laporan
cetak A4 dan CSV → log aktivitas. Lalu memeriksa batas akses manager, dan portal kreator: brief
miliknya sendiri (tanpa harga paket, tanpa akses ke rute internal) serta alur penuh kirim draf →
review tim → laporan tayang → konfirmasi tim → bukti metrik → verifikasi tim. Terakhir portal
klien: kampanye miliknya sendiri, tanpa harga paket maupun honor, dan tanpa akses ke rute
internal. Data demo di-reset otomatis
sebelum setiap run. Butuh `npm run db:start` dan akun dari `seed:owner` (termasuk manager) serta
`seed:demo` (akun portal kreator).

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
app/(app)/      halaman internal: dashboard, clients, creators, campaigns, settings
app/(portal)/   portal kreator (v2.0): beranda, penugasan, profil
app/(client)/   portal klien (v3.0): beranda, kampanye, profil
components/     ui (shadcn), layout, tables (TanStack), forms, creators
lib/data/       query daftar/detail per modul (server-only; portal.ts & client-portal.ts = view portal)
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
