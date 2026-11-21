<?php
/**
 * CDN Permata Wedding - Dashboard & Audio Studio
 * cdn.permatawedding.com
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

requireDashboardAuth();
sendCorsHeaders();

// Initial sync to ensure any newly added files are recognized
$musicList = MediaManager::getAllMusic(true);
$videoList = MediaManager::getAllVideos(true);
$isFfmpeg = MediaManager::isFfmpegAvailable();

// Total bytes calculation
$totalBytes = 0;
foreach ($musicList as $m) $totalBytes += ($m['size_bytes'] ?? 0);
foreach ($videoList as $v) $totalBytes += ($v['size_bytes'] ?? 0);
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Permata Wedding — CDN Media & Audio Studio</title>
    <meta name="description" content="Pusat penyimpanan asset audio musik wedding dan video untuk undangan digital cdn.permatawedding.com dengan fitur potong audio, fade, kompresi, dan REST API.">
    
    <!-- Google Fonts (Nunito & Playfair Display from invitation theme) -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    
    <!-- Invitation Theme CSS -->
    <link rel="stylesheet" href="assets/css/style.css?v=2">

    <!-- LameJS for Client-Side MP3 Processing -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js"></script>
</head>
<body>

    <!-- Header Styled after C:\xampp\htdocs\invitation -->
    <header class="invitation-header">
        <div class="header-eyebrow">
            <span>✦</span> Permata Wedding <span>✦</span>
        </div>
        <h1 class="site-title">CDN Media & Audio Studio</h1>
        <p class="site-subtitle">Pusat penyimpanan asset musik latar dan video undangan digital pernikahan dengan fitur potong audio, fade, kompresi, dan REST API</p>

        <div class="header-badges-row">
            <?php if ($isFfmpeg): ?>
                <span class="f-btn" style="cursor: default; pointer-events: none; background: #f0fdf4; color: #16a34a; font-size: 0.8rem; padding: 6px 16px;">
                    <i class="bi bi-cpu"></i> Server FFmpeg
                </span>
            <?php else: ?>
                <span class="f-btn" style="cursor: default; pointer-events: none; background: #fff1f2; color: #f43f6e; font-size: 0.8rem; padding: 6px 16px;" title="Audio studio menggunakan WebAudio Browser Engine sehingga aman untuk hosting shared">
                    <i class="bi bi-browser-chrome"></i> Client WebAudio Studio
                </span>
            <?php endif; ?>

            <button class="preview-btn" id="openImportModalBtn" style="border-color: var(--brand-rose); color: var(--brand-rose); margin-left: 6px;" title="Unduh audio dari link TikTok, YouTube, atau direct URL">
                <i class="bi bi-link-45deg"></i> Import dari URL
            </button>

            <button class="btn-rose" id="openUploadModalBtn" style="margin-left: 6px;">
                <i class="bi bi-cloud-arrow-up-fill"></i> Upload Asset
            </button>

            <a href="logout.php" class="preview-btn" style="border-color: #cbd5e1; color: #64748b; padding: 6px 14px; text-decoration: none;" title="Keluar dari sesi admin">
                <i class="bi bi-box-arrow-right"></i> Logout (permata)
            </a>
        </div>
    </header>

    <!-- Stats Overview -->
    <section class="stats-grid">
        <div class="stat-box">
            <div class="stat-icon-wrap">
                <i class="bi bi-music-note-list"></i>
            </div>
            <div>
                <div class="stat-text">Total Musik</div>
                <div class="stat-num" id="statTotalMusic"><?php echo count($musicList); ?></div>
            </div>
        </div>

        <div class="stat-box">
            <div class="stat-icon-wrap blue">
                <i class="bi bi-camera-reels-fill"></i>
            </div>
            <div>
                <div class="stat-text">Total Video</div>
                <div class="stat-num" id="statTotalVideo"><?php echo count($videoList); ?></div>
            </div>
        </div>

        <div class="stat-box">
            <div class="stat-icon-wrap green">
                <i class="bi bi-pie-chart-fill"></i>
            </div>
            <div>
                <div class="stat-text">Storage CDN</div>
                <div class="stat-num" id="statTotalStorage"><?php echo formatBytes($totalBytes); ?></div>
            </div>
        </div>

        <div class="stat-box">
            <div class="stat-icon-wrap">
                <i class="bi bi-link-45deg"></i>
            </div>
            <div>
                <div class="stat-text">API Status</div>
                <div class="stat-num" style="color: #16a34a; font-size: 1.25rem;">
                    <i class="bi bi-check-circle-fill"></i> 200 OK
                </div>
            </div>
        </div>
    </section>

    <!-- Sticky Filter Navigation (Matching .filter-wrapper in C:\xampp\htdocs\invitation) -->
    <div class="filter-wrapper">
        <div class="filter-title">Navigasi Asset CDN</div>
        <div class="filter-bar">
            <button class="f-btn nav-tab-btn active" data-tab="music">
                <i class="bi bi-file-earmark-music-fill"></i> Audio Musik (.MP3)
            </button>
            <button class="f-btn nav-tab-btn" data-tab="videos">
                <i class="bi bi-film"></i> Asset Video (.MP4)
            </button>

        </div>
    </div>

    <!-- Main Content Area -->
    <main class="main-wrapper">

        <!-- ============================================================== -->
        <!-- TAB 1: MUSIC ASSETS -->
        <!-- ============================================================== -->
        <section class="tab-content-pane active" id="tab-music">
            
            <!-- Search & Category Filters (Styled after invitation gallery) -->
            <div class="search-box">
                <input type="text" id="musicSearchInput" class="search-input" placeholder="Cari nama lagu atau file mp3...">
            </div>

            <div style="display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 2rem;">
                <span class="filter-title" style="margin: 0 8px 0 0;">Kategori:</span>
                <button class="f-btn category-pill-btn active" data-category="all">Semua</button>
                <button class="f-btn category-pill-btn" data-category="Romantic Wedding">Romantic Wedding</button>
                <button class="f-btn category-pill-btn" data-category="Acoustic Instrumental">Acoustic Instrumental</button>
                <button class="f-btn category-pill-btn" data-category="Traditional & Culture">Traditional & Culture</button>
                <button class="f-btn category-pill-btn" data-category="Upbeat & Modern">Upbeat & Modern</button>
                <button class="f-btn category-pill-btn" data-category="Slow Emotional">Slow Emotional</button>

                <button class="preview-btn" id="copyBaseApiBtn" data-url="<?php echo BASE_URL . '/api/music.php'; ?>" title="Salin Endpoint API Musik" style="margin-left: 10px;">
                    <i class="bi bi-clipboard-check"></i> Salin URL API
                </button>
            </div>

            <!-- Music Cards Container -->
            <div id="musicListContainer">
                <!-- Rendered dynamically by app.js -->
            </div>

            <!-- Empty State -->
            <div id="musicEmptyState" style="display: none; text-align: center; padding: 4rem 1rem; background: #ffffff; border-radius: var(--radius-card); border: 1px dashed var(--border-light); box-shadow: var(--shadow-card);">
                <i class="bi bi-music-note" style="font-size: 3.5rem; color: var(--brand-rose); opacity: 0.4;"></i>
                <h3 style="margin-top: 1rem; font-size: 1.35rem; color: var(--text-title);" class="brand-serif">Belum ada lagu yang ditemukan</h3>
                <p style="color: var(--text-muted); max-width: 480px; margin: 0.5rem auto 1.5rem;">Unggah lagu wedding pertama Anda atau simpan potongan lagu melalui Audio Studio.</p>
                <button class="btn-rose" onclick="document.getElementById('uploadFileInput').click()">
                    <i class="bi bi-cloud-arrow-up-fill"></i> Unggah File MP3
                </button>
            </div>

        </section>

        <!-- ============================================================== -->
        <!-- TAB 2: VIDEO ASSETS -->
        <!-- ============================================================== -->
        <section class="tab-content-pane" id="tab-videos">
            
            <div class="search-box">
                <input type="text" id="videoSearchInput" class="search-input" placeholder="Cari nama video wedding...">
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px;" id="videoListContainer">
                <!-- Rendered dynamically by app.js -->
            </div>

            <div id="videoEmptyState" style="display: none; text-align: center; padding: 4rem 1rem; background: #ffffff; border-radius: var(--radius-card); border: 1px dashed var(--border-light); margin-top: 1rem;">
                <i class="bi bi-camera-reels" style="font-size: 3.5rem; color: var(--brand-rose); opacity: 0.4;"></i>
                <h3 style="margin-top: 1rem; font-size: 1.35rem; color: var(--text-title);" class="brand-serif">Belum ada video wedding yang tersimpan</h3>
                <p style="color: var(--text-muted); max-width: 480px; margin: 0.5rem auto 1.5rem;">Unggah teaser undangan video atau highlight cinematic wedding Anda ke CDN.</p>
            </div>

        </section>

        <!-- ============================================================== -->
        <!-- TAB 3: REST API PLAYGROUND & DOCUMENTATION -->
        <!-- ============================================================== -->
        <section class="tab-content-pane" id="tab-api">
            <div class="api-spec-card">
                <h2 style="font-size: 1.7rem; color: var(--brand-rose); margin-bottom: 0.5rem;" class="brand-serif">
                    <i class="bi bi-braces-asterisk"></i> Permata Wedding Music API Specification
                </h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
                    API ini dirancang khusus untuk dipanggil oleh website undangan digital pernikahan guna menampilkan daftar pilihan musik latar (*background music*) dan memutar streaming audio secara instan.
                </p>

                <!-- Interactive Live Tester -->
                <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-card); padding: 1.5rem; margin-bottom: 2rem;">
                    <h4 style="font-size: 1.1rem; color: var(--text-title); margin-bottom: 1rem; display: flex; align-items: center; gap: 8px;" class="brand-serif">
                        <i class="bi bi-play-circle-fill" style="color: var(--brand-rose);"></i> Live API Playground (Uji Coba Endpoint)
                    </h4>

                    <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 1rem;">
                        <select id="apiEndpointSelect" class="form-select-custom" style="flex: 1; min-width: 280px;">
                            <option value="api/music.php">GET /api/music.php (Hanya Judul & URL - Default)</option>
                            <option value="api/music.php?wrap=1">GET /api/music.php?wrap=1 (Format Object: status, total, data)</option>
                            <option value="api/music.php?sort=name_asc">GET /api/music.php?sort=name_asc (Urutkan Judul A-Z)</option>
                            <option value="api/">GET /api/ (Akses Root API - Judul & URL)</option>
                        </select>

                        <button class="btn-rose" id="runApiTestBtn">
                            <i class="bi bi-send-fill"></i> Kirim Request
                        </button>
                    </div>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 0.8rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; font-weight: 600;">RESPONSE JSON:</span>
                        <div style="display: flex; gap: 8px;">
                            <span id="apiTestStatusBadge" class="f-btn" style="font-size: 0.72rem; padding: 2px 10px; cursor: default; background: #e2e8f0; color: #475569;">Ready</span>
                            <span id="apiTestTimeBadge" class="f-btn" style="font-size: 0.72rem; padding: 2px 10px; cursor: default; background: #e2e8f0; color: #475569;">-</span>
                        </div>
                    </div>

                    <pre class="code-pre-box" id="apiTestResultPre">[
  {
    "judul": "Bermuara",
    "artist": "Rizky Febian & Mahalini",
    "penyanyi": "Rizky Febian & Mahalini",
    "url": "<?php echo BASE_URL; ?>/uploads/music/rizky-febian-feat-mahalini-bermuara.mp3"
  },
  {
    "judul": "A Thousand Years",
    "artist": "Christina Perri",
    "penyanyi": "Christina Perri",
    "url": "<?php echo BASE_URL; ?>/uploads/music/a-thousand-years-romantic-acoustic.mp3"
  }
]</pre>
                </div>

                <!-- Integration Snippets -->
                <h3 style="font-size: 1.35rem; color: var(--text-title); margin-bottom: 1rem;" class="brand-serif">Contoh Integrasi di Website Undangan:</h3>

                <div class="api-spec-card" style="margin-bottom: 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: var(--brand-rose);"><i class="bi bi-filetype-js"></i> Fetch JavaScript (Frontend Undangan)</strong>
                        <button class="preview-btn" onclick="app.copyToClipboard(document.getElementById('snippetJs').innerText, 'Snippet JS disalin!')">Salin</button>
                    </div>
                    <pre class="code-pre-box" id="snippetJs">// Panggil API Musik CDN Permata Wedding (Hanya Judul & URL)
fetch('<?php echo BASE_URL; ?>/api/music.php')
  .then(response => response.json())
  .then(songList => {
    // Array: [{ judul: "...", url: "..." }, ...]
    songList.forEach(song => {
      console.log(`Judul Lagu: ${song.judul}`);
      console.log(`Direct Audio URL: ${song.url}`);
    });
  })
  .catch(error => console.error('Gagal mengambil musik CDN:', error));</pre>
                </div>

                <div class="api-spec-card">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: #0284c7;"><i class="bi bi-filetype-php"></i> Integrasi Server-Side PHP</strong>
                        <button class="preview-btn" onclick="app.copyToClipboard(document.getElementById('snippetPhp').innerText, 'Snippet PHP disalin!')">Salin</button>
                    </div>
                    <pre class="code-pre-box" id="snippetPhp">&lt;?php
$json = file_get_contents('<?php echo BASE_URL; ?>/api/music.php');
$songs = json_decode($json, true);

foreach ($songs as $song) {
    echo "Judul: " . htmlspecialchars($song['judul']) . "&lt;br&gt;";
    echo "URL: &lt;a href='" . htmlspecialchars($song['url']) . "'&gt;" . htmlspecialchars($song['url']) . "&lt;/a&gt;&lt;hr&gt;";
}
?&gt;</pre>
                </div>

            </div>
        </section>

        <!-- ============================================================== -->
        <!-- TAB 4: DEPLOYMENT GUIDE -->
        <!-- ============================================================== -->
        <section class="tab-content-pane" id="tab-deployment">
            <div class="api-spec-card">
                <h2 style="font-size: 1.7rem; color: var(--brand-rose); margin-bottom: 0.5rem;" class="brand-serif">
                    <i class="bi bi-cloud-upload-fill"></i> Panduan Publikasi ke Hosting (cPanel / VPS)
                </h2>
                <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
                    Aplikasi ini dirancang <strong>100% Zero-Configuration</strong>. Anda tidak perlu mengubah kode apapun saat memindahkan dari XAMPP ke domain <code>cdn.permatawedding.com</code>.
                </p>

                <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-card); padding: 1.5rem; margin-bottom: 1.5rem;">
                    <h4 style="color: var(--brand-rose); margin-bottom: 0.75rem;" class="brand-serif">1. Langkah Upload ke Hosting cPanel</h4>
                    <ol style="color: var(--text-body); line-height: 1.9; padding-left: 1.25rem;">
                        <li>Buka <strong>cPanel</strong> Anda &rarr; masuk ke menu <strong>Subdomains</strong>.</li>
                        <li>Buat subdomain <code>cdn.permatawedding.com</code> dengan document root <code>public_html/cdn.permatawedding.com</code>.</li>
                        <li>Zip seluruh isi folder ini (<code>c:\xampp\htdocs\cdn.permatawedding.com</code>).</li>
                        <li>Upload zip ke cPanel via <strong>File Manager</strong> atau <strong>FTP</strong>, lalu Extract.</li>
                        <li>Pastikan folder <code>uploads/</code> dan <code>data/</code> memiliki permission <strong>755</strong> (writable).</li>
                    </ol>
                </div>

                <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-card); padding: 1.5rem;">
                    <h4 style="color: var(--brand-rose); margin-bottom: 0.75rem;" class="brand-serif">2. Mengapa Sangat Ringan dan Aman di Shared Hosting?</h4>
                    <ul style="color: var(--text-body); line-height: 1.9; padding-left: 1.25rem;">
                        <li><strong>Tanpa Ketergantungan FFmpeg Server:</strong> Fitur potong audio, fade, dan kompresi MP3 diproses langsung di browser pengguna (*Client WebAudio*), sehingga tidak membebani CPU server hosting dan tidak diblokir oleh `disable_functions` cPanel.</li>
                        <li><strong>CORS Terbuka:</strong> Berkas <code>.htaccess</code> sudah disetel dengan <code>Access-Control-Allow-Origin: *</code> sehingga website undangan bebas mengambil file audio tanpa peringatan CORS.</li>
                    </ul>
                </div>
            </div>
        </section>

    </main>

    <!-- ============================================================== -->
    <!-- MODAL: AUDIO STUDIO (POTONG, FADE, KOMPRES) -->
    <!-- ============================================================== -->
    <div class="custom-modal-overlay" id="studioModal">
        <div class="custom-modal-content">
            <div class="modal-header-custom">
                <div>
                    <h3 style="font-size: 1.35rem; color: var(--brand-rose); margin: 0;" class="brand-serif">
                        <i class="bi bi-scissors"></i> Permata Audio Studio
                    </h3>
                    <div style="font-size: 0.82rem; color: var(--text-muted); margin-top: 2px;">
                        Potong Durasi, Efek Fade In/Out, & Kompresi Bitrate MP3
                    </div>
                </div>
                <button class="btn-close-modal" id="closeStudioModalBtn" title="Tutup Studio">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <div class="modal-body-custom" style="position: relative;">
                
                <div id="studioLoadingOverlay" style="display: none; position: absolute; inset: 0; background: rgba(255, 255, 255, 0.9); z-index: 20; border-radius: var(--radius-card); align-items: center; justify-content: center; flex-direction: column; gap: 12px;">
                    <div class="spinner-border" style="width: 3rem; height: 3rem; border: 3px solid rgba(244,63,110,0.2); border-top-color: var(--brand-rose); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                    <div id="studioLoadingText" style="color: var(--brand-rose); font-weight: 700;">Menganalisis audio...</div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 10px;">
                    <div>
                        <h4 id="studioTrackTitle" style="font-size: 1.2rem; color: var(--text-title); margin: 0;" class="brand-serif">Judul Lagu</h4>
                        <span id="studioTrackMeta" style="font-size: 0.82rem; color: var(--text-muted);">-</span>
                    </div>

                    <div style="display: flex; gap: 8px; align-items: center;">
                        <span class="badge-category" id="cropDurationBadge" style="font-size: 0.8rem; padding: 6px 14px;">
                            Durasi Potongan: 00:00
                        </span>
                        <span class="f-btn" id="estimatedSizeBadge" style="font-size: 0.8rem; padding: 5px 14px; cursor: default; background: #f8fafc;">
                            Perkiraan Ukuran: ~0 MB
                        </span>
                    </div>
                </div>

                <!-- Waveform Canvas Box -->
                <div class="waveform-canvas-box">
                    <canvas id="waveformCanvas" width="1000" height="180"></canvas>
                </div>

                <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: -1rem; margin-bottom: 1.5rem; display: flex; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
                    <span><i class="bi bi-hand-index-thumb" style="color: var(--brand-rose);"></i> Geser handle pink (START) & biru (END) untuk memotong audio</span>
                    <span>Klik pada gelombang suara untuk memutar dari posisi tersebut</span>
                </div>

                <!-- Controls Grid -->
                <div class="studio-grid-controls">
                    
                    <!-- Trim Box -->
                    <div class="studio-control-card">
                        <div class="studio-control-title">
                            <i class="bi bi-clock-history"></i> Titik Potong (Detik)
                        </div>
                        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                            <div style="flex: 1;">
                                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Mulai (Start):</label>
                                <input type="number" id="startTimeInput" step="0.1" min="0" class="form-input-custom">
                            </div>
                            <div style="flex: 1;">
                                <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600;">Selesai (End):</label>
                                <input type="number" id="endTimeInput" step="0.1" min="0" class="form-input-custom">
                            </div>
                        </div>
                        <button class="preview-btn" id="resetCropBtn" style="width: 100%; justify-content: center; font-size: 0.78rem; padding: 5px 10px;">
                            <i class="bi bi-arrows-expand"></i> Reset Durasi Penuh
                        </button>
                    </div>

                    <!-- Fade In / Fade Out Box -->
                    <div class="studio-control-card">
                        <div class="studio-control-title">
                            <i class="bi bi-soundwave"></i> Efek Transisi (Fade)
                        </div>
                        <div style="margin-bottom: 10px;">
                            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); font-weight: 600; margin-bottom: 3px;">
                                <span>Fade In (Awal Lagu):</span>
                                <input type="number" id="fadeInInput" step="0.1" min="0" max="10" value="2.0" style="width: 50px; background: transparent; border: none; color: var(--brand-rose); font-weight: 800; text-align: right;"> s
                            </div>
                            <input type="range" id="fadeInSlider" min="0" max="10" step="0.5" value="2.0" class="slider-custom">
                        </div>

                        <div>
                            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); font-weight: 600; margin-bottom: 3px;">
                                <span>Fade Out (Akhir Lagu):</span>
                                <input type="number" id="fadeOutInput" step="0.1" min="0" max="10" value="3.0" style="width: 50px; background: transparent; border: none; color: #0284c7; font-weight: 800; text-align: right;"> s
                            </div>
                            <input type="range" id="fadeOutSlider" min="0" max="10" step="0.5" value="3.0" class="slider-custom">
                        </div>
                    </div>

                    <!-- Bitrate Compression Box -->
                    <div class="studio-control-card">
                        <div class="studio-control-title">
                            <i class="bi bi-file-zip-fill"></i> Kompresi Bitrate Audio
                        </div>
                        <label style="font-size: 0.78rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 4px;">Pilih Kualitas / Bitrate:</label>
                        <select id="bitrateSelect" class="form-select-custom" style="width: 100%; margin-bottom: 8px;">
                            <option value="64">64 kbps (Sangat Ringan - hemat kuota tamu mobile)</option>
                            <option value="96">96 kbps (Ringan - loading sangat cepat)</option>
                            <option value="128" selected>128 kbps (Standar CDN Wedding - Sangat Direkomendasikan)</option>
                            <option value="192">192 kbps (High Fidelity - vokal & instrumen jernih)</option>
                            <option value="320">320 kbps (Studio Master - kualitas tertinggi)</option>
                        </select>
                        <div style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.4;">
                            Kompresi ke 128 atau 96 kbps membuat undangan pernikahan langsung berbunyi di ponsel tamu tanpa jeda.
                        </div>
                    </div>

                </div>

                <!-- Export Details -->
                <div style="background: #f8fafc; border: 1px solid var(--border-light); border-radius: var(--radius-card); padding: 1.25rem; margin-bottom: 1.5rem;">
                    <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 220px;">
                            <label style="font-size: 0.82rem; color: var(--text-title); font-weight: 700; display: block; margin-bottom: 4px;">Nama / Judul Lagu Hasil Potongan:</label>
                            <input type="text" id="exportTitleInput" class="form-input-custom" placeholder="Contoh: Bermuara (Wedding Trimmed)">
                        </div>

                        <div style="flex: 1; min-width: 180px;">
                            <label style="font-size: 0.82rem; color: var(--text-title); font-weight: 700; display: block; margin-bottom: 4px;">Penyanyi / Artist:</label>
                            <input type="text" id="exportArtistInput" class="form-input-custom" placeholder="Contoh: Rizky Febian ft. Mahalini">
                        </div>

                        <div style="display: flex; align-items: center; gap: 8px; margin-top: 1.25rem;">
                            <input type="checkbox" id="exportOverwriteCheck" style="width: 18px; height: 18px; accent-color: var(--brand-rose); cursor: pointer;">
                            <label for="exportOverwriteCheck" style="font-size: 0.88rem; color: var(--text-body); cursor: pointer; font-weight: 600;">
                                Timpa (overwrite) file asli di CDN
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Progress Bar -->
                <div id="studioProgressContainer" style="display: none; margin-bottom: 1.5rem;">
                    <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--brand-rose); font-weight: 700; margin-bottom: 6px;">
                        <span id="studioProgressText">Memproses audio...</span>
                    </div>
                    <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden;">
                        <div id="studioProgressBar" style="width: 0%; height: 100%; background: var(--brand-rose); transition: width 0.15s ease;"></div>
                    </div>
                </div>

                <!-- Modal Actions -->
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; border-top: 1px solid var(--border-light); padding-top: 1.25rem;">
                    <button class="preview-btn" id="studioPlayBtn" style="padding: 10px 24px; font-size: 0.95rem;">
                        <i class="bi bi-play-fill"></i> Play Seleksi
                    </button>

                    <div style="display: flex; gap: 10px;">
                        <button class="f-btn" onclick="audioStudio.closeStudio()">
                            Batal
                        </button>
                        <button class="btn-rose" id="studioProcessBtn">
                            <i class="bi bi-check-circle-fill"></i> Proses & Simpan ke CDN
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL: IMPORT ASSET DARI URL (TikTok, YouTube, Direct MP3) -->
    <!-- ============================================================== -->
    <div class="custom-modal-overlay" id="importModal">
        <div class="custom-modal-content" style="max-width: 550px;">
            <div class="modal-header-custom">
                <h3 style="font-size: 1.3rem; color: var(--brand-rose); margin: 0;" class="brand-serif">
                    <i class="bi bi-link-45deg"></i> Import Media dari URL
                </h3>
                <button class="btn-close-modal" id="closeImportModalBtn">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <div class="modal-body-custom">
                <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 1.25rem; line-height: 1.5;">
                    Unduh audio langsung dari internet ke CDN. Mendukung tautan <strong>TikTok</strong> (auto extract audio), <strong>YouTube</strong>, serta tautan langsung file <strong>.mp3 / .m4a</strong>.
                </p>

                <form id="importForm">
                    <div>
                        <label style="font-size: 0.82rem; color: var(--text-title); font-weight: 700; display: block; margin-bottom: 4px;">
                            URL Sumber Media * :
                        </label>
                        <div style="position: relative;">
                            <input type="url" name="url" id="importUrlInput" class="form-input-custom" placeholder="https://www.tiktok.com/... atau https://youtu.be/... atau https://.../audio.mp3" required style="padding-left: 38px;">
                            <i class="bi bi-link" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--brand-rose); font-size: 1.1rem;"></i>
                        </div>
                        <div style="display: flex; gap: 6px; margin-top: 6px; flex-wrap: wrap;">
                            <span class="f-btn" style="font-size: 0.7rem; padding: 2px 10px; cursor: default; background: #f1f5f9; color: #475569;">
                                <i class="bi bi-tiktok"></i> TikTok
                            </span>
                            <span class="f-btn" style="font-size: 0.7rem; padding: 2px 10px; cursor: default; background: #f1f5f9; color: #475569;">
                                <i class="bi bi-youtube"></i> YouTube
                            </span>
                            <span class="f-btn" style="font-size: 0.7rem; padding: 2px 10px; cursor: default; background: #f1f5f9; color: #475569;">
                                <i class="bi bi-file-earmark-music"></i> Direct MP3
                            </span>
                        </div>
                    </div>

                    <div style="margin-top: 1.25rem;">
                        <label style="font-size: 0.82rem; color: var(--text-title); font-weight: 700; display: block; margin-bottom: 4px;">
                            Judul Lagu (Opsional - otomatis terdeteksi jika kosong):
                        </label>
                        <input type="text" name="title" id="importTitleInput" class="form-input-custom" placeholder="Contoh: Bermuara">
                    </div>

                    <div style="margin-top: 1rem;">
                        <label style="font-size: 0.82rem; color: var(--text-title); font-weight: 700; display: block; margin-bottom: 4px;">
                            Nama Penyanyi / Artist (Opsional):
                        </label>
                        <input type="text" name="artist" id="importArtistInput" class="form-input-custom" placeholder="Contoh: Rizky Febian feat. Mahalini">
                    </div>

                    <div style="margin-top: 1rem;">
                        <label style="font-size: 0.82rem; color: var(--text-title); font-weight: 700; display: block; margin-bottom: 4px;">
                            Kategori Asset:
                        </label>
                        <select name="category" id="importCategorySelect" class="form-select-custom" style="width: 100%;">
                            <option value="Romantic Wedding">Romantic Wedding</option>
                            <option value="Acoustic Instrumental">Acoustic Instrumental</option>
                            <option value="Traditional & Culture">Traditional & Culture</option>
                            <option value="Upbeat & Modern">Upbeat & Modern</option>
                            <option value="Slow Emotional">Slow Emotional</option>
                            <option value="Wedding Highlights">Wedding Highlights</option>
                        </select>
                    </div>

                    <div id="importProgressContainer" style="display: none; margin-top: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; color: var(--brand-rose); font-weight: 700; margin-bottom: 6px;">
                            <span id="importProgressText"><i class="bi bi-arrow-repeat" style="animation: spin 1s linear infinite; display: inline-block;"></i> Mengunduh dan memproses media...</span>
                        </div>
                        <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
                            <div id="importProgressBar" style="width: 60%; height: 100%; background: var(--brand-rose); transition: width 0.3s ease;"></div>
                        </div>
                    </div>

                    <div style="margin-top: 1.75rem;">
                        <button type="submit" class="btn-rose" id="importSubmitBtn" style="width: 100%; justify-content: center;">
                            <i class="bi bi-cloud-arrow-down-fill"></i> Download & Simpan ke CDN
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- ============================================================== -->
    <!-- MODAL: UPLOAD ASSET -->
    <!-- ============================================================== -->
    <div class="custom-modal-overlay" id="uploadModal">
        <div class="custom-modal-content" style="max-width: 550px;">
            <div class="modal-header-custom">
                <h3 style="font-size: 1.3rem; color: var(--brand-rose); margin: 0;" class="brand-serif">
                    <i class="bi bi-cloud-arrow-up-fill"></i> Unggah Asset ke CDN
                </h3>
                <button class="btn-close-modal" id="closeUploadModalBtn">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>

            <div class="modal-body-custom">
                <form id="uploadForm">
                    <input type="file" id="uploadFileInput" name="file" accept=".mp3,.wav,.ogg,.m4a,.aac,.mp4,.webm" style="display: none;" required>

                    <div class="upload-dropzone" id="uploadDropZone">
                        <i class="bi bi-cloud-arrow-up-fill dropzone-icon"></i>
                        <h4 style="font-size: 1.15rem; color: var(--text-title); margin-bottom: 4px;" class="brand-serif">Pilih atau Tarik File ke Sini</h4>
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0;">
                            Mendukung Musik (.mp3, .wav, .m4a) & Video (.mp4, .webm)
                        </p>
                    </div>

                    <div id="selectedFileDetails" style="display: none; background: var(--brand-rose-light); border: 1px solid var(--brand-rose-border); border-radius: var(--radius-card); padding: 12px 16px; margin-top: 1rem; align-items: center; justify-content: space-between;">
                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 320px;">
                            <div id="selectedFileName" style="font-weight: 700; font-size: 0.88rem; color: var(--brand-rose);"></div>
                            <div id="selectedFileSize" style="font-size: 0.78rem; color: var(--text-muted);"></div>
                        </div>
                        <i class="bi bi-check-circle-fill" style="color: #16a34a; font-size: 1.25rem;"></i>
                    </div>

                    <div style="margin-top: 1.25rem;">
                        <label style="font-size: 0.82rem; color: var(--text-title); font-weight: 700; display: block; margin-bottom: 4px;">Judul Lagu / Asset:</label>
                        <input type="text" name="title" id="uploadTitleInput" class="form-input-custom" placeholder="Contoh: Bermuara">
                    </div>

                    <div style="margin-top: 1rem;">
                        <label style="font-size: 0.82rem; color: var(--text-title); font-weight: 700; display: block; margin-bottom: 4px;">Nama Penyanyi / Artist:</label>
                        <input type="text" name="artist" id="uploadArtistInput" class="form-input-custom" placeholder="Contoh: Rizky Febian feat. Mahalini">
                    </div>

                    <div style="margin-top: 1rem;">
                        <label style="font-size: 0.82rem; color: var(--text-title); font-weight: 700; display: block; margin-bottom: 4px;">Kategori Asset:</label>
                        <select name="category" class="form-select-custom" style="width: 100%;">
                            <option value="Romantic Wedding">Romantic Wedding</option>
                            <option value="Acoustic Instrumental">Acoustic Instrumental</option>
                            <option value="Traditional & Culture">Traditional & Culture</option>
                            <option value="Upbeat & Modern">Upbeat & Modern</option>
                            <option value="Slow Emotional">Slow Emotional</option>
                            <option value="Wedding Highlights">Wedding Highlights (Video)</option>
                        </select>
                    </div>

                    <div id="uploadProgressContainer" style="display: none; margin-top: 1.25rem;">
                        <div style="width: 100%; height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden;">
                            <div id="uploadProgressBar" style="width: 0%; height: 100%; background: var(--brand-rose);"></div>
                        </div>
                    </div>

                    <div style="margin-top: 1.75rem;">
                        <button type="submit" class="btn-rose" id="uploadSubmitBtn" style="width: 100%; justify-content: center;">
                            <i class="bi bi-upload"></i> Mulai Unggah ke CDN
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Toast Notification Container -->
    <div id="toastContainer"></div>

    <!-- Scripts -->
    <script src="assets/js/audio-studio.js?v=2"></script>
    <script src="assets/js/app.js"?v=2></script>

    <style>
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    </style>
</body>
</html>
