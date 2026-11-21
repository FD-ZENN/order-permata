<?php
/**
 * CDN Permata Wedding - Remote URL Importer
 * Endpoint: /api/import-url.php
 * 
 * Mengunduh dan mengimpor file audio langsung dari URL:
 * - Direct Audio Link (.mp3, .wav, .m4a, .aac, dll.)
 * - TikTok Video / Audio link (ekstraksi background audio)
 * - YouTube Video / Audio link (resolver multi-tier & yt-dlp jika tersedia)
 * 
 * Dilengkapi proteksi Anti-SSRF & Anti-Injection ketat.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../helpers.php';

sendCorsHeaders();
header('Content-Type: application/json; charset=utf-8');

// Wajib login admin
requireApiAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    sendJsonResponse(['status' => 'error', 'message' => 'Method not allowed. Use POST.'], 405);
}

$rawUrl = trim($_POST['url'] ?? '');
$customTitle = !empty($_POST['title']) ? sanitizeText($_POST['title'], 120) : '';
$customArtist = !empty($_POST['artist']) ? sanitizeText($_POST['artist'], 100) : '';
$category = !empty($_POST['category']) ? sanitizeText($_POST['category'], 60) : 'Romantic Wedding';

if (empty($rawUrl)) {
    sendJsonResponse(['status' => 'error', 'message' => 'URL sumber media tidak boleh kosong.'], 400);
}

// =============================================================================
// 1. KEAMANAN: ANTI-SSRF (Server-Side Request Forgery) FILTER
// =============================================================================
function validatePublicUrl($url) {
    $parsed = parse_url($url);
    if (!$parsed || empty($parsed['scheme']) || empty($parsed['host'])) {
        return ['valid' => false, 'error' => 'Format URL tidak valid. Gunakan format http:// atau https://'];
    }

    $scheme = strtolower($parsed['scheme']);
    if (!in_array($scheme, ['http', 'https'], true)) {
        return ['valid' => false, 'error' => 'Hanya protokol HTTP dan HTTPS yang diizinkan.'];
    }

    $host = strtolower($parsed['host']);
    if (in_array($host, ['localhost', '127.0.0.1', '::1', '0.0.0.0'], true)) {
        return ['valid' => false, 'error' => 'Akses ke alamat loopback/lokal dilarang (Anti-SSRF).'];
    }

    // Resolusi IP DNS
    $ips = @gethostbynamel($host);
    if (!$ips) {
        return ['valid' => false, 'error' => 'Nama host URL tidak dapat diselesaikan oleh DNS.'];
    }

    foreach ($ips as $ip) {
        // Blokir private IP (10.x, 192.168.x, 172.16-31.x) dan reserved IP (169.254.x Cloud Metadata)
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            return ['valid' => false, 'error' => "Akses ke IP privat/internal ($ip) diblokir untuk keamanan server."];
        }
    }

    return ['valid' => true, 'host' => $host];
}

$securityCheck = validatePublicUrl($rawUrl);
if (!$securityCheck['valid']) {
    sendJsonResponse(['status' => 'error', 'message' => $securityCheck['error']], 403);
}

$host = $securityCheck['host'];

// =============================================================================
// 2. DETEKSI JENIS URL (TikTok, YouTube, atau Direct Audio URL)
// =============================================================================
$isTikTok = (stripos($host, 'tiktok.com') !== false);
$isYouTube = (stripos($host, 'youtube.com') !== false || stripos($host, 'youtu.be') !== false);

$downloadUrl = $rawUrl;
$resolvedTitle = '';
$resolvedArtist = '';
$tempExt = 'mp3';

// -----------------------------------------------------------------------------
// Kasus A: TikTok Video Link
if ($isTikTok) {
    // Resolve shortlink jika format vt.tiktok.com atau vm.tiktok.com
    $tiktokTargetUrl = $rawUrl;
    if (stripos($host, 'vt.tiktok.com') !== false || stripos($host, 'vm.tiktok.com') !== false) {
        $chFollow = curl_init();
        curl_setopt_array($chFollow, [
            CURLOPT_URL => $rawUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_NOBODY => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        ]);
        curl_exec($chFollow);
        $effective = curl_getinfo($chFollow, CURLINFO_EFFECTIVE_URL);
        curl_close($chFollow);
        if (!empty($effective) && stripos($effective, 'tiktok.com') !== false) {
            $tiktokTargetUrl = $effective;
        }
    }

    // Ekstraksi audio via TikWM API
    $apiEndpoint = 'https://www.tikwm.com/api/?url=' . urlencode($tiktokTargetUrl);
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiEndpoint,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 20,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ]);
    $tikRes = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $tikData = json_decode($tikRes, true);
    if ($httpCode === 200 && isset($tikData['code']) && $tikData['code'] === 0 && !empty($tikData['data'])) {
        $data = $tikData['data'];
        
        // Cari direct link audio
        if (!empty($data['music'])) {
            $downloadUrl = $data['music'];
        } elseif (!empty($data['music_info']['play'])) {
            $downloadUrl = $data['music_info']['play'];
        } else {
            sendJsonResponse(['status' => 'error', 'message' => 'Audio latar tidak ditemukan pada video TikTok ini.'], 400);
        }

        // Ambil judul dan artis dari TikTok jika admin tidak mengisi manual
        if (empty($customTitle)) {
            $resolvedTitle = !empty($data['music_info']['title']) ? $data['music_info']['title'] : ($data['title'] ?? 'TikTok Sound');
        }
        if (empty($customArtist)) {
            $resolvedArtist = !empty($data['music_info']['author']) ? $data['music_info']['author'] : ($data['author']['nickname'] ?? 'TikTok Artist');
        }
    } else {
        $errMsg = $tikData['msg'] ?? 'Gagal mengekstrak audio dari link TikTok. Pastikan video bersifat publik dan link benar.';
        sendJsonResponse(['status' => 'error', 'message' => $errMsg], 400);
    }
}

// -----------------------------------------------------------------------------
// Kasus B: YouTube Link
// -----------------------------------------------------------------------------
elseif ($isYouTube) {
    // 1. Deteksi letak binary yt-dlp di sistem (Linux VPS & Windows)
    $hasYtDlp = false;
    $ytDlpCmd = '';
    
    // Perpanjang timeout PHP untuk pengunduhan YouTube
    @set_time_limit(180);

    $localBin = ROOT_PATH . DIRECTORY_SEPARATOR . 'bin' . DIRECTORY_SEPARATOR . (DIRECTORY_SEPARATOR === '\\' ? 'yt-dlp.exe' : 'yt-dlp');
    $ytCandidates = [
        $localBin,
        '/usr/local/bin/yt-dlp',
        '/usr/bin/yt-dlp',
        'yt-dlp',
        'yt-dlp.exe',
        '/home/permata/.local/bin/yt-dlp',
        '/snap/bin/yt-dlp'
    ];

    if (function_exists('shell_exec')) {
        $whichYt = @trim((string)shell_exec('which yt-dlp 2>/dev/null'));
        if (!empty($whichYt) && !in_array($whichYt, $ytCandidates, true)) {
            array_unshift($ytCandidates, $whichYt);
        }
    }

    if (function_exists('exec') && function_exists('shell_exec')) {
        $disabled = explode(',', ini_get('disable_functions'));
        $disabled = array_map('trim', $disabled);
        if (!in_array('exec', $disabled) && !in_array('shell_exec', $disabled)) {
            foreach ($ytCandidates as $bin) {
                if (file_exists($bin)) {
                    $hasYtDlp = true;
                    $ytDlpCmd = escapeshellarg($bin);
                    break;
                }
                $execBin = (strpos($bin, ' ') !== false) ? escapeshellarg($bin) : $bin;
                $testOut = @shell_exec("$execBin --version 2>&1");
                if (!empty($testOut) && preg_match('/\d{4}\.\d{2}\.\d{2}/', $testOut)) {
                    $hasYtDlp = true;
                    $ytDlpCmd = $execBin;
                    break;
                }
            }
        }
    }

    if ($hasYtDlp) {
        // Cek letak direktori ffmpeg & ffprobe untuk konversi MP3
        $ffmpegLocation = '';
        if (DIRECTORY_SEPARATOR === '\\') {
            // Windows
            if (file_exists(ROOT_PATH . DIRECTORY_SEPARATOR . 'bin' . DIRECTORY_SEPARATOR . 'ffmpeg.exe')) {
                $ffmpegLocation = '--ffmpeg-location ' . escapeshellarg(ROOT_PATH . DIRECTORY_SEPARATOR . 'bin');
            }
        } else {
            // Linux VPS
            $possibleDirs = ['/usr/bin', '/usr/local/bin'];
            foreach ($possibleDirs as $dir) {
                if (@file_exists($dir . '/ffmpeg') || @file_exists($dir . '/ffprobe')) {
                    $ffmpegLocation = '--ffmpeg-location ' . escapeshellarg($dir);
                    break;
                }
            }
            if (empty($ffmpegLocation)) {
                $whichFfmpeg = @trim((string)shell_exec('which ffmpeg 2>/dev/null'));
                if (!empty($whichFfmpeg)) {
                    $ffmpegLocation = '--ffmpeg-location ' . escapeshellarg(dirname($whichFfmpeg));
                } else {
                    $ffmpegLocation = '--ffmpeg-location /usr/bin';
                }
            }
        }

        // Export PATH di Linux agar yt-dlp selalu dapat menemukan binary sistem
        $envPrefix = (DIRECTORY_SEPARATOR !== '\\') ? 'export PATH=/usr/bin:/usr/local/bin:/bin:$PATH; ' : '';

        // Ekstraksi via server-side yt-dlp
        $tempOutputBase = UPLOAD_DIR . DIRECTORY_SEPARATOR . 'temp_ytdl_' . time() . '_' . substr(md5(uniqid()), 0, 5);
        $escapedUrl = escapeshellarg($rawUrl);
        $escapedOut = escapeshellarg($tempOutputBase . '.%(ext)s');

        // Parameter optimasi audio MP3 128K
        $formatAndExtract = '-f "bestaudio/best" -x --audio-format mp3 --audio-quality 128K ' . $ffmpegLocation;
        $cmd = $envPrefix . "$ytDlpCmd --no-playlist --no-warnings $formatAndExtract --print \"BEFORE_DL:%(title)s;;;%(uploader)s\" -o $escapedOut $escapedUrl 2>&1";
        
        $cmdOutput = [];
        $cmdCode = 0;
        exec($cmd, $cmdOutput, $cmdCode);

        // Jika gagal karena ffprobe/ffmpeg, coba otomatis unduh stream AAC/M4A murni (tanpa butuh konversi)
        if ($cmdCode !== 0 && stripos(implode(' ', $cmdOutput), 'ffmpeg') !== false) {
            $fallbackCmd = $envPrefix . "$ytDlpCmd --no-playlist --no-warnings -f \"ba[ext=m4a]/ba\" --print \"BEFORE_DL:%(title)s;;;%(uploader)s\" -o $escapedOut $escapedUrl 2>&1";
            $cmdOutput = [];
            $cmdCode = 0;
            exec($fallbackCmd, $cmdOutput, $cmdCode);
        }

        // Ambil info metadata dari output perintah jika ada
        foreach ($cmdOutput as $line) {
            if (strpos($line, ';;;') !== false) {
                $cleanLine = str_replace('BEFORE_DL:', '', trim($line));
                $parts = explode(';;;', $cleanLine, 2);
                if (empty($customTitle) && !empty($parts[0])) $resolvedTitle = trim($parts[0]);
                if (empty($customArtist) && !empty($parts[1])) $resolvedArtist = trim($parts[1]);
                break;
            }
        }

        // Cari file hasil download (bisa .mp3, atau .m4a jika ffmpeg belum terinstall)
        $expectedFiles = glob($tempOutputBase . '.*');
        $downloadedFile = null;
        $fileExt = 'mp3';

        if (!empty($expectedFiles)) {
            foreach ($expectedFiles as $f) {
                if (file_exists($f) && filesize($f) > 1000) {
                    $downloadedFile = $f;
                    $fileExt = strtolower(pathinfo($f, PATHINFO_EXTENSION));
                    break;
                }
            }
        }

        if ($cmdCode === 0 && $downloadedFile && file_exists($downloadedFile)) {
            // Tentukan Judul Lagu & Artis
            $finalTitle = !empty($customTitle) ? $customTitle : (!empty($resolvedTitle) ? MediaManager::cleanTitleFromFilename($resolvedTitle) : 'YouTube Audio');
            $finalArtist = !empty($customArtist) ? $customArtist : (!empty($resolvedArtist) ? $resolvedArtist : '');

            // Jika artist kosong dan judul punya format "Artist - Title", pisahkan
            if (empty($finalArtist) && strpos($finalTitle, ' - ') !== false) {
                $parts = explode(' - ', $finalTitle, 2);
                $finalArtist = trim($parts[0]);
                $finalTitle = trim($parts[1]);
            }

            // Format nama file aman tanpa spasi
            $targetExt = in_array($fileExt, ['mp3', 'm4a', 'wav', 'ogg']) ? $fileExt : 'mp3';
            $finalFilename = MediaManager::generateSafeFilename(MUSIC_DIR, $finalTitle, $targetExt);
            $destination = MUSIC_DIR . DIRECTORY_SEPARATOR . $finalFilename;

            rename($downloadedFile, $destination);

            $meta = MediaManager::estimateAudioMeta($destination);
            $fileSize = filesize($destination);

            $item = [
                'id' => 'trk_' . substr(md5($finalFilename . time()), 0, 8),
                'name' => $finalTitle,
                'artist' => $finalArtist,
                'filename' => $finalFilename,
                'url' => BASE_URL . '/uploads/music/' . rawurlencode($finalFilename),
                'duration' => $meta['duration_formatted'],
                'duration_seconds' => (int)$meta['duration_seconds'],
                'size' => formatBytes($fileSize),
                'size_bytes' => (int)$fileSize,
                'bitrate' => safeHtml($meta['bitrate']),
                'category' => $category,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            MediaManager::saveMusicItem($item);

            sendJsonResponse([
                'status' => 'success',
                'message' => 'Berhasil mengunduh audio YouTube via yt-dlp server!',
                'source' => 'YouTube (yt-dlp)',
                'data' => $item
            ]);
        } else {
            // Bersihkan file sementara jika gagal
            if (!empty($expectedFiles)) {
                foreach ($expectedFiles as $f) @unlink($f);
            }
            $errSnippet = implode(' | ', array_slice(array_filter($cmdOutput), -3));
            sendJsonResponse([
                'status' => 'error',
                'message' => 'Proses yt-dlp gagal: ' . ($errSnippet ?: "Kode keluar: $cmdCode")
            ], 500);
        }
    }

    // Jika yt-dlp tidak tersedia di hosting, coba via resolver API
    $apiEndpoints = [
        'https://cobalt-api.kwiatekm.pl/',
        'https://api.cobalt.tools/'
    ];

    $resolvedAudioUrl = null;
    foreach ($apiEndpoints as $endpoint) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $endpoint,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode(['url' => $rawUrl, 'downloadMode' => 'audio', 'audioFormat' => 'mp3']),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_FOLLOWLOCATION => true
        ]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $json = json_decode($resp, true);
        if ($code === 200 && !empty($json['url'])) {
            $resolvedAudioUrl = $json['url'];
            break;
        }
    }

    if ($resolvedAudioUrl) {
        $downloadUrl = $resolvedAudioUrl;
    } else {
        $phpUser = function_exists('posix_getpwuid') && function_exists('posix_geteuid') 
            ? posix_getpwuid(posix_geteuid())['name'] 
            : get_current_user();
        
        $diag = [
            'server_os' => PHP_OS,
            'php_user' => $phpUser,
            'exec_enabled' => function_exists('exec') && !in_array('exec', array_map('trim', explode(',', ini_get('disable_functions')))),
            'shell_exec_enabled' => function_exists('shell_exec') && !in_array('shell_exec', array_map('trim', explode(',', ini_get('disable_functions')))),
            'disable_functions' => ini_get('disable_functions') ?: '(none)',
            'tested_paths' => $ytCandidates,
            'solusi_vps' => 'Jalankan di terminal VPS: sudo cp $(which yt-dlp) /usr/local/bin/yt-dlp && sudo chmod 755 /usr/local/bin/yt-dlp'
        ];

        sendJsonResponse([
            'status' => 'error',
            'message' => 'Layanan YouTube server membutuhkan yt-dlp. yt-dlp belum terdeteksi atau belum memiliki izin eksekusi oleh proses PHP (User: ' . $phpUser . ').',
            'diagnostic' => $diag
        ], 400);
    }
}

// =============================================================================
// 3. UNDUH STREAM MEDIA DARI URL (Dengan Chunking & Limit Ukuran)
// =============================================================================
$tempFile = UPLOAD_DIR . DIRECTORY_SEPARATOR . 'temp_import_' . time() . '_' . substr(md5(uniqid()), 0, 5) . '.tmp';
$fp = @fopen($tempFile, 'w+');
if (!$fp) {
    sendJsonResponse(['status' => 'error', 'message' => 'Gagal membuat file sementara di server.'], 500);
}

$maxDownloadBytes = 50 * 1024 * 1024; // Maksimal 50 MB
$downloadedBytes = 0;

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $downloadUrl,
    CURLOPT_FILE => $fp,
    CURLOPT_TIMEOUT => 60,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_MAXREDIRS => 5,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    CURLOPT_NOPROGRESS => false,
    CURLOPT_PROGRESSFUNCTION => function($resource, $download_size, $downloaded, $upload_size, $uploaded) use ($maxDownloadBytes, &$downloadedBytes) {
        $downloadedBytes = $downloaded;
        if ($downloaded > $maxDownloadBytes) {
            return 1; // Abort download
        }
        return 0;
    }
]);

$success = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
$curlErr = curl_error($ch);
curl_close($ch);
fclose($fp);

if (!$success || $httpCode >= 400 || !file_exists($tempFile) || filesize($tempFile) < 1000) {
    @unlink($tempFile);
    $errMsg = !empty($curlErr) ? $curlErr : "Server remote mengembalikan kode HTTP $httpCode.";
    sendJsonResponse(['status' => 'error', 'message' => "Gagal mengunduh file media: $errMsg"], 400);
}

// =============================================================================
// 4. VALIDASI MIME TYPE DARI MAGIC BYTES (Anti-Web Shell)
// =============================================================================
$mime = '';
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $tempFile);
    finfo_close($finfo);
}

$allowedAudioMimes = [
    'audio/mpeg', 'audio/mp3', 'audio/x-wav', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/aac', 'audio/mp4', 'video/mp4', 'application/octet-stream'
];

if (!empty($mime) && !in_array(strtolower($mime), $allowedAudioMimes, true)) {
    @unlink($tempFile);
    sendJsonResponse(['status' => 'error', 'message' => "File yang diunduh tidak dikenali sebagai format audio/video yang valid (MIME: $mime)."], 400);
}

// =============================================================================
// 5. PENENTUAN JUDUL, ARTIST, DAN NAMA FILE OTOMATIS (TANPA SPASI)
// =============================================================================
// Jika judul belum ada, coba tebak dari URL
if (empty($customTitle)) {
    if (!empty($resolvedTitle)) {
        $finalTitle = MediaManager::cleanTitleFromFilename($resolvedTitle);
    } else {
        $pathName = basename(parse_url($rawUrl, PHP_URL_PATH));
        $finalTitle = MediaManager::cleanTitleFromFilename($pathName);
        if (empty($finalTitle) || strtolower($finalTitle) === 'sound' || strtolower($finalTitle) === 'music') {
            $finalTitle = 'Imported Music ' . date('d M');
        }
    }
} else {
    $finalTitle = $customTitle;
}

$finalArtist = !empty($customArtist) ? $customArtist : (!empty($resolvedArtist) ? $resolvedArtist : '');

// Jika artist belum ada dan judul memiliki format "Judul - Artis", pisahkan otomatis
if (empty($finalArtist) && strpos($finalTitle, ' - ') !== false) {
    $parts = explode(' - ', $finalTitle, 2);
    $finalTitle = trim($parts[0]);
    $finalArtist = trim($parts[1]);
}

// Generate nama file otomatis sesuai judul lagu, bersih tanpa spasi
$finalFilename = MediaManager::generateSafeFilename(MUSIC_DIR, $finalTitle, 'mp3');
$destination = MUSIC_DIR . DIRECTORY_SEPARATOR . $finalFilename;

// Pindahkan file sementara ke lokasi final
if (!rename($tempFile, $destination)) {
    @unlink($tempFile);
    sendJsonResponse(['status' => 'error', 'message' => 'Gagal memindahkan file yang diimpor ke direktori musik.'], 500);
}

// Hitung durasi dan bitrate
$meta = MediaManager::estimateAudioMeta($destination);
$fileSize = filesize($destination);

$item = [
    'id' => 'trk_' . substr(md5($finalFilename . time()), 0, 8),
    'name' => $finalTitle,
    'artist' => $finalArtist,
    'filename' => $finalFilename,
    'url' => BASE_URL . '/uploads/music/' . rawurlencode($finalFilename),
    'duration' => $meta['duration_formatted'],
    'duration_seconds' => (int)$meta['duration_seconds'],
    'size' => formatBytes($fileSize),
    'size_bytes' => (int)$fileSize,
    'bitrate' => safeHtml($meta['bitrate']),
    'category' => $category,
    'created_at' => date('Y-m-d H:i:s'),
    'updated_at' => date('Y-m-d H:i:s')
];

MediaManager::saveMusicItem($item);

sendJsonResponse([
    'status' => 'success',
    'message' => 'Media berhasil diimpor dan disimpan ke CDN!',
    'source' => $isTikTok ? 'TikTok Audio' : ($isYouTube ? 'YouTube Audio' : 'Direct Audio URL'),
    'data' => $item
]);
