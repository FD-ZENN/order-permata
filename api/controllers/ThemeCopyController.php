<?php
class ThemeCopyController
{
    private const TEMPLATES_DIR = __DIR__ . '/../../templates/';
    private const UPLOADS_DIR   = __DIR__ . '/../../uploads/';

    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    // POST /themes/{id}/copy-assets
    public function copyAssets(string $themeId): void
    {
        $input = json_decode(file_get_contents('php://input'), true) ?? [];
        $slug  = trim($input['slug'] ?? '');

        // Validasi slug
        if (!$slug || !preg_match('/^[a-z0-9\-]+$/', $slug)) {
            Response::error('Slug tidak valid. Gunakan huruf kecil, angka, dan tanda hubung.', 422);
        }

        // Ambil data tema dari database
        $stmt = $this->db->prepare('SELECT * FROM themes WHERE id = ? LIMIT 1');
        $stmt->execute([$themeId]);
        $theme = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$theme) {
            Response::error('Tema tidak ditemukan', 404);
        }

        // Buat nama folder tema dari nama tema
        $themeFolder = $this->slugify($theme['name']);
        $sourceDir   = self::TEMPLATES_DIR . $themeFolder . '/';
        $destDir     = self::UPLOADS_DIR . $slug . '/theme/';

        // Cek folder template tema tersedia
        if (!is_dir($sourceDir)) {
            Response::error(
                'Folder aset tema tidak ditemukan: templates/' . $themeFolder . '/',
                404
            );
        }

        // Buat folder tujuan jika belum ada
        if (!is_dir($destDir) && !mkdir($destDir, 0755, true) && !is_dir($destDir)) {
            Response::error('Gagal membuat folder tujuan: uploads/' . $slug . '/theme/', 500);
        }

        // Salin semua aset tema ke folder mempelai
        $result = $this->copyDirectory($sourceDir, $destDir);

        Response::success([
            'copied'      => $result['copied'],
            'skipped'     => $result['skipped'],
            'destination' => '/uploads/' . $slug . '/theme/',
            'source'      => '/templates/' . $themeFolder . '/',
            'theme'       => [
                'id'       => $theme['id'],
                'name'     => $theme['name'],
                'category' => $theme['category'] ?? null,
            ],
        ], $result['copied'] . ' aset tema berhasil disalin ke folder mempelai');
    }

    // Rekursif salin isi direktori
    private function copyDirectory(string $source, string $dest): array
    {
        $copied  = 0;
        $skipped = 0;

        $items = scandir($source);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;

            $srcPath  = $source . $item;
            $destPath = $dest . $item;

            if (is_dir($srcPath)) {
                if (!is_dir($destPath)) {
                    mkdir($destPath, 0755, true);
                }
                $sub      = $this->copyDirectory($srcPath . '/', $destPath . '/');
                $copied  += $sub['copied'];
                $skipped += $sub['skipped'];
            } elseif (is_file($srcPath)) {
                // Jika file sudah ada di tujuan, lewati (tidak overwrite)
                if (file_exists($destPath)) {
                    $skipped++;
                    continue;
                }
                if (copy($srcPath, $destPath)) {
                    $copied++;
                } else {
                    $skipped++;
                }
            }
        }

        return ['copied' => $copied, 'skipped' => $skipped];
    }

    // Helper: konversi nama tema ke slug folder
    private function slugify(string $name): string
    {
        $name = strtolower(trim($name));
        $name = preg_replace('/[^a-z0-9\s\-]/', '', $name);
        $name = preg_replace('/[\s\-]+/', '-', $name);
        return trim($name, '-');
    }
}