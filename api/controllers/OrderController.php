<?php
class OrderController extends BaseController
{
    protected string $table = 'orders';

    protected array $fillable = [
        'order_code', 'customer_name', 'customer_phone', 'package_type',
        'theme_id', 'payment_status', 'total_price', 'is_active', 'notes',
        'order_date', 'views_count',
    ];

    protected array $required = ['order_code', 'customer_name'];

    protected array $enums = [
        'package_type'   => ['basic', 'premium', 'exclusive'],
        'payment_status' => ['unpaid', 'paid', 'partial', 'cancelled'],
    ];

    protected ?string $orderBy = 'order_date DESC';

    // ---------------------------------------------------------------
    // Auto-generate order_code (admin route)
    // ---------------------------------------------------------------
    protected function beforeCreate(array &$input): void
    {
        if (empty($input['order_code'])) {
            $input['order_code'] = $this->generateOrderCode();
        }
        if (empty($input['order_date'])) {
            $input['order_date'] = date('Y-m-d H:i:s');
        }
    }
    
    // ---------------------------------------------------------------
    // Generate unique order_code — pakai MAX bukan COUNT
    // ---------------------------------------------------------------
    private function generateOrderCode(): string
    {
        $prefix = 'ORD-' . date('Ym') . '-';
        $stmt   = $this->db->prepare(
            "SELECT MAX(CAST(SUBSTRING(order_code, :len) AS UNSIGNED)) AS last_num
             FROM orders
             WHERE order_code LIKE :prefix"
        );
        $prefixLen = strlen($prefix) + 1; // +1 karena SUBSTRING 1-indexed
        $stmt->execute([
            ':len'    => $prefixLen,
            ':prefix' => $prefix . '%',
        ]);
        $lastNum = (int) ($stmt->fetch()['last_num'] ?? 0);
        return $prefix . str_pad($lastNum + 1, 4, '0', STR_PAD_LEFT);
    }

    // ---------------------------------------------------------------
    // POST /orders/public
    // ---------------------------------------------------------------
    public function storePublic(): void
    {
        // Rate limit pembuatan pesanan publik: maksimal 5 per 10 menit per IP
        $clientIp = RateLimiter::clientIp();
        $rateLimitKey = 'order_public:' . $clientIp;
        if (!RateLimiter::attempt($rateLimitKey, 5, 600)) {
            Response::error('Terlalu banyak permintaan pemesanan dari perangkat Anda. Silakan coba lagi nanti.', 429);
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true);
        if (!is_array($body)) {
            Response::error('Request body tidak valid (JSON required)', 400);
            return;
        }

        // ── Validasi ────────────────────────────────────────────────
        $errors = [];
        if (empty(trim($body['phone'] ?? '')))
            $errors[] = 'Nomor WhatsApp wajib diisi';
        if (empty(trim($body['slug'] ?? '')))
            $errors[] = 'Slug URL wajib diisi';
        if (!empty($body['slug']) && !preg_match('/^[a-z0-9\-]+$/', trim($body['slug'])))
            $errors[] = 'Slug hanya boleh huruf kecil, angka, dan tanda hubung';
        if (empty($body['theme_id']))
            $errors[] = 'Tema wajib dipilih';
        if (empty(trim($body['groom']['full_name'] ?? '')))
            $errors[] = 'Nama lengkap mempelai pria wajib diisi';
        if (empty(trim($body['bride']['full_name'] ?? '')))
            $errors[] = 'Nama lengkap mempelai wanita wajib diisi';

        if ($errors) {
            Response::error('Validasi gagal', 422, $errors);
            return;
        }

        $slug  = trim($body['slug']);
        $phone = trim($body['phone']);
        $groom = $body['groom'] ?? [];
        $bride = $body['bride'] ?? [];

        // ── Cek slug unik ────────────────────────────────────────────
        $stmtSlug = $this->db->prepare(
            "SELECT id FROM couples WHERE slug_url = :slug LIMIT 1"
        );
        $stmtSlug->execute([':slug' => $slug]);
        if ($stmtSlug->fetch()) {
            Response::error('Slug URL sudah digunakan, silakan pilih slug lain', 409);
            return;
        }

        // ── Cek tema valid & aktif ──────────────────────────────────
        $stmtTheme = $this->db->prepare(
            "SELECT * FROM themes WHERE id = :id AND is_active = 1 LIMIT 1"
        );
        $stmtTheme->execute([':id' => $body['theme_id']]);
        $theme = $stmtTheme->fetch(PDO::FETCH_ASSOC);
        if (!$theme) {
            Response::error('Tema tidak ditemukan atau tidak aktif', 404);
            return;
        }

        try {
            $this->db->beginTransaction();

            // ── 1. Generate order_code (MAX bukan COUNT agar tidak duplicate) ──
            $prefix = 'ORD-' . date('Ym') . '-';
            $stmt   = $this->db->prepare(
                "SELECT MAX(CAST(SUBSTRING(order_code, :len) AS UNSIGNED)) AS last_num
                 FROM orders
                 WHERE order_code LIKE :prefix"
            );
            $prefixLen = strlen($prefix) + 1;
            $stmt->execute([
                ':len'    => $prefixLen,
                ':prefix' => $prefix . '%',
            ]);
            $lastNum   = (int) ($stmt->fetch()['last_num'] ?? 0);
            $orderCode = $prefix . str_pad($lastNum + 1, 4, '0', STR_PAD_LEFT);

            // ── 2. Insert order ───────────────────────────────────────
            // FIX: pakai UUID() MariaDB bukan generate_uuid() PHP
            // FIX: tambah order_date
            $stmtOrder = $this->db->prepare("
                INSERT INTO orders
                    (id, order_code, customer_name, customer_phone,
                     theme_id, package_type, payment_status, is_active, notes, order_date)
                VALUES
                    (UUID(), :order_code, :customer_name, :customer_phone,
                     :theme_id, :package_type, 'unpaid', 0, :notes, NOW())
            ");
            $stmtOrder->execute([
                ':order_code'     => $orderCode,
                ':customer_name'  => trim($groom['full_name'] . ' & ' . $bride['full_name']),
                ':customer_phone' => $phone,
                ':theme_id'       => $body['theme_id'],
                ':package_type'   => in_array($body['package'] ?? '', ['basic', 'premium', 'exclusive'])
                                        ? $body['package'] : 'basic',
                ':notes'          => $body['notes'] ?? null,
            ]);
            $orderId = $this->db->lastInsertId();
            // MariaDB lastInsertId() returns "0" for non-auto_increment
            // Jadi ambil ulang via order_code
            if (!$orderId || $orderId === '0') {
                $stmtGetId = $this->db->prepare("SELECT id FROM orders WHERE order_code = :code LIMIT 1");
                $stmtGetId->execute([':code' => $orderCode]);
                $orderId = $stmtGetId->fetchColumn();
            }

            // ── 3. Insert couple ──────────────────────────────────────
            $stmtCouple = $this->db->prepare("
                INSERT INTO couples
                    (id, order_id, slug_url,
                     groom_name, groom_nickname, groom_father, groom_mother,
                     groom_address, groom_photo_url,
                     bride_name, bride_nickname, bride_father, bride_mother,
                     bride_address, bride_photo_url)
                VALUES
                    (UUID(), :order_id, :slug_url,
                     :groom_name, :groom_nickname, :groom_father, :groom_mother,
                     :groom_address, :groom_photo_url,
                     :bride_name, :bride_nickname, :bride_father, :bride_mother,
                     :bride_address, :bride_photo_url)
            ");
            $stmtCouple->execute([
                ':order_id'        => $orderId,
                ':slug_url'        => $slug,
                ':groom_name'      => trim($groom['full_name']),
                ':groom_nickname'  => $groom['nickname']  ?? null,
                ':groom_father'    => $groom['father']    ?? null,
                ':groom_mother'    => $groom['mother']    ?? null,
                ':groom_address'   => $groom['address']   ?? null,
                ':groom_photo_url' => $groom['photo_url'] ?? null,
                ':bride_name'      => trim($bride['full_name']),
                ':bride_nickname'  => $bride['nickname']  ?? null,
                ':bride_father'    => $bride['father']    ?? null,
                ':bride_mother'    => $bride['mother']    ?? null,
                ':bride_address'   => $bride['address']   ?? null,
                ':bride_photo_url' => $bride['photo_url'] ?? null,
            ]);
            // Ambil couple_id
            $stmtGetCouple = $this->db->prepare("SELECT id FROM couples WHERE order_id = :oid LIMIT 1");
            $stmtGetCouple->execute([':oid' => $orderId]);
            $coupleId = $stmtGetCouple->fetchColumn();

            // ── 4. Insert events ──────────────────────────────────────
            if (!empty($body['events']) && is_array($body['events'])) {
                $stmtEv = $this->db->prepare("
                    INSERT INTO events
                        (id, order_id, event_name, event_datetime, event_end,
                         venue_name, venue_address, google_maps_url, sort_order)
                    VALUES
                        (UUID(), :order_id, :event_name, :event_datetime, :event_end,
                         :venue_name, :venue_address, :google_maps_url, :sort_order)
                ");
                foreach ($body['events'] as $i => $ev) {
                    if (empty($ev['name']) || empty($ev['start_time'])) continue;
                    $stmtEv->execute([
                        ':order_id'        => $orderId,
                        ':event_name'      => $ev['name'],
                        ':event_datetime'  => $ev['start_time'],
                        ':event_end'       => $ev['end_time']    ?: null,
                        ':venue_name'      => $ev['venue_name']  ?? null,
                        ':venue_address'   => $ev['address']     ?? null,
                        ':google_maps_url' => $ev['maps_url']    ?? null,
                        ':sort_order'      => $i + 1,
                    ]);
                }
            }

            // ── 5. Insert music ───────────────────────────────────────
            if (!empty($body['music']) && is_array($body['music'])) {
                $stmtMu = $this->db->prepare("
                    INSERT INTO music
                        (id, order_id, title, artist, audio_url, autoplay, `loop`, sort_order)
                    VALUES
                        (UUID(), :order_id, :title, :artist, :audio_url, :autoplay, :loop, :sort_order)
                ");
                foreach ($body['music'] as $i => $mu) {
                    if (empty($mu['title']) || empty($mu['url'])) continue;
                    $stmtMu->execute([
                        ':order_id'   => $orderId,
                        ':title'      => $mu['title'],
                        ':artist'     => $mu['artist']   ?? null,
                        ':audio_url'  => $mu['url'],
                        ':autoplay'   => $mu['autoplay'] ? 1 : 0,
                        ':loop'       => isset($mu['loop']) ? ($mu['loop'] ? 1 : 0) : 1,
                        ':sort_order' => $i + 1,
                    ]);
                }
            }

            // ── 6. Insert love_stories ────────────────────────────────
            if (!empty($body['love_stories']) && is_array($body['love_stories'])) {
                $stmtSt = $this->db->prepare("
                    INSERT INTO love_stories
                        (id, order_id, title, content, story_date, sort_order)
                    VALUES
                        (UUID(), :order_id, :title, :content, :story_date, :sort_order)
                ");
                foreach ($body['love_stories'] as $i => $st) {
                    if (empty($st['title'])) continue;
                    $stmtSt->execute([
                        ':order_id'   => $orderId,
                        ':title'      => $st['title'],
                        ':content'    => $st['content']  ?? null,
                        ':story_date' => $st['date']     ?: null,
                        ':sort_order' => $i + 1,
                    ]);
                }
            }

            // ── 7. Insert livestreaming ───────────────────────────────
            if (!empty($body['live_streamings']) && is_array($body['live_streamings'])) {
                $stmtLv = $this->db->prepare("
                    INSERT INTO livestreaming
                        (id, order_id, title, youtube_url, stream_start, stream_end)
                    VALUES
                        (UUID(), :order_id, :title, :youtube_url, :stream_start, :stream_end)
                ");
                foreach ($body['live_streamings'] as $lv) {
                    if (empty($lv['url'])) continue;
                    $stmtLv->execute([
                        ':order_id'     => $orderId,
                        ':title'        => $lv['title']      ?? null,
                        ':youtube_url'  => $lv['url'],
                        ':stream_start' => $lv['start_time'] ?: null,
                        ':stream_end'   => $lv['end_time']   ?: null,
                    ]);
                }
            }

            // ── 8. Insert entertainment ───────────────────────────────
            if (!empty($body['entertainments']) && is_array($body['entertainments'])) {
                $stmtEn = $this->db->prepare("
                    INSERT INTO entertainment
                        (id, order_id, name, type, description, sort_order)
                    VALUES
                        (UUID(), :order_id, :name, :type, :description, :sort_order)
                ");
                foreach ($body['entertainments'] as $i => $en) {
                    if (empty($en['name'])) continue;
                    $stmtEn->execute([
                        ':order_id'    => $orderId,
                        ':name'        => $en['name'],
                        ':type'        => $en['type']        ?? null,
                        ':description' => $en['description'] ?? null,
                        ':sort_order'  => $i + 1,
                    ]);
                }
            }

            // ── 9. Insert digital_wallets ─────────────────────────────
            if (!empty($body['bank_accounts']) && is_array($body['bank_accounts'])) {
                $stmtBk = $this->db->prepare("
                    INSERT INTO digital_wallets
                        (id, order_id, wallet_type, bank_name,
                         account_number, account_holder)
                    VALUES
                        (UUID(), :order_id, :wallet_type, :bank_name,
                         :account_number, :account_holder)
                ");
                foreach ($body['bank_accounts'] as $bk) {
                    if (empty($bk['account_name'])) continue;
                    $stmtBk->execute([
                        ':order_id'       => $orderId,
                        ':wallet_type'    => 'bank',
                        ':bank_name'      => $bk['bank_name']      ?? null,
                        ':account_number' => $bk['account_number'] ?? null,
                        ':account_holder' => $bk['account_name'],
                    ]);
                }
            }

            // ── 10. Insert galleries ──────────────────────────────────
            // FIX: tabel galleries pakai "uploaded_at" bukan "created_at"
            // Kolom uploaded_at dan updated_at punya DEFAULT, jadi tidak perlu diisi manual
            if (!empty($body['gallery']) && is_array($body['gallery'])) {
                $stmtGl = $this->db->prepare("
                    INSERT INTO galleries
                        (id, order_id, photo_url, sort_order)
                    VALUES
                        (UUID(), :order_id, :photo_url, :sort_order)
                ");
                foreach ($body['gallery'] as $i => $url) {
                    if (empty($url)) continue;
                    $stmtGl->execute([
                        ':order_id'   => $orderId,
                        ':photo_url'  => $url,
                        ':sort_order' => $i + 1,
                    ]);
                }
            }

            $this->db->commit();

            // ── 11. Pre-render & Build Undangan Otomatis (Static Generation) ─
            $buildResult = [];
            try {
                $buildResult = InvitationCompiler::build($this->db, $orderId);
            } catch (\Throwable $tb) {
                error_log("Pre-render Invitation Build Warning: " . $tb->getMessage());
            }

            $invitationUrl = !empty($buildResult['url']) ? $buildResult['url'] : "/{$slug}/";

            // ── Response sukses ───────────────────────────────────────
            Response::success([
                'order_id'       => $orderId,
                'order_code'     => $orderCode,
                'couple_id'      => $coupleId,
                'slug'           => $slug,
                'year'           => $buildResult['year'] ?? date('Y'),
                'invitation_url' => $invitationUrl,
                'build_status'   => !empty($buildResult['success']),
            ], 'Pesanan berhasil dikirim dan halaman undangan telah digenerate!', 201);

        } catch (\Throwable $e) {
            $this->db->rollBack();
            // LOG error detail ke server log
            error_log("ORDER ERROR: " . $e->getMessage() . " | " . $e->getFile() . ":" . $e->getLine());
            Response::error(
                'Gagal menyimpan pesanan: ' . $e->getMessage(),
                500
            );
        }
    }

    // ---------------------------------------------------------------
    // Copy isi folder tema ke /2027/{slug}/
    // ---------------------------------------------------------------
    public function recompile(string $id): void
    {
        try {
            $stmt = $this->db->prepare("
                SELECT o.*, c.slug_url, t.name AS theme_name
                FROM orders o
                LEFT JOIN couples c ON c.order_id = o.id
                LEFT JOIN themes t ON t.id = o.theme_id
                WHERE o.id = :id LIMIT 1
            ");
            $stmt->execute([':id' => $id]);
            $order = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                Response::error("Pesanan dengan ID {$id} tidak ditemukan", 404);
                return;
            }

            // Jalankan InvitationCompiler
            $buildResult = InvitationCompiler::build($this->db, $id);

            Response::success([
                'order_id'       => $id,
                'order_code'     => $order['order_code'],
                'slug'           => $buildResult['slug'] ?? $order['slug_url'],
                'year'           => $buildResult['year'] ?? date('Y'),
                'invitation_url' => $buildResult['url'] ?? '',
                'build_result'   => $buildResult,
            ], "Halaman website undangan berhasil dikompilasi ulang!");
        } catch (\Throwable $e) {
            error_log("Recompile Order Error: " . $e->getMessage());
            Response::error("Gagal kompilasi undangan: " . $e->getMessage(), 500);
        }
    }

    public function recordView(string $id): void
    {
        try {
            $stmt = $this->db->prepare("UPDATE orders SET views_count = views_count + 1 WHERE id = :id");
            $stmt->execute([':id' => $id]);
            Response::success(['id' => $id], "Kunjungan berhasil dicatat");
        } catch (\Throwable $e) {
            Response::error("Gagal mencatat kunjungan", 500);
        }
    }

    public function stats(): void
    {
        try {
            $stmt = $this->db->query("
                SELECT 
                    COUNT(*) AS total_orders,
                    SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_orders,
                    SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) AS paid_orders,
                    SUM(COALESCE(views_count, 0)) AS total_views,
                    SUM(CASE WHEN payment_status = 'paid' THEN total_price ELSE 0 END) AS total_revenue
                FROM orders
            ");
            $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];

            // Ucapan & RSVP
            $stmtCm = $this->db->query("
                SELECT 
                    COUNT(*) AS total_comments,
                    SUM(CASE WHEN attendance = 'hadir' THEN 1 ELSE 0 END) AS total_attending,
                    SUM(CASE WHEN attendance = 'tidak_hadir' THEN 1 ELSE 0 END) AS total_absent,
                    SUM(CASE WHEN attendance = 'ragu_ragu' THEN 1 ELSE 0 END) AS total_unsure
                FROM comments
            ");
            $rowCm = $stmtCm->fetch(PDO::FETCH_ASSOC) ?: [];

            Response::success(array_merge($row, $rowCm));
        } catch (\Throwable $e) {
            Response::error("Gagal memuat statistik", 500);
        }
    }

    private function copyThemeToSlugRoot(array $theme, string $slug, string $year = '2027'): array
    {
        $templatesDir = __DIR__ . '/../../templates/';
        $uploadsDir   = __DIR__ . "/../../{$year}/";

        $themeFolder = $this->slugifyTheme($theme['name']);
        $sourceDir   = $templatesDir . $themeFolder . '/';
        $destDir     = $uploadsDir . $slug . '/';

        if (!is_dir($sourceDir)) {
            error_log("Folder template tidak ditemukan: {$sourceDir}");
            return [
                'copied'  => 0,
                'skipped' => 0,
                'error'   => "Folder template tidak ditemukan: templates/{$themeFolder}/",
            ];
        }

        if (!is_dir($destDir)) {
            mkdir($destDir, 0755, true);
        }

        $protectedFolders = ['couple', 'gallery'];
        return $this->copyDirRecursive($sourceDir, $destDir, $protectedFolders);
    }

    // ---------------------------------------------------------------
    // Rekursif copy direktori
    // ---------------------------------------------------------------
    private function copyDirRecursive(
        string $source,
        string $dest,
        array  $protectedFolders = []
    ): array {
        $copied  = 0;
        $skipped = 0;

        $items = scandir($source);
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;

            if (in_array($item, $protectedFolders, true) && is_dir($source . $item)) {
                $skipped++;
                continue;
            }

            $srcPath  = $source . $item;
            $destPath = $dest   . $item;

            if (is_dir($srcPath)) {
                if (!is_dir($destPath)) {
                    mkdir($destPath, 0755, true);
                }
                $sub      = $this->copyDirRecursive($srcPath . '/', $destPath . '/');
                $copied  += $sub['copied'];
                $skipped += $sub['skipped'];

            } elseif (is_file($srcPath)) {
                if (file_exists($destPath)) {
                    $skipped++;
                    continue;
                }
                if (copy($srcPath, $destPath)) {
                    $copied++;
                } else {
                    $skipped++;
                }
            }
        }

        return ['copied' => $copied, 'skipped' => $skipped];
    }

    // ---------------------------------------------------------------
    // Slugify nama tema
    // ---------------------------------------------------------------
    private function slugifyTheme(string $name): string
    {
        $name = strtolower(trim($name));
        $name = preg_replace('/[^a-z0-9]+/', '-', $name);
        return trim($name, '-');
    }
}