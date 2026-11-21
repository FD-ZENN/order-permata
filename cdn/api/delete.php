<?php
/**
 * CDN Permata Wedding - Delete Asset API
 * Endpoint: /api/delete.php
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../helpers.php';

sendCorsHeaders();

// Enforce authentication
requireApiAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJsonResponse(['status' => 'error', 'message' => 'Method not allowed. Use POST.'], 405);
}

// Anti-Injection: Sanitize asset ID and strictly whitelist type
$id = sanitizeFilename($_POST['id'] ?? '');
$type = in_array($_POST['type'] ?? '', ['music', 'video'], true) ? $_POST['type'] : 'music';

if (empty($id)) {
    sendJsonResponse(['status' => 'error', 'message' => 'Asset ID is required.'], 400);
}

if ($type === 'video') {
    $deleted = MediaManager::deleteVideoItem($id);
} else {
    $deleted = MediaManager::deleteMusicItem($id);
}

if ($deleted) {
    sendJsonResponse([
        'status' => 'success',
        'message' => 'Asset deleted successfully.'
    ]);
} else {
    sendJsonResponse([
        'status' => 'error',
        'message' => 'Asset not found or already deleted.'
    ], 404);
}
