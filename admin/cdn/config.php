<?php
/**
 * Konfigurasi CDN Permata Wedding untuk Admin Panel
 * Domain Publik Live: https://content.permatawedding.com/
 * Direktori Fisik Server (Linux / aaPanel): /www/wwwroot/content.permatawedding.test
 * Direktori Fisik Lokal (Windows XAMPP): C:\xampp\htdocs\cdn.permatawedding.com
 */

$serverPath = '/www/wwwroot/content.permatawedding.test';
$localPath  = 'C:/xampp/htdocs/cdn.permatawedding.com';
$orderPermataCdn = dirname(__DIR__, 2) . '/cdn';

// Deteksi otomatis direktori yang aktif di server / lokal
if (is_dir($orderPermataCdn)) {
    $activeDir = $orderPermataCdn;
} elseif (is_dir($serverPath)) {
    $activeDir = $serverPath;
} elseif (is_dir($localPath)) {
    $activeDir = $localPath;
} elseif (is_dir(dirname(__DIR__, 3) . '/cdn.permatawedding.com')) {
    $activeDir = dirname(__DIR__, 3) . '/cdn.permatawedding.com';
} elseif (is_dir('/www/wwwroot/content.permatawedding.com')) {
    $activeDir = '/www/wwwroot/content.permatawedding.com';
} else {
    $activeDir = $serverPath; // Default server path
}

return [
    // Domain publik CDN untuk undangan dan aset publik
    'public_base_url' => 'https://content.permatawedding.com',

    // Path fisik yang terdeteksi secara otomatis (Server Linux / Lokal Windows)
    'local_dir'       => $activeDir,
    'server_dir'      => $serverPath,
    'windows_dir'     => $localPath,

    // API Key / Auth Bearer untuk operasi tulis (upload, delete, edit, import)
    'auth_password'   => 'PermataWedding1',
    'auth_username'   => 'permata',

    // Subfolder aset
    'upload_subdirs'  => [
        'music'  => 'uploads/music',
        'videos' => 'uploads/videos',
    ],

    // Kategori default
    'categories'      => [
        'music' => [
            'Romantic Wedding',
            'Traditional Javanese',
            'Modern Acoustic',
            'Pop Wedding',
            'Instrumental / Piano',
            'Religi / Islami',
        ],
        'video' => [
            'Wedding Highlights',
            'Cinematic Teaser',
            'Live Streaming Teaser',
            'Background Animation',
        ],
    ],
];
