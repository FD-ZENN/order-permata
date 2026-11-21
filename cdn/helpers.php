<?php
/**
 * CDN Permata Wedding - Helpers
 * cdn.permatawedding.com
 */

require_once __DIR__ . '/config.php';

class MediaManager {
    private static function getDb() {
        if (!file_exists(DB_FILE)) {
            return ['music' => [], 'videos' => [], 'settings' => []];
        }
        $data = json_decode(file_get_contents(DB_FILE), true);
        if (!is_array($data)) {
            return ['music' => [], 'videos' => [], 'settings' => []];
        }
        return $data;
    }

    private static function saveDb($data) {
        return file_put_contents(DB_FILE, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Get all music tracks, with optional automatic synchronization with filesystem
     */
    public static function getAllMusic($syncWithFs = true) {
        $db = self::getDb();
        $music = isset($db['music']) ? $db['music'] : [];

        if ($syncWithFs) {
            $updated = false;
            // Scan music folder
            $files = glob(MUSIC_DIR . DIRECTORY_SEPARATOR . '*.{mp3,wav,ogg,m4a,aac}', GLOB_BRACE);
            if (empty($files) && file_exists(ROOT_PATH . '/data/init_samples.php')) {
                require_once ROOT_PATH . '/data/init_samples.php';
                $files = glob(MUSIC_DIR . DIRECTORY_SEPARATOR . '*.{mp3,wav,ogg,m4a,aac}', GLOB_BRACE);
            }
            $existingFilenames = array_column($music, 'filename');

            if ($files) {
                foreach ($files as $filePath) {
                    $filename = basename($filePath);
                    if (!in_array($filename, $existingFilenames)) {
                        // Automatically register discovered file
                        $id = 'trk_' . substr(md5($filename . time()), 0, 8);
                        $fileSize = filesize($filePath);
                        $title = self::cleanTitleFromFilename($filename);
                        $meta = self::estimateAudioMeta($filePath);

                        $music[] = [
                            'id' => $id,
                            'name' => $title,
                            'filename' => $filename,
                            'url' => BASE_URL . '/uploads/music/' . rawurlencode($filename),
                            'duration' => $meta['duration_formatted'],
                            'duration_seconds' => $meta['duration_seconds'],
                            'size' => formatBytes($fileSize),
                            'size_bytes' => $fileSize,
                            'bitrate' => $meta['bitrate'],
                            'category' => 'Romantic Wedding',
                            'created_at' => date('Y-m-d H:i:s', filemtime($filePath)),
                            'updated_at' => date('Y-m-d H:i:s', filemtime($filePath))
                        ];
                        $updated = true;
                    }
                }
            }

            // Also remove tracks from DB if file was manually deleted from disk
            $filteredMusic = [];
            foreach ($music as $track) {
                $filePath = MUSIC_DIR . DIRECTORY_SEPARATOR . $track['filename'];
                if (file_exists($filePath)) {
                    // Update URL dynamically to match current BASE_URL (vital for moving from local to hosting!)
                    $track['url'] = BASE_URL . '/uploads/music/' . rawurlencode($track['filename']);
                    $filteredMusic[] = $track;
                } else {
                    $updated = true;
                }
            }

            if ($updated) {
                $db['music'] = $filteredMusic;
                self::saveDb($db);
            }
            $music = $filteredMusic;
        }

        return $music;
    }

    /**
     * Get all videos, with filesystem synchronization
     */
    public static function getAllVideos($syncWithFs = true) {
        $db = self::getDb();
        $videos = isset($db['videos']) ? $db['videos'] : [];

        if ($syncWithFs) {
            $updated = false;
            $files = glob(VIDEO_DIR . DIRECTORY_SEPARATOR . '*.{mp4,webm,mov,avi,mkv}', GLOB_BRACE);
            $existingFilenames = array_column($videos, 'filename');

            if ($files) {
                foreach ($files as $filePath) {
                    $filename = basename($filePath);
                    if (!in_array($filename, $existingFilenames)) {
                        $id = 'vid_' . substr(md5($filename . time()), 0, 8);
                        $fileSize = filesize($filePath);
                        $title = self::cleanTitleFromFilename($filename);

                        $videos[] = [
                            'id' => $id,
                            'name' => $title,
                            'filename' => $filename,
                            'url' => BASE_URL . '/uploads/videos/' . rawurlencode($filename),
                            'size' => formatBytes($fileSize),
                            'size_bytes' => $fileSize,
                            'category' => 'Wedding Highlights',
                            'created_at' => date('Y-m-d H:i:s', filemtime($filePath)),
                            'updated_at' => date('Y-m-d H:i:s', filemtime($filePath))
                        ];
                        $updated = true;
                    }
                }
            }

            $filteredVideos = [];
            foreach ($videos as $vid) {
                $filePath = VIDEO_DIR . DIRECTORY_SEPARATOR . $vid['filename'];
                if (file_exists($filePath)) {
                    $vid['url'] = BASE_URL . '/uploads/videos/' . rawurlencode($vid['filename']);
                    $filteredVideos[] = $vid;
                } else {
                    $updated = true;
                }
            }

            if ($updated) {
                $db['videos'] = $filteredVideos;
                self::saveDb($db);
            }
            $videos = $filteredVideos;
        }

        return $videos;
    }

    /**
     * Add or update music item
     */
    public static function saveMusicItem($trackData) {
        $db = self::getDb();
        $music = isset($db['music']) ? $db['music'] : [];
        $found = false;

        foreach ($music as $key => $item) {
            if ($item['id'] === $trackData['id']) {
                $music[$key] = array_merge($item, $trackData, ['updated_at' => date('Y-m-d H:i:s')]);
                $found = true;
                break;
            }
        }

        if (!$found) {
            if (empty($trackData['id'])) {
                $trackData['id'] = 'trk_' . substr(md5(uniqid('', true)), 0, 8);
            }
            $trackData['created_at'] = date('Y-m-d H:i:s');
            $trackData['updated_at'] = date('Y-m-d H:i:s');
            $music[] = $trackData;
        }

        $db['music'] = $music;
        self::saveDb($db);
        return $trackData;
    }

    /**
     * Add or update video item
     */
    public static function saveVideoItem($vidData) {
        $db = self::getDb();
        $videos = isset($db['videos']) ? $db['videos'] : [];
        $found = false;

        foreach ($videos as $key => $item) {
            if ($item['id'] === $vidData['id']) {
                $videos[$key] = array_merge($item, $vidData, ['updated_at' => date('Y-m-d H:i:s')]);
                $found = true;
                break;
            }
        }

        if (!$found) {
            if (empty($vidData['id'])) {
                $vidData['id'] = 'vid_' . substr(md5(uniqid('', true)), 0, 8);
            }
            $vidData['created_at'] = date('Y-m-d H:i:s');
            $vidData['updated_at'] = date('Y-m-d H:i:s');
            $videos[] = $vidData;
        }

        $db['videos'] = $videos;
        self::saveDb($db);
        return $vidData;
    }

    /**
     * Delete music item and file
     */
    public static function deleteMusicItem($id) {
        $db = self::getDb();
        $music = isset($db['music']) ? $db['music'] : [];
        $deleted = false;

        foreach ($music as $key => $item) {
            if ($item['id'] === $id) {
                $safeFilename = sanitizeFilename($item['filename']);
                $filePath = MUSIC_DIR . DIRECTORY_SEPARATOR . $safeFilename;
                $realPath = realpath($filePath);
                $realDir = realpath(MUSIC_DIR);

                if ($realPath && $realDir && strpos($realPath, $realDir) === 0 && file_exists($realPath)) {
                    @unlink($realPath);
                }
                unset($music[$key]);
                $deleted = true;
                break;
            }
        }

        if ($deleted) {
            $db['music'] = array_values($music);
            self::saveDb($db);
        }

        return $deleted;
    }

    /**
     * Delete video item and file
     */
    public static function deleteVideoItem($id) {
        $db = self::getDb();
        $videos = isset($db['videos']) ? $db['videos'] : [];
        $deleted = false;

        foreach ($videos as $key => $item) {
            if ($item['id'] === $id) {
                $safeFilename = sanitizeFilename($item['filename']);
                $filePath = VIDEO_DIR . DIRECTORY_SEPARATOR . $safeFilename;
                $realPath = realpath($filePath);
                $realDir = realpath(VIDEO_DIR);

                if ($realPath && $realDir && strpos($realPath, $realDir) === 0 && file_exists($realPath)) {
                    @unlink($realPath);
                }
                unset($videos[$key]);
                $deleted = true;
                break;
            }
        }

        if ($deleted) {
            $db['videos'] = array_values($videos);
            self::saveDb($db);
        }

        return $deleted;
    }

    /**
     * Find music item by ID or filename
     */
    public static function findMusic($identifier) {
        $all = self::getAllMusic();
        foreach ($all as $item) {
            if ($item['id'] === $identifier || $item['filename'] === $identifier) {
                return $item;
            }
        }
        return null;
    }

    /**
     * Konversi string judul menjadi slug yang bersih, tanpa spasi, URL-friendly
     */
    public static function slugify($text, $ext = '') {
        $text = str_replace(['&', '+'], ['and', 'plus'], $text);

        // Hapus karakter non-ASCII jika ekstensi transliterator tersedia
        if (function_exists('transliterator_transliterate')) {
            $text = transliterator_transliterate('Any-Latin; Latin-ASCII; Lower()', $text);
        } else {
            $text = strtolower($text);
        }

        // Ganti spasi, tanda kurung, garis bawah, dan simbol lainnya menjadi tanda hubung (-)
        $slug = preg_replace('/[^a-z0-9]+/i', '-', $text);
        // Hapus tanda hubung berulang dan di awal/akhir string
        $slug = strtolower(trim($slug, '-'));

        if (empty($slug)) {
            $slug = 'asset-' . time();
        }

        $cleanExt = ltrim(strtolower($ext), '.');
        return $cleanExt ? ($slug . '.' . $cleanExt) : $slug;
    }

    /**
     * Buat nama file aman otomatis berdasarkan judul lagu, tanpa spasi, anti duplikat
     */
    public static function generateSafeFilename($targetDir, $title, $ext = 'mp3', $ignoreFilename = '') {
        $cleanExt = ltrim(strtolower($ext), '.');
        $baseSlug = self::slugify($title);
        $candidate = $baseSlug . ($cleanExt ? '.' . $cleanExt : '');

        // Jika nama file sama dengan file lama saat diedit, pertahankan
        if (!empty($ignoreFilename) && $candidate === $ignoreFilename) {
            return $candidate;
        }

        $targetPath = rtrim($targetDir, '/\\') . DIRECTORY_SEPARATOR . $candidate;
        if (!file_exists($targetPath)) {
            return $candidate;
        }

        // Jika file sudah ada, tambahkan penomoran urut: judul-2.mp3, judul-3.mp3
        $counter = 2;
        while ($counter < 1000) {
            $candidateWithCounter = $baseSlug . '-' . $counter . ($cleanExt ? '.' . $cleanExt : '');
            if (!empty($ignoreFilename) && $candidateWithCounter === $ignoreFilename) {
                return $candidateWithCounter;
            }
            $testPath = rtrim($targetDir, '/\\') . DIRECTORY_SEPARATOR . $candidateWithCounter;
            if (!file_exists($testPath)) {
                return $candidateWithCounter;
            }
            $counter++;
        }

        // Fallback jika counter sangat besar
        return $baseSlug . '-' . substr(md5(uniqid('', true)), 0, 5) . ($cleanExt ? '.' . $cleanExt : '');
    }

    /**
     * Helper to clean filename into presentable title
     */
    public static function cleanTitleFromFilename($filename) {
        $nameWithoutExt = preg_replace('/\.(mp3|wav|ogg|m4a|aac|mp4|webm|flac)$/i', '', $filename);
        // Bersihkan token downloader/ripper YouTube umum
        $patterns = [
            '/(ytdown[\s\.\-_]*com|snaptube|yt1s[\s\.\-_]*com|mp3cut[\s\.\-_]*net)/i',
            '/youtube[\s\.\-_]*media/i',
            '/official[\s\.\-_]*(music)?[\s\.\-_]*video/i',
            '/\b\d{2,3}k\b/i',
            '/\b[a-zA-Z0-9]{11}\b/i',
            '/\(mp3cut\.net\)/i',
            '/\b009\b/i'
        ];
        $cleaned = preg_replace($patterns, ' ', $nameWithoutExt);
        $clean = str_replace(['-', '_'], ' ', $cleaned);
        $clean = preg_replace('/\s+/', ' ', $clean);
        $result = ucwords(trim($clean));
        return !empty($result) ? $result : 'Wedding Music';
    }

    /**
     * Estimate audio duration and bitrate purely in PHP (without external dependencies)
     */
    public static function estimateAudioMeta($filePath) {
        $durationSeconds = 0;
        $bitrate = "128 kbps";

        if (!file_exists($filePath)) {
            return [
                'duration_seconds' => 0,
                'duration_formatted' => '00:00',
                'bitrate' => $bitrate
            ];
        }

        $fileSize = filesize($filePath);

        // Try reading MP3 header for bitrate if possible
        $handle = @fopen($filePath, "rb");
        if ($handle) {
            // Read first 100KB to find sync word
            $bytes = fread($handle, 102400);
            fclose($handle);

            $len = strlen($bytes);
            for ($i = 0; $i < $len - 4; $i++) {
                // Look for frame sync (11 set bits: 0xFF followed by 0xE0 or higher)
                if (ord($bytes[$i]) === 0xFF && (ord($bytes[$i + 1]) & 0xE0) === 0xE0) {
                    $b1 = ord($bytes[$i + 1]);
                    $b2 = ord($bytes[$i + 2]);
                    
                    $version = ($b1 >> 3) & 0x03; // 3 = MPEG 1
                    $layer   = ($b1 >> 1) & 0x03; // 1 = Layer III
                    $bitrateIdx = ($b2 >> 4) & 0x0F;

                    // MPEG 1 Layer 3 bitrate table
                    $bitrateTableMpeg1L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];
                    if ($version === 3 && $layer === 1 && isset($bitrateTableMpeg1L3[$bitrateIdx]) && $bitrateTableMpeg1L3[$bitrateIdx] > 0) {
                        $kbps = $bitrateTableMpeg1L3[$bitrateIdx];
                        $bitrate = $kbps . " kbps";
                        $durationSeconds = round(($fileSize * 8) / ($kbps * 1000));
                        break;
                    }
                }
            }
        }

        // Fallback calculation assuming standard ~128kbps if undetermined
        if ($durationSeconds <= 0) {
            $durationSeconds = round(($fileSize * 8) / (128 * 1000));
        }

        $min = floor($durationSeconds / 60);
        $sec = $durationSeconds % 60;
        $durationFormatted = sprintf("%02d:%02d", $min, $sec);

        return [
            'duration_seconds' => (int)$durationSeconds,
            'duration_formatted' => $durationFormatted,
            'bitrate' => $bitrate
        ];
    }

    /**
     * Check if FFmpeg is available on server
     */
    public static function isFfmpegAvailable() {
        if (!function_exists('shell_exec') || !function_exists('exec')) {
            return false;
        }
        $disabled = explode(',', ini_get('disable_functions'));
        $disabled = array_map('trim', $disabled);
        if (in_array('exec', $disabled) || in_array('shell_exec', $disabled)) {
            return false;
        }

        $output = @shell_exec('ffmpeg -version 2>&1');
        return !empty($output) && stripos($output, 'ffmpeg version') !== false;
    }
}
