<?php
declare(strict_types=1);

namespace Permata\Admin\Cdn;

class CdnService
{
    private array $config;
    private string $localDir;
    private string $publicBaseUrl;
    private string $authPassword;

    public function __construct()
    {
        $configFile = __DIR__ . '/config.php';
        if (file_exists($configFile)) {
            $this->config = require $configFile;
        } else {
            $this->config = [
                'public_base_url' => 'https://content.permatawedding.com',
                'local_dir'       => 'C:/xampp/htdocs/cdn.permatawedding.com',
                'auth_password'   => 'PermataWedding1',
            ];
        }

        $this->localDir      = rtrim(str_replace('\\', '/', $this->config['local_dir']), '/');
        $this->publicBaseUrl = rtrim($this->config['public_base_url'], '/');
        $this->authPassword  = (string)($this->config['auth_password'] ?? 'PermataWedding1');
    }

    public function getConfig(): array
    {
        return $this->config;
    }

    public function isLocalAvailable(): bool
    {
        return is_dir($this->localDir);
    }

    /**
     * Memuat helpers dari cdn.permatawedding.com jika ada di lokal
     */
    private function loadCdnHelpers(): bool
    {
        if ($this->isLocalAvailable() && file_exists($this->localDir . '/helpers.php')) {
            // Hindari output headers sent jika belum di-require
            if (!class_exists('\MediaManager')) {
                require_once $this->localDir . '/config.php';
                require_once $this->localDir . '/helpers.php';
            }
            return true;
        }
        return false;
    }

    /**
     * Membaca media_database.json secara langsung
     */
    private function readDatabase(): array
    {
        $dbFile = $this->localDir . '/data/media_database.json';
        if (file_exists($dbFile)) {
            $content = @file_get_contents($dbFile);
            if ($content) {
                $decoded = json_decode($content, true);
                if (is_array($decoded)) {
                    return $decoded;
                }
            }
        }
        return ['music' => [], 'videos' => [], 'settings' => []];
    }

    /**
     * Menyimpan data ke media_database.json
     */
    private function writeDatabase(array $data): bool
    {
        $dbFile = $this->localDir . '/data/media_database.json';
        return (bool) @file_put_contents($dbFile, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Mengambil ringkasan statistik storage dan aset CDN
     */
    public function getStats(): array
    {
        $music = $this->getMusicList();
        $videos = $this->getVideoList();

        $totalBytes = 0;
        foreach ($music as $m) {
            $totalBytes += (int)($m['size_bytes'] ?? 0);
        }
        foreach ($videos as $v) {
            $totalBytes += (int)($v['size_bytes'] ?? 0);
        }

        return [
            'music_count'       => count($music),
            'video_count'       => count($videos),
            'total_size_bytes'  => $totalBytes,
            'total_size_fmt'    => $this->formatBytes($totalBytes),
            'public_domain'     => $this->publicBaseUrl,
            'local_dir'         => $this->localDir,
            'is_local'          => $this->isLocalAvailable(),
            'online'            => true,
            'audio_studio_url'  => $this->publicBaseUrl . '/#studio',
            'api_music_url'     => $this->publicBaseUrl . '/api/music.php',
            'api_videos_url'    => $this->publicBaseUrl . '/api/videos.php',
        ];
    }

    /**
     * Mengambil daftar musik lengkap dengan public link https://content.permatawedding.com/
     */
    public function getMusicList(string $search = '', string $category = ''): array
    {
        $items = [];

        if ($this->loadCdnHelpers()) {
            $raw = \MediaManager::getAllMusic(true);
            foreach ($raw as $m) {
                $filename = (string)($m['filename'] ?? '');
                $publicUrl = $this->publicBaseUrl . '/uploads/music/' . rawurlencode($filename);
                $localUrl = $this->getPreviewUrl('uploads/music', $filename);

                $items[] = [
                    'id'               => (string)($m['id'] ?? ''),
                    'name'             => (string)($m['name'] ?? 'Tanpa Judul'),
                    'artist'           => (string)($m['artist'] ?? 'Permata Wedding'),
                    'filename'         => $filename,
                    'public_url'       => $publicUrl,
                    'preview_url'      => $localUrl,
                    'duration'         => (string)($m['duration'] ?? '0:00'),
                    'duration_seconds' => (int)($m['duration_seconds'] ?? 0),
                    'size'             => (string)($m['size'] ?? '0 B'),
                    'size_bytes'       => (int)($m['size_bytes'] ?? 0),
                    'bitrate'          => (string)($m['bitrate'] ?? '128 kbps'),
                    'category'         => (string)($m['category'] ?? 'Romantic Wedding'),
                    'created_at'       => (string)($m['created_at'] ?? ''),
                ];
            }
        } else {
            // Fallback baca JSON langsung
            $db = $this->readDatabase();
            foreach ($db['music'] ?? [] as $m) {
                $filename = (string)($m['filename'] ?? '');
                $publicUrl = $this->publicBaseUrl . '/uploads/music/' . rawurlencode($filename);
                $localUrl = $this->getPreviewUrl('uploads/music', $filename);

                $items[] = [
                    'id'               => (string)($m['id'] ?? ''),
                    'name'             => (string)($m['name'] ?? 'Tanpa Judul'),
                    'artist'           => (string)($m['artist'] ?? 'Permata Wedding'),
                    'filename'         => $filename,
                    'public_url'       => $publicUrl,
                    'preview_url'      => $localUrl,
                    'duration'         => (string)($m['duration'] ?? '0:00'),
                    'duration_seconds' => (int)($m['duration_seconds'] ?? 0),
                    'size'             => (string)($m['size'] ?? '0 B'),
                    'size_bytes'       => (int)($m['size_bytes'] ?? 0),
                    'bitrate'          => (string)($m['bitrate'] ?? '128 kbps'),
                    'category'         => (string)($m['category'] ?? 'Romantic Wedding'),
                    'created_at'       => (string)($m['created_at'] ?? ''),
                ];
            }
        }

        // Filter search & category
        if ($search !== '' || $category !== '') {
            $s = strtolower(trim($search));
            $c = strtolower(trim($category));
            $items = array_values(array_filter($items, function ($it) use ($s, $c) {
                $matchS = ($s === '') || str_contains(strtolower($it['name']), $s) || str_contains(strtolower($it['artist']), $s) || str_contains(strtolower($it['filename']), $s);
                $matchC = ($c === '') || (strtolower($it['category']) === $c);
                return $matchS && $matchC;
            }));
        }

        return $items;
    }

    /**
     * Mengambil daftar video lengkap dengan public link https://content.permatawedding.com/
     */
    public function getVideoList(string $search = '', string $category = ''): array
    {
        $items = [];

        if ($this->loadCdnHelpers()) {
            $raw = \MediaManager::getAllVideos(true);
            foreach ($raw as $v) {
                $filename = (string)($v['filename'] ?? '');
                $publicUrl = $this->publicBaseUrl . '/uploads/videos/' . rawurlencode($filename);
                $localUrl = $this->getPreviewUrl('uploads/videos', $filename);

                $items[] = [
                    'id'          => (string)($v['id'] ?? ''),
                    'name'        => (string)($v['name'] ?? 'Video'),
                    'filename'    => $filename,
                    'public_url'  => $publicUrl,
                    'preview_url' => $localUrl,
                    'size'        => (string)($v['size'] ?? '0 B'),
                    'size_bytes'  => (int)($v['size_bytes'] ?? 0),
                    'category'    => (string)($v['category'] ?? 'Wedding Highlights'),
                    'created_at'  => (string)($v['created_at'] ?? ''),
                ];
            }
        } else {
            $db = $this->readDatabase();
            foreach ($db['videos'] ?? [] as $v) {
                $filename = (string)($v['filename'] ?? '');
                $publicUrl = $this->publicBaseUrl . '/uploads/videos/' . rawurlencode($filename);
                $localUrl = $this->getPreviewUrl('uploads/videos', $filename);

                $items[] = [
                    'id'          => (string)($v['id'] ?? ''),
                    'name'        => (string)($v['name'] ?? 'Video'),
                    'filename'    => $filename,
                    'public_url'  => $publicUrl,
                    'preview_url' => $localUrl,
                    'size'        => (string)($v['size'] ?? '0 B'),
                    'size_bytes'  => (int)($v['size_bytes'] ?? 0),
                    'category'    => (string)($v['category'] ?? 'Wedding Highlights'),
                    'created_at'  => (string)($v['created_at'] ?? ''),
                ];
            }
        }

        if ($search !== '' || $category !== '') {
            $s = strtolower(trim($search));
            $c = strtolower(trim($category));
            $items = array_values(array_filter($items, function ($it) use ($s, $c) {
                $matchS = ($s === '') || str_contains(strtolower($it['name']), $s) || str_contains(strtolower($it['filename']), $s);
                $matchC = ($c === '') || (strtolower($it['category']) === $c);
                return $matchS && $matchC;
            }));
        }

        return $items;
    }

    /**
     * Upload asset langsung ke folder CDN
     */
    public function uploadAsset(array $file, string $type, string $title, string $artist = '', string $category = ''): array
    {
        if (empty($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return ['success' => false, 'message' => 'Berkas upload tidak valid'];
        }

        $type = in_array($type, ['music', 'video'], true) ? $type : 'music';
        $isAudio = ($type === 'music');

        $origName = $file['name'];
        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));

        $audioExts = ['mp3', 'wav', 'm4a', 'ogg', 'aac'];
        $videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

        if ($isAudio && !in_array($ext, $audioExts, true)) {
            return ['success' => false, 'message' => 'Format audio harus: ' . implode(', ', $audioExts)];
        }
        if (!$isAudio && !in_array($ext, $videoExts, true)) {
            return ['success' => false, 'message' => 'Format video harus: ' . implode(', ', $videoExts)];
        }

        // Tentukan folder tujuan
        $destDir = $isAudio 
            ? $this->localDir . '/uploads/music' 
            : $this->localDir . '/uploads/videos';

        if (!is_dir($destDir)) {
            @mkdir($destDir, 0755, true);
        }

        // Bersihkan nama berkas
        $slug = $this->slugify($title ?: pathinfo($origName, PATHINFO_FILENAME));
        $targetFilename = $slug . '.' . $ext;
        $counter = 1;
        while (file_exists($destDir . '/' . $targetFilename)) {
            $targetFilename = $slug . '-' . $counter . '.' . $ext;
            $counter++;
        }

        $destPath = $destDir . '/' . $targetFilename;
        if (!move_uploaded_file($file['tmp_name'], $destPath)) {
            return ['success' => false, 'message' => 'Gagal memindahkan berkas ke folder CDN'];
        }

        $fileSize = filesize($destPath);
        $cleanTitle = $title ?: ucwords(str_replace(['-', '_'], ' ', pathinfo($origName, PATHINFO_FILENAME)));
        $cleanArtist = $artist ?: 'Permata Wedding';
        $cleanCat = $category ?: ($isAudio ? 'Romantic Wedding' : 'Wedding Highlights');

        $this->loadCdnHelpers();

        if ($isAudio) {
            $meta = class_exists('\MediaManager') ? \MediaManager::estimateAudioMeta($destPath) : [
                'duration_formatted' => '0:00',
                'duration_seconds'   => 0,
                'bitrate'            => '128 kbps',
            ];
            $item = [
                'id'               => 'trk_' . substr(md5($targetFilename . time()), 0, 8),
                'name'             => $cleanTitle,
                'artist'           => $cleanArtist,
                'filename'         => $targetFilename,
                'url'              => $this->publicBaseUrl . '/uploads/music/' . rawurlencode($targetFilename),
                'duration'         => $meta['duration_formatted'] ?? '0:00',
                'duration_seconds' => (int)($meta['duration_seconds'] ?? 0),
                'size'             => $this->formatBytes($fileSize),
                'size_bytes'       => (int)$fileSize,
                'bitrate'          => $meta['bitrate'] ?? '128 kbps',
                'category'         => $cleanCat,
                'created_at'       => date('Y-m-d H:i:s'),
                'updated_at'       => date('Y-m-d H:i:s'),
            ];
            if (class_exists('\MediaManager')) {
                \MediaManager::saveMusicItem($item);
            }
        } else {
            $item = [
                'id'          => 'vid_' . substr(md5($targetFilename . time()), 0, 8),
                'name'        => $cleanTitle,
                'filename'    => $targetFilename,
                'url'         => $this->publicBaseUrl . '/uploads/videos/' . rawurlencode($targetFilename),
                'size'        => $this->formatBytes($fileSize),
                'size_bytes'  => (int)$fileSize,
                'category'    => $cleanCat,
                'created_at'  => date('Y-m-d H:i:s'),
                'updated_at'  => date('Y-m-d H:i:s'),
            ];
            if (class_exists('\MediaManager')) {
                \MediaManager::saveVideoItem($item);
            }
        }

        return [
            'success' => true,
            'message' => 'Asset berhasil diunggah ke CDN!',
            'type'    => $type,
            'data'    => $item,
        ];
    }

    /**
     * Import Audio / Media dari URL publik atau TikTok via cdn api
     */
    public function importUrl(string $url, string $title = '', string $artist = '', string $category = ''): array
    {
        $importApi = str_starts_with($this->localDir, '/www/wwwroot')
            ? $this->publicBaseUrl . '/api/import-url.php'
            : 'http://localhost/cdn.permatawedding.com/api/import-url.php';

        $postData = [
            'url'      => $url,
            'title'    => $title,
            'artist'   => $artist,
            'category' => $category,
        ];

        $ch = curl_init($importApi);
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($postData),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . $this->authPassword,
            ],
            CURLOPT_TIMEOUT        => 60,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $err      = curl_error($ch);
        curl_close($ch);

        if ($err) {
            return ['success' => false, 'message' => 'Gagal koneksi import: ' . $err];
        }

        $decoded = json_decode((string)$response, true);
        if ($httpCode === 200 && is_array($decoded) && ($decoded['status'] ?? '') === 'success') {
            return [
                'success' => true,
                'message' => $decoded['message'] ?? 'Import URL berhasil',
                'data'    => $decoded['data'] ?? [],
            ];
        }

        return [
            'success' => false,
            'message' => $decoded['message'] ?? 'Gagal mengimpor media dari URL',
        ];
    }

    /**
     * Update metadata asset (Nama, Artis, Kategori)
     */
    public function updateAsset(string $id, string $type, string $title, string $artist = '', string $category = ''): array
    {
        $this->loadCdnHelpers();

        if ($type === 'video') {
            $videos = \MediaManager::getAllVideos(false);
            $found = null;
            foreach ($videos as $v) {
                if ($v['id'] === $id) {
                    $found = $v;
                    break;
                }
            }
            if (!$found) {
                return ['success' => false, 'message' => 'Video tidak ditemukan'];
            }
            if (!empty($title)) $found['name'] = trim($title);
            if (!empty($category)) $found['category'] = trim($category);
            $found['updated_at'] = date('Y-m-d H:i:s');
            \MediaManager::saveVideoItem($found);
            return ['success' => true, 'message' => 'Video berhasil diperbarui', 'data' => $found];
        } else {
            $track = \MediaManager::findMusic($id);
            if (!$track) {
                return ['success' => false, 'message' => 'Musik tidak ditemukan'];
            }
            if (!empty($title)) $track['name'] = trim($title);
            if (!empty($artist)) $track['artist'] = trim($artist);
            if (!empty($category)) $track['category'] = trim($category);
            $track['updated_at'] = date('Y-m-d H:i:s');
            \MediaManager::saveMusicItem($track);
            return ['success' => true, 'message' => 'Musik berhasil diperbarui', 'data' => $track];
        }
    }

    /**
     * Hapus asset fisik dan entri database
     */
    public function deleteAsset(string $id, string $type): array
    {
        $this->loadCdnHelpers();

        $deleted = ($type === 'video')
            ? \MediaManager::deleteVideoItem($id)
            : \MediaManager::deleteMusicItem($id);

        if ($deleted) {
            return ['success' => true, 'message' => 'Aset CDN berhasil dihapus'];
        }
        return ['success' => false, 'message' => 'Aset tidak ditemukan atau gagal dihapus'];
    }

    private function slugify(string $text): string
    {
        $text = strtolower(trim($text));
        $text = preg_replace('/[^a-z0-9]+/i', '-', $text);
        return trim($text, '-');
    }

    private function getPreviewUrl(string $subpath, string $filename): string
    {
        if (str_starts_with($this->localDir, '/www/wwwroot')) {
            return $this->publicBaseUrl . '/' . $subpath . '/' . rawurlencode($filename);
        }

        // Jika folder cdn berada di dalam order-permata
        if (str_contains(str_replace('\\', '/', $this->localDir), 'order-permata/cdn')) {
            return '/order-permata/cdn/' . $subpath . '/' . rawurlencode($filename);
        }

        return 'http://localhost/cdn.permatawedding.com/' . $subpath . '/' . rawurlencode($filename);
    }

    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min((int)$pow, count($units) - 1);
        $bytes /= (1024 ** $pow);
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}
