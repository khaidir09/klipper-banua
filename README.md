# Klipper Banua

Aplikasi web internal untuk mengelola kampanye promosi instansi regional di Kalimantan
bersama kreator lokal. Kebutuhan produk ada di [`PRD.md`](./PRD.md), aturan kerja di
[`CLAUDE.md`](./CLAUDE.md).

Status: **Fase 3 — Konten dan Review** selesai (pencatatan draf, checklist review, revisi, status
tayang/dihapus, riwayat review permanen). Fase 0–2: autentikasi, pengguna, klien, kreator,
kampanye, penugasan, tautan pelacakan.

## Prasyarat

- Node.js 22+
- Docker Desktop (untuk Supabase lokal)

## Menjalankan di lokal

```bash
npm install
npm run db:start          # menyalakan Supabase lokal, mencetak URL dan kunci
cp .env.example .env.local # lalu isi nilainya dari keluaran db:start
npm run seed:owner        # membuat akun owner pertama
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

`npm run db:rls-check` menjalankan `scripts/rls-check.sql` terhadap database lokal dan
menunjukkan bahwa `manager` tidak bisa membaca `creator_bank_accounts` secara langsung
(0 baris; hanya lewat fungsi tersamar), `owner` bisa, dan `anon` tidak melihat kreator.

`npm run db:guards-check` menjalankan `scripts/guards-check.sql`: aktivasi tanpa URL tujuan/kreator,
penugasan kreator prospek/diblokir, kode ambigu, insert klik oleh manager, transisi status mundur,
perubahan kode setelah ada klik, kampanye tertutup, serta alur review konten (URL tayang sebelum
disetujui, revisi tanpa catatan, checklist tidak lengkap, draf yang sudah direview, dan perubahan
riwayat review) — masing-masing harus ditolak database.

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
