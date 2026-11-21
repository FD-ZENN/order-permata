<?php
declare(strict_types=1);

class WhatsAppService
{
    private array $config;
    private ?PDO $sqlite = null;
    private ?PDO $mysql = null;

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? (require __DIR__ . '/config.php');
        $this->initSqlite();
    }

    public function getConfig(): array
    {
        return $this->config;
    }

    /**
     * Inisialisasi SQLite database lokal untuk logging chat & session bot
     */
    private function initSqlite(): void
    {
        $dbPath = $this->config['db_path'] ?? (__DIR__ . '/storage/messages.sqlite');
        $dir = dirname($dbPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $this->sqlite = new PDO('sqlite:' . $dbPath, null, null, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);

        // Buat tabel jika belum ada
        $this->sqlite->exec("
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                phone TEXT NOT NULL,
                customer_name TEXT,
                direction TEXT NOT NULL, -- outbound / inbound
                message TEXT NOT NULL,
                status TEXT DEFAULT 'sent', -- sent, failed, received
                response_raw TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_messages_phone ON messages(phone);
            CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

            CREATE TABLE IF NOT EXISTS bot_sessions (
                phone TEXT PRIMARY KEY,
                last_reply_at DATETIME,
                last_menu_state TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        ");
    }

    /**
     * Koneksi opsional ke MySQL Permata Wedding untuk query order/undangan
     */
    private function getMysql(): ?PDO
    {
        if ($this->mysql !== null) {
            return $this->mysql;
        }

        $dbConfigFile = __DIR__ . '/../../API/config/database.php';
        if (file_exists($dbConfigFile)) {
            require_once $dbConfigFile;
            try {
                $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
                $this->mysql = new PDO($dsn, DB_USER, DB_PASS, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]);
            } catch (\Throwable $e) {
                error_log("WA Service: MySQL connect error: " . $e->getMessage());
                $this->mysql = null;
            }
        }
        return $this->mysql;
    }

    /**
     * Normalisasi nomor telepon ke format internasional (misal 628xxxxxxxx)
     */
    public function normalizePhone(string $phone): string
    {
        $phone = trim($phone);
        if ($phone === '') {
            return '';
        }
        // Jika merupakan WhatsApp Group JID (misal: 6282242204889-1481086867@g.us) atau JID pengguna
        if (str_ends_with($phone, '@g.us') || str_ends_with($phone, '@s.whatsapp.net')) {
            return $phone;
        }

        $clean = preg_replace('/[^0-9]/', '', $phone);
        if ($clean === '') {
            return '';
        }
        if (str_starts_with($clean, '08')) {
            $clean = '62' . substr($clean, 1);
        } elseif (str_starts_with($clean, '8')) {
            $clean = '62' . $clean;
        }
        return $clean;
    }

    /**
     * Kirim Pesan WhatsApp via GoWA REST API
     */
    public function sendMessage(string $phone, string $message, ?string $customerName = null): array
    {
        $cleanPhone = $this->normalizePhone($phone);
        if ($cleanPhone === '') {
            return [
                'success' => false,
                'message' => 'Nomor WhatsApp tidak valid',
            ];
        }

        $url = rtrim($this->config['gowa_base_url'], '/') . '/send/message';
        $payload = [
            'phone'   => $cleanPhone,
            'message' => $message,
        ];

        $headers = [
            'Content-Type: application/json',
            'Accept: application/json',
        ];
        if (!empty($this->config['gowa_device_id'])) {
            $headers[] = 'X-Device-Id: ' . $this->config['gowa_device_id'];
        }

        $userPwd = ($this->config['gowa_basic_auth_user'] ?? '') . ':' . ($this->config['gowa_basic_auth_pass'] ?? '');

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_USERPWD, $userPwd);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 5);

        $responseRaw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $isSuccess = ($httpCode >= 200 && $httpCode < 300);
        $status = $isSuccess ? 'sent' : 'failed';

        // Log ke SQLite
        try {
            $stmt = $this->sqlite->prepare("
                INSERT INTO messages (phone, customer_name, direction, message, status, response_raw, created_at)
                VALUES (:phone, :name, 'outbound', :message, :status, :raw, datetime('now', 'localtime'))
            ");
            $stmt->execute([
                ':phone'   => $cleanPhone,
                ':name'    => $customerName,
                ':message' => $message,
                ':status'  => $status,
                ':raw'     => $responseRaw ?: $curlError,
            ]);
        } catch (\Throwable $e) {
            error_log("WA Service SQLite Log Error: " . $e->getMessage());
        }

        $responseData = json_decode((string) $responseRaw, true) ?? ['raw' => $responseRaw];

        return [
            'success'   => $isSuccess,
            'http_code' => $httpCode,
            'phone'     => $cleanPhone,
            'response'  => $responseData,
            'error'     => $isSuccess ? null : ($curlError ?: ($responseData['message'] ?? 'Gagal mengirim pesan via GoWA')),
        ];
    }

    /**
     * Kirim notifikasi konfirmasi pesanan baru secara otomatis:
     * 1. Ke nomor WhatsApp customer
     * 2. Ke grup WhatsApp admin (6282242204889-1481086867@g.us)
     */
    public function notifyNewOrder(array $data): array
    {
        $orderCode     = (string)($data['order_code'] ?? 'ORD-NEW');
        $customerName  = (string)($data['customer_name'] ?? 'Calon Pengantin');
        $customerPhone = (string)($data['customer_phone'] ?? '');
        $themeName     = (string)($data['theme_name'] ?? 'Tema Undangan');
        $packageType   = ucfirst((string)($data['package_type'] ?? 'Basic'));
        $slug          = (string)($data['slug'] ?? '');
        $orderDate     = (string)($data['order_date'] ?? (date('d M Y, H:i') . ' WIB'));
        $eventYear     = !empty($data['year']) ? (string)$data['year'] : (!empty($data['events'][0]['start_time']) ? date('Y', strtotime($data['events'][0]['start_time'])) : date('Y'));

        $invitationWeb = rtrim((string)($this->config['invitation_web_url'] ?? 'https://invitation.permatawedding.com'), '/');
        $invitationUrl = $slug ? "{$invitationWeb}/{$eventYear}/{$slug}/" : $invitationWeb;

        $results = [
            'customer' => null,
            'admin'    => null,
        ];

        // 1. Pesan Konfirmasi ke Customer
        if (!empty($customerPhone)) {
            $customerMsg = "Halo Kak *{$customerName}*! 💍\n"
                         . "Terima kasih telah memesan undangan digital pernikahan di *Permata Wedding*.\n\n"
                         . "Pesanan Anda telah berhasil kami terima dengan rincian sebagai berikut:\n\n"
                         . "📋 *Detail Pesanan:*\n"
                         . "• No. Order : *{$orderCode}*\n"
                         . "• Paket : *Paket {$packageType}*\n"
                         . "• Tema : *{$themeName}*\n"
                         . "• Link Undangan : {$invitationUrl}\n\n"
                         . "Pesanan Anda saat ini sedang dalam antrian verifikasi dan penyiapan oleh tim kami. Jika ada penyesuaian data atau pertanyaan, silakan langsung balas pesan ini ya Kak.\n\n"
                         . "Terima kasih atas kepercayaannya bersama *Permata Wedding*! ✨";

            $results['customer'] = $this->sendMessage($customerPhone, $customerMsg, $customerName);
        }

        // 2. Pesan Notifikasi ke Admin / Admin Group (6282242204889-1481086867@g.us)
        $adminTarget = (string)($this->config['admin_notify_group'] ?? '6282242204889-1481086867@g.us');
        if (!empty($adminTarget)) {
            $cleanCustPhone = $this->normalizePhone($customerPhone);
            $waLink = $cleanCustPhone ? "https://wa.me/{$cleanCustPhone}" : "—";

            $adminMsg = "🔔 *NOTIFIKASI ORDER BARU MASUK!* 💍\n\n"
                      . "Ada pesanan undangan pernikahan baru di *Permata Wedding*:\n\n"
                      . "📋 *Rincian Pesanan:*\n"
                      . "• No. Order : *{$orderCode}*\n"
                      . "• Mempelai : *{$customerName}*\n"
                      . "• No. WhatsApp : {$waLink}\n"
                      . "• Paket : *Paket {$packageType}*\n"
                      . "• Tema : *{$themeName}*\n"
                      . "• Slug / Link : {$invitationUrl}\n"
                      . "• Waktu Masuk : {$orderDate}\n\n"
                      . "Silakan cek detail lengkap dan konfirmasi di Admin Panel:\n"
                      . "https://invitation.permatawedding.com/api/admin/";

            $results['admin'] = $this->sendMessage($adminTarget, $adminMsg, 'Admin Group Permata Wedding');
        }

        return $results;
    }

    /**
     * Cek status koneksi GoWA device
     */
    public function checkDeviceStatus(): array
    {
        $url = rtrim($this->config['gowa_base_url'], '/') . '/app/status';
        $headers = ['Accept: application/json'];
        if (!empty($this->config['gowa_device_id'])) {
            $headers[] = 'X-Device-Id: ' . $this->config['gowa_device_id'];
        }
        $userPwd = ($this->config['gowa_basic_auth_user'] ?? '') . ':' . ($this->config['gowa_basic_auth_pass'] ?? '');

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_USERPWD, $userPwd);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);

        $responseRaw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $data = json_decode((string) $responseRaw, true);

        // Status mapping: connected, need_qr, disconnected
        $isConnected = false;
        $isLoggedIn = false;
        $statusKey = 'disconnected';
        $jid = '';

        if ($httpCode === 200 && is_array($data)) {
            $res = $data['results'] ?? [];
            $isConnected = !empty($res['is_connected']);
            $isLoggedIn = !empty($res['is_logged_in']);
            $jid = (string)($res['jid'] ?? '');

            if ($isConnected && $isLoggedIn) {
                $statusKey = 'connected';
            } elseif ($isConnected && !$isLoggedIn) {
                $statusKey = 'need_qr';
            } else {
                $statusKey = 'disconnected';
            }
        }

        return [
            'online'       => ($httpCode === 200),
            'status_key'   => $statusKey, // 'connected' | 'need_qr' | 'disconnected'
            'is_connected' => $isConnected,
            'is_logged_in' => $isLoggedIn,
            'jid'          => $jid,
            'http_code'    => $httpCode,
            'device_id'    => $this->config['gowa_device_id'],
            'data'         => $data,
            'error'        => $curlError ?: null,
        ];
    }

    /**
     * Reconnect device di GoWA
     */
    public function reconnectDevice(): array
    {
        $url = rtrim($this->config['gowa_base_url'], '/') . '/app/reconnect';
        $headers = ['Accept: application/json'];
        if (!empty($this->config['gowa_device_id'])) {
            $headers[] = 'X-Device-Id: ' . $this->config['gowa_device_id'];
        }
        $userPwd = ($this->config['gowa_basic_auth_user'] ?? '') . ':' . ($this->config['gowa_basic_auth_pass'] ?? '');

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_USERPWD, $userPwd);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $responseRaw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode((string) $responseRaw, true);
        return [
            'success'   => ($httpCode === 200),
            'http_code' => $httpCode,
            'data'      => $data,
        ];
    }

    /**
     * Dapatkan QR Code link untuk scan WhatsApp baru
     */
    public function getLoginQr(): array
    {
        $url = rtrim($this->config['gowa_base_url'], '/') . '/app/login';
        $headers = ['Accept: application/json'];
        if (!empty($this->config['gowa_device_id'])) {
            $headers[] = 'X-Device-Id: ' . $this->config['gowa_device_id'];
        }
        $userPwd = ($this->config['gowa_basic_auth_user'] ?? '') . ':' . ($this->config['gowa_basic_auth_pass'] ?? '');

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_USERPWD, $userPwd);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $responseRaw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode((string) $responseRaw, true);
        $qrLink = $data['results']['qr_link'] ?? '';

        return [
            'success'   => ($httpCode === 200 && !empty($qrLink)),
            'http_code' => $httpCode,
            'qr_link'   => $qrLink,
            'qr_duration' => $data['results']['qr_duration'] ?? 30,
            'data'      => $data,
        ];
    }

    /**
     * Mengambil riwayat pesan langsung dari API GoWA untuk chat JID tertentu
     * Format JID: 6281234567890@s.whatsapp.net atau nomor grup @g.us
     */
    public function fetchChatFromApi(string $phoneOrJid): array
    {
        $jid = $phoneOrJid;
        if (!str_contains($jid, '@')) {
            $clean = $this->normalizePhone($jid);
            $jid = $clean . '@s.whatsapp.net';
        }

        $url = rtrim($this->config['gowa_base_url'], '/') . '/chat/' . rawurlencode($jid) . '/messages';
        $headers = [
            'Accept: application/json',
            'X-Device-Id: ' . ($this->config['gowa_device_id'] ?? 'permatawedding'),
        ];
        $userPwd = ($this->config['gowa_basic_auth_user'] ?? '') . ':' . ($this->config['gowa_basic_auth_pass'] ?? '');

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_USERPWD, $userPwd);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);

        $responseRaw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        $data = json_decode((string) $responseRaw, true);
        $messages = [];

        if ($httpCode === 200 && isset($data['results']['data']) && is_array($data['results']['data'])) {
            foreach ($data['results']['data'] as $item) {
                $senderJid = (string)($item['sender_jid'] ?? '');
                $isFromMe = !empty($item['is_from_me']) || str_starts_with($senderJid, '6285741773941');
                
                $messages[] = [
                    'id'          => $item['id'] ?? '',
                    'jid'         => $jid,
                    'direction'   => $isFromMe ? 'outbound' : 'inbound',
                    'message'     => $item['content'] ?? ($item['message'] ?? ''),
                    'sender_name' => $item['sender_name'] ?? '',
                    'timestamp'   => !empty($item['timestamp']) ? date('Y-m-d H:i:s', (int)$item['timestamp']) : ($item['created_at'] ?? ''),
                    'status'      => 'sent',
                ];
            }
        }

        return [
            'success'   => ($httpCode === 200),
            'jid'       => $jid,
            'data'      => $messages,
            'raw_count' => count($messages),
            'error'     => $curlError ?: ($data['message'] ?? null),
        ];
    }

    /**
     * Ambil riwayat chat pesan dari SQLite
     */
    public function getMessages(int $limit = 50, ?string $phone = null): array
    {
        $sql = "SELECT * FROM messages";
        $params = [];
        if ($phone) {
            $cleanPhone = $this->normalizePhone($phone);
            $sql .= " WHERE phone = :phone";
            $params[':phone'] = $cleanPhone;
        }
        $sql .= " ORDER BY id DESC LIMIT :limit";

        $stmt = $this->sqlite->prepare($sql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Cari pesanan & URL undangan berdasarkan nomor WhatsApp
     */
    public function findOrderByPhone(string $phone): ?array
    {
        $cleanPhone = $this->normalizePhone($phone);
        if ($cleanPhone === '') {
            return null;
        }

        // Varian nomor yang mungkin tersimpan di DB (08xx, 62xx, dsb)
        $suffix = substr($cleanPhone, 2); // buang 62
        $pattern1 = '0' . $suffix;
        $pattern2 = '62' . $suffix;
        $pattern3 = '+62' . $suffix;

        $db = $this->getMysql();
        if ($db) {
            try {
                $stmt = $db->prepare("
                    SELECT o.id, o.order_code, o.customer_name, o.customer_phone, o.payment_status, o.is_active,
                           c.slug_url, c.groom_name, c.bride_name,
                           (SELECT event_datetime FROM events WHERE order_id = o.id ORDER BY sort_order ASC, event_datetime ASC LIMIT 1) AS event_date
                    FROM orders o
                    LEFT JOIN couples c ON c.order_id = o.id
                    WHERE o.customer_phone IN (:p1, :p2, :p3)
                       OR o.customer_phone LIKE :p_like
                    ORDER BY o.order_date DESC
                    LIMIT 1
                ");
                $stmt->execute([
                    ':p1'     => $pattern1,
                    ':p2'     => $pattern2,
                    ':p3'     => $pattern3,
                    ':p_like' => '%' . $suffix . '%',
                ]);
                $order = $stmt->fetch();
                if ($order && !empty($order['slug_url'])) {
                    $year = !empty($order['event_date']) ? date('Y', strtotime($order['event_date'])) : date('Y');
                    $webBase = rtrim($this->config['invitation_web_url'] ?? 'https://invitation.permatawedding.com', '/');
                    $order['invitation_url'] = $webBase . '/' . $year . '/' . $order['slug_url'];
                    $order['kirim_url']      = $webBase . '/' . $year . '/' . $order['slug_url'] . '#kirim';
                    return $order;
                }
            } catch (\Throwable $e) {
                error_log("WA findOrderByPhone DB error: " . $e->getMessage());
            }
        }

        return null;
    }

    /**
     * Ambil daftar customer dari pesanan MySQL untuk dropdown admin
     */
    public function getCustomerList(int $limit = 100): array
    {
        $db = $this->getMysql();
        if (!$db) {
            return [];
        }

        try {
            $stmt = $db->prepare("
                SELECT o.id, o.order_code, o.customer_name, o.customer_phone, o.payment_status, o.order_date,
                       c.slug_url, c.groom_name, c.bride_name,
                       (SELECT event_datetime FROM events WHERE order_id = o.id ORDER BY sort_order ASC, event_datetime ASC LIMIT 1) AS event_date
                FROM orders o
                LEFT JOIN couples c ON c.order_id = o.id
                WHERE o.customer_phone IS NOT NULL AND o.customer_phone != ''
                ORDER BY o.order_date DESC
                LIMIT :limit
            ");
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $rows = $stmt->fetchAll();

            $webBase = rtrim($this->config['invitation_web_url'] ?? 'https://invitation.permatawedding.com', '/');
            foreach ($rows as &$r) {
                if (!empty($r['slug_url'])) {
                    $year = !empty($r['event_date']) ? date('Y', strtotime($r['event_date'])) : date('Y');
                    $r['invitation_url'] = $webBase . '/' . $year . '/' . $r['slug_url'];
                    $r['kirim_url']      = $webBase . '/' . $year . '/' . $r['slug_url'] . '#kirim';
                } else {
                    $r['invitation_url'] = '';
                    $r['kirim_url']      = '';
                }
            }
            return $rows;
        } catch (\Throwable $e) {
            error_log("WA getCustomerList error: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Cek apakah saat ini berada dalam jam operasional
     */
    public function isWorkingHours(): bool
    {
        $wh = $this->config['working_hours'] ?? null;
        if (!$wh || empty($wh['enabled'])) {
            return true;
        }

        $tz = new DateTimeZone($wh['timezone'] ?? 'Asia/Jakarta');
        $now = new DateTime('now', $tz);

        // Hari dalam seminggu: 1 = Senin, ..., 7 = Minggu
        $dayOfWeek = (int) $now->format('N');
        $allowedDays = $wh['work_days'] ?? [1, 2, 3, 4, 5, 6];
        if (!in_array($dayOfWeek, $allowedDays, true)) {
            return false;
        }

        $currentTime = $now->format('H:i');
        $start = $wh['start_hour'] ?? '08:00';
        $end   = $wh['end_hour'] ?? '17:00';

        return ($currentTime >= $start && $currentTime <= $end);
    }

    /**
     * Render teks template dengan substitusi variabel {INVITATION_URL} dan {KIRIM_URL}
     */
    public function renderTemplate(string $text, ?string $invitationUrl = null, ?string $kirimUrl = null): string
    {
        $invUrl = $invitationUrl ?: ($this->config['invitation_web_url'] ?? 'https://invitation.permatawedding.com');
        $krmUrl = $kirimUrl ?: ($invUrl . '#kirim');

        $out = str_replace('{INVITATION_URL}', $invUrl, $text);
        return str_replace('{KIRIM_URL}', $krmUrl, $out);
    }

    /**
     * Penanganan Webhook Pesan Masuk dari GoWA
     */
    public function handleWebhook(array $data): array
    {
        // Standar format payload GoWA
        $sender  = $data['sender']  ?? $data['from']  ?? $data['phone'] ?? '';
        $message = trim((string) ($data['message'] ?? $data['body'] ?? $data['text'] ?? ''));

        if ($sender === '' || $message === '') {
            return ['status' => 'ignored', 'reason' => 'Empty sender or message'];
        }

        $cleanPhone = $this->normalizePhone($sender);

        // Simpan pesan masuk ke SQLite
        try {
            $stmt = $this->sqlite->prepare("
                INSERT INTO messages (phone, direction, message, status, response_raw, created_at)
                VALUES (:phone, 'inbound', :message, 'received', :raw, datetime('now', 'localtime'))
            ");
            $stmt->execute([
                ':phone'   => $cleanPhone,
                ':message' => $message,
                ':raw'     => json_encode($data),
            ]);
        } catch (\Throwable $e) {
            error_log("WA handleWebhook insert error: " . $e->getMessage());
        }

        // Cek sesi bot untuk rate limiting balasan otomatis
        $stmtSess = $this->sqlite->prepare("SELECT * FROM bot_sessions WHERE phone = :p LIMIT 1");
        $stmtSess->execute([':p' => $cleanPhone]);
        $session = $stmtSess->fetch();

        $replyToSend = null;
        $lowerMsg = strtolower($message);

        // 1. Cek Kata Kunci Menu Bot
        $menuConfig = $this->config['menu_bot'] ?? [];
        if (!empty($menuConfig['enabled'])) {
            $triggerWords = $menuConfig['trigger_keywords'] ?? [];
            if (in_array($lowerMsg, $triggerWords, true)) {
                $replyToSend = $menuConfig['welcome_message'] ?? '';
            } elseif (isset($menuConfig['options'][$lowerMsg])) {
                $selectedOption = $menuConfig['options'][$lowerMsg];
                if ($selectedOption === '__AUTO_INVITATION__') {
                    // Cari undangan berdasarkan nomor pengirim
                    $order = $this->findOrderByPhone($cleanPhone);
                    if ($order && !empty($order['invitation_url'])) {
                        $replyToSend = "Halo Kak! Berikut data undangan digital Anda:\n\n"
                                     . "👰 Pasangan: " . ($order['groom_name'] ?? '') . " & " . ($order['bride_name'] ?? '') . "\n"
                                     . "🔗 Link Undangan: " . $order['invitation_url'] . "\n"
                                     . "📤 Link Kirim Tamu: " . $order['kirim_url'] . "\n\n"
                                     . "Status Pesanan: " . strtoupper((string) ($order['payment_status'] ?? 'Aktif')) . "\n\n"
                                     . "Ada yang bisa kami bantu lagi Kak?";
                    } else {
                        $replyToSend = "Mohon maaf Kak, sistem belum menemukan data undangan digital aktif untuk nomor WhatsApp ini (" . $cleanPhone . ").\n\n"
                                     . "Pastikan nomor yang digunakan sama dengan saat pemesanan, atau balas '4' untuk terhubung langsung dengan admin kami.";
                    }
                } else {
                    $replyToSend = $selectedOption;
                }
            }
        }

        // 2. Cek Auto Replies Kustom (misal "jam operasional")
        if (!$replyToSend && !empty($this->config['auto_replies'])) {
            foreach ($this->config['auto_replies'] as $kw => $ans) {
                if (str_contains($lowerMsg, strtolower((string) $kw))) {
                    $replyToSend = $ans;
                    break;
                }
            }
        }

        // 3. Cek Jam Operasional (Di luar jam kerja kirim offline reply jika interval terpenuhi)
        if (!$replyToSend && !$this->isWorkingHours()) {
            $wh = $this->config['working_hours'] ?? [];
            $intervalMins = (int) ($wh['reply_interval_minutes'] ?? 120);

            $shouldSendOffline = true;
            if ($session && !empty($session['last_reply_at'])) {
                $lastReplyTime = strtotime($session['last_reply_at']);
                if ((time() - $lastReplyTime) < ($intervalMins * 60)) {
                    $shouldSendOffline = false; // Hindari spam jika user sering chat
                }
            }

            if ($shouldSendOffline && !empty($wh['offline_reply'])) {
                $replyToSend = $wh['offline_reply'];
            }
        }

        // Kirim balasan otomatis jika ada
        if ($replyToSend) {
            $this->sendMessage($cleanPhone, $replyToSend, 'Auto Bot Reply');

            // Update sesi bot
            $updSess = $this->sqlite->prepare("
                INSERT INTO bot_sessions (phone, last_reply_at, last_menu_state, updated_at)
                VALUES (:p, datetime('now', 'localtime'), :state, datetime('now', 'localtime'))
                ON CONFLICT(phone) DO UPDATE SET
                    last_reply_at = datetime('now', 'localtime'),
                    last_menu_state = :state,
                    updated_at = datetime('now', 'localtime')
            ");
            $updSess->execute([
                ':p'     => $cleanPhone,
                ':state' => $lowerMsg,
            ]);

            return ['status' => 'replied', 'reply' => $replyToSend];
        }

        return ['status' => 'received', 'phone' => $cleanPhone];
    }
}
