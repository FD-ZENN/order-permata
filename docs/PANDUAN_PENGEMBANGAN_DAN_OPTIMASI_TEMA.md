# PANDUAN LENGKAP PENGEMBANGAN, ADAPTASI & OPTIMASI TEMA UNDANGAN DIGITAL
## Permata Wedding — Arsitektur True Static Pre-Rendering & Universal Platform Standards

> [!IMPORTANT]
> **DOKUMEN INI ADALAH STANDAR BAKU PROYEK (MANDATORY STANDARD)**  
> Panduan ini disusun untuk developer internal, developer eksternal, desainer tema, maupun AI Coding Agent. Dokumen ini memuat seluruh kaidah, kontrak elemen HTML, arsitektur sinkronisasi media, pencegahan error runtime, integrasi API, serta tata cara mengonversi tema dari nol (0) maupun tema pihak ketiga (WordPress, ThemeForest, Envato, HTML template biasa) agar **100% kompatibel** dengan sistem build Permata Wedding tanpa ambigu.

---

## DAFTAR ISI
1. [Standar Baku Rekayasa Web (Modern Web Guidance & Security Audit)](#1-standar-baku-rekayasa-web)
2. [Prinsip Arsitektur: 100% True Static Pre-Rendering](#2-prinsip-arsitektur-100-true-static-pre-rendering)
3. [Struktur Standar Direktori Tema](#3-struktur-standar-direktori-tema)
4. [Mekanisme Sinkronisasi Media (Opsi A — Self-Contained Output)](#4-mekanisme-sinkronisasi-media)
5. [Kontrak Atribut HTML Wajib (Standard Data Mapping)](#5-kontrak-atribut-html-wajib)
6. [Penanganan Elemen Berulang (Blueprint Cloning)](#6-penanganan-elemen-berulang-blueprint-cloning)
7. [Penanganan Bagian Kosong (Auto-Hide on Empty)](#7-penanganan-bagian-kosong-auto-hide-on-empty)
8. [Penanganan Audio & Jalur Musik (Jebakan 404 & Solusi)](#8-penanganan-audio--jalur-musik)
9. [Interaktivitas, Minimal Config & Form RSVP / Komentar](#9-interaktivitas-minimal-config--form-rsvp--komentar)
10. [Panduan Langkah demi Langkah: Membuat Tema Baru dari Nol atau Tema Eksternal](#10-panduan-langkah-demi-langkah-membuat-tema-baru)
11. [Checklist Final Verifikasi Tema Sebelum Masuk Produksi](#11-checklist-final-verifikasi-tema)

---

## 1. Standar Baku Rekayasa Web

Setiap tema wajib mematuhi dua pilar standar rekayasa:

### A. Google Chrome Modern Web Guidance (`modern-web-guidance`)
* **Performa & Core Web Vitals (CWV)**:
  * **LCP (Largest Contentful Paint)**: Gambar cover / hero utama wajib dimuat secepat mungkin dengan:
    ```html
    <img src="couple/cover.jpg" alt="Cover" loading="eager" fetchpriority="high" />
    ```
  * **Lazy Loading**: Seluruh gambar di bawah lipatan (galeri, ornamen, foto mempelai) wajib menggunakan native lazy loading:
    ```html
    <img src="gallery/galeri-1.jpg" alt="Galeri" loading="lazy" decoding="async" />
    ```
  * **CLS (Cumulative Layout Shift)**: Semua gambar, frame foto, dan layout wajib memiliki rasio aspek atau dimensi eksplisit:
    ```css
    .couple-photo-frame { aspect-ratio: 1 / 1; width: 100%; object-fit: cover; }
    ```
  * **INP (Interaction to Next Paint)**: Hindari blocking execution pada main thread. Inisialisasi plugin berat (seperti Swiper, AOS, Lightbox) dijalankan secara asynchronous atau ditunda hingga cover dibuka tamu.
* **Modern Baseline APIs**:
  * Utamakan CSS modern native: CSS Grid, Flexbox, CSS Subgrid, `@starting-style`, dan CSS Variables (`:root`).
  * Hindari library dependensi berlebih jika platform browser modern sudah menyediakannya.
* **Aksesibilitas (a11y)**:
  * Gunakan semantik HTML murni: `<header>`, `<main>`, `<section>`, `<article>`, `<button>`, `<nav>`.
  * Tombol wajib menggunakan tag `<button type="button">`, bukan `<a href="javascript:void(0)">` atau `<div onclick="...">`.
  * Sertakan atribut `alt` bermakna pada gambar dan `aria-label` pada tombol ikon navigasi/musik.

### B. Cloudflare Security Audit (`security-audit`)
* **Sanitasi Kontekstual XSS**:
  * Seluruh teks dinamis yang disuntikkan ke HTML wajib disanitasi menggunakan `htmlspecialchars($text, ENT_QUOTES, 'UTF-8')`.
* **Database Prepared Statements**:
  * Interaksi backend wajib menggunakan PDO Prepared Statements dengan parameter binding (`:param`). Dilarang keras melakukan string concatenation SQL query.
* **Keamanan Unggahan & File Handling**:
  * Validasi MIME-type riil berbasis byte stream (magic bytes).
  * Bersihkan nama file dari karakter berbahaya dan path traversal (`../`).
  * Folder target tidak boleh mengeksekusi skrip server side (.php, .phtml, .cgi).

---

## 2. Prinsip Arsitektur: 100% True Static Pre-Rendering

### Kenapa True Static Pre-Rendering?
Mayoritas tamu membuka undangan pernikahan lewat koneksi seluler saat di jalan atau di lokasi acara. Jika undangan mengandalkan Client-Side Rendering (CSR) via JavaScript:
1. Muncul **FOUT (Flash of Unstyled Text)** atau layar putih (white screen).
2. Teks dummy template bawaan sempat terlihat oleh tamu sebelum API merespons.
3. Metadata OpenGraph / WhatsApp preview gagal terbaca oleh crawler chat karena crawler WhatsApp/Facebook tidak mengeksekusi JavaScript.

### Aturan Arsitektur Compiler:
1. **0ms First Contentful Paint (FCP)**: Seluruh nama pengantin, orang tua, alamat, tanggal acara, venue, link maps, cerita cinta, nomor rekening, dan foto **HARUS DITULIS LANGSUNG KE DALAM TAG HTML** oleh `InvitationCompiler.php`.
2. **DILARANG MENGGUNAKAN INJEKSI SKRIP BERAT**:
   Jangan pernah menyuntikkan `<script>window.INVITATION_DATA = { ... };</script>` ke dalam HTML hasil kompilasi. Tamu tidak perlu mem-parsing puluhan kilobyte JSON untuk membaca undangan.
3. **Hasil Akhir Murni `index.html`**:
   Output disimpan langsung sebagai file `index.html` murni di `/{year}/{slug}/` (contoh: `/2026/agung-fitri/index.html`). Jika ada file `index.php` lama di folder tujuan, compiler akan otomatis menghapusnya agar server web langsung menyajikan `index.html` statis super cepat.

---

## 3. Struktur Standar Direktori Tema

Setiap tema di dalam folder `templates/` (contoh: `templates/premium-elegant-javanese/`) wajib memiliki struktur direktori berikut:

```
templates/<nama-tema>/
├── index.html                 # Master template HTML dengan atribut standar
├── thumbnail.png              # Preview gambar tema untuk admin (600x400 / 800x600)
├── css/
│   ├── style.css              # Styling utama tema
│   └── responsive.css         # Styling responsive mobile & tablet (opsional jika di style.css)
├── js/
│   ├── script.js              # Interaksi UI, buka cover, animasi AOS, countdown, audio
│   └── api.js                 # Handler interaktif (Form RSVP, Submit Doa, Load Komentar)
├── assets/                    # Aset tema bawaan (ornamen WebP/SVG, background, dekorasi)
├── couple/                    # File placeholder foto pengantin default
│   ├── cover.jpg
│   ├── mempelai-pria.jpg
│   └── mempelai-wanita.jpg
└── gallery/                   # File placeholder galeri default
    ├── galeri-1.jpg
    ├── galeri-2.jpg
    └── ...
```

> [!NOTE]
> Semua pemanggilan aset internal di dalam template **WAJIB MENGGUNAKAN PATH RELATIF**, contoh: `assets/images/bg.webp`, `css/style.css`, `couple/cover.jpg`. **Dilarang** menggunakan awalan slash absolut seperti `/assets/...` karena akan merusak halaman saat dibuka di subpath folder.

---

## 4. Mekanisme Sinkronisasi Media

Sistem Permata Wedding menggunakan **Opsi A (Sinkronisasi Otomatis saat Build)**:

### Alur Kerja:
```
1. Admin Upload Foto
   └── File master tersimpan di: uploads/{slug}/
       ├── couple/cover.jpg
       ├── couple/mempelai-pria.jpg
       ├── couple/mempelai-wanita.jpg
       └── gallery/galeri-1.jpg, galeri-2.jpg, dst.

2. Proses Build / Generate Undangan (InvitationCompiler::build)
   ├── A. Menyalin file statis tema (CSS, JS, aset ornamen) ke: {year}/{slug}/
   ├── B. SINKRONISASI MEDIA:
   │      File foto disalin otomatis dari uploads/{slug}/ ke {year}/{slug}/
   │      - uploads/{slug}/couple/cover.jpg          -> {destDir}couple/cover.jpg
   │      - uploads/{slug}/couple/mempelai-pria.jpg  -> {destDir}couple/mempelai-pria.jpg
   │      - uploads/{slug}/couple/mempelai-wanita.jpg-> {destDir}couple/mempelai-wanita.jpg
   │      - uploads/{slug}/gallery/galeri-*.jpg      -> {destDir}gallery/galeri-*.jpg
   │      - love-stories / qrcode                     -> {destDir}love-stories/ & qrcode/
   └── C. PRE-RENDER HTML:
          Mengubah src dan href di index.html menjadi path relatif lokal:
          <img src="couple/cover.jpg" />
          <img src="gallery/galeri-1.jpg" />
```

### Keunggulan Sistem Ini:
* **Folder Mandiri (*Self-Contained*)**: Folder undangan `{year}/{slug}/` dapat dipindahkan, di-zip, atau diarsipkan secara independen tanpa bergantung ke folder `uploads/`.
* **Master Foto Selalu Aman**: Foto pengantin di master `uploads/{slug}/` tidak pernah dihapus atau diubah namanya. Jika pengantin ingin mengganti tema, compiler tinggal menyalin ulang master ke tema baru.
* **Performa Maksimal**: Browser memuat foto dari folder lokal tema tanpa cross-origin overhead atau redirect.

---

## 5. Kontrak Atribut HTML Wajib (Standard Data Mapping)

Untuk memastikan compiler dapat menyuntikkan data pengantin secara tepat ke dalam elemen template tanpa merusak styling CSS, pasang atribut `id` atau `data-key` sesuai tabel kontrak berikut:

### A. Mempelai & Pasangan (`couples`)

| Bagian | Target Elemen HTML | Sumber Database | Contoh Isi Hasil Render |
| :--- | :--- | :--- | :--- |
| **Cover Panggilan Pria** | `id="cover-groom"` | `couples.groom_nickname` | `Agung` |
| **Cover Panggilan Wanita** | `id="cover-bride"` | `couples.bride_nickname` | `Fitri` |
| **Hero Panggilan Pria** | `id="name-groom"` atau `id="hero-groom"` | `couples.groom_nickname` | `Agung` |
| **Hero Panggilan Wanita** | `id="name-bride"` atau `id="hero-bride"` | `couples.bride_nickname` | `Fitri` |
| **Inisial Monogram Cover** | `id="cover-initials-groom"` & `id="cover-initials-bride"` | Karakter ke-1 Nickname | `A` dan `F` |
| **Inisial Gabungan** | `id="cover-initials"` / `id="cover-monogram"` | Huruf Inisial Gabungan | `F &amp; A` |
| **Nama Lengkap Wanita** | `id="bride-full"` | `couples.bride_name` | `Nur Safitri, S.Kom` |
| **Nama Lengkap Pria** | `id="groom-full"` | `couples.groom_name` | `Agung Prastiyo, S.T.` |
| **Ayah Pengantin Wanita** | `id="bride-father"` | `couples.bride_father` | `Bp. Riyanto` |
| **Ibu Pengantin Wanita** | `id="bride-mother"` | `couples.bride_mother` | `Ibu Supanti` |
| **Ayah Pengantin Pria** | `id="groom-father"` | `couples.groom_father` | `Bp. Giyono` |
| **Ibu Pengantin Pria** | `id="groom-mother"` | `couples.groom_mother` | `Ibu Ngadinem` |
| **Alamat Mempelai Wanita** | `id="bride-address"` | `couples.bride_address` | `Mojorejo RT 12, Sukodono, Sragen` |
| **Alamat Mempelai Pria** | `id="groom-address"` | `couples.groom_address` | `Kalidoro RT 29, Mondokan, Sragen` |
| **Foto Pengantin Wanita** | `id="bride-photo"` atau `src="couple/mempelai-wanita.jpg"` | `couples.bride_photo_url` | `couple/mempelai-wanita.jpg` |
| **Foto Pengantin Pria** | `id="groom-photo"` atau `src="couple/mempelai-pria.jpg"` | `couples.groom_photo_url` | `couple/mempelai-pria.jpg` |
| **Foto Cover Utama** | `id="cover-photo"` / `id="hero-cover-img"` atau `src="couple/cover.jpg"` | `couples.cover_photo_url` | `couple/cover.jpg` |
| **Nama di Bagian Penutup** | `id="closing-couple"` | Gabungan Nama Panggilan | `Fitri &amp; Agung` |

### B. Tanggal, Countdown & Acara (`events`)

| Bagian | Target Elemen HTML | Sumber Database | Keterangan & Format |
| :--- | :--- | :--- | :--- |
| **Tanggal di Cover** | `data-key="cover-date"` atau `id="cover-date"` | `events[0].event_datetime` | Format: `29 November 2026` |
| **Tanggal Penutup** | `id="closing-date"` | `events[0].event_datetime` | Format: `Minggu, 29 November 2026` |
| **Target Countdown** | `id="countdown"` (`data-target="..."`) | `events[0].event_datetime` | ISO Format: `2026-11-29T07:00:00+07:00` |
| **Tahun Hak Cipta** | `id="current-year"` | Tahun saat ini | `2026` |
| **Acara 0: Tanggal** | `data-key="event-0-date"` | `events[0].event_datetime` | `Minggu, 21 November 2026` |
| **Acara 0: Waktu** | `data-key="event-0-time"` | `events[0].event_datetime` & `event_end` | `07.00 WIB - Selesai` |
| **Acara 0: Nama Tempat**| `data-key="event-0-venue"` | `events[0].venue_name` | `Kediaman Mempelai Wanita` |
| **Acara 0: Alamat** | `data-key="event-0-address"` | `events[0].venue_address` | `Mojorejo RT 12 Karanganom` |
| **Acara 0: Google Maps**| `data-key="event-0-maps"` (`href="..."`) | `events[0].google_maps_url` | Link Google Maps aktif |
| **Acara 1: Detail** | `data-key="event-1-date"`, `time`, `venue`, `maps` | `events[1]` | Idem untuk Acara Resepsi |
| **Acara Tambahan (N)** | `data-key="event-N-..."` | `events[N]` | Diduplikasi otomatis jika N > slot template |
| **Hiburan Acara** | `data-key="event-0-entertainment"` / `event-1-...` | `entertainments` | `Hiburan: Campursari Sekar Jinggo` |

---

## 6. Penanganan Elemen Berulang (Blueprint Cloning)

Jumlah data acara, cerita cinta, galeri foto, dan rekening amplop bervariasi antar pengantin. Compiler menggunakan mekanisme **Blueprint Cloning**:

### A. Galeri Foto (`galleries`)
Compiler mendeteksi kontainer galeri yang umum digunakan pada tema:
* **Format Grid Klasik (`.gallery-grid`)**:
  ```html
  <div class="gallery-grid" data-aos="fade-up">
    <!-- Diisi otomatis oleh compiler sejumlah foto di database -->
    <a href="gallery/galeri-1.jpg" data-lightbox="wedding" data-title="Mempelai" class="gallery-item">
      <img src="gallery/galeri-1.jpg" alt="Galeri" loading="lazy" />
      <div class="gallery-overlay"><i class="fas fa-search-plus"></i></div>
    </a>
  </div>
  ```
* **Format Carousel Swiper (`#gallery .swiper-wrapper`)**:
  ```html
  <div class="swiper-wrapper">
    <div class="swiper-slide"><img src="gallery/galeri-1.jpg" alt="Galeri" /></div>
  </div>
  ```
* **Format Lightbox Zen (`#gallery-container`)**:
  ```html
  <div id="gallery-container">
    <a href="gallery/galeri-1.jpg" data-lightbox="jp-gallery" class="jpg-item">...</a>
  </div>
  ```
> **Aturan**: Compiler membaca semua baris di tabel `galleries`, menyalin file ke `gallery/`, dan mengisi seluruh item foto secara otomatis tanpa ada foto yang tertinggal.

### B. Love Story Timeline (`love_stories`)
Buat item timeline prototype dengan penomoran indeks:
```html
<div class="timeline">
  <!-- Blueprint Prototype (Index 0) -->
  <div class="timeline-item" data-aos="fade-right">
    <div class="timeline-dot">...</div>
    <div class="timeline-content">
      <span class="timeline-year" data-key="story-0-label">Desember 2021</span>
      <h4 class="timeline-title" data-key="story-0-title">Pertemuan Pertama</h4>
      <p class="timeline-text" data-key="story-0-content">Cerita awal mula kami saling mengenal...</p>
    </div>
  </div>
  <!-- Slot tambahan di template (Index 1, dst) -->
  <div class="timeline-item">
    ... data-key="story-1-label" ...
  </div>
</div>
```
* **Jika DB > slot template**: Compiler mengambil markup blok slot terakhir (`story-X`), menggandakannya menjadi `story-X+1`, `story-X+2`, dst., lalu mengisinya.
* **Jika DB < slot template**: Slot sisa yang tidak terpakai otomatis dibersihkan dari HTML.

### C. Rekening Amplop Digital (`digital_wallets`)
```html
<div class="wallets-wrapper">
  <!-- Blueprint Prototype Kartu Rekening (Index 0) -->
  <div class="amplop-card" data-aos="fade-up">
    <div class="amplop-bank-logo"><i class="fas fa-university"></i></div>
    <p class="amplop-bank" data-key="wallet-0-bank">Bank BRI</p>
    <p class="amplop-norek" data-key="wallet-0-number">687501046673539</p>
    <p class="amplop-atas-nama" data-key="wallet-0-holder">a.n. Nur Safitri</p>
    <button class="btn-copy" data-key="wallet-0-copy" data-copy="687501046673539">
      <i class="fas fa-copy"></i> Salin Nomor Rekening
    </button>
  </div>
</div>
```
* Tombol salin wajib menggunakan atribut `data-copy="..."`. Script tema cukup menangkap event klik dan memanggil `navigator.clipboard.writeText(btn.dataset.copy)`.

---

## 7. Penanganan Bagian Kosong (Auto-Hide on Empty)

Tema tidak boleh menampilkan data dummy atau placeholder palsu jika pengantin tidak mengisi bagian tersebut.

| Bagian | Kondisi Kosong di DB | Tindakan Otomatis Compiler |
| :--- | :--- | :--- |
| **Love Story** | 0 cerita | Menyembunyikan `<section id="love-story" style="display:none;">` dan menghapus menu navigasi `<a href="#love-story">`. |
| **Amplop / Hadiah** | 0 rekening aktif | Menyembunyikan `<section id="amplop" style="display:none;">` dan menghapus menu navigasi `<a href="#amplop">`. |
| **Galeri Foto** | 0 foto di galeri | Menyembunyikan `<section id="gallery" style="display:none;">`, mengosongkan kontainer gambar agar browser tidak request gambar dummy, dan menghapus menu navigasi `#gallery`. |
| **Live Streaming** | URL streaming kosong | Menyembunyikan section streaming dan link navigasi terkait. *(Sebaliknya jika URL ada tapi tema belum punya section, compiler otomatis menyuntikkan section streaming siap pakai)*. |
| **Hiburan Acara** | Hiburan tidak diisi | Menghapus baris `<li>` hiburan di rincian acara agar tidak tampil placeholder kosong. |
| **Kado Fisik** | Alamat pengantin kosong | Menghapus kartu kirim kado fisik (`.card-gift`). |

---

## 8. Penanganan Audio & Jalur Musik

### ⚠️ Masalah Klasik (Error 404 Not Found)
File audio musik yang dipilih dari admin tersimpan di direktori CDN lokal:
`cdn/uploads/music/judul-lagu.mp3`

Di halaman undangan tamu yang berada di kedalaman 2 level (`/2026/nama-mempelai/`), path relatif yang benar adalah:
`../../cdn/uploads/music/judul-lagu.mp3`

### Solusi Wajib di Template HTML:
```html
<audio id="bg-music" loop preload="none">
  <source src="../../cdn/uploads/music/default-lagu.mp3" type="audio/mpeg" />
</audio>
```

### Solusi Wajib di File JavaScript Tema (`js/api.js` / `js/script.js`):
Jika JavaScript tema memuat ulang data musik dari API / data JSON (`DATA.music`), **JANGAN LANGSUNG MENULIS** `audio.src = DATA.music.audio_url`. Periksa dan sesuaikan prefixnya:
```javascript
function renderMusic() {
  if (!DATA.music?.audio_url) return;
  const audio = document.getElementById("bg-music");
  if (!audio) return;

  var url = DATA.music.audio_url;
  // Jika path audio lokal cdn/..., tambahkan ../../ agar tidak 404 di subfolder /2026/slug/
  if (url.startsWith("cdn/")) {
    url = "../../" + url;
  }
  audio.src = url;
  audio.loop = Boolean(+DATA.music.loop);
}
```

---

## 9. Interaktivitas, Minimal Config & Form RSVP / Komentar

### A. Minimal Config Injected oleh Compiler
Compiler menyuntikkan skrip ringkas berikut ke `<head>`:
```html
<script>
  window.CONFIG = window.CONFIG || {};
  window.CONFIG.ORDER_ID = 'UUID-ORDER-DARI-DB';
  (function() {
    var path = window.location.pathname || '';
    var m = path.match(/^(\/[^\/]+)?\/(?:20\d\d)\//);
    var prefix = (m && m[1]) ? m[1] : '';
    window.CONFIG.apiBase = window.location.origin + prefix + '/api';
  })();
</script>
```

### B. Aturan Penulisan Script Tema (`script.js` & `api.js`):
1. **DILARANG MENGGUNAKAN** `const CONFIG = ...` di file JS tema karena akan menyebabkan error tabrakan identifier:
   `Uncaught TypeError: Identifier 'CONFIG' has already been declared`.
2. **Gunakan pola aman berikut**:
   ```javascript
   window.CONFIG = window.CONFIG || {};
   var CONFIG = window.CONFIG;
   ```

### C. Markup Standar Form RSVP:
```html
<section id="rsvp" class="section section-rsvp">
  <form id="rsvp-form" class="rsvp-form" novalidate>
    <div class="form-group">
      <input type="text" id="rsvp-name" name="name" class="form-control" placeholder="Nama Lengkap" required />
    </div>
    <div class="form-group">
      <div class="radio-attendance">
        <label><input type="radio" name="attendance" value="hadir" required /> Hadir</label>
        <label><input type="radio" name="attendance" value="tidak_hadir" /> Tidak Hadir</label>
        <label><input type="radio" name="attendance" value="ragu_ragu" /> Masih Ragu</label>
      </div>
    </div>
    <div class="form-group">
      <textarea id="rsvp-greeting" name="greeting" class="form-control" rows="3" placeholder="Ucapan Doa & Harapan..." required></textarea>
    </div>
    <button type="submit" id="rsvp-submit" class="btn btn-primary">
      <i class="fas fa-paper-plane"></i> Kirim Konfirmasi
    </button>
    <div id="rsvp-feedback" class="rsvp-feedback"></div>
  </form>
</section>
```

### D. Markup & Fallback Komentar Buku Tamu:
```html
<div class="comments-container">
  <div id="comments-list" class="comments-list">
    <!-- Di-render oleh api.js melalui GET /api/comments?order_id=... -->
  </div>
</div>
```
* **Fallback Template Komentar**:
  Jika API komentar gagal diakses atau server offline, script wajib menampilkan pesan fallback yang sopan:
  ```javascript
  const DUMMY_COMMENTS = [
    {
      name: "Keluarga & Sahabat",
      attendance: "hadir",
      message: "Selamat Menempuh Hidup Baru Kak " + (document.getElementById("name-bride")?.textContent || "Mempelai") + ", semoga menjadi keluarga sakinah, mawaddah, dan warrahmah.",
      created_at: "Baru saja"
    }
  ];
  ```

---

## 10. Panduan Langkah demi Langkah: Membuat Tema Baru

Bagi siapa saja yang ingin membuat tema baru atau mengadaptasi tema eksternal (HTML template biasa / WordPress / Envato), ikuti 6 langkah terstruktur ini:

### Langkah 1: Siapkan Folder Tema
Buat folder baru di dalam `templates/<slug-tema>/` (misal: `templates/rustic-botanical/`). Buat subfolder `css/`, `js/`, `assets/`, `couple/`, `gallery/`.

### Langkah 2: Rapikan Asset & Placeholder Foto
1. Masukkan 3 foto placeholder ke `couple/`:
   * `cover.jpg`
   * `mempelai-pria.jpg`
   * `mempelai-wanita.jpg`
2. Masukkan foto galeri contoh ke `gallery/` (`galeri-1.jpg`, `galeri-2.jpg`, dst).
3. Pastikan semua path aset di CSS dan HTML bersifat relatif (`assets/...`, bukan `/assets/...`).

### Langkah 3: Beri Tanda Atribut HTML (`id` dan `data-key`)
Buka `index.html` dan pasang atribut kontrak:
* Nama panggilan cover: `id="cover-groom"` dan `id="cover-bride"`.
* Nama lengkap & ortu: `id="bride-full"`, `id="bride-father"`, `id="groom-full"`, dst.
* Tanggal cover: `data-key="cover-date"`.
* Acara: `data-key="event-0-date"`, `data-key="event-0-time"`, `data-key="event-0-venue"`, `data-key="event-0-maps"`.
* Acara Resepsi: `data-key="event-1-date"`, dst.
* Love story prototype: `data-key="story-0-label"`, `data-key="story-0-title"`, `data-key="story-0-content"`.
* Rekening prototype: `data-key="wallet-0-bank"`, `data-key="wallet-0-number"`, `data-key="wallet-0-holder"`, `data-key="wallet-0-copy"`.

### Langkah 4: Terapkan Audio Player Standar
Pasang tag audio di bawah `<body>`:
```html
<audio id="bg-music" loop preload="none">
  <source src="../../cdn/uploads/music/sinarengan.mp3" type="audio/mpeg" />
</audio>
```
Dan pastikan tombol putar/jeda musik di UI terhubung dengan elemen `#bg-music`.

### Langkah 5: Bersihkan Script JS
1. Cek `js/script.js` dan pastikan tidak ada `const CONFIG =`.
2. Salin `js/api.js` dari tema referensi (seperti `premium-elegant-javanese/js/api.js`) untuk menangani RSVP dan buku tamu secara otomatis.
3. Pastikan fungsi `renderMusic()` di JS memiliki pencegah 404 (`if (url.startsWith('cdn/')) url = '../../' + url;`).

### Langkah 6: Tambahkan Thumbnail Tema
Simpan gambar cuplikan tampilan tema di `templates/<slug-tema>/thumbnail.png` agar muncul di galeri tema panel admin.

---

## 11. Checklist Final Verifikasi Tema

Sebelum tema dinyatakan siap produksi, lakukan audit dengan checklist berikut:

- [ ] **LCP & CWV**: Tag cover menggunakan `loading="eager" fetchpriority="high"`. Gambar galeri menggunakan `loading="lazy" decoding="async"`.
- [ ] **Atribut Pasangan**: `cover-groom`, `cover-bride`, `bride-full`, `groom-full`, `bride-father`, `bride-mother`, `groom-father`, `groom-mother`, `bride-address`, `groom-address` terpasang.
- [ ] **Atribut Foto**: Tag foto wanita mengarah ke `couple/mempelai-wanita.jpg`, pria ke `couple/mempelai-pria.jpg`, dan cover ke `couple/cover.jpg`.
- [ ] **Atribut Acara**: `event-0-date`, `event-0-time`, `event-0-venue`, `event-0-maps` lengkap.
- [ ] **Blueprint Story**: Minimal item `story-0-...` terpasang rapi di dalam `.timeline`.
- [ ] **Blueprint Amplop**: Minimal item `wallet-0-...` terpasang rapi dengan atribut `data-copy`.
- [ ] **Live Streaming**: Memiliki `<section id="livestreaming">` dan tag link `data-key="stream-0-url"`.
- [ ] **Form RSVP**: Input `#rsvp-name`, radio `attendance`, textarea `#rsvp-greeting`, tombol submit `#rsvp-submit`.
- [ ] **Buku Tamu**: Kontainer ucapan `#comments-list` tersedia.
- [ ] **Bebas Error Identifier**: Tidak ada deklarasi `const CONFIG` di file `.js`.
- [ ] **Bebas Error 404 Audio**: Handler musik menggunakan resolusi `../../cdn/...`.
- [ ] **Self-Contained**: Semua tautan file CSS, JS, dan gambar menggunakan path relatif lokal murni.
- [ ] **Lolos Unit Test**: Menjalankan `php tests/run_all.php` dengan hasil 100% Passed (0 Failed).

---

## 12. Unit Testing & Validasi Otomatis (Automated Testing Suite)

Sistem telah dilengkapi dengan test suite murni PHP tanpa dependensi Composer eksternal (`tests/PermataAssert.php`) yang dirancang khusus untuk memvalidasi kepatuhan tema, compiler, integritas media, dan keamanan.

### Struktur File Testing:
- `tests/PermataAssert.php`: Assertion runner ringan (assert, check, error reporting, summary).
- `tests/ThemeContractTest.php`: Menguji kepatuhan kontrak HTML semua tema di `templates/`, ketiadaan `const CONFIG =`, ketersediaan audio tag `#bg-music`, form RSVP, dan pemecah path audio 404.
- `tests/CompilerBuildTest.php`: Menguji build nyata compiler, pencocokan SHA256 media upload master vs build, path relatif murni, True Static HTML render, serta blueprint cloning.
- `tests/SecuritySanitizationTest.php`: Menguji sanitasi XSS (`htmlspecialchars`), kekebalan PDO Prepared Statement dari SQL Injection, dan sanitasi Directory Traversal.
- `tests/run_all.php`: Master runner untuk mengeksekusi seluruh pengujian sekaligus.

### Cara Menjalankan Unit Test:
Jalankan perintah berikut di terminal / PowerShell root workspace:

```bash
# Menjalankan seluruh test suite sekaligus
php tests/run_all.php

# Menjalankan test kepatuhan tema secara spesifik
php tests/ThemeContractTest.php

# Menjalankan test compiler & sinkronisasi media
php tests/CompilerBuildTest.php

# Menjalankan test keamanan & sanitasi
php tests/SecuritySanitizationTest.php
```

Output yang diharapkan adalah:
```text
============================================================
HASIL UNIT TEST:
Passed: 74 test(s)
Failed: 0 test(s)
Status: 100% SEMUA TEST BERHASIL (SUCCESS)
============================================================
```
Jika terdapat failure, perbaiki script JavaScript tema, markup HTML, atau konfigurasi compiler sesuai rincian error yang dilaporkan oleh runner.

