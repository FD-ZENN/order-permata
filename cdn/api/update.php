<?php
/**
 * CDN Permata Wedding - Update Metadata API
 * Endpoint: /api/update.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../helpers.php';

sendCorsHeaders();

// Enforce authentication
requireApiAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['status' => 'error', 'message' => 'Method not allowed. Use POST.'], 405);
}

// Anti-XSS & Anti-Injection Sanitization
$id = sanitizeFilename($_POST['id'] ?? '');
$title = !empty($_POST['title']) ? sanitizeText($_POST['title'], 120) : '';
$artist = isset($_POST['artist']) ? sanitizeText($_POST['artist'], 100) : null;
$category = !empty($_POST['category']) ? sanitizeText($_POST['category'], 60) : '';
$type = in_array($_POST['type'] ?? '', ['music', 'video'], true) ? $_POST['type'] : 'music';

if (empty($id)) {
    sendJsonResponse(['status' => 'error', 'message' => 'Asset ID is required.'], 400);
}

if ($type === 'video') {
    $videos = MediaManager::getAllVideos();
    $found = null;
    foreach ($videos as $v) {
        if ($v['id'] === $id) {
            $found = $v;
            break;
        }
    }
    if (!$found) {
        sendJsonResponse(['status' => 'error', 'message' => 'Video not found.'], 404);
    }
    if (!empty($title)) {
        $found['name'] = $title;
        $oldFilename = $found['filename'];
        $oldPath = VIDEO_DIR . DIRECTORY_SEPARATOR . $oldFilename;
        $ext = pathinfo($oldFilename, PATHINFO_EXTENSION);
        $newFilename = MediaManager::generateSafeFilename(VIDEO_DIR, $title, $ext, $oldFilename);

        if ($newFilename !== $oldFilename && file_exists($oldPath)) {
            $newPath = VIDEO_DIR . DIRECTORY_SEPARATOR . $newFilename;
            if (@rename($oldPath, $newPath)) {
                $found['filename'] = $newFilename;
                $found['url'] = BASE_URL . '/uploads/videos/' . rawurlencode($newFilename);
            }
        }
    }
    if (!empty($category)) $found['category'] = $category;
    $found['updated_at'] = date('Y-m-d H:i:s');
    MediaManager::saveVideoItem($found);
} else {
    $track = MediaManager::findMusic($id);
    if (!$track) {
        sendJsonResponse(['status' => 'error', 'message' => 'Music track not found.'], 404);
    }
    if (!empty($title)) {
        $track['name'] = $title;
        $oldFilename = $track['filename'];
        $oldPath = MUSIC_DIR . DIRECTORY_SEPARATOR . $oldFilename;
        $ext = pathinfo($oldFilename, PATHINFO_EXTENSION);
        $newFilename = MediaManager::generateSafeFilename(MUSIC_DIR, $title, $ext, $oldFilename);

        if ($newFilename !== $oldFilename && file_exists($oldPath)) {
            $newPath = MUSIC_DIR . DIRECTORY_SEPARATOR . $newFilename;
            if (@rename($oldPath, $newPath)) {
                $track['filename'] = $newFilename;
                $track['url'] = BASE_URL . '/uploads/music/' . rawurlencode($newFilename);
            }
        }
    }
    if ($artist !== null) {
        $track['artist'] = $artist;
    }
    if (!empty($category)) $track['category'] = $category;
    $track['updated_at'] = date('Y-m-d H:i:s');
    MediaManager::saveMusicItem($track);
    $found = $track;
}

sendJsonResponse([
    'status' => 'success',
    'message' => 'Asset details updated successfully.',
    'data' => $found
]);
