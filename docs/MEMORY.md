# Memori Persisten Proyek — Permata Wedding

## Cara Mencari
Cari memakai kata kunci: #database, #auth, #compiler, #template, [DB], [ENV], [STRUKTUR], [KEPUTUSAN], [BUG], [API], dst.

---

### [STRUKTUR] Arsitektur Monolitik PHP & True Static Pre-Rendering — 2026-11-21
- Fakta/keputusan: Proyek adalah sistem pembuatan & builder undangan pernikahan digital berbasis Native PHP 8.x (tanpa Laravel/Node.js backend framework) dengan arsitektur True Static Pre-Rendering. Folder output berupa HTML statis di `/{year}/{slug}/index.html` dan data dinamis (RSVP/ucapan) dilayani API RESTful murni.
- Lokasi terkait: `api/`, `templates/`, `tests/`
- Tag: #struktur #arsitektur #php

### [DB] Konfigurasi Database Tunggal — 2026-11-21
- Fakta/keputusan: Database MySQL tunggal bernama `invitation_permatawedding` menggunakan PDO. Konfigurasi dimuat via variabel environment dengan fallback default lokal.
- Lokasi terkait: `api/config/database.php` (variabel: `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `DB_CHARSET`)
- Tag: #database #db #pdo #koneksi

### [ENV] Variabel Environment Proyek — 2026-11-21
- Fakta/keputusan: Variabel lingkungan dikelola di `.env` (dilindungi oleh `.gitignore`). File template referensi tersedia di `.env.example`.
- Lokasi terkait: `.env`, `.env.example`, `api/config/app.php`, `api/config/database.php`
- Tag: #env #keamanan #jwt #config

### [KEPUTUSAN] Opsi A Sinkronisasi Media & Total Re-write Tema — 2026-11-21
- Fakta/keputusan: Saat undangan di-build atau berganti tema, foto dari `uploads/{slug}/` disinkronkan otomatis ke subfolder lokal build `{year}/{slug}/couple/` & `gallery/`. Aset tema lama dibersihkan tuntas (`cleanThemeAssets`), lalu `index.html` ditulis ulang 100% statis.
- Lokasi terkait: `api/core/InvitationCompiler.php`
- Tag: #keputusan #compiler #media #sinkronisasi

### [KEPUTUSAN] Standar Kontrak Template & Larangan Hardcode — 2026-11-21
- Fakta/keputusan: Semua tema (`templates/*`) dilarang keras menyuntikkan `window.INVITATION_DATA` atau mendeklarasikan `const CONFIG =` keras di JS tema. Harus menggunakan `id` & `data-key` standar, serta audio lokal `../../cdn/`.
- Lokasi terkait: `templates/`, `tests/ThemeContractTest.php`
- Tag: #keputusan #template #kontrak #html

### [BUG] Ekstraksi Outer Container Blueprint Cloning Amplop & Story — 2026-11-21
- Fakta/keputusan: Regex single-tag div sebelumnya memotong inner card-body pada amplop digital bertingkat sehingga card rekening menumpuk di satu box. Diperbaiki dengan scanner balanced-div `extractOuterContainerByMarker()` dan `extractBalancedTag()` di compiler.
- Lokasi terkait: `api/core/InvitationCompiler.php`
- Tag: #bug #compiler #amplop #story #blueprint

### [SERVER] Header Authorization Hilang di PHP-FPM / FastCGI (401 Unauthorized) — 2026-11-21
- Fakta/keputusan: Server Apache dengan PHP-FPM / CGI / Proxy secara default memotong header `Authorization: Bearer <token>`. Akibatnya, request admin seperti `GET /api/orders/stats` ditolak dengan status 401 Unauthorized karena `$_SERVER['HTTP_AUTHORIZATION']` kosong.
- Solusi:
  1. Di `.htaccess` ditambahkan rule rewritenya: `RewriteCond %{HTTP:Authorization} .` dan `RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]`.
  2. Di `Middleware::getAuthorizationHeader()`, ditambahkan fallback `$_SERVER['REDIRECT_HTTP_AUTHORIZATION']`.
- Lokasi terkait: `.htaccess`, `api/core/Middleware.php`
- Tag: #server #apache #php-fpm #authorization #bearer #jwt #401

### [FRONTEND] Normalisasi Auto-Detect API Base URL Admin Panel — 2026-11-21
- Fakta/keputusan: Pada browser yang pernah membuka admin di localhost, `localStorage` menyimpan `wd_base = "http://localhost/order-permata/api"`. Saat dibuka di live domain (`https://invitation-test.permatawedding.com/admin/`), admin panel masih memanggil URL localhost atau URL dengan prefix `/order-permata/api/auth/login` yang menghasilkan 404.
- Solusi: Di `admin/assets/app.js`, ditambahkan deteksi dinamis: jika `window.location.origin` bukan localhost, `baseUrl` otomatis disetel ke `${window.location.origin}/api` dan meng-override nilai usang di `localStorage`.
- Lokasi terkait: `admin/assets/app.js`
- Tag: #admin #api #url #404 #localstorage #auth

### [CONFIG] Konfigurasi RATE_LIMIT_ENABLED & Reset Storage — 2026-11-21
- Fakta/keputusan: Rate limiter menyimpan file JSON hitungan di direktori temporary sistem: `sys_get_temp_dir() . '/wedding_api_ratelimit'` (di Linux: `/tmp/wedding_api_ratelimit`).
- Reset manual via SSH/Terminal: `rm -rf /tmp/wedding_api_ratelimit/*`.
- Mematikan sementara: Ditambahkan konstanta `RATE_LIMIT_ENABLED` di `api/config/app.php` (bisa diatur via file `.env` dengan `RATE_LIMIT_ENABLED=false`).
- Lokasi terkait: `api/config/app.php`, `api/core/RateLimiter.php`
- Tag: #config #ratelimit #reset #temp

### [SERVER] Permission Denied mkdir() pada Hosting Linux / aaPanel — 2026-11-21
- Fakta/keputusan: Server Linux aaPanel berjalan di bawah user `www:www`. Jika root repository atau subfolder tahun (`2026/`) dimiliki oleh `root:root` (misal setelah git clone/pull via terminal SSH), proses PHP-FPM tidak memiliki izin (`Permission denied`) untuk membuat folder `/{year}/{slug}/`.
- Solusi:
  1. Di server aaPanel/Linux jalankan: `chown -R www:www /www/wwwroot/invitation-test.permatawedding.com` dan `chmod -R 755 /www/wwwroot/invitation-test.permatawedding.com`.
  2. Di `InvitationCompiler.php`, `mkdir` dibungkus dengan supresi `@` dan deteksi error yang melempar exception deskriptif alih-alih melempar PHP Warning yang merusak JSON Response.
- Lokasi terkait: `api/core/InvitationCompiler.php`
- Tag: #server #linux #permissions #chown #aapanel #mkdir

### [SERVER] Apache/Nginx .htaccess 500 Error pada uploads/.htaccess — 2026-11-21
- Fakta/keputusan: Server produksi modern (Apache 2.4+ dengan PHP-FPM / FastCGI / Nginx proxy) melempar HTTP 500 saat membaca `php_flag engine off` di luar modul PHP prefork Apache standar (`mod_php`).
- Solusi: Seluruh direktif modul PHP di `uploads/.htaccess` dibungkus dalam blok `<IfModule mod_php.c>`, `<IfModule mod_php7.c>`, dan `<IfModule mod_php8.c>`. Proteksi eksekusi utama dialihkan ke standar Apache modern `<IfModule mod_authz_core.c>` dengan `Require all denied` untuk file script (`.php`, `.phtml`, dll). File media (.png, .jpg, .webp) dapat diakses langsung oleh web browser tanpa 500 error.
- Lokasi terkait: `uploads/.htaccess`
- Tag: #server #htaccess #apache #500 #uploads #keamanan

### [BUG] Ekstensi Fileinfo Tidak Aktif di Server Hosting (mime_content_type) — 2026-11-21
- Fakta/keputusan: Error fatal `Call to undefined function mime_content_type()` terjadi di server live aaPanel (`/www/wwwroot/...`) karena ekstensi PHP `fileinfo` belum dicentang/diaktifkan.
- Solusi: Diimplementasikan fallback deteksi MIME berjenjang di `UploadController::detectMimeType()`:
  1. `mime_content_type()` jika fileinfo aktif.
  2. `finfo_open(FILEINFO_MIME_TYPE)` jika modul finfo tersedia.
  3. `getimagesize()` membaca signature header gambar secara native (selalu tersedia di PHP dengan GD).
- Lokasi terkait: `api/controllers/UploadController.php`
- Tag: #bug #upload #mime #fileinfo #server #aapanel

### [API] Endpoint Komentar & RSVP — 2026-11-21
- Fakta/keputusan: Endpoint RSVP dan ucapan doa dilayani oleh `CommentController` di path `/api/comments` dengan method GET (query `order_id`) dan POST (payload JSON: `order_id`, `guest_name`, `attendance`, `content`).
- Lokasi terkait: `api/controllers/CommentController.php`, `api/index.php`
- Tag: #api #rsvp #komentar

### [STRUKTUR] Standarisasi Aset & Responsivitas Tema Royal-Premium — 2026-11-21
- Fakta/keputusan: Tema `royal-premium` telah dirapikan tuntas: folder redundant `images/` dan `img/` dihapus; jalur gambar di CSS/HTML disatukan ke `couple/` dan `gallery/`; breakpoint mobile dibuat presisi pada 768px dan <= 480px; touch target tombol >= 44px; blueprint kartu cerita & amplop digital rapi tanpa overflow.
- Lokasi terkait: `templates/royal-premium/` (`index.html`, `css/style.css`)
- Tag: #template #royal-premium #css #responsive #mobile

### [BUG] Inisial Dobel Akibat Tag Bersarang pada #cover-initials — 2026-11-21
- Fakta/keputusan: Regex `replaceElementContent` mencari tag penutup pertama (`</span>`). Jika `#cover-initials` membungkus span `#cover-initials-groom` dan `#cover-initials-bride`, compiler me-replace inner span terlebih dahulu lalu tag outer, menyisakan tag anak kedua sehingga teks inisial dobel (misal `F & A & F`). Standar kontrak: `#cover-initials` harus berupa elemen tunggal tanpa nested span (`<span id="cover-initials">A &amp; Y</span>`).
- Lokasi terkait: `api/core/InvitationCompiler.php`, `templates/*/index.html`
- Tag: #bug #compiler #initials #html

### [UX] Penyempurnaan Form Pemesanan: Quick Chips, Presets & Auto-Draft — 2026-11-21
- Fakta/keputusan: Meningkatkan kenyamanan dan kecepatan calon pengantin saat mengisi form pesanan (`index.html` & `script.js`):
  1. Quick Time Chips & Sampai Selesai: Pemisahan tanggal dan jam acara, dilengkapi tombol pill jam populer (08:00, 09:00, 10:00, 11:00, 13:00, 19:00) dan checkbox "Sampai Selesai (s/d selesai)".
  2. Quick Event Name Chips: Tombol chip nama acara instan (+ Akad Nikah, + Pemberkatan, + Resepsi, + Ngunduh Mantu, + Walimatul 'Ursy).
  3. Duplikasi Cerdas Lokasi: Tombol "Klik di sini untuk menggunakan Lokasi & Alamat yang sama dengan Acara 1" pada acara ke-2 dst.
  4. Presets Judul Cerita Cinta: Quick chip inspirasi momen (Pertama Bertemu, Menjalin Hubungan, Lamaran / Khitbah, Menuju Hari Bahagia).
  5. Pilihan Bank Populer & Auto-Clean: Quick chip bank (BCA, Mandiri, BRI, BNI, BSI, DANA, GoPay, OVO, ShopeePay) dengan pembersih spasi/tanda hubung otomatis.
  6. Normalisasi Otomatis No. WhatsApp: Input telp otomatis diselaraskan formatnya (08...).
  7. Auto-Save Draft (LocalStorage): Menyimpan progres pengisian secara real-time ke browser, dengan banner pemulihan draf otomatis jika halaman ter-refresh/tertutup.
  8. Estetika & Polishing UI Desain Eksklusif Permata Wedding:
     - Draf Banner: Palet warm canvas minimalis tanpa elemen dekoratif berlebihan, tombol pulihkan dan mulai baru yang ringkas.
     - Quick Chips: Dibuat simpel, bersih, profesional, bebas emoji, berukuran kompak dengan padding proporsional sehingga nyaman diklik di layar smartphone.
     - Tombol Duplikasi Lokasi: Tombol fungsional bersih bertuliskan "Salin Lokasi & Alamat dari Acara 1" yang hemat ruang dan to the point.
     - Modal Processing: Menggunakan stepper native dialog bersih tanpa elemen visual yang mengganggu fokus.
- Lokasi terkait: `index.html`, `script.js`
- Tag: #ux #form #order #chips #presets #autodraft #storage #ui #design

- Fakta/keputusan: Menghilangkan kesan "macet" saat pengguna menekan tombol "Kirim & Simpan Data Order". Diterapkan modal dialog interaktif standar native Baseline `<dialog id="order-processing-modal">` dengan backdrop blur, semantic indeterminate `<progress class="order-spinner">`, dan 3-step indikator visual progres real-time:
  1. "Mengunggah & mengompresi media foto" (menampilkan progress upload galeri/foto)
  2. "Menyimpan data mempelai, jadwal acara & amplop digital" (penyimpanan transaksi database)
  3. "Pre-rendering & kompilasi website undangan" (proses static site generation di server)
- Lokasi terkait: `index.html`, `script.js`
- Tag: #ux #loading #modal #dialog #spinner #progress #order

- Fakta/keputusan: Dilakukan hardening keamanan komprehensif berstandar Cloudflare Security Audit:
  1. Proteksi Route Mutasi: Seluruh operasi tulis (POST, PUT, PATCH, DELETE) di semua resource API wajib menyertakan token Bearer Admin (`Middleware::requireAdmin()`), kecuali dua endpoint publik resmi: `POST /orders/public` dan `POST /comments`.
  2. Proteksi Eksekusi Upload: Direktori `uploads/.htaccess` dipasangi aturan `php_flag engine off`, `Options -ExecCGI -Indexes`, serta penonaktifan handler script eksekusi (.php, .phtml, .phar, dll).
  3. Otorisasi Upload Controller: Non-admin dibatasi hanya dapat mengunggah ke folder berformat `{slug}/couple` atau `{slug}/gallery` dengan IP rate limiter, sementara folder lain dan aksi template/testimoni wajib admin.
  4. Anti-Spam Rate Limiting & XSS: `CommentController` dibatasi 5 request/menit per IP serta input di-escape (`htmlspecialchars`), dan `OrderController::storePublic` dibatasi 5 pesanan/10 menit per IP.
- Lokasi terkait: `api/index.php`, `uploads/.htaccess`, `api/controllers/UploadController.php`, `api/controllers/CommentController.php`, `api/controllers/OrderController.php`, `tests/SecuritySanitizationTest.php`
- Tag: #keamanan #security #cloudflare #auth #ratelimit #upload #api

### [UX] Penyederhanaan Dropdown Nama Acara, Jam Tunggal & Judul Cerita — 2026-11-21
- Fakta/keputusan: Mengatasi keluhan antarmuka yang penuh sesak dan pilihan jam dobel pada form pemesanan (`script.js` & `index.html`):
  1. Pilihan Jam Tunggal (Eliminasi Dobel): Mengganti barisan chip jam dan input time browser native yang bertumpuk dengan satu elemen `<select>` dropdown jam interval 30 menit (06:00 - 23:30 WIB) yang ringkas dan hemat ruang layar HP. Checkbox "Sampai Selesai" tetap men-disable dropdown jam selesai.
  2. Dropdown Nama Acara: Mengganti deretan chip nama acara dengan `<select id="ev-name-select-${n}">` opsi standar (Akad Nikah, Resepsi Pernikahan, Pemberkatan, Ngunduh Mantu, Walimatul 'Ursy, Siraman & Pengajian, dan opsi Lainnya yang otomatis memunculkan input teks kustom jika dipilih).
  3. Dropdown Judul Cerita: Mengganti chips judul cerita cinta dengan `<select id="st-title-select-${n}">` (Pertama Bertemu, Menjalin Hubungan, Lamaran / Khitbah, Menuju Hari Bahagia, Momen Spesial, dan opsi Lainnya untuk kustom).
  4. Styling Bersih & Bebas Emoji: Elemen `<select>` dilengkapi chevron panah SVG elegan, tanpa emoji dekoratif, mendukung auto-save dan restore draf LocalStorage secara mulus.
- Lokasi terkait: `script.js`, `index.html`
- Tag: #ux #dropdown #select #events #stories #form #mobile-friendly #clean-ui

### [UX] Saran Alamat Mempelai, Minimalisasi Form Musik & Sinkronisasi Live Streaming — 2026-11-21
- Fakta/keputusan: Meningkatkan kecepatan pengisian dan kerapian UI form pesanan (`script.js` & `index.html`):
  1. Sugest Ambil Alamat Mempelai Pria/Wanita: Pada field Alamat Lengkap Sesi Acara, ditambahkan tombol sugesti instan "Alamat Pria" dan "Alamat Wanita" (`copyAddressFromPerson`) yang langsung menyalin alamat dari Langkah 2 tanpa perlu mengetik ulang.
  2. Penyembunyian URL Audio & Autoplay/Loop: URL MP3, checklist Autoplay, dan Loop disembunyikan (hidden input dengan default autoplay 1 & loop 1) agar form musik bersih. Ditampilkan hanya pilihan preset musik Permata Wedding, input Judul Lagu, Artis/Penyanyi, dan tombol Play/Jeda preview interaktif. Log console debug CDN musik dibersihkan pada mode produksi.
  3. Sinkronisasi Data Live Streaming dari Acara: Pada bagian Live Streaming, ditambahkan tombol cerdas "Ambil dari [Nama Acara]" (`copyLiveFromEvent`) yang secara otomatis menyelaraskan judul siaran ("Live Streaming [Nama Acara]"), jadwal mulai, dan jadwal selesai langsung dari sesi acara yang telah diisi.
- Lokasi terkait: `assets/js/order-events.js`, `assets/js/order-music.js`, `assets/js/order-components.js`, `assets/css/order.css`, `index.html`
- Tag: #ux #saran-alamat #musik-clean #live-streaming #sinkronisasi #form

### [STRUKTUR] Modularisasi & Pemisahan Aset Form Pemesanan (HTML, CSS, JS) — 2026-11-21
- Fakta/keputusan: Merestrukturisasi form pemesanan `index.html` dan `script.js` yang semula monolitik raksasa (>2.100 baris HTML+CSS dan >1.900 baris JS) menjadi arsitektur modular bersih:
  1. CSS: Seluruh styling diekstrak ke `assets/css/order.css` (terhubung melalui `<link rel="stylesheet" href="assets/css/order.css?v=2.0">`), mereduksi `index.html` dari 2.161 baris menjadi ~600 baris semantik murni.
  2. JavaScript Modular: Memecah logika fungsional ke dalam `assets/js/`:
     - `order-config.js`: Deklarasi `ORDER`, constants domain, helper `apiPublic`, upload API, DOM helper `esc`, `getV`, toast, slug validation.
     - `order-upload.js`: Upload single/multi, kompresi client-side (`compressImageFile`), dan manajemen pratinjau galeri dinamis (`removeGalleryFile`).
     - `order-events.js`: Pengelolaan acara, dropdown nama acara, jam tunggal, copy lokasi & alamat mempelai.
     - `order-music.js`: Pilihan preset musik CDN, audio preview player (play/jeda).
     - `order-components.js`: Love stories, live streaming sync, bank/e-wallet presets, hiburan, dynamic item remover.
     - `order-stepper.js`: Wizard stepper navigation (1-7), validasi bertahap multi-step, serta navigasi bebas klik indikator atas.
     - `order-draft.js`: Auto-save & pemulihan draf LocalStorage (`permata_order_form_draft_v1`).
     - `order-submit.js`: Pengumpulan data form (`collectEvents`, dll.), review table builder, submit modal status, kompresi galeri, WhatsApp share.
     - `order-app.js`: Inisialisasi awal pada `DOMContentLoaded` dan pendaftaran event listener klik indikator stepper.
  3. Perbaikan Border-Left & Desain Bersih:
     - Garis `border-left` pada sidebar admin (`.nav-item.active`) dan form order (`.brand-tag`, `.draft-alert-banner`) telah dibersihkan seluruhnya untuk tampilan minimalis modern.
  4. Kompresi Canvas Sisi Klien & Manajemen Galeri:
     - Foto mempelai dan galeri kamera (5MB-15MB) dikompres otomatis di memori browser dengan HTML5 Canvas (resolusi maks 1600px, WebP/JPEG 0.82-0.85) menyusut hingga ~90% (300KB-600KB) sebelum dikirim, menghilangkan risiko payload timeout di jaringan seluler.
     - Pratinjau galeri dilengkapi tombol silang `(×)` pada tiap foto untuk membatalkan/menghapus pilihan foto individual secara instan.
  5. Navigasi Stepper Bebas Loncat:
     - Bulatan indikator langkah di bagian atas kini dapat diklik langsung kapan saja untuk kembali ke langkah sebelumnya atau melompat ke langkah berikutnya (dengan validasi bertahap otomatis).
  6. Kompatibilitas & Testing: Semua automated unit tests (107 tests) lolos sempurna (100% PASS).
- Lokasi terkait: `index.html`, `assets/css/order.css`, `admin/assets/style.css`, `assets/js/*.js`
- Tag: #struktur #refactor #modular #css #js #kompresi #canvas #galeri #stepper #clean-ui

### [COMPILER & RSVP] Resolusi OpenGraph Absolut, View Beacon, dan Rekap RSVP — 2026-11-21
- Fakta/keputusan: Menyelesaikan masalah link preview media sosial dan pelaporan kehadiran tamu untuk pengantin:
  1. Resolusi URL Absolut OpenGraph: `InvitationCompiler::injectMetaAndConfig` kini otomatis merender URL absolut penuh (`https://invitation.permatawedding.com/{year}/{slug}/couple/cover.jpg?v=...`) pada tag `og:image`, `og:url`, `twitter:image`, dan `twitter:title`. Hal ini memastikan thumbnail foto sampul muncul sempurna saat link undangan dibagikan di WhatsApp, Telegram, Facebook, dan iMessage.
  2. Otomatisasi Kunjungan Undangan (View Tracker): Injeksi skrip non-blocking pada HTML statis hasil compile yang menggunakan `navigator.sendBeacon(apiBase + '/orders/{id}/view')` atau `fetch keepalive` dengan perlindungan `sessionStorage` guard agar reload tidak dihitung ganda.
  3. Ekspor & Salin Rekap RSVP Tamu: Pada tab *RSVP & Ucapan* di Detail Order admin, ditambahkan tombol *Ekspor CSV* (format Excel/CSV lengkap dengan encoding UTF-8 BOM) dan tombol *Salin Rekap WA* yang secara cerdas merangkum total hadir, berhalangan, ragu-ragu, serta daftar nama tamu berformat rapi siap dikirim ke WhatsApp pengantin.
  4. Pengujian: Automated unit test suite diperluas menjadi 110 tests (100% PASS).
- Lokasi terkait: `api/core/InvitationCompiler.php`, `admin/index.html`, `admin/assets/app.js`, `tests/CompilerBuildTest.php`
- Tag: #compiler #opengraph #thumbnail-wa #view-beacon #rsvp #ekspor-csv #rekap-wa

### [TEMA] Inspeksi Mendalam & Perbaikan Total Tema Sakura-Zen — 2026-11-22
- Fakta/keputusan: Tema `sakura-zen` mengalami gambar mempelai tidak muncul (berganti avatar placeholder), cover broken, dan error runtime JavaScript.
- Akar Masalah & Temuan:
  1. Jalur Gambar Salah di Template Master: File `templates/sakura-zen/index.html` menunjuk ke `images/mempelai-pria.jpg` dan `images/mempelai-wanita.jpg` yang tidak ada (karena di folder `images/` hanya ada `fl.png` dan `fl2.png`, sementara foto fisik berada di `couple/mempelai-pria.jpg` dan `couple/mempelai-wanita.jpg`).
  2. Handler Onerror Placeholder: Tag `<img>` memiliki atribut `onerror="this.src = 'https://ui-avatars.com/...'" ` yang langsung menggantikan foto dengan avatar saat link salah/404.
  3. Cover Image Hilang: `#cover-photo` menunjuk ke `images/cover.jpg` yang tidak ada.
  4. Ketergantungan Hardcode Domain Runtime JS: `templates/sakura-zen/js/script.js` memiliki `const BASE_DOMAIN = "https://invitation.permatawedding.com"` dan `CONFIG.apiBase` hardcode yang menimpa path relatif lokal `couple/...` dengan domain luar, memicu error 404 saat dibuka di localhost / staging.
  5. Uncaught Throw Error di `fetchAllData()`: Melempar `throw new Error("Data couple tidak ditemukan")` saat `CONFIG.ORDER_ID` kosong / mode statis murni.
  6. Styling CSS Kisah Cinta Hilang: Class `.timeline-jp`, `.tl-item`, `.tl-dot`, dll. tidak memiliki deklarasi di `css/style.css`.
- Solusi & Perbaikan:
  1. Standardisasi Path Gambar: Mengarahkan `src` foto mempelai ke `couple/mempelai-pria.jpg` dan `couple/mempelai-wanita.jpg`, menambahkan `loading="lazy"` & `decoding="async"`, serta menghapus atribut `onerror` ui-avatars.
  2. Penyediaan Cover & Dukungan Compiler: Menyalin file `cover.jpg` default ke `templates/sakura-zen/couple/cover.jpg`, memperbarui CSS/HTML `#cover-photo`, dan menambahkan regex replacement background `#cover-photo` pada `InvitationCompiler.php`.
  3. Pembersihan Runtime JS & Dynamic Origin Resolver: Mengubah `BASE_DOMAIN` hardcode ke resolver dinamis `_BASE_DOMAIN` berbasis origin aktif; memasang guard pada `fetchAllData()` jika `ORDER_ID` kosong agar tidak throw exception; melindungi seluruh fungsi render (`renderCouple`, `renderEvents`, `renderStories`, `renderGalleries`, `renderWallets`) agar data yang sudah di-pre-render statis oleh compiler tidak ditimpa/dikosongkan.
  4. Penambahan Styling Timeline Kisah Cinta di `css/style.css`: Menambahkan styling `.timeline-jp`, `.tl-item`, `.tl-dot`, `.tl-content`, `.tl-title`, `.tl-date`, dan `.tl-text` dengan aksen crimson Jepang yang responsif.
  5. Verifikasi & Pengujian: Uji build compiler tema Sakura-Zen berhasil 100%, seluruh 110 unit tests PASS tanpa error.
- Lokasi terkait: `templates/sakura-zen/index.html`, `templates/sakura-zen/css/style.css`, `templates/sakura-zen/js/script.js`, `templates/sakura-zen/couple/cover.jpg`, `api/core/InvitationCompiler.php`
- Tag: #tema #sakura-zen #foto-mempelai #cover #compiler #javascript #css #timeline





