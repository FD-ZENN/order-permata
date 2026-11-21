<?php
/**
 * CDN Permata Wedding - Media Upload Handler
 * Endpoint: /api/upload.php
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

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errMap = [
        UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize in php.ini',
        UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE in HTML form',
        UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION => 'PHP extension stopped the upload'
    ];
    $code = $_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE;
    $msg = $errMap[$code] ?? 'Unknown upload error';

    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $msg]);
    exit();
}

$uploadedFile = $_FILES['file'];
$origName = $uploadedFile['name'];
$tmpPath = $uploadedFile['tmp_name'];
$fileSize = $uploadedFile['size'];

// Anti-Path Traversal: Extract extension securely
$cleanBase = basename(str_replace(chr(0), '', $origName));
$parts = explode('.', $cleanBase);
$ext = strtolower(end($parts));

// Prevent double-extension attacks (e.g., shell.php.mp3)
foreach ($parts as $part) {
    $p = strtolower($part);
    if (in_array($p, ['php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'php8', 'phps', 'phar', 'cgi', 'pl', 'py', 'asp', 'aspx', 'jsp', 'sh', 'exe', 'bat', 'cmd'])) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'File rejected: executable secondary extension detected.'
        ], 400);
    }
}

// Determine media type
$audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
$videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];

$isAudio = in_array($ext, $audioExts, true);
$isVideo = in_array($ext, $videoExts, true);

if (!$isAudio && !$isVideo) {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Invalid file format. Allowed formats: MP3, WAV, OGG, M4A for audio, MP4, WEBM for video.'
    ], 400);
}

// MIME Type Inspection (Magic Bytes Check)
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $tmpPath);
    finfo_close($finfo);

    // Reject dangerous executable MIME types
    $dangerousMimes = [
        'text/html', 'application/x-php', 'application/x-httpd-php', 'text/x-php',
        'application/javascript', 'text/javascript', 'application/x-executable',
        'application/x-msdos-program', 'application/x-sh'
    ];
    if (in_array(strtolower($mime), $dangerousMimes, true)) {
        sendJsonResponse([
            'status' => 'error',
            'message' => 'Upload rejected: MIME content inspection detected potentially harmful content.'
        ], 400);
    }
}

// Anti-XSS: Tentukan Judul Lagu / Asset terlebih dahulu
$baseNameWithoutExt = pathinfo($cleanBase, PATHINFO_FILENAME);
$customTitle = !empty($_POST['title']) ? sanitizeText($_POST['title'], 120) : sanitizeText(MediaManager::cleanTitleFromFilename($baseNameWithoutExt), 120);
$artist = !empty($_POST['artist']) ? sanitizeText($_POST['artist'], 100) : '';

// Jika artist belum diisi tapi judul memiliki format "Judul - Artis", ekstrak otomatis
if (empty($artist) && strpos($customTitle, ' - ') !== false) {
    $parts = explode(' - ', $customTitle, 2);
    $customTitle = trim($parts[0]);
    $artist = trim($parts[1]);
}

$category = !empty($_POST['category']) ? sanitizeText($_POST['category'], 60) : ($isAudio ? 'Romantic Wedding' : 'Wedding Highlights');

// Penamaan file otomatis, SESUAI JUDUL LAGU, TANPA SPASI (URL-safe slug)
$targetDir = $isAudio ? MUSIC_DIR : VIDEO_DIR;
$finalFilename = MediaManager::generateSafeFilename($targetDir, $customTitle, $ext);
$destination = $targetDir . DIRECTORY_SEPARATOR . $finalFilename;

// Ensure destination path stays strictly within the target directory (anti-traversal check)
$realTargetDir = realpath($targetDir);
if (!move_uploaded_file($tmpPath, $destination)) {
    sendJsonResponse(['status' => 'error', 'message' => 'Failed to save uploaded file to destination.'], 500);
}

// Verify that saved file is within allowed directory
$realDest = realpath($destination);
if (!$realDest || strpos($realDest, $realTargetDir) !== 0) {
    @unlink($destination);
    sendJsonResponse(['status' => 'error', 'message' => 'Security violation: illegal destination path.'], 403);
}

if ($isAudio) {
    $meta = MediaManager::estimateAudioMeta($destination);
    $item = [
        'id' => 'trk_' . substr(md5($finalFilename . time()), 0, 8),
        'name' => $customTitle,
        'artist' => $artist,
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
} else {
    $item = [
        'id' => 'vid_' . substr(md5($finalFilename . time()), 0, 8),
        'name' => $customTitle,
        'filename' => $finalFilename,
        'url' => BASE_URL . '/uploads/videos/' . rawurlencode($finalFilename),
        'size' => formatBytes($fileSize),
        'size_bytes' => (int)$fileSize,
        'category' => $category,
        'created_at' => date('Y-m-d H:i:s'),
        'updated_at' => date('Y-m-d H:i:s')
    ];
    MediaManager::saveVideoItem($item);
}

sendJsonResponse([
    'status' => 'success',
    'message' => 'Asset uploaded successfully!',
    'type' => $isAudio ? 'music' : 'video',
    'data' => $item
]);
