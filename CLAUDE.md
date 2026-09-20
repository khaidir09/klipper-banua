# CLAUDE.md — Aturan Proyek

Sumber kebenaran kebutuhan produk ada di `PRD.md`. Baca bagian yang relevan sebelum mengerjakan tugas apa pun.

## Konteks singkat

Aplikasi web internal untuk mengelola kampanye promosi instansi regional (dimulai dari kampus swasta di Kalimantan) menggunakan kreator lokal. Pengguna inti adalah tim internal (`owner`, `manager`); sejak v2.0 kreator memakai portal `/portal` (peran `creator`), dan sejak v3.0 klien memakai portal `/klien` (peran `client`).

## Stack

Next.js (App Router) + TypeScript strict, Tailwind CSS + shadcn/ui, React Hook Form + Zod, TanStack Table, Recharts, Supabase (Postgres, Auth, Storage, RLS), Vitest.

## Cara kerja

- Kerjakan **satu fase PRD (Bagian 11) per sesi**. Susun rencana terlebih dahulu dan tunggu persetujuan sebelum menulis kode.
- Jangan membangun fitur di luar cakupan (PRD Bagian 4.2). Jika ada kebutuhan baru, usulkan perubahan PRD dulu.
- Setelah fase selesai: jalankan lint, typecheck, test, dan build; laporkan kriteria penerimaan yang sudah dan belum terpenuhi.

## Aturan wajib

- **Bahasa:** UI dalam Bahasa Indonesia. Kode, nama tabel/kolom, dan komentar dalam bahasa Inggris. Nilai enum mengikuti PRD.
- **Database:** setiap perubahan skema lewat file migrasi baru di `supabase/migrations/`. Jangan mengedit migrasi yang sudah ada. Regenerasi `types/database.ts` setelah migrasi.
- **RLS:** aktif di setiap tabel baru, lengkap dengan kebijakan untuk `owner` dan `manager`. `creator_bank_accounts` dan bukti keuangan hanya untuk `owner`.
- **Peran portal (`creator` M13, `client` M14):** `public.is_active_member()` berarti **anggota internal** (`owner`/`manager`) saja. Bacaan portal lewat view `creator_portal_*` yang memfilter `public.current_creator_id()` dan hanya memuat kolom aman. Bacaan portal klien lewat view `client_portal_*` yang memfilter `public.current_client_id()`. Pengecualian yang diizinkan hanya baris milik pengguna portal sendiri yang memang perlu ditulis dari portal (`contents`, `metric_submissions`): Postgres butuh izin `select` sebelum `update`/`delete`. Ekspresi kebijakan tidak boleh menyentuh tabel ber-RLS lain — pakai helper `security definer` (`creator_owns_assignment`, `creator_owns_content`, `client_owns_campaign`). Tulisan dari portal lewat Server Action + RLS + trigger, bukan service role.
- **Kiriman kreator:** angka yang memengaruhi honor (metrik) dan status tayang tidak pernah resmi tanpa tindakan tim — lihat `review_metric_submission()` dan kolom `contents.proposed_posted_*`.
- **Guard rute:** rute `(app)` memakai `requireInternal()` / `requireRole()`, `(portal)` memakai `requireCreator()`, `(client)` memakai `requireClient()`. `requireSession()` hanya untuk yang dipakai lintas area (mis. profil sendiri). Tujuan setiap peran ada di `homePathFor()`.
- **Rahasia:** `SUPABASE_SERVICE_ROLE_KEY`, `CLICK_IP_HASH_SALT`, dan `REMINDER_API_TOKEN` hanya dipakai di kode server. Jangan pernah mengimpornya ke komponen client.
- **Validasi:** setiap Server Action memvalidasi input dengan Zod dan memeriksa peran pengguna di server, bukan hanya di UI.
- **Uang:** nominal Rupiah disimpan sebagai `bigint` utuh. Jangan memakai float untuk uang.
- **Waktu:** simpan `timestamptz` UTC; tampilkan dengan zona waktu pengguna (default `Asia/Makassar`).
- **Perhitungan:** logika honor dan metrik hanya di `lib/calculations/`, berupa fungsi murni dengan unit test.
- **Privasi:** jangan menambah penyimpanan data pribadi pendaftar/calon mahasiswa.
- **Redirect:** `/r/[slug]` hanya mengarah ke `landing_url` dari database.
- **Log:** aksi penting dicatat ke `activity_logs` sesuai PRD M11.

## Perintah

| Perintah                               | Kegunaan                                      |
| -------------------------------------- | --------------------------------------------- |
| `npm run dev`                          | Server pengembangan (http://localhost:3000)   |
| `npm run build`                        | Build produksi                                |
| `npm run lint`                         | ESLint                                        |
| `npm run typecheck`                    | `tsc --noEmit`                                |
| `npm run test`                         | Unit test Vitest                              |
| `npm run db:start` / `npm run db:stop` | Supabase lokal (butuh Docker)                 |
| `npm run db:reset`                     | Reset database lokal + jalankan ulang migrasi |
| `npm run db:push`                      | Terapkan migrasi ke proyek Supabase terhubung |
| `npm run db:types`                     | Regenerasi `types/database.ts`                |
| `npm run seed:owner`                   | Buat/perbarui akun `owner` (+ `manager` bila `SEED_MANAGER_*` diisi) |
| `npm run seed:demo` (`SEED_CREATOR_*`, `SEED_CLIENT_*`) | Ikut membuat akun portal kreator dan klien untuk data demo |
| `npm run db:rls-check`                 | Uji kebijakan RLS di database lokal (`scripts/rls-check.sql`) |
| `npm run db:guards-check`              | Uji trigger aturan kampanye/penugasan (`scripts/guards-check.sql`) |
| `npm run seed:demo` / `seed:demo:reset` | Data demo lokal / kembalikan kampanye demo ke draft |
| `npm run test:e2e`                     | Uji alur kritis Playwright (butuh Supabase lokal + data demo) |

Sebelum menyelesaikan fase, jalankan: `npm run lint && npm run typecheck && npm run test && npm run build`.

Tabel **dan view** baru wajib ditambahkan ke matriks `scripts/rls-check.sql` (termasuk kolom persona `creator`); skrip gagal bila ada yang belum tercakup. Deploy produksi: lihat `DEPLOY.md`.

## Catatan framework

- Next.js 16: berkas `middleware.ts` sudah diganti menjadi `proxy.ts` (runtime Node.js).
- `AGENTS.md` ditulis ulang otomatis oleh `next dev`; baca juga berkas itu sebelum menulis kode Next.js.
- Dokumentasi versi terpasang ada di `node_modules/next/dist/docs/`.
- TanStack Table v9: `useTable` + `tableFeatures` (bukan `useReactTable`); panduan di `node_modules/@tanstack/react-table/skills/`.
- Form: `useForm<z.input<S>, unknown, z.output<S>>` + `zodResolver` karena skema memakai transform/default.
- Tautan email Supabase (undangan, pemulihan) memakai templat `supabase/templates/*.html` → `/auth/callback?token_hash=…`; templat yang sama wajib dipasang di dashboard proyek hosted.
- Server Action dibatasi 6 MB (`next.config.ts`); berkas besar (materi kampanye) diunggah langsung dari browser ke Storage, lalu action hanya mencatat path.
- Aturan status kampanye dan penugasan ditegakkan dua kali: di action (pesan ramah) dan trigger database (`dbRuleMessage` di `lib/actions.ts` memetakan kode error trigger).
- Satu templat undangan Supabase dipakai untuk anggota tim dan kreator, jadi teksnya netral.
