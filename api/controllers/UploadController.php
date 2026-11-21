<?php
class UploadController
{
    private const MAX_SIZE = 20 * 1024 * 1024;
    private const ALLOWED  = ['image/jpeg', 'image/png', 'image/webp'];

    private const ADMIN_ONLY_FOLDERS = ['templates'];

    // ── PENGATURAN LOKASI FOLDER & URL PUBLIK ───────────────────
    private const STORAGE_MAP = [
        'templates'    => [
            'dir' => __DIR__ . '/../../templates/',
            'url' => '/templates/',
        ],
        'testimonials' => [
            'dir' => __DIR__ . '/../../uploads/testimonials/',
            'url' => '/uploads/testimonials/',
        ],
        'default'      => [
            'dir' => __DIR__ . '/../../uploads/',
            'url' => '/uploads/',
        ],
    ];

    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // ── Cek apakah folder ini wajib login admin ──────────────────
    // Dicek terhadap folder yang SUDAH disanitize, supaya tidak bisa
    // dibypass dengan trik semacam "templates/../foo".
    private function requiresAdmin(string $folder): bool
    {
        foreach (self::ADMIN_ONLY_FOLDERS as $key) {
            if ($folder === $key || str_starts_with($folder, $key . '/')) {
                return true;
            }
        }
        return false;
    }

    /**
     * Deteksi subpath aplikasi web secara dinamis.
     * Contoh:
     * - Di XAMPP: /order-permata/api/index.php -> menghasilkan '/order-permata'
     * - Di Production root: /api/index.php -> menghasilkan ''
     */
    private function getBaseWebPath(): string
    {
        if (!empty($_SERVER['SCRIPT_NAME'])) {
            $script = str_replace('\\', '/', $_SERVER['SCRIPT_NAME']);
            $dir = dirname(dirname($script));
            if ($dir !== '/' && $dir !== '\\' && $dir !== '.' && $dir !== '') {
                return rtrim($dir, '/');
            }
        }

        if (!empty($_SERVER['DOCUMENT_ROOT'])) {
            $docRoot = rtrim(str_replace('\\', '/', realpath($_SERVER['DOCUMENT_ROOT']) ?: $_SERVER['DOCUMENT_ROOT']), '/');
            $projRoot = rtrim(str_replace('\\', '/', realpath(__DIR__ . '/../../') ?: ''), '/');
            if ($projRoot !== '' && str_starts_with($projRoot, $docRoot)) {
                $sub = substr($projRoot, strlen($docRoot));
                return rtrim($sub, '/');
            }
        }

        return '';
    }

    // ── Resolusi tunggal untuk dir + url, menghindari duplikasi logika ──
    private function resolveStorage(string $folder): array
    {
        $baseWeb = $this->getBaseWebPath();

        foreach (self::STORAGE_MAP as $key => $cfg) {
            if ($key !== 'default' && (str_starts_with($folder, $key . '/') || $folder === $key)) {
                $subPath = ltrim(substr($folder, strlen($key)), '/');
                $dir = rtrim($cfg['dir'] . $subPath, '/') . '/';
                $urlPrefix = $baseWeb . rtrim($cfg['url'] . $subPath, '/');
                return ['dir' => $dir, 'url' => $urlPrefix ? $urlPrefix . '/' : '/'];
            }
        }
        $dir = rtrim(self::STORAGE_MAP['default']['dir'] . $folder, '/') . '/';
        $url = $baseWeb . rtrim(self::STORAGE_MAP['default']['url'] . $folder, '/') . '/';
        return ['dir' => $dir, 'url' => $url];
    }

    private function getTargetDir(string $folder): string
    {
        return $this->resolveStorage($folder)['dir'];
    }

    private function getPublicUrl(string $folder, string $filename): string
    {
        return $this->resolveStorage($folder)['url'] . $filename;
    }

    // ── POST /upload — single file ──────────────────────────────
    public function upload(): void
    {
        if (empty($_FILES['file'])) {
            Response::error('Tidak ada file yang dikirim', 400);
        }

        $folder = $this->sanitizeFolder($_POST['folder'] ?? 'misc');

        // Otentikasi & Otorisasi Upload:
        // 1. Admin terotentikasi diizinkan upload ke folder mana saja.
        // 2. Publik tanpa token admin HANYA boleh upload foto mempelai / galeri pesanan baru,
        //    dengan pembatasan format path {slug}/couple atau {slug}/gallery dan rate limiting ketat.
        $isAdmin = (bool) Middleware::getAuthPayload();
        if (!$isAdmin) {
            // Folder templates atau testimonials mutlak dilarang untuk non-admin
            if ($this->requiresAdmin($folder) || str_starts_with($folder, 'testimonials')) {
                Middleware::requireAdmin();
            }

            // Validasi folder publik: hanya izinkan format [slug]/couple atau [slug]/gallery
            if (!preg_match('/^[a-z0-9\-]+\/(couple|gallery)$/', $folder)) {
                Response::error('Akses upload publik tidak diizinkan untuk folder tujuan ini', 403);
            }

            // Rate limit publik: maksimal 15 file upload per 5 menit per IP
            $rateKey = 'upload_pub:' . RateLimiter::clientIp();
            if (!RateLimiter::attempt($rateKey, 15, 300)) {
                Response::error('Batas upload tercapai. Silakan coba beberapa saat lagi.', 429);
            }
        }

        $label   = $_POST['label']   ?? 'foto';
        $context = $_POST['context'] ?? '';

        try {
            $url = $this->processFile($_FILES['file'], $folder, $label, $context);
        } catch (\RuntimeException $e) {
            Response::error($e->getMessage(), 422);
        }

        Response::success(['url' => $url], 'Upload berhasil', 201);
    }

    // ── POST /upload-multi — multiple files ─────────────────────
    public function uploadMultiple(): void
    {
        // Mendukung format files[] maupun file tunggal
        $rawFiles = $_FILES['files'] ?? $_FILES['file'] ?? null;
        if (empty($rawFiles)) {
            Response::error('Tidak ada file yang dikirim', 400);
        }

        $folder = $this->sanitizeFolder($_POST['folder'] ?? 'misc');

        $isAdmin = (bool) Middleware::getAuthPayload();
        if (!$isAdmin) {
            if ($this->requiresAdmin($folder) || str_starts_with($folder, 'testimonials')) {
                Middleware::requireAdmin();
            }

            // Validasi folder publik: hanya izinkan [slug]/gallery
            if (!preg_match('/^[a-z0-9\-]+\/gallery$/', $folder)) {
                Response::error('Akses upload publik tidak diizinkan untuk folder tujuan ini', 403);
            }

            // Rate limit publik upload multi: maksimal 3 batch per 5 menit per IP
            $rateKey = 'upload_multi_pub:' . RateLimiter::clientIp();
            if (!RateLimiter::attempt($rateKey, 3, 300)) {
                Response::error('Batas upload galeri tercapai. Silakan coba beberapa saat lagi.', 429);
            }
        }

        $label   = $_POST['label'] ?? 'galeri';
        $urls    = [];
        $errors  = [];
        
        // Normalisasi struktur $_FILES baik array maupun tunggal
        $filesList = [];
        if (is_array($rawFiles['name'])) {
            $count = count($rawFiles['name']);
            for ($i = 0; $i < $count; $i++) {
                if (!empty($rawFiles['name'][$i])) {
                    $filesList[] = [
                        'name'     => $rawFiles['name'][$i],
                        'type'     => $rawFiles['type'][$i] ?? '',
                        'tmp_name' => $rawFiles['tmp_name'][$i] ?? '',
                        'error'    => $rawFiles['error'][$i] ?? UPLOAD_ERR_NO_FILE,
                        'size'     => $rawFiles['size'][$i] ?? 0,
                    ];
                }
            }
        } elseif (!empty($rawFiles['name'])) {
            $filesList[] = $rawFiles;
        }

        if (count($filesList) === 0) {
            Response::error('Tidak ada file yang dikirim', 400);
        }
        if (count($filesList) > 20) {
            Response::error('Maksimal 20 file per upload', 422);
        }

        $startNum = $this->countExistingFiles($folder) + 1;
        foreach ($filesList as $idx => $file) {
            try {
                $url    = $this->processFile($file, $folder, $label, '', $startNum + $idx);
                $urls[] = $url;
            } catch (\RuntimeException $e) {
                $errors[] = $file['name'] . ': ' . $e->getMessage();
            }
        }

        Response::success(
            [
                'urls'     => $urls,
                'uploaded' => count($urls),
                'failed'   => count($errors),
                'errors'   => $errors ?: null,
            ],
            count($urls) . ' file berhasil diupload' . (count($errors) ? ', ' . count($errors) . ' gagal' : ''),
            201
        );
    }

    /**
     * Deteksi MIME Type secara aman dengan fallback berjenjang:
     * 1. mime_content_type() (membutuhkan ekstensi fileinfo)
     * 2. finfo_open() (standar PHP fileinfo class/resource)
     * 3. getimagesize() (memeriksa signature header gambar secara native via GD)
     */
    private function detectMimeType(string $filePath): string|false
    {
        if (function_exists('mime_content_type')) {
            $mime = @mime_content_type($filePath);
            if (!empty($mime)) {
                return $mime;
            }
        }

        if (function_exists('finfo_open')) {
            $finfo = @finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo) {
                $mime = @finfo_file($finfo, $filePath);
                @finfo_close($finfo);
                if (!empty($mime)) {
                    return $mime;
                }
            }
        }

        // Fallback untuk file gambar menggunakan getimagesize()
        $imgInfo = @getimagesize($filePath);
        if (!empty($imgInfo['mime'])) {
            return $imgInfo['mime'];
        }

        return false;
    }

    private function processFile(array $file, string $folderRaw, string $label, string $context = '', int $number = 0): string
    {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \RuntimeException('Upload error code: ' . $file['error']);
        }
        if ($file['size'] > self::MAX_SIZE) {
            throw new \RuntimeException('Ukuran melebihi 2 MB');
        }

        $mime = $this->detectMimeType($file['tmp_name']);
        if ($mime === false || !in_array($mime, self::ALLOWED, true)) {
            throw new \RuntimeException('Tipe file tidak didukung');
        }

        $imgInfo = @getimagesize($file['tmp_name']);
        if ($imgInfo === false) {
            throw new \RuntimeException('File bukan gambar yang valid atau rusak');
        }

        if ($mime === 'image/webp' && !function_exists('imagecreatefromwebp')) {
            throw new \RuntimeException('Server tidak mendukung format WebP');
        }

        $folder = $this->sanitizeFolder($folderRaw);
        $ext    = match ($mime) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
        };

        $filename = $this->buildFilename($label, $context, $number, $ext, $folder);
        $destDir  = $this->getTargetDir($folder);

        if (!is_dir($destDir) && !mkdir($destDir, 0755, true) && !is_dir($destDir)) {
            throw new \RuntimeException('Gagal membuat folder tujuan');
        }

        // Jika file sudah ada, timpa file (overwrite)
        if (is_file($destDir . $filename)) {
            @unlink($destDir . $filename);
        }

        $this->compressAndSave($file['tmp_name'], $destDir . $filename, $mime);

        // Tambahkan query timestamp version (?v=...) untuk cache busting
        return $this->getPublicUrl($folder, $filename) . '?v=' . time();
    }

    private function buildFilename(string $label, string $context, int $number, string $ext, string $folder): string
    {
        $label   = $this->sanitizeName($label) ?: 'foto';
        $context = $this->sanitizeName($context);

        $standalone = ['cover', 'mempelai-pria', 'mempelai-wanita', 'thumbnail'];
        if (in_array($label, $standalone, true)) {
            $base = $label;
        } elseif ($context !== '') {
            $base = $label . '-' . $context;
        } elseif ($number > 0) {
            $base = $label . '-' . $number;
        } else {
            $num  = $this->countExistingFiles($folder, $label) + 1;
            $base = $label . '-' . $num;
        }

        // Timpa file dengan nama konsisten ($base.$ext) tanpa menambahkan hash random
        return $base . '.' . $ext;
    }

    private function countExistingFiles(string $folder, string $labelPrefix = ''): int
    {
        $dir = $this->getTargetDir($folder);
        if (!is_dir($dir)) return 0;
        $count = 0;
        foreach (scandir($dir) as $f) {
            if ($f === '.' || $f === '..') continue;
            if ($labelPrefix === '' || str_starts_with($f, $labelPrefix)) {
                $count++;
            }
        }
        return $count;
    }

    private function compressAndSave(string $sourcePath, string $destPath, string $mime, int $quality = 80, int $maxWidth = 1920): void
    {
        $img = match ($mime) {
            'image/jpeg' => @imagecreatefromjpeg($sourcePath),
            'image/png'  => @imagecreatefrompng($sourcePath),
            'image/webp' => @imagecreatefromwebp($sourcePath),
            default      => null,
        };

        if (!$img) {
            if (!move_uploaded_file($sourcePath, $destPath)) {
                throw new \RuntimeException('Gagal menyimpan file');
            }
            return;
        }

        if ($mime === 'image/png' || $mime === 'image/webp') {
            imagealphablending($img, false);
            imagesavealpha($img, true);
        }

        $w = imagesx($img);
        $h = imagesy($img);

        if ($w > $maxWidth) {
            $newW = $maxWidth;
            $newH = (int) round(($h / $w) * $newW);
            $canvas = imagecreatetruecolor($newW, $newH);

            if ($mime === 'image/png' || $mime === 'image/webp') {
                imagealphablending($canvas, false);
                imagesavealpha($canvas, true);
                $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
                imagefill($canvas, 0, 0, $transparent);
            }

            imagecopyresampled($canvas, $img, 0, 0, 0, 0, $newW, $newH, $w, $h);
            imagedestroy($img);
            $img = $canvas;
        }

        $saved = match ($mime) {
            'image/jpeg' => imagejpeg($img, $destPath, $quality),
            'image/png'  => imagepng($img, $destPath, 6),
            'image/webp' => imagewebp($img, $destPath, $quality),
            default      => false,
        };

        imagedestroy($img);

        if (!$saved) {
            throw new \RuntimeException('Gagal mengompres dan menyimpan file');
        }
    }

    private function sanitizeFolder(string $folder): string
    {
        $folder = trim($folder, '/ ');
        $folder = preg_replace('/[^a-zA-Z0-9_\-\/]/', '', $folder);
        $parts  = array_slice(explode('/', $folder), 0, 2);
        $parts  = array_filter($parts, static fn(string $p): bool => $p !== '');
        return implode('/', $parts) ?: 'misc';
    }

    private function sanitizeName(string $name): string
    {
        $name = trim(strtolower($name));
        $name = preg_replace('/[^a-z0-9\-]/', '-', $name);
        $name = preg_replace('/-+/', '-', $name);
        return trim($name, '-');
    }
}