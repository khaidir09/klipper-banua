# Klipper Banua — Design System (MASTER)

Sumber acuan global untuk redesign UI/UX. Aturan produk tetap di `PRD.md`;
aturan teknis tetap di `CLAUDE.md`. Dokumen ini hanya mengatur tampilan.

Status: **Langkah 0 dan 1 selesai** (token + halaman auth). Langkah 2–9 belum.

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
login. Hanya lapisan style, color, dan UX yang diambil.

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

| Enum              | Arti                     | Token badge        |
| ----------------- | ------------------------ | ------------------ |
| `draft`           | belum jalan              | `neutral-soft`     |
| `aktif`           | sedang berjalan          | `info-soft`        |
| `selesai`         | tuntas                   | `success-soft`     |
| `dibatalkan`      | batal                    | `destructive-soft` |
| `menunggu_review` | butuh tindakan tim       | `warning-soft`     |
| `terverifikasi`   | kreator lolos verifikasi | `success-soft`     |
| `diblokir`        | kreator diblokir         | `destructive-soft` |

Wajib: warna **tidak boleh** jadi satu-satunya pembawa makna — setiap badge
tetap membawa teks, dan badge kritis membawa ikon Lucide
(`ux-guidelines.csv`: _Color Only_, severity High).

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

| Area           | Rute       | Aksen             | Label header     |
| -------------- | ---------- | ----------------- | ---------------- |
| Internal       | `(app)`    | navy `--primary`  | nama aplikasi    |
| Portal kreator | `(portal)` | biru `--info`     | "Portal Kreator" |
| Portal klien   | `(client)` | hijau `--success` | "Portal Klien"   |

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
