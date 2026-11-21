<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/CdnService.php';

use Permata\Admin\Cdn\CdnService;

try {
    $service = new CdnService();
    $action  = $_GET['action'] ?? $_POST['action'] ?? '';

    switch ($action) {
        case 'stats':
            $stats = $service->getStats();
            echo json_encode([
                'success' => true,
                'data'    => $stats,
            ]);
            break;

        case 'music':
            $search   = trim((string)($_GET['search'] ?? ''));
            $category = trim((string)($_GET['category'] ?? ''));
            $list     = $service->getMusicList($search, $category);
            echo json_encode([
                'success' => true,
                'total'   => count($list),
                'data'    => $list,
            ]);
            break;

        case 'videos':
            $search   = trim((string)($_GET['search'] ?? ''));
            $category = trim((string)($_GET['category'] ?? ''));
            $list     = $service->getVideoList($search, $category);
            echo json_encode([
                'success' => true,
                'total'   => count($list),
                'data'    => $list,
            ]);
            break;

        case 'upload':
            if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Method harus POST']);
                exit;
            }

            if (empty($_FILES['file'])) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Berkas file wajib dipilih']);
                exit;
            }

            $type     = trim((string)($_POST['type'] ?? 'music'));
            $title    = trim((string)($_POST['title'] ?? ''));
            $artist   = trim((string)($_POST['artist'] ?? ''));
            $category = trim((string)($_POST['category'] ?? ''));

            $res = $service->uploadAsset($_FILES['file'], $type, $title, $artist, $category);
            http_response_code($res['success'] ? 200 : 400);
            echo json_encode($res);
            break;

        case 'import_url':
            if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Method harus POST']);
                exit;
            }

            $rawInput = file_get_contents('php://input');
            $input    = json_decode($rawInput, true);
            if (!is_array($input)) {
                $input = $_POST;
            }

            $url      = trim((string)($input['url'] ?? ''));
            $title    = trim((string)($input['title'] ?? ''));
            $artist   = trim((string)($input['artist'] ?? ''));
            $category = trim((string)($input['category'] ?? ''));

            if (empty($url)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'URL sumber media wajib diisi']);
                exit;
            }

            $res = $service->importUrl($url, $title, $artist, $category);
            http_response_code($res['success'] ? 200 : 400);
            echo json_encode($res);
            break;

        case 'update':
            if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Method harus POST']);
                exit;
            }

            $rawInput = file_get_contents('php://input');
            $input    = json_decode($rawInput, true);
            if (!is_array($input)) {
                $input = $_POST;
            }

            $id       = trim((string)($input['id'] ?? ''));
            $type     = trim((string)($input['type'] ?? 'music'));
            $title    = trim((string)($input['title'] ?? ''));
            $artist   = trim((string)($input['artist'] ?? ''));
            $category = trim((string)($input['category'] ?? ''));

            if (empty($id)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'ID aset wajib diisi']);
                exit;
            }

            $res = $service->updateAsset($id, $type, $title, $artist, $category);
            http_response_code($res['success'] ? 200 : 400);
            echo json_encode($res);
            break;

        case 'delete':
            if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Method harus POST']);
                exit;
            }

            $rawInput = file_get_contents('php://input');
            $input    = json_decode($rawInput, true);
            if (!is_array($input)) {
                $input = $_POST;
            }

            $id   = trim((string)($input['id'] ?? ''));
            $type = trim((string)($input['type'] ?? 'music'));

            if (empty($id)) {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'ID aset wajib diisi']);
                exit;
            }

            $res = $service->deleteAsset($id, $type);
            http_response_code($res['success'] ? 200 : 400);
            echo json_encode($res);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Aksi tidak dikenal. Gunakan: stats, music, videos, upload, import_url, update, delete',
            ]);
            break;
    }
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error CDN: ' . $e->getMessage(),
    ]);
}
