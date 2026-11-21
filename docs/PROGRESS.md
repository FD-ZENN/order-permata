# Progress Pengembangan Proyek — Permata Wedding

Terakhir diperbarui: 2026-11-21

## Selesai
- Implementasi True Static Compiler murni (HTML output di `/{year}/{slug}/index.html` tanpa injeksi data besar `window.INVITATION_DATA`).
- Fitur sinkronisasi media (Opsi A) dari `uploads/{slug}/` ke subfolder build lokal `couple/` dan `gallery/`.
- Mekanisme pembersihan aset tema lama (`cleanThemeAssets`) dan total re-write saat pergantian tema.
- Implementasi algoritma *Blueprint Cloning* berkeseimbangan tag (`extractOuterContainerByMarker`) untuk memperbanyak slot rekening amplop digital dan kartu cerita cinta secara mandiri.
- Standardisasi dan adaptasi 8 tema:
  1. `pink-elegance`
  2. `premium-elegant-javanese`
  3. `premium-eternal-luxe`
  4. `premium-ivory-grace`
  5. `sakura-zen`
  6. `midnight-luxury`
  7. `fresh-minimal` (perbaikan amplop digital mandiri & mobile responsive)
  8. `royal-premium` (penyesuaian kontrak data, integrasi API komentar, pendaftaran ke DB, perapian styling & mobile responsiveness tuntas)
- Pembuatan Automated Unit Test Suite lengkap (100 test lolos / 100% PASS).
- Dokumentasi panduan arsitektur tema dan pemetaan elemen DOM (`PANDUAN_PENGEMBANGAN_DAN_OPTIMASI_TEMA.md`, `DATABASE_ELEMENT_MAPPING.md`).
- Penerapan sistem memori persisten proyek (`docs/MEMORY.md`, `docs/SCHEMA.md`, `docs/PROGRESS.md`, dan rules `.agents/`).
- Remediasi Keamanan Berstandar Cloudflare Security Audit:
  1. Penguncian seluruh rute mutasi API (POST/PUT/PATCH/DELETE) di `api/index.php` dengan kewajiban Bearer Token Admin.
  2. Pemasangan `uploads/.htaccess` anti Remote Code Execution (RCE) mematikan engine PHP dan script execution.
  3. Pengetatan otorisasi `UploadController` (publik hanya bisa upload `{slug}/couple` dan `{slug}/gallery`).
  4. Penerapan IP Rate Limiting pada `CommentController` (RSVP) dan `OrderController::storePublic`.
  5. Perluasan automated unit test suite menjadi 107 test (100% lolos / PASS).
- Penambahan Interactive Real-Time Loading & Status Modal pada proses pengiriman order (`index.html`, `script.js`) dengan stepper 3 tahap (Upload media -> Simpan database -> Static Pre-rendering) untuk mencegah kebingungan pengguna saat menunggu proses kompilasi.
- Peningkatan Kenyamanan Pengguna (UX) & Pemolesan Visual Formulir Pemesanan:
  1. Pemisahan tanggal & tombol cepat jam acara (Quick Time Chips) + opsi "Sampai Selesai".
  2. Quick chips nama sesi acara (Akad, Resepsi, Pemberkatan, dll.) dilengkapi micro-ikon tematik.
  3. Kartu duplikasi instan lokasi acara ke-2 dengan interactive luxury card styling.
  4. Quick presets inspirasi cerita cinta (Pertama Bertemu, Lamaran, dll.).
  5. Pilihan chip bank/e-wallet populer dengan ikon institusi & pembersihan nomor otomatis.
  6. Normalisasi nomor WhatsApp.
  7. Auto-save draft formulir ke LocalStorage dengan banner pemulihan bergaya Atelier Nuance.
  8. Pembersihan visual UI formulir menjadi simpel, bersih, profesional, dan bebas dari emoji.
- Modularisasi & Pemisahan Aset Form Pemesanan:
  1. Ekstraksi CSS dari `index.html` ke [assets/css/order.css](file:///c:/xampp/htdocs/order-permata/assets/css/order.css) (ukuran file HTML berkurang ~72% menjadi ~600 baris semantik).
  2. Modularisasi JavaScript ke direktori [assets/js/](file:///c:/xampp/htdocs/order-permata/assets/js/): `order-config.js`, `order-upload.js`, `order-events.js`, `order-music.js`, `order-components.js`, `order-stepper.js`, `order-draft.js`, `order-submit.js`, dan `order-app.js`.
  3. Verifikasi menyeluruh: Sintaks JS valid, seluruh unit test 100% PASS (107/107).
- Implementasi Fitur WhatsApp Gateway Modern, Generator & Statistik Admin:
  1. **One-Click Recompile / Build Generator**: Tombol aksi kompilasi ulang HTML statis dari database di tabel order & detail view (`POST /orders/{id}/recompile`).
  2. **Statistik & Kunjungan Undangan**: Penambahan kolom `views_count` di database `orders`, endpoint `POST /orders/{id}/view`, endpoint `GET /orders/stats`, serta kartu statistik total views di dashboard admin.
  3. **Tombol Live Preview Undangan**: Modal live preview responsif (Desktop & Layar Ponsel 375px) dengan tombol aksi di tabel order & detail pesanan.
  4. **WhatsApp Gateway Live Chat Inbox & Balas Cepat**: Tampilan percakapan dua arah (Two-Way Conversation View) dengan daftar kontak klien terindeks, filter pencarian cepat, bubble chat masuk/keluar, dan input balasan cepat (Ctrl+Enter).
  5. **Integrasi Chat API GoWA**: Pengambilan riwayat percakapan langsung dari server GoWA (`GET /chat/{jid}/messages`) digabungkan dengan log pesan SQLite lokal.
  6. **Status Koneksi Perangkat**: Indikator status koneksi real-time (`Connected`, `QR Code needed`, `Disconnected`) lengkap dengan info JID nomor WhatsApp yang terhubung.
  7. **Tombol Reconnect & Scan QR Code**: Aksi reconnect session (`/app/reconnect`) dan modal scan QR Code langsung dari server GoWA (`/app/login`).
- Implementasi Optimasi True Static Compiler & Rekap RSVP:
  1. **Resolusi URL Penuh pada Meta Tag OpenGraph**: Compiler otomatis menghasilkan URL absolut penuh pada `og:image`, `og:url`, dan `twitter:image` untuk memastikan thumbnail foto pengantin muncul sempurna di crawler WhatsApp, Telegram, dan Facebook.
  2. **Otomatisasi Hitungan Kunjungan (View Tracker)**: Injeksi otomatis beacon tracking ringan tanpa beban render (`navigator.sendBeacon` / `fetch keepalive`) dengan session guard anti-double-count.
  3. **Ekspor & Salin Rekap RSVP Tamu**: Tombol "Ekspor CSV" untuk mengunduh daftar tamu ke file Excel/CSV, dan tombol "Salin Rekap WA" untuk menyalin ringkasan kehadiran berformat rapi langsung ke clipboard.
  4. **Perluasan Unit Test Suite**: Automated unit tests diperluas menjadi 110 pengujian (100% PASS / Berhasil).
- Pembaruan Dokumentasi Publik Repository (GitHub README.md):
  1. Penambahan tautan Live Preview resmi: `https://invitation-test.permatawedding.com/`.
  2. Diagram alur interaktif (*Mermaid Flowchart*) dan penjelasan rinci 7-step alur pemesanan klien (Client Order Workflow) beserta tahapan pre-rendering otomatis di sisi server.

## Sedang Dikerjakan
- Pemantauan performa dan adaptasi tema undangan berikutnya.

## Belum Dikerjakan / Masalah Terbuka
- Audit performa Lighthouse / Core Web Vitals pada koneksi mobile 3G/4G riil di setiap tema.
- Sistem manajemen upload multi-file dari form admin jika ukuran gambar melampaui batas PHP post_max_size.
- Pembuatan antarmuka visual preview tema dinamis di admin panel.
