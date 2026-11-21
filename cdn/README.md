# CDN Permata Wedding (cdn.permatawedding.com)
> **Pusat Penyimpanan Asset Audio Musik & Video Undangan Digital Pernikahan**  
> Dilengkapi REST API, Audio Studio (Potong Durasi, Fade In/Out, Kompresi Bitrate MP3), dan UI Dashboard Modern Luxury.

---

## ✨ Fitur Utama

1. **Penyimpanan Asset Media**:
   - Mendukung format audio: `.mp3`, `.wav`, `.m4a`, `.ogg`.
   - Mendukung format video: `.mp4`, `.webm`.
   - Auto-indexing: File yang diunggah lewat dashboard maupun langsung via FTP/File Manager cPanel otomatis terdeteksi dan tercatat.
   - **Direct CDN URL**: Setiap asset memiliki direct link berkecepatan tinggi dengan header CORS (`Access-Control-Allow-Origin: *`) sehingga dapat diputar dari domain mana pun tanpa hambatan keamanan browser.

2. **Audio Studio & Processing (Potong, Fade, Kompres)**:
   - **Visual Waveform Editor**: Menampilkan visual gelombang suara interaktif secara real-time.
   - **Potong Audio (Trim / Cut)**: Geser handle START (emas) dan END (biru) atau ketik detik yang diinginkan dengan presisi 0.1 detik.
   - **Efek Fade In & Fade Out**: Kurva transisi volume halus di awal dan akhir lagu (0 hingga 10 detik) agar musik undangan tidak berhenti secara mengejutkan (*abrupt*).
   - **Kompresi Bitrate MP3**: Pilihan bitrate (64 kbps, 96 kbps, 128 kbps, 192 kbps, 320 kbps). Kompresi ke 128 kbps atau 96 kbps sangat direkomendasikan untuk undangan digital agar langsung berbunyi dalam hitungan milidetik di ponsel tamu.
   - **Live Audition / Preview**: Dengarkan simulasi hasil potongan dan fade sebelum disimpan.
   - **Dual Engine (Aman untuk Hosting)**: Menggunakan *Client WebAudio Engine* di browser + LameJS. Tidak membutuhkan instalasi FFmpeg di server, sehingga **100% aman dan berjalan di shared hosting murah cPanel tanpa diblokir oleh `disable_functions`**. Namun jika server Anda memiliki FFmpeg, sistem juga secara otomatis mendukung mode server!

3. **Sistem Autentikasi Admin & Proteksi Aset**:
   - **Username**: `permata`
   - **Password**: `PermataWedding1`
   - **Dashboard**: Halaman utama dilindungi sesi login (`/login.php` & `/logout.php`).
   - **Akses API**:
     - *Public Read*: Endpoint `GET /api/music.php` & `GET /api/videos.php` tetap **publik** agar website undangan tamu bebas mengambil daftar lagu dan memutar audio.
     - *Protected Write*: Endpoint upload, potong audio, edit, dan hapus asset diproteksi oleh Autentikasi Sesi Web, HTTP Basic Auth (`permata:PermataWedding1`), atau Bearer Token (`PermataWedding1`).

4. **Import Audio Otomatis dari URL**:
   - **TikTok Link**: Cukup paste tautan video/audio TikTok, sistem mengekstrak musik latar `.mp3`, judul lagu, serta nama penyanyi/kreator secara otomatis.
   - **Direct Audio URL**: Unduh file audio langsung dari URL publik (`.mp3`, `.wav`, `.m4a`).
   - **Proteksi Anti-SSRF Ketat**: Memvalidasi IP dan memblokir akses ke alamat lokal/privat (127.0.0.1, 10.x, 192.168.x, Cloud metadata 169.254.x) untuk keamanan server.
   - **Auto-slug Naming**: Nama file fisik langsung dibuat otomatis sesuai judul lagu, bersih tanpa spasi.

---

## 🔐 Kredensial Login & Akses API

- **Halaman Login**: `http://localhost/cdn.permatawedding.com/login.php`
- **Username**: `permata`
- **Password**: `PermataWedding1`
- **Metode Auth API (untuk Write Action: Upload, Process, Edit, Delete)**:
  1. Login melalui browser (otomatis tervalidasi via PHP Session).
  2. Header HTTP Basic Auth: `Authorization: Basic cGVybWF0YTpQZXJtYXRhV2VkZGluZzE=`
  3. Header Bearer Token: `Authorization: Bearer PermataWedding1`
  4. Header API Key: `X-API-KEY: PermataWedding1` atau parameter URL `?api_key=PermataWedding1`

---

## 📡 Dokumentasi Endpoint REST API Publik

API publik sengaja diminimalkan secara elegan agar **hanya mengekspos `judul`, nama penyanyi (`artist`/`penyanyi`), dan `url` lagu saja**. Penamaan file fisik MP3 di CDN dibuat **otomatis sesuai judul lagu, bersih tanpa spasi**. Metadata internal server seperti ID, ukuran file, bitrate, dan path direktori internal tidak diekspos ke publik untuk alasan privasi dan keamanan.

### 1. Ambil Daftar Judul, Penyanyi & URL Musik (Publik)
- **URL**: `GET /api/music.php` atau `GET /api/`
- **Contoh URL**: `http://localhost/cdn.permatawedding.com/api/music.php` (Lokal) atau `https://cdn.permatawedding.com/api/music.php` (Hosting)
- **CORS**: `Access-Control-Allow-Origin: *` (Dapat langsung dipanggil dari domain undangan pernikahan)
- **Response Format**:
```json
[
  {
    "judul": "Bermuara",
    "artist": "Rizky Febian & Mahalini",
    "penyanyi": "Rizky Febian & Mahalini",
    "url": "http://localhost/cdn.permatawedding.com/uploads/music/rizky-febian-feat-mahalini-bermuara.mp3"
  },
  {
    "judul": "A Thousand Years",
    "artist": "Christina Perri",
    "penyanyi": "Christina Perri",
    "url": "http://localhost/cdn.permatawedding.com/uploads/music/a-thousand-years-romantic-acoustic.mp3"
  },
  {
    "judul": "Janji Suci",
    "artist": "Yovie & Nuno",
    "penyanyi": "Yovie & Nuno",
    "url": "http://localhost/cdn.permatawedding.com/uploads/music/janji-suci-wedding-instrumental.mp3"
  }
]
```

### 2. Format Object Wrapper (Opsional)
Jika frontend undangan Anda membutuhkan format JSON yang dibungkus object (`{ status, total, data }`), tambahkan parameter `?wrap=1`:
- **URL**: `GET /api/music.php?wrap=1`
- **Response Format**:
```json
{
  "status": "success",
  "total": 3,
  "data": [
    {
      "judul": "Bermuara",
      "artist": "Rizky Febian & Mahalini",
      "penyanyi": "Rizky Febian & Mahalini",
      "url": "http://localhost/cdn.permatawedding.com/uploads/music/rizky-febian-feat-mahalini-bermuara.mp3"
    }
  ]
}
```

### 3. Parameter Filter & Sortir Publik (Opsional)
- `search`: Cari lagu berdasarkan nama atau kategori (contoh: `/api/music.php?search=acoustic`)
- `category`: Filter berdasarkan kategori (contoh: `/api/music.php?category=Romantic%20Wedding`)
- `sort`: 
  - `newest` (Default, terbaru)
  - `oldest` (Terlama)
  - `name_asc` (Judul A &rarr; Z)
  - `name_desc` (Judul Z &rarr; A)
- `limit`: Batasi jumlah lagu yang dikembalikan (contoh: `/api/music.php?limit=10`)

---

## 💻 Contoh Integrasi di Website Undangan

### 1. Menggunakan Fetch JavaScript (Frontend Undangan)
```javascript
// Mengambil daftar musik dari CDN Permata Wedding
fetch('https://cdn.permatawedding.com/api/music.php')
  .then(res => res.json())
  .then(songList => {
    // songList berisi array [{ judul: "...", artist: "...", url: "..." }, ...]
    const selectElement = document.getElementById('musicSelect');
    
    songList.forEach(song => {
      const option = document.createElement('option');
      option.value = song.url;
      option.textContent = song.artist ? `${song.judul} - ${song.artist}` : song.judul;
      selectElement.appendChild(option);
    });
  })
  .catch(err => console.error('Gagal mengambil musik CDN:', err));
```

### 2. Memutar Musik Otomatis (HTML5 Audio)
```html
<audio id="weddingBgm" src="https://cdn.permatawedding.com/uploads/music/rizky-febian-feat-mahalini-bermuara.mp3" preload="auto" loop></audio>

<script>
  // Browser modern mewajibkan interaksi pertama pengguna untuk memutar audio
  document.addEventListener('click', function playAudioOnce() {
    const bgm = document.getElementById('weddingBgm');
    if (bgm && bgm.paused) {
      bgm.play().catch(e => console.log('Autoplay ditahan browser'));
    }
  }, { once: true });
</script>
```

### 3. Integrasi Menggunakan PHP
```php
<?php
$json = file_get_contents('https://cdn.permatawedding.com/api/music.php');
$musicList = json_decode($json, true);

foreach ($musicList as $song) {
    $artist = !empty($song['artist']) ? " ({$song['artist']})" : "";
    echo "Lagu: " . htmlspecialchars($song['judul'] . $artist) . "<br>";
    echo "URL: <a href='" . htmlspecialchars($song['url']) . "'>" . htmlspecialchars($song['url']) . "</a><br><hr>";
}
?>
```

---

## 🚀 Cara Menjalankan di Lokal (XAMPP Windows)

1. Pastikan Apache di **XAMPP Control Panel** dalam keadaan **Running**.
2. Folder project berada di:
   ```text
   C:\xampp\htdocs\cdn.permatawedding.com
   ```
3. Buka browser dan kunjungi salah satu URL berikut:
   - `http://localhost/cdn.permatawedding.com/`
4. *(Opsional - Virtual Host)* Jika Anda ingin mengakses langsung via `http://cdn.permatawedding.com` di komputer lokal:
   - Buka file `C:\Windows\System32\drivers\etc\hosts` (sebagai Administrator) dan tambahkan:
     ```text
     127.0.0.1  cdn.permatawedding.com
     ```
   - Tambahkan VirtualHost di `C:\xampp\apache\conf\extra\httpd-vhosts.conf`:
     ```apache
     <VirtualHost *:80>
         ServerName cdn.permatawedding.com
         DocumentRoot "C:/xampp/htdocs/cdn.permatawedding.com"
         <Directory "C:/xampp/htdocs/cdn.permatawedding.com">
             AllowOverride All
             Require all granted
         </Directory>
     </VirtualHost>
     ```
   - Restart Apache di XAMPP.

---

## 🌐 Cara Publikasi ke Hosting (cPanel / DirectAdmin / VPS)

Aplikasi dibuat **100% Zero-Configuration** (URL dasar menyesuaikan secara otomatis, tidak ada path hardcoded):

1. **Buat Subdomain di cPanel**:
   - Masuk ke cPanel &rarr; Menu **Domains** / **Subdomains**.
   - Buat subdomain: `cdn.permatawedding.com`.
   - Arahkan Document Root ke folder `public_html/cdn.permatawedding.com`.
2. **Upload Berkas**:
   - Kompres seluruh isi folder `c:\xampp\htdocs\cdn.permatawedding.com` menjadi format `.zip`.
   - Unggah zip tersebut ke folder subdomain di cPanel via **File Manager** atau **FTP (FileZilla)**.
   - Ekstrak file zip.
3. **Izin Folder (Permissions)**:
   - Pastikan folder `uploads/`, `uploads/music/`, `uploads/videos/`, dan `data/` memiliki permission **755** (dapat ditulisi oleh PHP).
4. **Aktifkan SSL (HTTPS)**:
   - Pasang Let's Encrypt SSL gratis di cPanel agar CDN berjalan aman melalui protokol `https://cdn.permatawedding.com`.
5. **Selesai!**
   - Buka `https://cdn.permatawedding.com` untuk mengakses dashboard studio.
   - Panggil `https://cdn.permatawedding.com/api/music.php` dari website mana pun.

---

## 📁 Struktur Berkas

```text
cdn.permatawedding.com/
├── .htaccess                 # Konfigurasi Apache, CORS (*), MIME types & Cache CDN
├── config.php                # Auto-detect BASE_URL lokal & hosting, path, konstanta
├── helpers.php               # MediaManager, sinkronisasi file, pembaca metadata audio
├── index.php                 # Dashboard UI, Audio Studio Waveform, Mini Player, API Playground
├── README.md                 # Dokumentasi lengkap
├── api/
│   ├── index.php             # Sitemaps & status operasional API
│   ├── music.php             # Endpoint GET daftar musik (nama, URL, durasi, bitrate)
│   ├── videos.php            # Endpoint GET daftar video
│   ├── import-url.php        # Endpoint POST unduh & import audio dari link TikTok / Direct URL
│   ├── upload.php            # Endpoint POST upload media (MP3 & MP4)
│   ├── process.php           # Endpoint POST pemotongan audio, fade & kompresi
│   ├── update.php            # Endpoint POST edit judul lagu / kategori
│   └── delete.php            # Endpoint POST hapus media
├── assets/
│   ├── css/
│   │   └── style.css         # Styling modern luxury dark-gold & glassmorphism
│   └── js/
│       ├── app.js            # Logika dashboard, tab, player, copy URL, API tester
│       ├── audio-studio.js   # Waveform canvas, trimming, fade in/out, MP3 encoding
│       └── lame.min.js       # Pure JavaScript MP3 encoder (LameJS)
├── data/
│   ├── media_database.json   # Basis data asset (JSON portabel)
│   └── init_samples.php      # Generator audio sampel wedding otomatis
└── uploads/
    ├── music/                # Direktori penyimpanan file musik (.mp3)
    └── videos/               # Direktori penyimpanan file video (.mp4)
```

---
Dibuat khusus untuk ekosistem **Permata Wedding** (*cdn.permatawedding.com*).
