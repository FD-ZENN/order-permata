<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/WhatsAppService.php';

$rawPayload = file_get_contents('php://input');
if (empty($rawPayload)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Empty webhook payload']);
    exit;
}

$data = json_decode($rawPayload, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON']);
    exit;
}

// Opsional HMAC Secret check jika diisi di config
$service = new WhatsAppService();
$config = $service->getConfig();
$secret = $config['webhook_secret'] ?? '';
if (!empty($secret)) {
    $signature = $_SERVER['HTTP_X_HUB_SIGNATURE'] ?? $_SERVER['HTTP_X_WEBHOOK_SIGNATURE'] ?? '';
    $computed  = hash_hmac('sha256', $rawPayload, $secret);
    if (!hash_equals($computed, (string) $signature)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Invalid signature']);
        exit;
    }
}

try {
    $result = $service->handleWebhook($data);
    echo json_encode(['success' => true, 'result' => $result]);
} catch (\Throwable $e) {
    error_log("WA Webhook Exception: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
