<?php
/**
 * CDN Permata Wedding - Audio Processing Engine (Trim / Cut, Fade In/Out, Compress)
 * Endpoint: /api/process.php
 * 
 * Supports both:
 * 1. Direct processed audio payload from browser (Web Audio API + LameJS - 100% hosting compatible)
 * 2. Server-side FFmpeg processing if available on the server environment.
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../helpers.php';

sendCorsHeaders();
header('Content-Type: application/json; charset=utf-8');

// Enforce auth (Session or Basic Auth / Bearer PermataWedding1)
requireApiAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Method not allowed. Use POST.']);
    exit();
}

$action = $_POST['action'] ?? 'process';

// -------------------------------------------------------------------------
// Action 1: Save Processed Audio (Sent from Client-Side Web Audio / LameJS Engine)
// -------------------------------------------------------------------------
if ($action === 'save_client_processed' || isset($_FILES['audio_blob'])) {
    if (!isset($_FILES['audio_blob']) || $_FILES['audio_blob']['error'] !== UPLOAD_ERR_OK) {
        sendJsonResponse(['status' => 'error', 'message' => 'Processed audio file blob was not received.'], 400);
    }

    $sourceId = sanitizeFilename($_POST['source_id'] ?? '');
    $title = !empty($_POST['title']) ? sanitizeText($_POST['title'], 120) : '';
    $overwrite = (!empty($_POST['overwrite']) && $_POST['overwrite'] === 'true');
    $category = !empty($_POST['category']) ? sanitizeText($_POST['category'], 60) : 'Romantic Wedding';
    $bitrate = !empty($_POST['bitrate']) ? sanitizeText($_POST['bitrate'], 20) : '128 kbps';
    $durationSec = isset($_POST['duration']) ? max(1, (int)$_POST['duration']) : 0;

    $sourceTrack = !empty($sourceId) ? MediaManager::findMusic($sourceId) : null;
    $artist = !empty($_POST['artist']) ? sanitizeText($_POST['artist'], 100) : ($sourceTrack ? ($sourceTrack['artist'] ?? '') : '');

    if ($overwrite && $sourceTrack) {
        $finalFilename = sanitizeFilename($sourceTrack['filename']);
        $finalPath = MUSIC_DIR . DIRECTORY_SEPARATOR . $finalFilename;
        $id = $sourceTrack['id'];
        $finalTitle = !empty($title) ? $title : $sourceTrack['name'];
    } else {
        $finalTitle = !empty($title) ? $title : (($sourceTrack ? $sourceTrack['name'] : 'Processed Track') . ' (Cut)');
        // Penamaan file otomatis, sesuai judul lagu, tanpa spasi
        $finalFilename = MediaManager::generateSafeFilename(MUSIC_DIR, $finalTitle, 'mp3');
        $finalPath = MUSIC_DIR . DIRECTORY_SEPARATOR . $finalFilename;
        $id = 'trk_' . substr(md5($finalFilename . time()), 0, 8);
    }

    // Verify destination stays strictly within MUSIC_DIR (Anti-Path Traversal)
    $realMusicDir = realpath(MUSIC_DIR);
    if (!move_uploaded_file($_FILES['audio_blob']['tmp_name'], $finalPath)) {
        sendJsonResponse(['status' => 'error', 'message' => 'Could not save processed MP3 file.'], 500);
    }

    $realFinalPath = realpath($finalPath);
    if (!$realFinalPath || strpos($realFinalPath, $realMusicDir) !== 0) {
        @unlink($finalPath);
        sendJsonResponse(['status' => 'error', 'message' => 'Security violation: path traversal detected.'], 403);
    }

    $fileSize = filesize($finalPath);
    if ($durationSec <= 0) {
        $meta = MediaManager::estimateAudioMeta($finalPath);
        $durationSec = (int)$meta['duration_seconds'];
        $durationFormatted = $meta['duration_formatted'];
    } else {
        $min = floor($durationSec / 60);
        $sec = $durationSec % 60;
        $durationFormatted = sprintf("%02d:%02d", $min, $sec);
    }

    $trackData = [
        'id' => $id,
        'name' => $finalTitle,
        'artist' => $artist,
        'filename' => $finalFilename,
        'url' => BASE_URL . '/uploads/music/' . rawurlencode($finalFilename),
        'duration' => $durationFormatted,
        'duration_seconds' => (int)$durationSec,
        'size' => formatBytes($fileSize),
        'size_bytes' => (int)$fileSize,
        'bitrate' => safeHtml($bitrate),
        'category' => $category,
        'created_at' => ($overwrite && $sourceTrack) ? $sourceTrack['created_at'] : date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];

    MediaManager::saveMusicItem($trackData);

    sendJsonResponse([
        'status' => 'success',
        'message' => 'Audio processed, compressed, and saved to CDN successfully!',
        'engine' => 'WebAudio Studio',
        'data' => $trackData
    ]);
}

// -------------------------------------------------------------------------
// Action 2: Server-side FFmpeg processing (Anti-Command Injection Hardening)
// -------------------------------------------------------------------------
$trackId = sanitizeFilename($_POST['track_id'] ?? '');
$start = max(0.0, (float)($_POST['start'] ?? 0));
$end = max(0.0, (float)($_POST['end'] ?? 0));
$fadeIn = max(0.0, min(15.0, (float)($_POST['fade_in'] ?? 0)));
$fadeOut = max(0.0, min(15.0, (float)($_POST['fade_out'] ?? 0)));
$rawBitrate = (int)($_POST['bitrate'] ?? 128);
$allowedBitrates = [64, 96, 128, 160, 192, 256, 320];
$bitrateKbps = in_array($rawBitrate, $allowedBitrates, true) ? $rawBitrate : 128;
$overwrite = (!empty($_POST['overwrite']) && $_POST['overwrite'] === 'true');
$customTitle = !empty($_POST['title']) ? sanitizeText($_POST['title'], 120) : '';

$track = MediaManager::findMusic($trackId);
if (!$track) {
    sendJsonResponse(['status' => 'error', 'message' => 'Source track not found.'], 404);
}

// Anti-Path Traversal check on source file
$safeFilename = sanitizeFilename($track['filename']);
$sourcePath = MUSIC_DIR . DIRECTORY_SEPARATOR . $safeFilename;
$realMusicDir = realpath(MUSIC_DIR);
$realSource = realpath($sourcePath);

if (!$realSource || strpos($realSource, $realMusicDir) !== 0 || !file_exists($realSource)) {
    sendJsonResponse(['status' => 'error', 'message' => 'Source audio file does not exist or invalid path.'], 404);
}

// Check if FFmpeg is available
if (!MediaManager::isFfmpegAvailable()) {
    sendJsonResponse([
        'status' => 'fallback_to_client',
        'message' => 'Server-side FFmpeg is not active or disabled on this hosting environment. Processing will execute in browser using Web Audio Studio.'
    ]);
}

// Calculate target duration
$clipDuration = ($end > $start) ? ($end - $start) : 0;
if ($clipDuration < 0.5) {
    sendJsonResponse(['status' => 'error', 'message' => 'Invalid start and end times for audio trim.'], 400);
}

// Build output file name
if ($overwrite) {
    $tempOut = MUSIC_DIR . DIRECTORY_SEPARATOR . 'temp_' . $safeFilename;
    $finalFilename = $safeFilename;
    $finalPath = $realSource;
    $id = $track['id'];
    $finalTitle = !empty($customTitle) ? $customTitle : $track['name'];
} else {
    $finalTitle = !empty($customTitle) ? $customTitle : ($track['name'] . ' (Trimmed)');
    // Penamaan file otomatis, sesuai judul lagu, tanpa spasi
    $finalFilename = MediaManager::generateSafeFilename(MUSIC_DIR, $finalTitle, 'mp3');
    $tempOut = MUSIC_DIR . DIRECTORY_SEPARATOR . $finalFilename;
    $finalPath = $tempOut;
    $id = 'trk_' . substr(md5($finalFilename . time()), 0, 8);
}

// Anti-Command Injection: Strictly construct audio filters with validated floats only
$audioFilters = [];
if ($fadeIn > 0) {
    $audioFilters[] = sprintf("afade=t=in:ss=0:d=%.2f", $fadeIn);
}
if ($fadeOut > 0 && $clipDuration > $fadeOut) {
    $fadeOutStart = $clipDuration - $fadeOut;
    $audioFilters[] = sprintf("afade=t=out:st=%.2f:d=%.2f", $fadeOutStart, $fadeOut);
}

$afParam = !empty($audioFilters) ? '-af ' . escapeshellarg(implode(',', $audioFilters)) : '';

// Strictly escaped FFmpeg command line
$cmd = sprintf(
    'ffmpeg -y -ss %s -to %s -i %s %s -b:a %dk %s 2>&1',
    escapeshellarg(sprintf("%.2f", $start)),
    escapeshellarg(sprintf("%.2f", $end)),
    escapeshellarg($realSource),
    $afParam,
    $bitrateKbps,
    escapeshellarg($tempOut)
);

$output = [];
$returnCode = 0;
exec($cmd, $output, $returnCode);

if ($returnCode !== 0 || !file_exists($tempOut)) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'FFmpeg processing failed.'
    ], 500);
}

if ($overwrite) {
    @unlink($realSource);
    @rename($tempOut, $realSource);
}

$fileSize = filesize($finalPath);
$min = floor($clipDuration / 60);
$sec = round($clipDuration % 60);
$durationFormatted = sprintf("%02d:%02d", $min, $sec);

$newTrack = [
    'id' => $id,
    'name' => $finalTitle,
    'filename' => $finalFilename,
    'url' => BASE_URL . '/uploads/music/' . rawurlencode($finalFilename),
    'duration' => $durationFormatted,
    'duration_seconds' => (int)$clipDuration,
    'size' => formatBytes($fileSize),
    'size_bytes' => (int)$fileSize,
    'bitrate' => $bitrateKbps . ' kbps',
    'category' => $track['category'] ?? 'Romantic Wedding',
    'created_at' => $overwrite ? $track['created_at'] : date('Y-m-d H:i:s'),
    'updated_at' => date('Y-m-d H:i:s')
];

MediaManager::saveMusicItem($newTrack);

sendJsonResponse([
    'status' => 'success',
    'message' => 'Audio trimmed, faded, and compressed successfully!',
    'engine' => 'FFmpeg Server',
    'data' => $newTrack
]);
