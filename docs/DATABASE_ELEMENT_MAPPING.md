# Dokumentasi Skema Database & Pemetaan Elemen Template HTML (Pre-Rendering)

Dokumen ini mencatat seluruh struktur tabel database `invitation_permatawedding`, kolom-kolom data yang tersedia untuk sebuah pesanan (order), serta pemetaannya ke elemen DOM HTML (`id` dan `data-key`) pada template undangan digital.

---

## 1. Skema Database Order (`invitation_permatawedding`)

### A. Tabel Utama: `orders`
Menyimpan identitas pesanan dan status transaksi.
- `id` (CHAR 36, PK / UUID): Identifier unik pesanan. Disisipkan ke `window.CONFIG.ORDER_ID`.
- `order_code` (VARCHAR 20): Kode unik pesanan (contoh: `ORD-202611-0002`).
- `customer_name` (VARCHAR 150): Nama pemesan.
- `customer_phone` (VARCHAR 20): Nomor WhatsApp pemesan.
- `package_type` (ENUM 'basic', 'premium', 'exclusive'): Paket langganan.
- `theme_id` (CHAR 36, FK ke `themes.id`): ID tema yang digunakan.
- `payment_status` (ENUM 'unpaid', 'paid', 'partial', 'cancelled'): Status pembayaran.
- `total_price` (DECIMAL 12,2): Total tagihan.
- `order_date` (TIMESTAMP): Tanggal transaksi order.
- `is_active` (TINYINT 1): Status aktif undangan.
- `notes` (TEXT): Catatan khusus pemesan.

### B. Tabel Mempelai: `couples`
Menyimpan data identitas pengantin pria dan wanita.
- `id` (CHAR 36, PK / UUID)
- `order_id` (CHAR 36, FK ke `orders.id`)
- `slug_url` (VARCHAR 100): Slug direktori undangan (contoh: `agung-fitri`). Menentukan folder output `/{year}/{slug}/`.
- `cover_photo_url` (VARCHAR 255): URL foto cover utama / banner.
- `groom_name` (VARCHAR 150): Nama lengkap pengantin pria beserta gelar.
- `groom_nickname` (VARCHAR 50): Nama panggilan pria.
- `groom_father` (VARCHAR 150): Nama ayah kandung pengantin pria.
- `groom_mother` (VARCHAR 150): Nama ibu kandung pengantin pria.
- `groom_address` (TEXT): Alamat asal / kediaman pria.
- `groom_photo_url` (VARCHAR 255): URL foto profil pria.
- `bride_name` (VARCHAR 150): Nama lengkap pengantin wanita beserta gelar.
- `bride_nickname` (VARCHAR 50): Nama panggilan wanita.
- `bride_father` (VARCHAR 150): Nama ayah kandung pengantin wanita.
- `bride_mother` (VARCHAR 150): Nama ibu kandung pengantin wanita.
- `bride_address` (TEXT): Alamat asal / kediaman wanita.
- `bride_photo_url` (VARCHAR 255): URL foto profil wanita.

### C. Tabel Acara: `events`
Menyimpan rangkaian acara (Akad Nikah, Resepsi, Unduh Mantu, dll.).
- `id` (CHAR 36, PK / UUID)
- `order_id` (CHAR 36, FK ke `orders.id`)
- `event_name` (VARCHAR 100): Nama acara (contoh: `Akad Nikah`, `Resepsi`).
- `event_datetime` (DATETIME): Tanggal & jam mulai acara (contoh: `2026-11-29 07:00:00`). Menentukan folder tahun dinamis `{year}`.
- `event_end` (DATETIME, NULL): Jam berakhirnya acara (jika kosong dianggap `Selesai`).
- `venue_name` (VARCHAR 200): Nama tempat / gedung / kediaman.
- `venue_address` (TEXT): Alamat jalan lengkap venue.
- `google_maps_url` (VARCHAR 500): URL tautan Google Maps untuk navigasi tamu.
- `description` (TEXT): Keterangan tambahan acara.
- `sort_order` (SMALLINT): Urutan kemunculan (`0`: Akad, `1`: Resepsi, dst.).

### D. Tabel Amplop Digital: `digital_wallets`
Menyimpan rekening bank dan e-wallet untuk kado digital.
- `id` (CHAR 36, PK / UUID)
- `order_id` (CHAR 36, FK ke `orders.id`)
- `wallet_type` (ENUM 'bank', 'gopay', 'ovo', 'dana', 'shopeepay', 'other')
- `bank_name` (VARCHAR 100): Nama bank atau provider e-wallet (BRI, BCA, Mandiri, DANA).
- `account_number` (VARCHAR 50): Nomor rekening atau nomor HP e-wallet.
- `account_holder` (VARCHAR 150): Nama pemilik rekening (atas nama).
- `qr_code_url` (VARCHAR 255): Gambar barcode QRIS jika tersedia.
- `is_active` (TINYINT 1): 1 jika aktif ditampilkan.

### E. Tabel Kisah Cinta: `love_stories`
Menyimpan timeline perjalanan cinta mempelai.
- `id` (CHAR 36, PK / UUID)
- `order_id` (CHAR 36, FK ke `orders.id`)
- `title` (VARCHAR 150): Judul momen (contoh: `Pertemuan Pertama`, `Lamaran`, `Pernikahan`).
- `content` (TEXT): Cerita narasi perjalanan cinta.
- `photo_url` (VARCHAR 255): Foto dokumentasi momen.
- `story_date` (DATE): Tanggal terjadinya momen (contoh: `2021-12-07`).
- `sort_order` (SMALLINT): Urutan timeline (`0`, `1`, `2`, dst.).

### F. Tabel Musik: `music`
Menyimpan musik latar belakang (background audio) undangan.
- `id` (CHAR 36, PK / UUID)
- `order_id` (CHAR 36, FK ke `orders.id`)
- `title` (VARCHAR 150): Judul lagu.
- `artist` (VARCHAR 100): Nama musisi/pencipta.
- `audio_url` (VARCHAR 500): Tautan file audio MP3.
- `autoplay` (TINYINT 1): Putar otomatis setelah klik buka undangan.
- `loop` (TINYINT 1): Ulangi audio setelah selesai (1 = loop).

### G. Tabel Hiburan: `entertainment`
- `id` (CHAR 36, PK / UUID)
- `order_id` (CHAR 36, FK ke `orders.id`)
- `name` (VARCHAR 150): Nama grup pengisi acara (contoh: `Sekar Jinggo`, `Campursari Arseka`).
- `type` (VARCHAR 80): Jenis hiburan (contoh: `Campursari`, `Akustik`, `Organ Tunggal`).
- `sort_order` (SMALLINT)

### H. Tabel Live Streaming: `livestreaming`
- `id` (CHAR 36, PK / UUID)
- `order_id` (CHAR 36, FK ke `orders.id`)
- `title` (VARCHAR 150): Judul siaran langsung.
- `youtube_url` (VARCHAR 500): URL link siaran YouTube Live.
- `stream_start` (DATETIME): Jam mulai siaran.
- `is_active` (TINYINT 1)

### I. Tabel Galeri: `galleries`
- `id` (CHAR 36, PK / UUID)
- `order_id` (CHAR 36, FK ke `orders.id`)
- `photo_url` (VARCHAR 255): Path/URL foto galeri.
- `caption` (VARCHAR 255): Keterangan foto.
- `is_cover` (TINYINT 1): Penanda apakah foto ini dijadikan foto utama.
- `sort_order` (SMALLINT): Urutan galeri.

### J. Tabel Komentar & Buku Tamu: `comments` (Dinamis via API)
- `id` (CHAR 36, PK / UUID)
- `order_id` (CHAR 36, FK ke `orders.id`)
- `guest_name` (VARCHAR 150): Nama tamu yang mengisi.
- `content` (TEXT): Ucapan dan doa restu.
- `attendance` (ENUM 'hadir', 'tidak_hadir', 'ragu_ragu')
- `created_at` (TIMESTAMP)

---

## 2. Pemetaan Elemen Template HTML (ID & Atribut)

| Komponen Undangan | Atribut Target di HTML (`id` / `data-key`) | Kolom Database Sumber | Format / Transformasi Output |
| :--- | :--- | :--- | :--- |
| **Meta Title & OG** | `<title>`, `og:title`, `meta-og-title` | `couples.bride_nickname`, `groom_nickname` | `The Wedding of {Bride} & {Groom}` |
| **Meta Deskripsi** | `meta[name=description]`, `og:description` | `couples`, `events[0]` | `Undangan Pernikahan {Bride} & {Groom} - {Tanggal}` |
| **Meta Image** | `og:image`, `meta-og-image` | `couples.cover_photo_url` / `groom_photo_url` | URL gambar cover |
| **Cover Nama Panggilan Pria** | `id="cover-groom"` & `id="name-groom"` | `couples.groom_nickname` (fallback `groom_name`) | Teks nama panggilan pria |
| **Cover Nama Panggilan Wanita** | `id="cover-bride"` & `id="name-bride"` | `couples.bride_nickname` (fallback `bride_name`) | Teks nama panggilan wanita |
| **Desktop / Hero Names** | `id="desktop-names"`, `id="hero-groom"`, `id="hero-bride"` | `couples.groom_nickname`, `bride_nickname` | `{Bride} &amp; {Groom}` |
| **Inisial Monogram Pria** | `id="cover-initials-groom"` | `couples.groom_nickname` | Huruf pertama uppercase (misal: `A`) |
| **Inisial Monogram Wanita** | `id="cover-initials-bride"` | `couples.bride_nickname` | Huruf pertama uppercase (misal: `F`) |
| **Inisial Gabungan** | `id="cover-initials"`, `id="cover-monogram"` | Keduanya | `{F} &amp; {A}` |
| **Nama Lengkap Wanita** | `id="bride-full"` | `couples.bride_name` | Teks nama lengkap & gelar wanita |
| **Nama Lengkap Pria** | `id="groom-full"` | `couples.groom_name` | Teks nama lengkap & gelar pria |
| **Ayah Pengantin Wanita** | `id="bride-father"` | `couples.bride_father` | Teks nama ayah wanita |
| **Ibu Pengantin Wanita** | `id="bride-mother"` | `couples.bride_mother` | Teks nama ibu wanita |
| **Ayah Pengantin Pria** | `id="groom-father"` | `couples.groom_father` | Teks nama ayah pria |
| **Ibu Pengantin Pria** | `id="groom-mother"` | `couples.groom_mother` | Teks nama ibu pria |
| **Alamat Pengantin Wanita** | `id="bride-address"` | `couples.bride_address` | Teks alamat lengkap kediaman wanita |
| **Alamat Pengantin Pria** | `id="groom-address"` | `couples.groom_address` | Teks alamat lengkap kediaman pria |
| **Foto Pengantin Wanita** | `id="bride-photo"` (`src="..."`) | `couples.bride_photo_url` | URL path foto |
| **Foto Pengantin Pria** | `id="groom-photo"` (`src="..."`) | `couples.groom_photo_url` | URL path foto |
| **Foto Cover Utama** | `id="cover-photo"` / `id="cover"` (style bg/src) | `couples.cover_photo_url` | URL path cover |
| **Tanggal di Cover** | `data-key="cover-date"`, `id="cover-date"` | `events[0].event_datetime` | Format: `d F Y` (cth: `29 November 2026`) |
| **Acara Index 0 (Akad)** | `data-key="event-0-date"`<br>`data-key="event-0-time"`<br>`data-key="event-0-venue"`<br>`data-key="event-0-address"`<br>`data-key="event-0-maps"` (href) | `events[0].event_datetime`<br>`events[0].event_end`<br>`events[0].venue_name`<br>`events[0].venue_address`<br>`events[0].google_maps_url` | Format Tanggal Indonesia lengkap<br>Format Jam: `07.00 WIB - Selesai`<br>Nama gedung/kediaman<br>Alamat lengkap<br>Tautan peta |
| **Acara Index 1 (Resepsi)** | `data-key="event-1-date"`<br>`data-key="event-1-time"`<br>`data-key="event-1-venue"`<br>`data-key="event-1-address"`<br>`data-key="event-1-maps"` (href) | `events[1].event_datetime`<br>`events[1].event_end`<br>`events[1].venue_name`<br>`events[1].venue_address`<br>`events[1].google_maps_url` | Tanggal Resepsi<br>Jam Resepsi<br>Tempat Resepsi<br>Alamat Resepsi<br>Tautan peta |
| **Hiburan Acara** | `data-key="event-0-entertainment"`, `data-key="event-1-entertainment"` | `entertainment[i].type` & `name` | `Hiburan: {Type} {Name}` |
| **Love Story (i = 0, 1, 2, ...)** | `data-key="story-{i}-label"`<br>`data-key="story-{i}-title"`<br>`data-key="story-{i}-content"` | `love_stories[i].story_date`<br>`love_stories[i].title`<br>`love_stories[i].content` | Tahun / Tanggal momen<br>Judul fase cerita<br>Paragraf cerita cinta |
| **Amplop / Rekening (i = 0, 1, ...)**| `data-key="wallet-{i}-bank"`<br>`data-key="wallet-{i}-number"`<br>`data-key="wallet-{i}-holder"`<br>`data-key="wallet-{i}-copy"` (`data-copy="..."`) | `digital_wallets[i].bank_name`<br>`digital_wallets[i].account_number`<br>`digital_wallets[i].account_holder` | Nama Bank (BCA, BRI, dll)<br>Nomor rekening bank<br>`a.n. {Holder}`<br>Atribut nomor rekening untuk fitur copy |
| **Kado Fisik** | `id="gift-recipient"`<br>`id="gift-address"`<br>`id="gift-copy-btn"` (`data-copy="..."`) | `couples.bride_name`<br>`couples.bride_address` | Penerima paket hadiah<br>Alamat tujuan pengiriman kado<br>Atribut alamat untuk tombol copy |
| **Background Music** | `<audio id="bg-music" src="...">` | `music.audio_url` | Link audio file MP3 |
| **Live Streaming** | `data-key="stream-0-url"` (href) | `livestreaming.youtube_url` | URL link YouTube siaran langsung |
| **Footer / Penutup** | `id="closing-couple"`<br>`id="closing-date"` | `couples.bride_nickname` & `groom_nickname`<br>`events[0].event_datetime` | `{Bride} & {Groom}`<br>`d F Y` |

---

## 3. Spesifikasi Arsitektur Pre-Rendering (True Static)

### A. Penghapusan Injeksi Skrip Berat
Blok berikut **tidak disisipkan lagi** ke HTML saat dicompile:
```html
<!-- DIHAPUS (TIDAK DIGUNAKAN LAGI) -->
<script>
  window.INVITATION_DATA = { ... seluruh payload order ... };
</script>
```

### B. Konfigurasi Minimal Tersisa
Hanya satu tag `<script>` ringan yang disisipkan sebelum `</head>`:
```html
<script>
  window.CONFIG = window.CONFIG || {};
  window.CONFIG.ORDER_ID = 'a757b2c1-d90e-11f1-9c1b-d8bbc11ae103';
  window.CONFIG.apiBase = '/api';
</script>
```

### C. Alur Kerja File Output
1. Admin / API menjalankan `InvitationCompiler::build($db, $orderId)`.
2. Tahun dihitung otomatis dari tanggal acara pertama (contoh: `2026`).
3. Seluruh asset tema disalin ke folder tujuan: `/{year}/{slug}/` (contoh: `/2026/agung-fitri/`).
4. File `index.html` tema dimuat ke memori PHP.
5. PHP melakukan regex search-and-replace langsung ke teks HTML berdasarkan tabel pemetaan di atas.
6. File disimpan sebagai file statis murni: `/{year}/{slug}/index.html`.
7. Tamu membuka undangan: HTML langsung berisi data mempelai asli (0 milidetik delay, tanpa FOUT dan tanpa overhead PHP engine).
8. JavaScript di browser tamu (`script.js` / `api.js`) hanya bertugas menangani interaksi dinamis: audio playback, countdown timer, submit RSVP, dan load komentar tamu.
