# Klipper Banua

Aplikasi web internal untuk mengelola kampanye promosi instansi regional di Kalimantan
bersama kreator lokal. Kebutuhan produk ada di [`PRD.md`](./PRD.md), aturan kerja di
[`CLAUDE.md`](./CLAUDE.md).

Status: **Fase 1 — Pengguna, Klien, dan Kreator** selesai (undangan pengguna, klien + kontak,
kreator + akun sosial + bukti audiens + rekening khusus owner, log aktivitas).

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

## Uji RLS

`npm run db:rls-check` menjalankan `scripts/rls-check.sql` terhadap database lokal dan
menunjukkan bahwa `manager` tidak bisa membaca `creator_bank_accounts` secara langsung
(0 baris; hanya lewat fungsi tersamar), `owner` bisa, dan `anon` tidak melihat kreator.

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

## Struktur

```
app/(auth)/     halaman masuk, lupa & atur kata sandi
app/(app)/      halaman yang wajib login: dashboard, clients, creators, settings
components/     ui (shadcn), layout, tables (TanStack), forms, creators
lib/data/       query daftar/detail per modul (server-only)
lib/activity/   penulisan log aktivitas (M11)
app/keluar/     route handler logout
proxy.ts        proteksi rute (pengganti middleware.ts di Next.js 16)
lib/            supabase, auth, validation, format
supabase/       migrasi SQL dan seed
types/          tipe hasil generate dari skema database
```
