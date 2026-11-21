<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/WhatsAppService.php';

try {
    $service = new WhatsAppService();
    $config  = $service->getConfig();
    $action  = $_GET['action'] ?? $_POST['action'] ?? '';

    switch ($action) {
        case 'send':
            if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'message' => 'Method must be POST']);
                exit;
            }

            $rawInput = file_get_contents('php://input');
            $input = json_decode($rawInput, true);
            if (!is_array($input)) {
                $input = $_POST;
            }

            $phone        = trim((string) ($input['phone'] ?? ''));
            $message      = trim((string) ($input['message'] ?? ''));
            $customerName = trim((string) ($input['customer_name'] ?? ''));
            $templateKey  = trim((string) ($input['template_key'] ?? ''));
            $invitationUrl= trim((string) ($input['invitation_url'] ?? ''));
            $kirimUrl     = trim((string) ($input['kirim_url'] ?? ''));

            if ($phone === '' || $message === '') {
                http_response_code(422);
                echo json_encode(['success' => false, 'message' => 'Nomor HP dan isi pesan wajib diisi']);
                exit;
            }

            // Render substitusi jika ada
            $finalMessage = $service->renderTemplate($message, $invitationUrl ?: null, $kirimUrl ?: null);

            $result = $service->sendMessage($phone, $finalMessage, $customerName ?: null);

            http_response_code($result['success'] ? 200 : 400);
            echo json_encode($result);
            break;

        case 'templates':
            $templates = $config['quick_templates'] ?? [];
            echo json_encode([
                'success' => true,
                'data'    => $templates,
            ]);
            break;

        case 'messages':
            $limit = min(200, max(1, (int) ($_GET['limit'] ?? 50)));
            $phone = !empty($_GET['phone']) ? trim((string) $_GET['phone']) : null;
            $msgs = $service->getMessages($limit, $phone);
            echo json_encode([
                'success' => true,
                'data'    => $msgs,
            ]);
            break;

        case 'customers':
            $limit = min(300, max(1, (int) ($_GET['limit'] ?? 100)));
            $customers = $service->getCustomerList($limit);
            echo json_encode([
                'success' => true,
                'data'    => $customers,
            ]);
            break;

        case 'device_status':
            $status = $service->checkDeviceStatus();
            echo json_encode([
                'success' => true,
                'data'    => $status,
            ]);
            break;

        case 'reconnect':
            $res = $service->reconnectDevice();
            echo json_encode($res);
            break;

        case 'get_qr':
            $res = $service->getLoginQr();
            echo json_encode($res);
            break;

        case 'chat_messages':
            $phone = trim((string)($_GET['phone'] ?? $_POST['phone'] ?? ''));
            if (empty($phone)) {
                echo json_encode(['success' => false, 'message' => 'Phone / JID wajib diisi']);
                exit;
            }
            $chatData = $service->fetchChatFromApi($phone);
            echo json_encode($chatData);
            break;

        case 'config_info':
            // Berikan info umum konfigurasi tanpa mengekspos password
            echo json_encode([
                'success' => true,
                'data'    => [
                    'gowa_base_url'    => $config['gowa_base_url'] ?? '',
                    'gowa_device_id'   => $config['gowa_device_id'] ?? '',
                    'invitation_web'   => $config['invitation_web_url'] ?? '',
                    'working_hours'    => $config['working_hours'] ?? [],
                    'menu_bot_enabled' => $config['menu_bot']['enabled'] ?? false,
                    'is_working_hours' => $service->isWorkingHours(),
                ],
            ]);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Action tidak dikenal. Gunakan: send, templates, messages, customers, device_status, config_info',
            ]);
            break;
    }

} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Terjadi kesalahan server: ' . $e->getMessage(),
    ]);
}
