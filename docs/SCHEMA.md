# Skema Database: `invitation_permatawedding`

Terakhir diperbarui: 2026-11-21

## Ringkasan Tabel & Relasi

### 1. `themes`
- **Tujuan**: Katalog tema undangan digital.
- **Kolom Utama**:
  - `id` (CHAR(36), PK): UUID tema.
  - `name` (VARCHAR(100)): Nama tampilan tema (misal: "Royal Premium", "Pink Elegance").
  - `preview_img` (VARCHAR(100)): Path thumbnail preview tema.
  - `preview_url` (VARCHAR(255), NULL): URL demo tema.
  - `category` (VARCHAR(50), NULL): Kategori (misal: "minimalis", "premium").
  - `is_active` (TINYINT(1)): Status aktif (1/0).

### 2. `orders`
- **Tujuan**: Data pesanan dan transaksi utama.
- **Kolom Utama**:
  - `id` (CHAR(36), PK): UUID pesanan (disuntikkan ke runtime JS `ORDER_ID`).
  - `order_code` (VARCHAR(20), UNIQUE): Nomor faktur/kode pesanan.
  - `theme_id` (CHAR(36), FK -> `themes.id`): Tema yang dipilih.
  - `customer_name` (VARCHAR(150)), `customer_phone` (VARCHAR(20)).
  - `payment_status` (ENUM: unpaid, paid, partial, cancelled).
  - `order_slug` / `order_date`, `is_active` (TINYINT(1)).

### 3. `couples`
- **Tujuan**: Data profil pengantin pria dan wanita.
- **Kolom Utama**:
  - `id` (CHAR(36), PK): UUID.
  - `order_id` (CHAR(36), FK -> `orders.id`, CASCADE): Relasi 1-to-1 pesanan.
  - `slug_url` (VARCHAR(100), INDEX): Slug path URL undangan (misal: `agung-fitri`).
  - `cover_photo_url`, `groom_photo_url`, `bride_photo_url`.
  - `groom_name`, `groom_nickname`, `groom_father`, `groom_mother`, `groom_address`.
  - `bride_name`, `bride_nickname`, `bride_father`, `bride_mother`, `bride_address`.

### 4. `events`
- **Tujuan**: Rangkaian jadwal acara (Akad, Resepsi, dll.).
- **Kolom Utama**:
  - `id` (CHAR(36), PK): UUID.
  - `order_id` (CHAR(36), FK -> `orders.id`, CASCADE): Relasi 1-to-N pesanan.
  - `event_name` (VARCHAR(100)): Nama sesi acara.
  - `event_datetime` (DATETIME): Waktu mulai (menentukan tahun folder build `{year}`).
  - `event_end` (DATETIME, NULL): Waktu selesai.
  - `venue_name` (VARCHAR(200)), `venue_address` (TEXT), `google_maps_url` (VARCHAR(500)).
  - `sort_order` (SMALLINT).

### 5. `digital_wallets`
- **Tujuan**: Nomor rekening bank dan e-wallet kado digital.
- **Kolom Utama**:
  - `id` (CHAR(36), PK): UUID.
  - `order_id` (CHAR(36), FK -> `orders.id`, CASCADE): Relasi 1-to-N pesanan.
  - `wallet_type` (ENUM: bank, gopay, ovo, dana, shopeepay, other).
  - `bank_name` (VARCHAR(100)), `account_number` (VARCHAR(50)), `account_holder` (VARCHAR(150)).
  - `qr_code_url` (VARCHAR(255), NULL), `is_active` (TINYINT(1)).

### 6. `love_stories`
- **Tujuan**: Timeline cerita cinta mempelai.
- **Kolom Utama**:
  - `id` (CHAR(36), PK): UUID.
  - `order_id` (CHAR(36), FK -> `orders.id`, CASCADE): Relasi 1-to-N pesanan.
  - `title` (VARCHAR(150)), `content` (TEXT), `story_date` (DATE), `photo_url` (VARCHAR(255), NULL).
  - `sort_order` (SMALLINT).

### 7. `galleries`
- **Tujuan**: Foto-foto galeri pre-wedding.
- **Kolom Utama**:
  - `id` (CHAR(36), PK): UUID.
  - `order_id` (CHAR(36), FK -> `orders.id`, CASCADE): Relasi 1-to-N pesanan.
  - `photo_url` (VARCHAR(255)), `caption` (VARCHAR(255), NULL), `sort_order` (SMALLINT).

### 8. `music`
- **Tujuan**: Musik latar (background audio).
- **Kolom Utama**:
  - `id` (CHAR(36), PK): UUID.
  - `order_id` (CHAR(36), FK -> `orders.id`, CASCADE): Relasi 1-to-1 pesanan.
  - `title` (VARCHAR(150)), `artist` (VARCHAR(100)), `audio_url` (VARCHAR(500)), `autoplay` (TINYINT(1)), `loop` (TINYINT(1)).

### 9. `comments`
- **Tujuan**: Buku tamu, konfirmasi RSVP & ucapan selamat.
- **Kolom Utama**:
  - `id` (CHAR(36), PK): UUID.
  - `order_id` (CHAR(36), FK -> `orders.id`, CASCADE): Relasi 1-to-N pesanan.
  - `guest_name` (VARCHAR(150)), `attendance` (ENUM: hadir, tidak_hadir, ragu_ragu), `content` (TEXT).
  - `created_at` (TIMESTAMP).

### 10. Tabel Pendukung Lainnya
- `admins`: Autentikasi pengelola sistem (`id`, `username`, `password_hash`, `email`, `role`).
- `entertainment`: Pengisi hiburan musik/seni per acara (`order_id`, `name`, `type`).
- `livestreaming`: Tautan siaran online YouTube Live (`order_id`, `title`, `youtube_url`).
- `testimonials`: Ulasan pelanggan website Permata Wedding.
