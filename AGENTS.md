# Aturan Proyek: Standar Pembuatan & Pengecekan Web

WAJIB DIPATUHI: Setiap kali memulai tugas, BERTINDAKLAH HANYA SETELAH membaca dokumen panduan dan memori proyek di `docs/` (`docs/MEMORY.md`, `docs/SCHEMA.md`, `docs/PROGRESS.md`). Jangan pernah mengulang pengecekan, probing, atau mencari dari nol jika informasinya sudah tersedia di `docs/`.

Semua proses pengembangan web, pembuatan tema, penulisan script frontend/backend, serta pengecekan performa dan keamanan pada proyek ini WAJIB mematuhi standar berikut:

---

## 0. Alur Kerja Wajib (Memory-First Workflow)
- **Baca `docs/MEMORY.md` terlebih dahulu**: Periksa apakah ada tag, arsitektur, catatan bug, atau konfigurasi terkait sebelum melakukan tindakan atau menyentuh kode.
- **Gunakan konteks yang ada**: Jangan menjalankan query DB berulang atau membaca ulang seluruh codebase untuk hal yang sudah terdokumentasi.
- **Catat temuan baru**: Setiap kali menyelesaikan masalah/menemukan solusi, segera perbarui `docs/MEMORY.md` dan `docs/PROGRESS.md`.

---

## 1. Modern Web Guidance (`modern-web-guidance`)
Berdasarkan standar Google Chrome Developer Relations:
* **HTML/CSS & DOM**:
  - Utamakan API standar modern Baseline (misal `<dialog>`, Popover API, CSS Subgrid, CSS Nesting, `@starting-style`, Container Queries).
  - Hindari library berat pihak ketiga jika platform web modern sudah menyediakannya secara native.
* **Performa & Core Web Vitals (CWV)**:
  - **LCP (Largest Contentful Paint)**: Prioritaskan gambar hero/cover dengan `fetchpriority="high"` dan `loading="eager"`.
  - **Lazy Loading**: Gunakan `loading="lazy"` dan `decoding="async"` untuk gambar di bawah lipatan (below-the-fold) seperti galeri.
  - **CLS (Cumulative Layout Shift)**: Selalu tentukan rasio aspek (`aspect-ratio`) atau dimensi `width` dan `height` pada elemen media dan layout.
  - **INP (Interaction to Next Paint)**: Hindari blocking JavaScript di main-thread; pisahkan eksekusi berat atau gunakan Web Workers / `scheduler.yield()`.
* **Aksesibilitas (a11y)**:
  - Semantik HTML murni (`<button>`, `<header>`, `<main>`, `<nav>`, `<section>`).
  - Lengkapi atribut `alt` pada gambar dan kelola kontras warna serta keyboard focus trap pada modal.

---

## 2. Cloudflare Security Audit (`security-audit`)
Berdasarkan panduan Cloudflare Security:
* **Validasi & Sanitasi Input**:
  - Jangan percaya input dari klien (`$_POST`, `$_GET`, `$_FILES`, JSON body).
  - Terapkan sanitasi ketat untuk mencegah Stored & Reflected XSS (gunakan `htmlspecialchars(..., ENT_QUOTES, 'UTF-8')` pada teks sebelum di-render ke HTML).
* **Keamanan Database**:
  - Wajib menggunakan Prepared Statements dengan parameter binding (`PDO::prepare`) untuk setiap query SQL. Tidak boleh ada string concatenation langsung ke SQL.
* **Keamanan File Upload**:
  - Validasi MIME-type riil (bukan hanya ekstensi file).
  - Sanitisasi nama file untuk mencegah Path Traversal (`../`).
  - Batasi ukuran upload dan simpan file di direktori yang tidak mengeksekusi script server-side (.php, .phtml, .cgi).
* **Keamanan Sesi & Otentikasi**:
  - Lindungi endpoint sensitif dengan verifikasi otentikasi/token sesi.
  - Terapkan perlindungan CSRF dan pembatasan CORS header sesuai origin yang diizinkan.
  - Gunakan flag `HttpOnly`, `SameSite=Lax/Strict`, dan `Secure` pada cookie.
