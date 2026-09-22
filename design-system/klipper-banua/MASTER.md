# Klipper Banua — Design System (MASTER)

Sumber acuan global untuk redesign UI/UX. Aturan produk tetap di `PRD.md`;
aturan teknis tetap di `CLAUDE.md`. Dokumen ini hanya mengatur tampilan.

Status: **Langkah 0–10 selesai.** Langkah 10 (situs publik, bagian 13)
dikerjakan bersama Fase 13 PRD.

## 1. Posisi produk

Konsol operasional internal, bukan situs pemasaran. PRD §2.2 menilai produk ini
dari kecepatan kerja: laporan < 15 menit, 0 selisih honor, 0 konten tayang tanpa
persetujuan. Maka prioritas visual berurutan:

1. **Status dapat dipindai sekilas** — kenapa orang membuka layar ini.
2. **Angka mudah dibaca** — honor, views, pendaftar, margin.
3. **Batas peran terlihat** — internal / kreator / klien tidak boleh tertukar.
4. Estetika, setelah tiga hal di atas terpenuhi.

Gaya: **Minimalism & Swiss Style** (hasil `--design-system`; _"Best For:
Enterprise apps, dashboards, SaaS platforms, professional tools"_).
Dial: variance 3/10, motion 2/10, density 8/10.

Catatan: lapisan "Pattern" pada tool berorientasi landing page
("Real-Time / Operations Landing") dan **tidak dipakai** untuk area yang sudah
login. Hanya lapisan style, color, dan UX yang diambil. Sejak v3.1 lapisan
pattern itu dipakai **hanya** di grup `app/(marketing)` — lihat bagian 13.

## 2. Keputusan terkunci

| Keputusan    | Pilihan                                                                        |
| ------------ | ------------------------------------------------------------------------------ |
| Palet        | Navy profesional + hijau lunas (sumber `colors.csv`, _Invoice & Billing Tool_) |
| Dark mode    | Dihidupkan — token `.dark` sudah ada tapi tak pernah terpasang                 |
| Pembeda area | Aksen + header berbeda per area; kerangka dan komponen tetap sama              |

## 3. Token warna

Semua nilai OKLCH dihitung dari hex sumber, dan semua rasio kontras di bawah
**sudah diverifikasi**, bukan diperkirakan.

> **Peran token.** `--secondary` dan `--accent` pada shadcn adalah **permukaan**
> (latar tombol sekunder, latar hover), bukan warna merek. Memetakan biru dan
> hijau merek ke sana akan mengubah setiap tombol dan badge `secondary` di
> seluruh aplikasi. Karena itu keduanya tetap netral, dan warna merek tinggal
> di `--info` (biru) serta `--success` (hijau).

### 3.1 Mode terang

| Token                  | Hex       | Peran              | OKLCH                         |
| ---------------------- | --------- | ------------------ | ----------------------------- |
| `--primary`            | `#1E3A5F` | aksi utama         | `oklch(0.3462 0.0736 256.04)` |
| `--primary-foreground` | `#FFFFFF` | —                  | `oklch(1 0 0)`                |
| `--info`               | `#2563EB` | biru merek         | `oklch(0.5461 0.2152 262.88)` |
| `--success`            | `#047857` | hijau lunas        | `oklch(0.5081 0.1049 165.61)` |
| `--warning`            | `#B45309` | butuh tindakan     | `oklch(0.5553 0.1455 49.00)`  |
| `--destructive`        | `#DC2626` | batal / gagal      | `oklch(0.5771 0.2152 27.33)`  |
| `--secondary`          | `#F1F3F5` | permukaan sekunder | `oklch(0.9632 0.0034 247.86)` |
| `--accent`             | `#EBF0F7` | permukaan hover    | `oklch(0.9534 0.0108 256.70)` |
| `--background`         | `#F8FAFC` | latar halaman      | `oklch(0.9842 0.0034 247.86)` |
| `--foreground`         | `#0F172A` | teks utama         | `oklch(0.2077 0.0398 265.75)` |
| `--card`               | `#FFFFFF` | permukaan kartu    | `oklch(1 0 0)`                |
| `--muted`              | `#F1F3F5` | permukaan redup    | `oklch(0.9632 0.0034 247.86)` |
| `--muted-foreground`   | `#475569` | teks sekunder      | `oklch(0.4455 0.0374 257.28)` |
| `--border`             | `#E4E7EB` | garis              | `oklch(0.9268 0.0063 255.48)` |
| `--ring`               | `#2563EB` | cincin fokus       | `oklch(0.5461 0.2152 262.88)` |

> **Koreksi terhadap palet sumber.** Hijau asal `#059669` hanya mencapai
> **3.77:1** — gagal untuk teks biasa, baik sebagai latar berteks putih maupun
> sebagai teks di atas kartu. Diganti `#047857` (**5.48:1**, lolos dua arah).
> Ini satu-satunya penyimpangan dari palet database, dan alasannya kontras.

### 3.2 Mode gelap

| Token                | Hex       | Peran              | OKLCH                         |
| -------------------- | --------- | ------------------ | ----------------------------- |
| `--background`       | `#0B1220` | latar halaman      | `oklch(0.1831 0.0309 263.38)` |
| `--card`             | `#131C2E` | permukaan kartu    | `oklch(0.2275 0.0376 263.41)` |
| `--foreground`       | `#E8EDF5` | teks utama         | `oklch(0.9446 0.0120 259.82)` |
| `--muted-foreground` | `#9AA8BD` | teks sekunder      | `oklch(0.7275 0.0344 258.37)` |
| `--primary`          | `#60A5FA` | aksi utama         | `oklch(0.7137 0.1434 254.62)` |
| `--info`             | `#60A5FA` | biru merek         | `oklch(0.7137 0.1434 254.62)` |
| `--success`          | `#34D399` | hijau lunas        | `oklch(0.7729 0.1535 163.22)` |
| `--warning`          | `#FBBF24` | butuh tindakan     | `oklch(0.8369 0.1644 84.43)`  |
| `--destructive`      | `#F87171` | batal / gagal      | `oklch(0.7106 0.1661 22.22)`  |
| `--secondary`        | `#1C2740` | permukaan sekunder | `oklch(0.2757 0.0491 265.28)` |
| `--accent`           | `#202C47` | permukaan hover    | `oklch(0.2961 0.0521 265.15)` |

### 3.3 Palet chart

Menggantikan `--chart-1..5` yang sekarang seluruhnya grayscale
(`oklch(x 0 0)`) — chart multi-seri saat ini tidak terbaca. Tambalan
`--series-1: #2a78d6` di `globals.css:52` **dihapus** setelah ini masuk.

| Token       | Hex       | Kontras vs kartu | OKLCH                         |
| ----------- | --------- | ---------------- | ----------------------------- |
| `--chart-1` | `#1E3A5F` | 11.50:1          | `oklch(0.3462 0.0736 256.04)` |
| `--chart-2` | `#2563EB` | 5.17:1           | `oklch(0.5461 0.2152 262.88)` |
| `--chart-3` | `#047857` | 5.48:1           | `oklch(0.5081 0.1049 165.61)` |
| `--chart-4` | `#B45309` | 5.02:1           | `oklch(0.5553 0.1455 49.00)`  |
| `--chart-5` | `#7E22CE` | 6.98:1           | `oklch(0.4955 0.2369 301.92)` |

Kelimanya lolos 4.5:1 sebagai teks, jadi label seri boleh diwarnai langsung.

### 3.4 Kontras terverifikasi (mode terang)

| Pasangan                         | Rasio   |
| -------------------------------- | ------- |
| foreground / background          | 17.06:1 |
| foreground / card                | 17.85:1 |
| muted-foreground / card          | 7.58:1  |
| muted-foreground / muted         | 6.81:1  |
| putih / primary                  | 11.50:1 |
| putih / info `#2563EB`           | 5.17:1  |
| putih / success `#047857`        | 5.48:1  |
| putih / warning `#B45309`        | 5.02:1  |
| putih / destructive              | 4.83:1  |
| info sebagai tautan / background | 4.94:1  |

## 4. Token status

Masalah sekarang: `aktif` = hitam, `selesai` = abu, `draft` = outline — status
tidak terbaca sekilas, padahal itu alasan utama layar ini dibuka. Nilai enum
mengikuti PRD dan **tidak berubah**; yang berubah hanya pemetaan warnanya.

Kosakata nada, dipakai konsisten lintas domain — sumbernya satu berkas,
`components/status/status-tone.ts`:

| Nada          | Arti                               |
| ------------- | ---------------------------------- |
| `neutral`     | belum mulai, tidak ada tanggungan  |
| `info`        | sedang berjalan                    |
| `success`     | tuntas, disetujui, lunas           |
| `warning`     | antrean yang harus dikosongkan tim |
| `destructive` | ditolak, dibatalkan, diblokir      |

| Domain           | Pemetaan                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Kampanye         | draft·neutral, aktif·info, selesai·success, dibatalkan·destructive                         |
| Penugasan        | diundang·neutral, bergabung·info, selesai·success, mundur·destructive                      |
| Kreator          | prospek·neutral, terverifikasi·info, aktif·success, nonaktif·neutral, diblokir·destructive |
| Review konten    | menunggu_review·warning, revisi·info, disetujui·success, ditolak·destructive               |
| Status tayang    | belum_tayang·neutral, tayang·success, dihapus·destructive                                  |
| Honor            | draf·neutral, disetujui·info, dibayar·success                                              |
| Pembayaran klien | belum_dibayar·warning, sebagian·info, lunas·success                                        |
| Kiriman kreator  | menunggu·warning, diterima·success, ditolak·destructive                                    |

Nada mengikuti **posisi dalam alur**, bukan kata harfiahnya. Karena itu `aktif`
pada kampanye berwarna biru (sedang berjalan) sementara `aktif` pada kreator
berwarna hijau (keadaan sehat terakhir dalam alurnya). Keduanya jarang muncul
di layar yang sama.

Status yang **menghentikan** pekerjaan (`dibatalkan`, `mundur`, `diblokir`,
`ditolak`, `dihapus`) membawa ikon Lucide, jadi maknanya tidak bergantung warna
saja (WCAG 1.4.1).

Terverifikasi di browser: 16 badge unik, 0 gagal, terendah 5.91:1 (terang) dan
7.90:1 (gelap).

Wajib: warna **tidak boleh** jadi satu-satunya pembawa makna — setiap badge
tetap membawa teks, dan badge kritis membawa ikon Lucide
(`ux-guidelines.csv`: _Color Only_, severity High).

## 4b. Kartu dasbor

Dasbor memisahkan dua hal yang dulu tercampur dalam satu baris enam kartu:

| Jenis          | Isi                                                      | Perlakuan                                               |
| -------------- | -------------------------------------------------------- | ------------------------------------------------------- |
| Butuh tindakan | konten menunggu review, snapshot jatuh tempo, kiriman    | `warning-soft` + ikon bila > 0; netral + centang bila 0 |
| Ringkasan      | kampanye aktif, honor belum dibayar, invoice belum lunas | selalu netral — tidak ada yang tertagih                 |

Tiga dan tiga, jadi grid tidak lagi menyisakan kartu yatim. Antrean diletakkan
**di atas** ringkasan karena PRD §2.2 menilai produk ini dari kecepatan tim
mengosongkannya.

Di kartu uang, **nominal** yang jadi angka besar dan jumlah dokumen jadi detail
— bukan sebaliknya.

> **Jangan pudarkan ink di atas permukaan bertint.** `text-<x>-soft-foreground/80`
> pada `warning-soft` turun ke **4.22:1**. Pakai ink penuh dan biarkan ukuran
> huruf yang membawa hierarki. Aturan yang sama berlaku untuk seluruh pasangan
> `-soft` di §10.

## 4c. Empty state tabel

Tabel kosong menyebut **apa yang harus dilakukan**, bukan sekadar "tidak ada
data". `DataTable` menerima `emptyMessage`, `emptyHint`, dan `emptyAction`, dan
halaman daftar meneruskan `filtered` sehingga pesannya berbeda antara
"filter tidak menemukan apa-apa" (tawarkan _Kosongkan filter_) dan
"memang belum ada isinya" (tawarkan _Buat/Tambah_).

Catatan: kolom responsif tabel (`hidden md:table-cell` dst.) dan
`overflow-x-auto` pada `components/ui/table.tsx` **sudah ada sebelumnya** dan
tidak diubah.

## 4d. Detail kampanye

Tujuh tab dengan kerangka bersama:

- **Fact strip di header** — periode, harga paket, dan kreator bergabung
  tampil di setiap tab, bukan hanya di tab Ringkasan.
- **Tab bar membawa hitungan.** Tab yang menyimpan pekerjaan belum selesai
  memakai angka `warning-soft` di sebelah labelnya, jadi tim tahu di mana
  antreannya tanpa membuka ketujuh tab. Angka, bukan warna saja.
  - Konten: konten berstatus `menunggu_review`
  - Metrik: snapshot jatuh tempo + kiriman metrik menunggu + laporan tayang
    yang belum dikonfirmasi
- **Ringkasan membuka dengan capaian terhadap target** (konten tayang, views,
  pendaftar). Sebelumnya angka ini hanya ada di tab Metrik, padahal klien
  melihatnya di portalnya sendiri.

Data untuk keduanya datang dari satu pemuat `loadCampaignPulse` yang
di-`cache()` per request — sengaja lebih ringan dari `getCampaignMetrics`
(tanpa total klik, tanpa signed URL), karena penghitung tab dan progress bar
tidak membutuhkannya dan signing memakan satu round trip Storage di tiap tab.

Progress bar: angka dan teks "dari N" membawa maknanya sendiri; bar hanya
menguatkan. Bar memakai `--primary`, berubah `--success` saat target tercapai,
dan membawa `role="progressbar"` dengan `aria-valuetext`.

## 4e. Portal kreator — target sentuh

Kreator membuka portal dari HP, jadi setiap kontrol melewati 44x44px di bawah
`md`. Dipasang sebagai **satu aturan** `.touch-targets` di `globals.css` yang
dipakai `(portal)/layout.tsx`, bukan override ukuran per tombol — supaya
kontrol yang ditambahkan nanti tidak bisa melorot lagi di bawah minimum.

Yang **dikecualikan**: tautan di tengah kalimat. WCAG 2.5.8 membebaskannya, dan
memberinya padding akan merusak paragraf brief. Contohnya "buka konten" pada
"Tayang sejak 17 Sep 2026, 21.23 WITA · buka konten" — sengaja dibiarkan 18px.
Tautan blok yang memang tombol aksi memakai atribut `data-cta` untuk ikut
aturan.

Kartu penugasan memakai **stretched link** (`after:absolute after:inset-0`):
seluruh kartu jadi area sentuh, lebih baik daripada memaksa judul satu baris
menjadi setinggi 44px. Tautan "Lihat brief" yang dulu menuju tempat sama
diturunkan jadi teks penanda, sehingga pembaca layar mendengar satu target per
kartu, bukan dua. Terverifikasi lewat hit-test: kartu 343x344px merespons di
ketiga sudut, dan menyentuh tengahnya membuka detail.

Kontrol header (pemicu sidebar, tombol tema, menu pengguna) ikut naik ke 44px
di bawah `md` untuk **semua** area — pengguna internal pun kadang membuka dari
HP.

Hasil audit 375px, sebelum → sesudah, kontrol di bawah 44px:
beranda 5→0, penugasan 6→0, profil 6→0, detail penugasan 13→0
(tidak menghitung dua tautan inline yang memang dikecualikan).

### Catatan patch kedua pada `components/ui/sidebar.tsx`

`SidebarInset` bawaan shadcn merender `<main>`, sementara app shell menaruh
`<header>` dan `<main>`-nya sendiri di dalamnya — dua landmark `main`
bersarang, HTML tidak valid. `SidebarInset` sekarang `<div>`; ia memang
kontainer tata letak, bukan landmark.

## 4f. Capaian terhadap target

Satu komponen, `components/metrics/target-progress.tsx`, dipakai di tiga
tempat: ringkasan kampanye internal, beranda portal klien, dan detail kampanye
klien. Capaian dibaca sama di mana pun, dan hanya ada satu tempat untuk
mengubahnya.

Aturannya: **angka dan teks "dari N" membawa maknanya sendiri**; bar hanya
menguatkan. Bar memakai `--primary`, berubah `--success` saat target tercapai,
dan membawa `role="progressbar"` dengan `aria-valuetext` berisi angka asli
("13.300 dari 80.000"), bukan persentase saja.

Metrik **tanpa target** — misalnya klik tautan non-bot — tidak diberi bar.
Bar tanpa target adalah bar tanpa makna.

Kontras isi bar terhadap jalurnya: 10.34:1 (terang) dan 5.84:1 (gelap), jauh
di atas 3:1 yang dibutuhkan indikator non-teks.

## 4g. Portal klien

Nada "laporan", bukan konsol: kampus membuka ini untuk tahu kampanyenya sampai
mana.

- Kartu kampanye memakai **stretched link** seperti portal kreator; tautan
  "Lihat detail" turun jadi teks penanda, jadi satu target per kartu.
- Angka capaian yang dulu teks polos ("13.300 dari 80.000 (16,6%)") kini
  memakai `TargetProgress`.
- Empty state menjelaskan apa yang akan terjadi, bukan sekadar menyatakan
  kosong.
- `.touch-targets` juga dipasang di `(client)/layout.tsx` — klien pun membuka
  dari HP.

Audit 375px setelah perubahan: detail dan profil **0** kontrol di bawah 44px;
beranda hanya menyisakan judul kartu yang justru area sentuhnya sekartu penuh.

## 4h. Laporan klien & cetak

Artefak yang diserahkan ke klien, jadi diuji dengan data sungguhan, bukan
diperkirakan.

**Penguncian tema saat cetak terbukti bekerja pada laporan, bukan hanya
halaman masuk.** Dari sesi bertema gelap (`#0B1220`, teks `#E8EDF5`), media
cetak menghasilkan `#FFFFFF` dengan teks `#0F172A` — identik dengan sesi
terang, dan PDF-nya sama persis: 132 KB, 2 halaman A4.

Terverifikasi pada dokumen cetak:

| Hal                             | Hasil                                                     |
| ------------------------------- | --------------------------------------------------------- |
| Teks isi di atas putih          | 17.85:1                                                   |
| Teks sekunder di atas putih     | 7.58:1                                                    |
| Garis chart                     | `#1E3A5F` (`--chart-1`), bukan lagi tambalan `--series-1` |
| Kontrol layar (`.print-hidden`) | `display: none` saat cetak                                |
| Hierarki heading                | H1 → H2 x5                                                |
| Tinggi chart                    | 26.8% satu halaman A4                                     |

**Tautan publik `/laporan/[token]`** — yang benar-benar dikirim ke klien —
diuji dari konteks tanpa sesi sama sekali: HTTP 200, `noindex, nofollow`,
satu landmark `main`, dan **tidak ada angka keuangan yang bocor** (FR-M9-03).

**Luapan tabel dikurung per tabel.** Sebelumnya `overflow-x-auto` hanya ada di
pembungkus terluar, jadi di layar ponsel seluruh dokumen yang terseret ke
samping saat tabel kreator (6 kolom) tidak muat. Kini tiap tabel punya
pembungkus geser sendiri dengan `print:overflow-visible` supaya cetak tidak
terpotong. Hasil di 375px: halaman, dokumen, dan pembungkus luar semuanya nol
luapan; hanya tabel kreator yang bergeser 86px di dalam kotaknya.

Kartu "Ringkasan capaian" memakai `report-keep` agar empat ubinnya tidak
terbelah antar halaman.

> **Belum terverifikasi langsung:** posisi persis pemotongan halaman. Aturan
> `.report-document h2 { break-after: avoid }` dan `tr { break-inside: avoid }`
> yang mengaturnya, tapi perkakas di sini tidak bisa membaca isi tiap halaman
> PDF untuk memastikannya. Jumlah halaman dan warna sudah dipastikan.

## 4i. Sapuan a11y & responsif (Langkah 9)

Audit otomatis menelusuri **setiap rute yang sudah login** sebagai tiga persona,
di 375 / 768 / 1024 / 1440px dan dua tema: **168 pemuatan halaman**. Skripnya
disimpan di `scripts/a11y-audit.mjs` supaya bisa dijalankan ulang.

Yang diperiksa: satu landmark `main`, satu `h1` tanpa level terlompat, id ganda,
nama aksesibel, label form, kontras teks (4.5:1; 3:1 untuk teks besar), dan
scroll horizontal.

Hasil: **14 temuan → 0.**

### Dua regresi dari Langkah 2 yang tertangkap di sini

1. **`min-w-0` hilang dari kolom konten.** Shell lama memakai
   `flex min-w-0 flex-1 flex-col`; `SidebarInset` shadcn tidak membawanya. Item
   flex default `min-width: auto`, jadi satu tabel lebar menyeret seluruh
   halaman ke samping begitu sidebar mengambil 16rem di `md` ke atas. Ini
   penyebab **11 dari 12** kasus scroll horizontal, dan besarannya persis
   256px — selebar sidebar.
2. **`h1` ganda di tab Laporan.** `CampaignReportDocument` membawa `h1` sendiri
   sementara halaman sudah punya satu. Komponen kini menerima `embedded`:
   judulnya turun ke `h2` dan bagiannya ke `h3` saat disematkan, tetap `h1`
   saat berdiri sendiri di `/print` dan `/laporan`.

### Kolom grid implisit

Satu URL 46 karakter di tab Brief melebarkan halaman 66px di 375px. Penyebabnya
bukan `Card` (yang sudah `min-w-0`) melainkan **track grid implisit**: grid
tanpa `grid-cols-*` eksplisit memakai track `auto` yang minimumnya selebar
min-content. Ada 55+ grid semacam itu di proyek, jadi diperbaiki sekali di
`@layer base`:

```css
:where(.grid) {
  grid-auto-columns: minmax(0, auto);
}
```

Template eksplisit tidak terpengaruh — Tailwind sudah menulis `grid-cols-N`
sebagai `minmax(0, 1fr)`. Aman karena proyek tidak memakai `grid-flow-col`.

### Fokus keyboard & gerak

115 perhentian tab diuji di empat rute: **nol** tanpa indikator fokus terlihat.
Lima yang tercatat adalah elemen `NEXTJS-PORTAL`, yaitu indikator mode
pengembangan Next.js, bukan kode aplikasi.

`prefers-reduced-motion: reduce` menurunkan durasi transisi ke `1e-05s` —
override `!important` di `globals.css` bekerja.

## 5. Tipografi

Skala modular, menggantikan ukuran acak: **12 / 14 / 16 / 18 / 24 / 32**.
Body 16px, line-height 1.5, angka memakai `tabular-nums` di seluruh tabel,
kartu metrik, dan laporan.

Font tetap **Geist / Geist Mono** yang sudah terpasang di `app/layout.tsx` —
sudah geometris-netral dan sejalan dengan Swiss Style. Tidak ada alasan menambah
permintaan jaringan hanya untuk berganti font.

## 6. Spasi

Density 8/10 (dashboard padat): **8 / 12 / 16 / 24 / 32px**. Kartu metrik
memakai padding 16px, bukan 24px.

## 7. Gerak

Motion 2/10. Hover dan perubahan state 150–250ms. Tidak ada animasi masuk
berbasis scroll di area yang sudah login. `prefers-reduced-motion` dihormati
di seluruh transisi.

## 8. Pembeda area

Kerangka, komponen, dan spasi identik. Yang berbeda hanya aksen sidebar dan
label header:

Pembeda dipasang lewat **override token**, bukan kelas khusus per area: tiap
area menimpa `--sidebar-accent` dan `--sidebar-accent-foreground` pada
`<Sidebar>`. Dengan begitu setiap item menu tetap distyle aturan yang sama dan
portal tidak bisa menyimpang lebih jauh dari sekadar aksennya.

| Area           | Rute       | Tile merek  | Aksen sidebar     | Label            |
| -------------- | ---------- | ----------- | ----------------- | ---------------- |
| Internal       | `(app)`    | `--primary` | `--accent` netral | nama aplikasi    |
| Portal kreator | `(portal)` | `--info`    | `--info-soft`     | "Portal Kreator" |
| Portal klien   | `(client)` | `--success` | `--success-soft`  | "Portal Klien"   |

Terverifikasi di browser: aksen aktif terbaca `#EBF0F7` / `#EFF6FF` / `#ECFDF5`
sesuai token, tepat satu item aktif per area, dan aksen bertahan di sheet mobile.

### Catatan patch pada `components/ui/sidebar.tsx`

Komponen bawaan shadcn meneruskan `{...props}` ke `Sheet` (Radix Root) pada
cabang mobile. Root itu bukan elemen DOM, jadi `style` — pembawa variabel aksen
area — **hilang di layar ponsel**, justru perangkat utama kreator. `style`
sekarang diteruskan eksplisit ke `SheetContent` dan ke kontainer desktop.
Teks antarmuka komponen juga dialihbahasakan ke Bahasa Indonesia.

`hooks/use-mobile.ts` hasil generate memanggil `setState` di dalam effect dan
ditolak ESLint proyek; ditulis ulang memakai `useSyncExternalStore`.

## 9. Larangan

- Tidak ada emoji sebagai ikon — Lucide sudah terpasang.
- Tidak ada warna mentah di komponen (`bg-blue-500`); selalu lewat token.
- Tidak ada `--chart-*` grayscale.
- Tidak ada focus ring yang dihapus.
- Tidak ada tabel lebar tanpa pembungkus `overflow-x-auto`.
- Tidak ada empty state kosong — selalu kalimat + tindakan.
- Tidak ada chip filter yang terpotong; harus membungkus
  (`ux-guidelines.csv`: _Chip Collection Reflow_, severity High).

## 10. Token badge lunak

Pola shadcn `bg-X/10 text-X` **gagal** kontras di mode terang: destructive
4.13:1, warning 4.39:1, info 4.49:1 — semuanya di bawah 4.5. Karena itu setiap
status punya pasangan `-soft` eksplisit, bukan hasil campuran transparan.

| Token              | Terang                | Rasio  | Gelap                 | Rasio   |
| ------------------ | --------------------- | ------ | --------------------- | ------- |
| `success-soft`     | `#ECFDF5` / `#065F46` | 7.29:1 | `#0E3A2E` / `#6EE7B7` | 8.28:1  |
| `warning-soft`     | `#FEF6E7` / `#92400E` | 6.60:1 | `#3A2E11` / `#FCD34D` | 9.22:1  |
| `info-soft`        | `#EFF6FF` / `#1D4ED8` | 6.16:1 | `#16294A` / `#93C5FD` | 8.03:1  |
| `destructive-soft` | `#FEF2F2` / `#B91C1C` | 5.91:1 | `#3E1D1F` / `#FCA5A5` | 7.90:1  |
| `neutral-soft`     | `#F1F3F5` / `#334155` | 9.31:1 | `#1C2740` / `#CBD5E1` | 10.01:1 |

Badge status dipasang ke token ini pada **Langkah 4**, bukan sebelumnya.

## 11. Panel merek

Panel masuk adalah permukaan merek tetap: ia **tidak ikut membalik** bersama
`--primary`, karena di mode gelap `--primary` menjadi biru terang dan panelnya
akan menyilaukan.

| Token                      | Terang              | Gelap               |
| -------------------------- | ------------------- | ------------------- |
| `--brand-panel`            | `#1E3A5F`           | `#0F1B2D`           |
| `--brand-panel-foreground` | `#FFFFFF` (11.50:1) | `#E8EDF5` (14.70:1) |
| `--brand-panel-muted`      | `#C3D3E8` (7.56:1)  | `#A9BBD2` (8.83:1)  |

## 12. Checklist sebelum tiap langkah ditutup

- [ ] Kontras teks ≥ 4.5:1 di mode terang **dan** gelap
- [ ] Focus terlihat untuk navigasi keyboard
- [ ] Target sentuh ≥ 44×44px (wajib di portal kreator)
- [ ] `prefers-reduced-motion` dihormati
- [ ] Diuji di 375 / 768 / 1024 / 1440px, tanpa scroll horizontal
- [ ] Hierarki heading berurutan, tidak melompat
- [ ] `npm run lint && npm run typecheck && npm run test && npm run build`

## 13. Situs publik (Langkah 10, v3.1)

Bagian 1 menyatakan produk ini konsol operasional, bukan situs pemasaran, dan
lapisan pattern landing page **tidak dipakai** untuk area yang sudah login.
Aturan itu tetap berlaku. Grup `app/(marketing)` adalah satu-satunya
pengecualian: di sanalah lapisan pattern landing page justru dipakai.

| Aspek      | Aturan di `(marketing)`                                                                      |
| ---------- | -------------------------------------------------------------------------------------------- |
| Dial       | variance 5/10, motion 3/10, density 4/10 — lapang, bukan padat seperti dasbor (density 8/10) |
| Warna      | Token yang sama, tanpa warna mentah. Hero memakai `--brand-panel` (bagian 11) karena permukaan itu tidak ikut membalik di mode gelap |
| Tipografi  | Hero satu tingkat di atas heading aplikasi (bagian 5); hierarki tetap berurutan, tidak melompat |
| Ritme      | Satu pesan per seksi; padding vertikal 64px di ponsel, 96px pada ≥1024px; lebar teks maks. 65ch |
| CTA        | Satu tindakan utama per seksi: tombol `default` untuk hubungi tim, `outline` untuk "Masuk"    |
| Ikon       | Tetap Lucide, tanpa emoji (bagian 9)                                                         |
| Gerak      | Hanya fade/translate halus ≤ 200ms, dihentikan `prefers-reduced-motion`; tanpa parallax dan tanpa carousel otomatis |
| Gambar     | Aset statis di `public/` lewat `next/image` dengan ukuran eksplisit; tanpa foto stok yang mengesankan klien nyata |

Larangan bagian 9 dan checklist bagian 12 berlaku penuh di halaman publik.
Isi teks, angka, dan nama di situs tunduk pada PRD FR-M15-06: konten statis yang
disetujui `owner`, bukan tarikan database.
