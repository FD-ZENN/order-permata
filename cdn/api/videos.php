<?php
/**
 * CDN Permata Wedding - Video List API
 * Endpoint: /api/videos.php
 * Hardened against XSS and Injection
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../helpers.php';

sendCorsHeaders();

// Batasi akses video hanya untuk admin terotentikasi (Dashboard session / API Key)
requireApiAuth();

try {
    $videos = MediaManager::getAllVideos(true);

    if (!empty($_GET['search'])) {
        $search = strtolower(sanitizeText($_GET['search'], 60));
        $videos = array_filter($videos, function($v) use ($search) {
            return (stripos($v['name'], $search) !== false) ||
                   (stripos($v['filename'], $search) !== false);
        });
    }

    if (!empty($_GET['simple']) || (isset($_GET['format']) && $_GET['format'] === 'simple')) {
        $simpleList = array_map(function($v) {
            return [
                'name' => $v['name'],
                'url' => $v['url']
            ];
        }, array_values($videos));

        sendJsonResponse($simpleList);
    }

    sendJsonResponse([
        'status' => 'success',
        'message' => 'Video list retrieved successfully',
        'total' => count($videos),
        'base_cdn' => BASE_URL . '/uploads/videos/',
        'data' => array_values($videos)
    ]);

} catch (Exception $e) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'An error occurred while fetching the video list.'
    ], 500);
}
