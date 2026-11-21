<?php
/**
 * CDN Permata Wedding - Public Music API
 * Endpoint: /api/music.php
 * 
 * Hanya mengekspos judul lagu dan direct URL untuk kebutuhan pemutar musik undangan digital.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../helpers.php';

// Header CORS publik agar website undangan bebas memutar audio
sendCorsHeaders();

try {
    $tracks = MediaManager::getAllMusic(true);

    // Filter pencarian jika ada
    if (!empty($_GET['search'])) {
        $search = strtolower(sanitizeText($_GET['search'], 60));
        $tracks = array_filter($tracks, function($t) use ($search) {
            return (stripos($t['name'], $search) !== false) ||
                   (stripos($t['artist'] ?? '', $search) !== false) ||
                   (stripos($t['category'] ?? '', $search) !== false) ||
                   (stripos($t['filename'], $search) !== false);
        });
    }

    // Filter kategori jika ada
    if (!empty($_GET['category'])) {
        $cat = strtolower(sanitizeText($_GET['category'], 60));
        $tracks = array_filter($tracks, function($t) use ($cat) {
            return strtolower($t['category'] ?? '') === $cat;
        });
    }

    // Pengurutan (A-Z, Z-A, Terbaru, Terlama)
    $sort = $_GET['sort'] ?? 'newest';
    if ($sort === 'name_asc') {
        usort($tracks, fn($a, $b) => strcasecmp($a['name'], $b['name']));
    } elseif ($sort === 'name_desc') {
        usort($tracks, fn($a, $b) => strcasecmp($b['name'], $a['name']));
    } elseif ($sort === 'oldest') {
        usort($tracks, fn($a, $b) => strtotime($a['created_at']) <=> strtotime($b['created_at']));
    } else { // default: newest
        usort($tracks, fn($a, $b) => strtotime($b['created_at']) <=> strtotime($a['created_at']));
    }

    // Batasi jumlah jika diminta
    if (!empty($_GET['limit']) && is_numeric($_GET['limit'])) {
        $limit = max(1, min(500, (int)$_GET['limit']));
        $tracks = array_slice($tracks, 0, $limit);
    }

    $tracks = array_values($tracks);

    // Mode Khusus Admin Dashboard (Memerlukan Autentikasi Sesi/Key)
    if (!empty($_GET['manage'])) {
        requireApiAuth();
        sendJsonResponse([
            'status' => 'success',
            'total' => count($tracks),
            'data' => $tracks
        ]);
    }

    // =========================================================================
    // EXPOSE PUBLIK: JUDUL, ARTIST / PENYANYI, DAN URL LAGU
    // =========================================================================
    $publicList = array_map(function($t) {
        $artist = !empty($t['artist']) ? $t['artist'] : '';
        return [
            'judul'    => $t['name'],
            'title'    => $t['name'],
            'artist'   => $artist,
            'penyanyi' => $artist,
            'url'      => $t['url']
        ];
    }, $tracks);

    // Jika pemanggil meminta format wrapper objek (?wrap=1)
    if (!empty($_GET['wrap']) || !empty($_GET['data_only'])) {
        sendJsonResponse([
            'status' => 'success',
            'total' => count($publicList),
            'data' => $publicList
        ]);
    }

    // Default: Langsung mengeluarkan array JSON berisi list [judul, url]
    sendJsonResponse($publicList);

} catch (Exception $e) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Gagal mengambil daftar lagu.'
    ], 500);
}
