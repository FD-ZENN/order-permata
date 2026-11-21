<?php
declare(strict_types=1);

/**
 * InvitationCompiler
 *
 * Bertanggung jawab menyalin aset tema dan melakukan True Static Pre-Rendering
 * ke dalam index.html / index.php di folder tahun dinamis undangan mempelai.
 *
 * Arsitektur:
 * 1. 100% True Static Pre-Rendering (0ms FCP, tanpa FOUT).
 * 2. Tanpa injeksi skrip berat window.INVITATION_DATA.
 * 3. Cache-busting dinamis berbasis timestamp waktu generate (?v=YYYYMMDDHHIISS).
 * 4. Blueprint / Dynamic Loop & Auto-Hide on Empty untuk Story, Wallets, Galeri, Hiburan.
 * 5. Hanya menyisakan window.CONFIG minimal untuk fitur interaktif (RSVP & Komentar).
 */
class InvitationCompiler
{
    private static string $templatesBaseDir = __DIR__ . '/../../templates/';
    private static string $rootDir = __DIR__ . '/../../';

    /**
     * Build atau rebuild undangan digital dari database.
     */
    public static function build(PDO $db, string $orderId): array
    {
        // 1. Ambil data Order & Tema
        $stmtOrder = $db->prepare("
            SELECT o.*, t.name AS theme_name
            FROM orders o
            LEFT JOIN themes t ON t.id = o.theme_id
            WHERE o.id = :id LIMIT 1
        ");
        $stmtOrder->execute([':id' => $orderId]);
        $order = $stmtOrder->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            throw new \RuntimeException("Order dengan ID {$orderId} tidak ditemukan");
        }

        // 2. Ambil data Pasangan (Couples)
        $stmtCouple = $db->prepare("SELECT * FROM couples WHERE order_id = :id LIMIT 1");
        $stmtCouple->execute([':id' => $orderId]);
        $couple = $stmtCouple->fetch(PDO::FETCH_ASSOC) ?: [];

        $slug = trim($couple['slug_url'] ?? '');
        if (!$slug) {
            $slug = 'order-' . strtolower(preg_replace('/[^a-zA-Z0-9_-]/', '', $order['order_code']));
        }

        // 3. Ambil data Acara (Events)
        $stmtEvents = $db->prepare("SELECT * FROM events WHERE order_id = :id ORDER BY sort_order ASC, event_datetime ASC");
        $stmtEvents->execute([':id' => $orderId]);
        $events = $stmtEvents->fetchAll(PDO::FETCH_ASSOC) ?: [];

        // Tentukan tahun acara dinamis (ambil tahun dari event pertama jika ada, fallback ke created_at / tahun sekarang)
        $eventYear = date('Y');
        if (!empty($events[0]['event_datetime'])) {
            $parsedYear = date('Y', strtotime($events[0]['event_datetime']));
            if ($parsedYear && (int)$parsedYear >= 2020) {
                $eventYear = $parsedYear;
            }
        } elseif (!empty($order['created_at'])) {
            $parsedYear = date('Y', strtotime($order['created_at']));
            if ($parsedYear && (int)$parsedYear >= 2020) {
                $eventYear = $parsedYear;
            }
        }

        // 4. Ambil data Cerita Cinta (Love Stories)
        $stmtStories = $db->prepare("SELECT * FROM love_stories WHERE order_id = :id ORDER BY sort_order ASC, story_date ASC");
        $stmtStories->execute([':id' => $orderId]);
        $stories = $stmtStories->fetchAll(PDO::FETCH_ASSOC) ?: [];

        // 5. Ambil data Galeri
        $stmtGalleries = $db->prepare("SELECT * FROM galleries WHERE order_id = :id ORDER BY sort_order ASC");
        $stmtGalleries->execute([':id' => $orderId]);
        $galleries = $stmtGalleries->fetchAll(PDO::FETCH_ASSOC) ?: [];

        // 6. Ambil data Musik
        $stmtMusic = $db->prepare("SELECT * FROM music WHERE order_id = :id LIMIT 1");
        $stmtMusic->execute([':id' => $orderId]);
        $music = $stmtMusic->fetch(PDO::FETCH_ASSOC) ?: null;

        // 7. Ambil data Dompet Digital
        $stmtWallets = $db->prepare("SELECT * FROM digital_wallets WHERE order_id = :id AND is_active = 1");
        $stmtWallets->execute([':id' => $orderId]);
        $wallets = $stmtWallets->fetchAll(PDO::FETCH_ASSOC) ?: [];

        // 8. Ambil data Hiburan
        $stmtEnt = $db->prepare("SELECT * FROM entertainment WHERE order_id = :id ORDER BY sort_order ASC");
        $stmtEnt->execute([':id' => $orderId]);
        $entertainments = $stmtEnt->fetchAll(PDO::FETCH_ASSOC) ?: [];

        // 9. Ambil data Live Streaming
        $stmtLive = $db->prepare("SELECT * FROM livestreaming WHERE order_id = :id AND is_active = 1 LIMIT 1");
        $stmtLive->execute([':id' => $orderId]);
        $livestreaming = $stmtLive->fetch(PDO::FETCH_ASSOC) ?: null;

        // Timestamp versi untuk cache-busting (?v=YYYYMMDDHHIISS)
        $buildVersion = date('YmdHis');

        // Gabungkan seluruh payload dalam satu struktur
        $fullData = [
            'order'          => $order,
            'couple'         => $couple,
            'events'         => $events,
            'stories'        => $stories,
            'galleries'      => $galleries,
            'music'          => $music,
            'wallets'        => $wallets,
            'entertainments' => $entertainments,
            'livestreaming'  => $livestreaming,
            'build_version'  => $buildVersion,
            'year'           => $eventYear,
            'slug'           => $slug,
            'generated_at'   => date('Y-m-d H:i:s'),
        ];

        // 10. Tentukan Direktori Sumber Tema & Direktori Tujuan (Tahun Dinamis)
        $themeName = trim($order['theme_name'] ?? 'premium-ivory-grace');
        $themeSlug = self::slugify($themeName);

        $sourceDir = self::$templatesBaseDir . $themeSlug . '/';
        if (!is_dir($sourceDir)) {
            $sourceDir = self::$templatesBaseDir . 'premium-ivory-grace/';
        }

        $yearDir = self::$rootDir . $eventYear . '/';
        if (!is_dir($yearDir)) {
            if (!@mkdir($yearDir, 0755, true) && !is_dir($yearDir)) {
                throw new \RuntimeException("Gagal membuat folder tahun ({$yearDir}). Periksa izin/ownership folder website di server.");
            }
        }

        $destDir = $yearDir . $slug . '/';
        if (!is_dir($destDir)) {
            if (!@mkdir($destDir, 0755, true) && !is_dir($destDir)) {
                throw new \RuntimeException("Gagal membuat folder undangan ({$destDir}). Periksa izin direktori di server.");
            }
        } else {
            // Jika folder sudah ada (misal ganti tema atau re-compile),
            // bersihkan aset lama (css, js, assets, fonts, ornamen, dll)
            // KECUALI folder media master pengantin (couple, gallery) agar aset tema baru tidak bercampur dengan tema lama!
            self::cleanThemeAssets($destDir);
        }

        // Salin file statis tema (css, js, assets, dll) tanpa menimpa index
        self::copyAssets($sourceDir, $destDir);

        // Opsi A: Sinkronisasi Otomatis Media Unggahan dari master uploads/{slug}/ ke folder build {year}/{slug}/
        self::syncUploadedMedia($fullData, $destDir);

        // Simpan data.json hanya sebagai cadangan arsip
        file_put_contents($destDir . 'data.json', json_encode($fullData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        // Baca file master template
        $masterIndex = $sourceDir . 'index.html';
        if (!file_exists($masterIndex)) {
            $masterIndex = $sourceDir . 'index.php';
        }

        $content = file_exists($masterIndex) ? file_get_contents($masterIndex) : '';

        // Inject Meta Tags, Minimal Config, dan Cache-Busting
        $renderedHtml = self::injectMetaAndConfig($content, $fullData);

        // Pre-render seluruh elemen teks statis dan elemen dinamis (True Static)
        $renderedHtml = self::preRenderContent($renderedHtml, $fullData);

        // Tulis hasil kompilasi langsung ke index.html saja (Opsi A: Pure Static)
        file_put_contents($destDir . 'index.html', $renderedHtml);
        // Hapus index.php jika ada sisa kompilasi lama agar tidak menimpa index.html
        if (file_exists($destDir . 'index.php')) {
            @unlink($destDir . 'index.php');
        }

        return [
            'success'     => true,
            'slug'        => $slug,
            'year'        => $eventYear,
            'path'        => $destDir,
            'url'         => "/{$eventYear}/{$slug}/",
            'theme'       => $themeName,
            'version'     => $buildVersion,
            'generated_at' => $fullData['generated_at'],
        ];
    }

    /**
     * Injeksi metadata OpenGraph, minimal window.CONFIG, dan cache-busting timestamp.
     * Tidak menyuntikkan window.INVITATION_DATA!
     */
    private static function injectMetaAndConfig(string $html, array $data): string
    {
        $couple = $data['couple'] ?? [];
        $order  = $data['order'] ?? [];
        $events = $data['events'] ?? [];
        $v      = $data['build_version'] ?? date('YmdHis');

        $groomNick = htmlspecialchars($couple['groom_nickname'] ?? $couple['groom_name'] ?? 'Mempelai Pria', ENT_QUOTES, 'UTF-8');
        $brideNick = htmlspecialchars($couple['bride_nickname'] ?? $couple['bride_name'] ?? 'Mempelai Wanita', ENT_QUOTES, 'UTF-8');
        $coupleNames = "{$brideNick} & {$groomNick}";

        // Tentukan domain root URL absolut untuk OpenGraph crawler (WhatsApp, Telegram, FB, dll)
        $domainBase = 'https://invitation.permatawedding.com';
        if (!empty($_SERVER['HTTP_HOST'])) {
            $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'];
            // Deteksi folder subpath lokal jika ada (misal /order-permata)
            $scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
            $subPath = preg_replace('#/(api|admin).*$#', '', $scriptDir);
            $subPath = rtrim(str_replace('\\', '/', $subPath), '/');
            $domainBase = "{$scheme}://{$host}{$subPath}";
        }

        $eventYear = $data['year'] ?? date('Y');
        $slug = $data['slug'] ?? ($couple['slug_url'] ?? '');
        $invitationAbsUrl = rtrim($domainBase, '/') . "/{$eventYear}/{$slug}/";

        // Resolusi og:image menjadi URL absolut penuh
        $coverPhoto = $couple['cover_photo_url'] ?: ($couple['groom_photo_url'] ?: ($couple['bride_photo_url'] ?: 'couple/cover.jpg'));
        if (preg_match('#^https?://#i', $coverPhoto)) {
            $absCoverPhoto = $coverPhoto;
        } else {
            $cleanRelative = ltrim($coverPhoto, '/');
            $absCoverPhoto = rtrim($invitationAbsUrl, '/') . '/' . $cleanRelative;
        }
        $coverPhotoWithVer = $absCoverPhoto . (strpos($absCoverPhoto, '?') !== false ? "&v={$v}" : "?v={$v}");

        $firstEventDate = !empty($events[0]['event_datetime']) ? self::formatTglIndo($events[0]['event_datetime']) : '';
        $title = "The Wedding of {$coupleNames}";
        if ($firstEventDate) {
            $title .= " — {$firstEventDate}";
        }
        $desc = "Undangan Pernikahan {$coupleNames}" . ($firstEventDate ? " pada {$firstEventDate}" : "") . " - Permata Wedding";

        // 1. Ganti Title & Meta OpenGraph (Mendukung crawler WA / Telegram dengan URL absolut murni)
        $html = preg_replace('/<title>(.*?)<\/title>/is', "<title>{$title}</title>", $html);

        // Update atau sisipkan og:title
        $html = preg_replace('/<meta[^>]+(?:property|name)=["\']og:title["\'][^>]*>/is', '<meta property="og:title" id="meta-og-title" content="' . $title . '">', $html, -1, $cOgTitle);
        if ($cOgTitle === 0) {
            $html = preg_replace('/(<title>.*?<\/title>)/is', "$1\n    <meta property=\"og:title\" id=\"meta-og-title\" content=\"{$title}\">", $html);
        }

        // Update atau sisipkan og:description
        $html = preg_replace('/<meta[^>]+(?:property|name)=["\']og:description["\'][^>]*>/is', '<meta property="og:description" id="meta-og-description" content="' . $desc . '">', $html, -1, $cOgDesc);
        if ($cOgDesc === 0) {
            $html = preg_replace('/(<meta property="og:title"[^>]*>)/is', "$1\n    <meta property=\"og:description\" id=\"meta-og-description\" content=\"{$desc}\">", $html);
        }

        // Update atau sisipkan og:image (Wajib Absolut untuk thumbnail WhatsApp/Telegram/FB)
        $html = preg_replace('/<meta[^>]+(?:property|name)=["\']og:image["\'][^>]*>/is', '<meta property="og:image" id="meta-og-image" content="' . $coverPhotoWithVer . '">', $html, -1, $cOgImg);
        if ($cOgImg === 0) {
            $html = preg_replace('/(<meta property="og:title"[^>]*>)/is', "$1\n    <meta property=\"og:image\" id=\"meta-og-image\" content=\"{$coverPhotoWithVer}\">", $html);
        }

        // Update atau sisipkan og:url
        $html = preg_replace('/<meta[^>]+(?:property|name)=["\']og:url["\'][^>]*>/is', '<meta property="og:url" id="meta-og-url" content="' . $invitationAbsUrl . '">', $html, -1, $cOgUrl);
        if ($cOgUrl === 0) {
            $html = preg_replace('/(<meta property="og:title"[^>]*>)/is', "$1\n    <meta property=\"og:url\" id=\"meta-og-url\" content=\"{$invitationAbsUrl}\">", $html);
        }

        // Update atau sisipkan standard description
        $html = preg_replace('/<meta[^>]+name=["\']description["\'][^>]*>/is', '<meta name="description" id="meta-description" content="' . $desc . '">', $html, -1, $cDesc);
        if ($cDesc === 0) {
            $html = preg_replace('/(<title>.*?<\/title>)/is', "$1\n    <meta name=\"description\" id=\"meta-description\" content=\"{$desc}\">", $html);
        }

        // Update atau sisipkan Twitter Card metadata
        $html = preg_replace('/<meta[^>]+name=["\']twitter:title["\'][^>]*>/is', '<meta name="twitter:title" id="meta-twitter-title" content="' . $title . '">', $html, -1, $cTwTitle);
        if ($cTwTitle === 0) {
            $html = preg_replace('/(<meta property="og:url"[^>]*>)/is', "$1\n    <meta name=\"twitter:card\" content=\"summary_large_image\">\n    <meta name=\"twitter:title\" id=\"meta-twitter-title\" content=\"{$title}\">", $html);
        }
        $html = preg_replace('/<meta[^>]+name=["\']twitter:description["\'][^>]*>/is', '<meta name="twitter:description" id="meta-twitter-description" content="' . $desc . '">', $html, -1, $cTwDesc);
        if ($cTwDesc === 0) {
            $html = preg_replace('/(<meta name="twitter:title"[^>]*>)/is', "$1\n    <meta name=\"twitter:description\" id=\"meta-twitter-description\" content=\"{$desc}\">", $html);
        }
        $html = preg_replace('/<meta[^>]+name=["\']twitter:image["\'][^>]*>/is', '<meta name="twitter:image" id="meta-twitter-image" content="' . $coverPhotoWithVer . '">', $html, -1, $cTwImg);
        if ($cTwImg === 0) {
            $html = preg_replace('/(<meta name="twitter:description"[^>]*>)/is', "$1\n    <meta name=\"twitter:image\" id=\"meta-twitter-image\" content=\"{$coverPhotoWithVer}\">", $html);
        }

        // 2. Cache-busting pada pemanggilan script & stylesheet lokal (ganti ?v1, ?v2, dll menjadi ?v=YYYYMMDDHHIISS)
        $html = preg_replace_callback('/(<script[^>]+src=["\'])([^"\']+)(["\'][^>]*>)/i', function($matches) use ($v) {
            $src = $matches[2];
            // Abaikan link CDN luar
            if (preg_match('/^(https?:)?\/\//i', $src) && !preg_match('/permatawedding\.com/i', $src)) {
                return $matches[0];
            }
            $cleanSrc = preg_replace('/\?.*$/', '', $src);
            return $matches[1] . $cleanSrc . '?v=' . $v . $matches[3];
        }, $html);

        $html = preg_replace_callback('/(<link[^>]+rel=["\']stylesheet["\'][^>]+href=["\'])([^"\']+)(["\'][^>]*>)/i', function($matches) use ($v) {
            $href = $matches[2];
            if (preg_match('/^(https?:)?\/\//i', $href) && !preg_match('/permatawedding\.com/i', $href)) {
                return $matches[0];
            }
            $cleanHref = preg_replace('/\?.*$/', '', $href);
            return $matches[1] . $cleanHref . '?v=' . $v . $matches[3];
        }, $html);

        // 3. Sisipkan Minimal Config Saja (ORDER_ID & apiBase untuk RSVP/Komentar + Lightweight View Tracker)
        // apiBase dibuat adaptif: otomatis mendeteksi subpath proyek (misal /order-permata/api di local XAMPP atau /api di production)
        $minimalScript = "\n<script>\n";
        $minimalScript .= "  window.CONFIG = window.CONFIG || {};\n";
        $minimalScript .= "  window.CONFIG.ORDER_ID = '" . ($order['id'] ?? '') . "';\n";
        $minimalScript .= "  (function() {\n";
        $minimalScript .= "    var path = window.location.pathname || '';\n";
        $minimalScript .= "    var m = path.match(/^(\/[^\/]+)?\/(?:20\d\d)\//);\n";
        $minimalScript .= "    var prefix = (m && m[1]) ? m[1] : '';\n";
        $minimalScript .= "    window.CONFIG.apiBase = window.location.origin + prefix + '/api';\n";
        $minimalScript .= "    try {\n";
        $minimalScript .= "      var oid = window.CONFIG.ORDER_ID;\n";
        $minimalScript .= "      if (oid && !sessionStorage.getItem('pw_view_' + oid)) {\n";
        $minimalScript .= "        sessionStorage.setItem('pw_view_' + oid, '1');\n";
        $minimalScript .= "        var vUrl = window.CONFIG.apiBase + '/orders/' + encodeURIComponent(oid) + '/view';\n";
        $minimalScript .= "        if (navigator.sendBeacon) { navigator.sendBeacon(vUrl); } else { fetch(vUrl, { method: 'POST', keepalive: true }).catch(function(){}); }\n";
        $minimalScript .= "      }\n";
        $minimalScript .= "    } catch (_) {}\n";
        $minimalScript .= "  })();\n";
        $minimalScript .= "</script>\n";

        if (stripos($html, '</head>') !== false) {
            $html = str_ireplace('</head>', $minimalScript . '</head>', $html);
        } else {
            $html = $minimalScript . $html;
        }

        return $html;
    }

    /**
     * Lakukan penggantian seluruh teks, nama, tanggal, acara, love story, rekening, dll ke tag HTML.
     */
    private static function preRenderContent(string $html, array $data): string
    {
        $couple         = $data['couple'] ?? [];
        $events         = $data['events'] ?? [];
        $stories        = $data['stories'] ?? [];
        $galleries      = $data['galleries'] ?? [];
        $wallets        = $data['wallets'] ?? [];
        $entertainments = $data['entertainments'] ?? [];
        $music          = $data['music'] ?? null;
        $livestreaming  = $data['livestreaming'] ?? null;

        $gNick = htmlspecialchars($couple['groom_nickname'] ?? $couple['groom_name'] ?? 'Mempelai Pria', ENT_QUOTES, 'UTF-8');
        $bNick = htmlspecialchars($couple['bride_nickname'] ?? $couple['bride_name'] ?? 'Mempelai Wanita', ENT_QUOTES, 'UTF-8');
        $gFull = htmlspecialchars($couple['groom_name'] ?? '', ENT_QUOTES, 'UTF-8');
        $bFull = htmlspecialchars($couple['bride_name'] ?? '', ENT_QUOTES, 'UTF-8');
        $coupleNames = "{$bNick} &amp; {$gNick}";

        // --- A. MEMPELAI & MONOGRAM ---
        $html = self::replaceElementContent($html, 'id="desktop-names"', $coupleNames);
        $html = self::replaceElementContent($html, 'id="cover-bride"', $bNick);
        $html = self::replaceElementContent($html, 'id="cover-groom"', $gNick);
        $html = self::replaceElementContent($html, 'id="hero-bride"', $bNick);
        $html = self::replaceElementContent($html, 'id="hero-groom"', $gNick);
        $html = self::replaceElementContent($html, 'id="name-bride"', $bNick);
        $html = self::replaceElementContent($html, 'id="name-groom"', $gNick);
        $html = self::replaceElementContent($html, 'id="bride-full"', $bFull);
        $html = self::replaceElementContent($html, 'id="groom-full"', $gFull);
        $html = self::replaceElementContent($html, 'id="closing-couple"', "{$bNick} &amp; {$gNick}");

        // Inisial
        $initB = strtoupper(mb_substr($bNick, 0, 1));
        $initG = strtoupper(mb_substr($gNick, 0, 1));
        $html = self::replaceElementContent($html, 'id="cover-initials-bride"', $initB);
        $html = self::replaceElementContent($html, 'id="cover-initials-groom"', $initG);
        $html = self::replaceElementContent($html, 'id="cover-initials"', "{$initB} &amp; {$initG}");
        $html = self::replaceElementContent($html, 'id="cover-monogram"', "{$initB} &amp; {$initG}");

        // Orang Tua
        if (!empty($couple['bride_father'])) {
            $html = self::replaceElementContent($html, 'id="bride-father"', htmlspecialchars($couple['bride_father']));
        }
        if (!empty($couple['bride_mother'])) {
            $html = self::replaceElementContent($html, 'id="bride-mother"', htmlspecialchars($couple['bride_mother']));
        }
        if (!empty($couple['groom_father'])) {
            $html = self::replaceElementContent($html, 'id="groom-father"', htmlspecialchars($couple['groom_father']));
        }
        if (!empty($couple['groom_mother'])) {
            $html = self::replaceElementContent($html, 'id="groom-mother"', htmlspecialchars($couple['groom_mother']));
        }

        // Alamat Mempelai
        if (!empty($couple['bride_address'])) {
            $html = self::replaceElementContent($html, 'id="bride-address"', htmlspecialchars($couple['bride_address']));
        }
        if (!empty($couple['groom_address'])) {
            $html = self::replaceElementContent($html, 'id="groom-address"', htmlspecialchars($couple['groom_address']));
        }

        // Foto Mempelai
        if (!empty($couple['bride_photo_url'])) {
            $html = preg_replace('/id="bride-photo"[^>]*src="[^"]*"/is', 'id="bride-photo" src="' . $couple['bride_photo_url'] . '"', $html);
        }
        if (!empty($couple['groom_photo_url'])) {
            $html = preg_replace('/id="groom-photo"[^>]*src="[^"]*"/is', 'id="groom-photo" src="' . $couple['groom_photo_url'] . '"', $html);
        }

        // --- B. TANGGAL COVER & PENUTUP ---
        if (!empty($events[0]['event_datetime'])) {
            $coverDate = self::formatTglCover($events[0]['event_datetime']);
            $fullDate  = self::formatTglIndo($events[0]['event_datetime']);

            $html = self::replaceElementContent($html, 'data-key="cover-date"', $coverDate);
            $html = self::replaceElementContent($html, 'id="cover-date"', $coverDate);
            $html = self::replaceElementContent($html, 'id="closing-date"', $fullDate);
            $html = self::replaceElementContent($html, 'id="current-year"', date('Y'));

            // Set ISO Date target di atribut data countdown jika ada
            $isoDate = date('c', strtotime($events[0]['event_datetime']));
            $html = preg_replace('/id="countdown"[^>]*data-target="[^"]*"/is', 'id="countdown" data-target="' . $isoDate . '"', $html);
        }

        // --- C. DETAIL ACARA (EVENTS LOOP & BLUEPRINT CLONING) ---
        $eventCount = count($events);
        if ($eventCount > 0) {
            // Blueprint cloning jika jumlah acara DB melebihi slot template
            if (preg_match_all('/data-key="event-(\d+)-date"/i', $html, $evMatches)) {
                $maxEvIdx = max(array_map('intval', $evMatches[1]));
                $existingEvCount = $maxEvIdx + 1;
                if ($eventCount > $existingEvCount) {
                    $evPatterns = [
                        '/<div class="events-grid"[^>]*>(?:(?!<div class="events-grid").)*?data-key="event-' . $maxEvIdx . '-date".*?<\/a>\s*<\/div>\s*<\/div>/is',
                        '/<div class="event-card"[^>]*>(?:(?!<div class="event-card").)*?data-key="event-' . $maxEvIdx . '-date".*?<\/div>/is',
                        '/<div[^>]*>(?:(?!<div).)*?data-key="event-' . $maxEvIdx . '-date".*?<\/a>\s*<\/div>/is',
                    ];
                    $evBlueprint = '';
                    foreach ($evPatterns as $evPat) {
                        if (preg_match($evPat, $html, $m)) {
                            $evBlueprint = $m[0];
                            break;
                        }
                    }
                    if ($evBlueprint) {
                        $evClones = '';
                        for ($eK = $existingEvCount; $eK < $eventCount; $eK++) {
                            $clonedBlock = preg_replace('/event-' . $maxEvIdx . '-/i', 'event-' . $eK . '-', $evBlueprint);
                            $evClones .= "\n" . $clonedBlock;
                        }
                        $html = str_replace($evBlueprint, $evBlueprint . $evClones, $html);
                    }
                }
            }

            foreach ($events as $idx => $ev) {
                $tgl = self::formatTglIndo($ev['event_datetime']);
                $jamMulai = date('H.i', strtotime($ev['event_datetime'])) . ' WIB';
                $jamAkhir = !empty($ev['event_end']) ? date('H.i', strtotime($ev['event_end'])) . ' WIB' : 'Selesai';
                $waktu = "{$jamMulai} - {$jamAkhir}";

                $venue = htmlspecialchars($ev['venue_name'] ?? '');
                $alamat = htmlspecialchars($ev['venue_address'] ?? '');

                $html = self::replaceElementContent($html, 'data-key="event-' . $idx . '-date"', $tgl);
                $html = self::replaceElementContent($html, 'data-key="event-' . $idx . '-time"', $waktu);
                $html = self::replaceElementContent($html, 'data-key="event-' . $idx . '-venue"', $venue);
                $html = self::replaceElementContent($html, 'data-key="event-' . $idx . '-address"', $alamat);

                if (!empty($ev['google_maps_url'])) {
                    $mapsUrl = htmlspecialchars($ev['google_maps_url']);
                    $html = preg_replace('/(data-key="event-' . $idx . '-maps"[^>]*href=")[^"]*(")/is', '$1' . $mapsUrl . '$2', $html);
                    $html = preg_replace('/(href=")[^"]*("[^>]*data-key="event-' . $idx . '-maps")/is', '$1' . $mapsUrl . '$2', $html);
                }
            }
        } else {
            // Sembunyikan section acara jika 0 acara
            $html = self::hideSectionAndNav($html, ['acara', 'events', 'event']);
        }

        // Hiburan
        if (!empty($entertainments)) {
            foreach ($entertainments as $eIdx => $ent) {
                $entLabel = "Hiburan: " . htmlspecialchars(trim(($ent['type'] ?? '') . ' ' . ($ent['name'] ?? '')));
                $html = self::replaceElementContent($html, 'data-key="event-' . $eIdx . '-entertainment"', $entLabel);
            }
        } else {
            // Jika tidak ada hiburan, sembunyikan baris hiburan agar tidak menampilkan dummy
            $html = preg_replace('/<li[^>]*>\s*<i class="fas fa-music"><\/i>\s*<span data-key="event-\d+-entertainment">.*?<\/span>\s*<\/li>/is', '', $html);
        }

        // --- D. LOVE STORIES (LOOP & BLUEPRINT CLONING) ---
        if (!empty($stories)) {
            $storyCount = count($stories);

            // 1. Blueprint Cloning jika data DB melebihi slot template
            if (preg_match_all('/data-key="story-(\d+)-label"/i', $html, $stMatches)) {
                $maxStIdx = max(array_map('intval', $stMatches[1]));
                $existingStCount = $maxStIdx + 1;
                if ($storyCount > $existingStCount) {
                    $stBlueprint = self::extractOuterContainerByMarker($html, 'data-key="story-' . $maxStIdx . '-label"');
                    if (!$stBlueprint) {
                        $stPatterns = [
                            '/<div class="timeline-item"[^>]*>(?:(?!<div class="timeline-item").)*?data-key="story-' . $maxStIdx . '-[^"]*".*?<\/div>\s*<\/div>/is',
                            '/<div class="story-card"[^>]*>(?:(?!<div class="story-card").)*?data-key="story-' . $maxStIdx . '-[^"]*".*?<\/div>/is',
                            '/<div[^>]*data-aos=[^>]*>(?:(?!<div[^>]*data-aos=).)*?data-key="story-' . $maxStIdx . '-[^"]*".*?<\/div>\s*<\/div>/is',
                        ];
                        foreach ($stPatterns as $stPat) {
                            if (preg_match($stPat, $html, $m)) {
                                $stBlueprint = $m[0];
                                break;
                            }
                        }
                    }
                    if ($stBlueprint) {
                        $stClones = '';
                        for ($sK = $existingStCount; $sK < $storyCount; $sK++) {
                            $clonedBlock = preg_replace('/story-' . $maxStIdx . '-/i', 'story-' . $sK . '-', $stBlueprint);
                            $stClones .= "\n    " . $clonedBlock;
                        }
                        $html = str_replace($stBlueprint, $stBlueprint . $stClones, $html);
                    }
                }
            }

            // 2. Isi konten cerita
            foreach ($stories as $sIdx => $st) {
                $label = !empty($st['story_date']) ? self::formatTglIndo($st['story_date']) : htmlspecialchars($st['title'] ?? '');
                $title = htmlspecialchars($st['title'] ?? '');
                $desc  = htmlspecialchars($st['content'] ?? '');

                $html = self::replaceElementContent($html, 'data-key="story-' . $sIdx . '-label"', $label);
                $html = self::replaceElementContent($html, 'data-key="story-' . $sIdx . '-title"', $title);
                $html = self::replaceElementContent($html, 'data-key="story-' . $sIdx . '-content"', $desc);
            }

            // 3. Sembunyikan item timeline yang berlebih jika template memiliki slot lebih banyak daripada DB
            for ($k = $storyCount; $k <= 10; $k++) {
                $targetStory = self::extractOuterContainerByMarker($html, 'data-key="story-' . $k . '-label"');
                if ($targetStory) {
                    $html = str_replace($targetStory, '', $html);
                } else {
                    $html = preg_replace('/<div class="timeline-item"[^>]*>(?:(?!<div class="timeline-item").)*?data-key="story-' . $k . '-label".*?<\/div>\s*<\/div>/is', '', $html);
                    $html = preg_replace('/<div class="story-card"[^>]*>(?:(?!<div class="story-card").)*?data-key="story-' . $k . '-label".*?<\/div>/is', '', $html);
                }
            }
        } else {
            // Sembunyikan section love story jika pengantin tidak mengisi cerita
            $html = self::hideSectionAndNav($html, ['love-story', 'story', 'section-story']);
        }

        // --- E. GALERI FOTO (LOOP & AUTO-HIDE) ---
        if (!empty($galleries)) {
            $galleryCount = count($galleries);
            $coupleTitle = htmlspecialchars(($couple['groom_nickname'] ?? $couple['groom_name'] ?? '') . ' & ' . ($couple['bride_nickname'] ?? $couple['bride_name'] ?? ''));

            // 1. Template Javanese: .gallery-grid
            if (preg_match('/(<div class="gallery-grid"[^>]*>)(.*?)(<\/div>\s*<\/section>)/is', $html, $mGrid)) {
                $gridItems = '';
                foreach ($galleries as $gIdx => $g) {
                    $pUrl = htmlspecialchars($g['photo_url'] ?? '');
                    $cap = htmlspecialchars($g['caption'] ?? $coupleTitle);
                    $wideClass = ($gIdx === 0) ? ' gallery-item--wide' : '';
                    $delay = ($gIdx * 20);
                    $gridItems .= "\n          <a href=\"{$pUrl}\" data-lightbox=\"wedding\" data-title=\"{$cap}\" class=\"gallery-item{$wideClass}\" data-aos=\"zoom-in\" data-aos-delay=\"{$delay}\">\n"
                               . "            <img src=\"{$pUrl}\" alt=\"{$cap}\" loading=\"lazy\" />\n"
                               . "            <div class=\"gallery-overlay\"><i class=\"fas fa-search-plus\"></i></div>\n"
                               . "          </a>";
                }
                $gridItems .= "\n        ";
                $html = preg_replace('/(<div class="gallery-grid"[^>]*>)(.*?)(<\/div>\s*<\/section>)/is', '${1}' . $gridItems . '${3}', $html, 1);
            }

            // 2. Template Pink Elegance: .swiper-wrapper di dalam #gallery
            if (preg_match('/(<section[^>]*id="gallery"[^>]*>.*?<div class="swiper-wrapper"[^>]*>)(.*?)(<\/div>.*?<\/section>)/is', $html, $mSwiper)) {
                $slides = '';
                foreach ($galleries as $gIdx => $g) {
                    $pUrl = htmlspecialchars($g['photo_url'] ?? '');
                    $cap = htmlspecialchars($g['caption'] ?? ('Gallery image ' . ($gIdx + 1)));
                    $slides .= "\n              <div class=\"swiper-slide\"><img src=\"{$pUrl}\" alt=\"{$cap}\" /></div>";
                }
                $slides .= "\n            ";
                $html = preg_replace('/(<section[^>]*id="gallery"[^>]*>.*?<div class="swiper-wrapper"[^>]*>).*?(<\/div>.*?<\/section>)/is', '${1}' . $slides . '${3}', $html, 1);
            }

            // 3. Template Sakura Zen: #gallery-container
            if (preg_match('/<div[^>]*id="gallery-container"[^>]*>(.*?)<\/div>/is', $html, $mZen)) {
                $zenItems = '';
                foreach ($galleries as $gIdx => $g) {
                    $pUrl = htmlspecialchars($g['photo_url'] ?? '');
                    $cap = htmlspecialchars($g['caption'] ?? ('Galeri ' . ($gIdx + 1)));
                    $zenItems .= "\n              <a href=\"{$pUrl}\" data-lightbox=\"jp-gallery\" data-title=\"{$cap}\" class=\"jpg-item\">\n"
                              . "                <div class=\"jpg-inner\">\n"
                              . "                  <img src=\"{$pUrl}\" alt=\"{$cap}\" loading=\"lazy\" />\n"
                              . "                </div>\n"
                              . "              </a>";
                }
                $zenItems .= "\n            ";
                $html = preg_replace('/(<div[^>]*id="gallery-container"[^>]*>).*?(<\/div>)/is', '${1}' . $zenItems . '${2}', $html, 1);
            }
        } else {
            // Sembunyikan section gallery jika 0 foto di DB dan kosongkan isinya agar browser tidak memuat dummy images
            $html = preg_replace('/(<div class="gallery-grid"[^>]*>)(.*?)(<\/div>\s*<\/section>)/is', '${1}<!-- no gallery items -->${3}', $html);
            $html = preg_replace('/(<div[^>]*id="gallery-container"[^>]*>)(.*?)(<\/div>\s*<\/div>\s*<\/section>)/is', '${1}<!-- no gallery items -->${3}', $html);
            $html = preg_replace('/(<div class="swiper-wrapper"[^>]*>)(.*?)(<\/div>)/is', '${1}<!-- no gallery items -->${3}', $html);
            $html = self::hideSectionAndNav($html, ['gallery', 'galeri', 'section-gallery', 'gallery-section']);
        }

        // --- F. AMPLOP DIGITAL & REKENING (LOOP & BLUEPRINT CLONING) ---
        if (!empty($wallets)) {
            $walletCount = count($wallets);

            // 1. Blueprint Cloning jika rekening DB melebihi slot template
            if (preg_match_all('/data-key="wallet-(\d+)-bank"/i', $html, $wlMatches)) {
                $maxWlIdx = max(array_map('intval', $wlMatches[1]));
                $existingWlCount = $maxWlIdx + 1;
                if ($walletCount > $existingWlCount) {
                    $wlBlueprint = self::extractOuterContainerByMarker($html, 'data-key="wallet-' . $maxWlIdx . '-bank"');
                    if (!$wlBlueprint) {
                        $wlPatterns = [
                            '/<div class="amplop-card"[^>]*>(?:(?!<div class="amplop-card").)*?data-key="wallet-' . $maxWlIdx . '-bank".*?<\/div>/is',
                            '/<div class="wallet-card"[^>]*>(?:(?!<div class="wallet-card").)*?data-key="wallet-' . $maxWlIdx . '-bank".*?<\/div>/is',
                            '/<div[^>]*>(?:(?!<div).)*?data-key="wallet-' . $maxWlIdx . '-bank".*?<\/button>\s*<\/div>/is',
                        ];
                        foreach ($wlPatterns as $wlPat) {
                            if (preg_match($wlPat, $html, $m)) {
                                $wlBlueprint = $m[0];
                                break;
                            }
                        }
                    }
                    if ($wlBlueprint) {
                        $wlClones = '';
                        for ($wK = $existingWlCount; $wK < $walletCount; $wK++) {
                            $clonedBlock = preg_replace('/wallet-' . $maxWlIdx . '-/i', 'wallet-' . $wK . '-', $wlBlueprint);
                            $wlClones .= "\n    " . $clonedBlock;
                        }
                        $html = str_replace($wlBlueprint, $wlBlueprint . $wlClones, $html);
                    }
                }
            }

            // 2. Isi konten rekening
            foreach ($wallets as $wIdx => $w) {
                $bank = htmlspecialchars($w['bank_name'] ?? $w['wallet_type'] ?? 'Bank');
                $norek = htmlspecialchars($w['account_number'] ?? '');
                $an   = htmlspecialchars($w['account_holder'] ?? '');

                $html = self::replaceElementContent($html, 'data-key="wallet-' . $wIdx . '-bank"', $bank);
                $html = self::replaceElementContent($html, 'data-key="wallet-' . $wIdx . '-number"', $norek);
                $html = self::replaceElementContent($html, 'data-key="wallet-' . $wIdx . '-holder"', "a.n. {$an}");
                $html = preg_replace('/data-key="wallet-' . $wIdx . '-copy"[^>]*data-copy="[^"]*"/is', 'data-key="wallet-' . $wIdx . '-copy" data-copy="' . $norek . '"', $html);
            }

            // 3. Hapus kartu rekening yang tidak terpakai jika data DB lebih sedikit dari slot template
            for ($w = $walletCount; $w <= 10; $w++) {
                $html = preg_replace('/<div class="amplop-card"[^>]*>(?:(?!<div class="amplop-card").)*?data-key="wallet-' . $w . '-bank".*?<\/button>\s*<\/div>/is', '', $html);
                $html = preg_replace('/<div class="wallet-card"[^>]*>(?:(?!<div class="wallet-card").)*?data-key="wallet-' . $w . '-bank".*?<\/button>\s*<\/div>/is', '', $html);
            }
        } else {
            // Sembunyikan section amplop jika 0 rekening
            $html = self::hideSectionAndNav($html, ['amplop', 'gift', 'wallet', 'section-gift', 'gift-section']);
        }

        // --- G. KADO FISIK ---
        $giftRecipient = htmlspecialchars($couple['bride_name'] ?? $couple['groom_name'] ?? '', ENT_QUOTES, 'UTF-8');
        $giftAddress   = htmlspecialchars($couple['bride_address'] ?? $couple['groom_address'] ?? '', ENT_QUOTES, 'UTF-8');

        if ($giftAddress) {
            $html = self::replaceElementContent($html, 'id="gift-recipient"', $giftRecipient);
            $html = self::replaceElementContent($html, 'id="gift-address"', $giftAddress);
            $html = preg_replace('/id="gift-copy-btn"[^>]*data-copy="[^"]*"/is', 'id="gift-copy-btn" data-copy="' . $giftAddress . '"', $html);
        } else {
            // Sembunyikan kartu kirim kado jika alamat kado kosong
            $html = preg_replace('/<div[^>]*class="[^"]*card-gift[^"]*"[^>]*>.*?<\/div>/is', '', $html);
        }

        // --- H. AUDIO MUSIK ---
        if (!empty($music['audio_url'])) {
            $rawAudioUrl = trim($music['audio_url']);
            // Jika path adalah format lokal cdn/uploads/music/..., sesuaikan path relatif dari folder undangan tamu (misal 2026/nama-tamu/ butuh ../../)
            if (preg_match('/^(cdn\/uploads\/[^\s]+)/i', $rawAudioUrl, $mMatch)) {
                $audioUrl = '../../' . $mMatch[1];
            } else {
                $audioUrl = $rawAudioUrl;
            }
            $safeAudioUrl = htmlspecialchars($audioUrl, ENT_QUOTES, 'UTF-8');

            // Ganti pada tag audio src="..." langsung jika ada
            if (preg_match('/<audio id="bg-music"[^>]*src="/is', $html)) {
                $html = preg_replace('/(<audio id="bg-music"[^>]*src=")[^"]*(")/is', '$1' . $safeAudioUrl . '$2', $html);
            } elseif (preg_match('/<audio id="bg-music"[^>]*>(\s*<source[^>]*src=")[^"]*(")/is', $html)) {
                // Ganti pada tag <source src="..."> di dalam <audio id="bg-music">
                $html = preg_replace('/(<audio id="bg-music"[^>]*>\s*<source[^>]*src=")[^"]*(")/is', '$1' . $safeAudioUrl . '$2', $html);
            } else {
                // Jika tag <audio id="bg-music"></audio> belum memiliki src atau source
                $html = preg_replace('/(<audio id="bg-music"[^>]*)(>)/is', '$1 src="' . $safeAudioUrl . '"$2', $html);
            }
        }

        // --- I. LIVE STREAMING (INJECTION & AUTO-HIDE) ---
        if (!empty($livestreaming['youtube_url'])) {
            $streamUrl = htmlspecialchars($livestreaming['youtube_url']);
            $streamTitle = htmlspecialchars($livestreaming['title'] ?? 'Siaran Langsung Pernikahan');

            // Cek apakah template sudah punya elemen live streaming
            $hasStreamTag = (stripos($html, 'data-key="stream-0-url"') !== false || stripos($html, 'id="live-link"') !== false);

            if ($hasStreamTag) {
                $html = preg_replace('/(data-key="stream-0-url"[^>]*href=")[^"]*(")/is', '$1' . $streamUrl . '$2', $html);
                $html = preg_replace('/(href=")[^"]*("[^>]*data-key="stream-0-url")/is', '$1' . $streamUrl . '$2', $html);
                $html = preg_replace('/(id="live-link"[^>]*href=")[^"]*(")/is', '$1' . $streamUrl . '$2', $html);
                $html = preg_replace('/(href=")[^"]*("[^>]*id="live-link")/is', '$1' . $streamUrl . '$2', $html);

                // Tampilkan section live jika sebelumnya disembunyikan
                $html = preg_replace('/(<section[^>]*id="livestreaming"[^>]*style="[^"]*display:\s*none;?[^"]*")/is', 'id="livestreaming"', $html);
                $html = preg_replace('/(<section[^>]*id="live-section"[^>]*style="[^"]*display:\s*none;?[^"]*")/is', 'id="live-section"', $html);
                $html = preg_replace('/(<article[^>]*class="section-stream"[^>]*style="[^"]*display:\s*none;?[^"]*")/is', 'class="section-stream"', $html);
                $html = self::replaceElementContent($html, 'id="live-title"', $streamTitle);
            } else {
                // Fallback Injection: jika tema tidak memiliki section live streaming, sisipkan sebelum RSVP
                $liveSectionHtml = "\n    <!-- INJECTED LIVE STREAMING -->\n";
                $liveSectionHtml .= "    <section id=\"livestreaming\" class=\"section section-stream\" style=\"padding: 50px 20px; text-align: center;\">\n";
                $liveSectionHtml .= "      <div style=\"max-width: 500px; margin: 0 auto; background: rgba(255,255,255,0.9); border: 2px solid #C5A55A; border-radius: 16px; padding: 30px 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.08);\">\n";
                $liveSectionHtml .= "        <div style=\"font-size: 2.5rem; color: #ff0000; margin-bottom: 15px;\"><i class=\"fab fa-youtube\"></i></div>\n";
                $liveSectionHtml .= "        <h3 style=\"font-size: 1.3rem; margin-bottom: 10px;\">" . $streamTitle . "</h3>\n";
                $liveSectionHtml .= "        <p style=\"font-size: 0.9rem; margin-bottom: 20px;\">Temui kami secara virtual dalam momen sakral bahagia ini.</p>\n";
                $liveSectionHtml .= "        <a data-key=\"stream-0-url\" id=\"live-link\" href=\"" . $streamUrl . "\" target=\"_blank\" rel=\"noopener noreferrer\" style=\"display: inline-block; background: #C5A55A; color: #fff; padding: 12px 28px; border-radius: 30px; text-decoration: none; font-weight: 600;\"><i class=\"fab fa-youtube\"></i> Tonton Live Streaming</a>\n";
                $liveSectionHtml .= "      </div>\n";
                $liveSectionHtml .= "    </section>\n";

                if (stripos($html, '<section id="rsvp"') !== false) {
                    $html = str_ireplace('<section id="rsvp"', $liveSectionHtml . "\n    <section id=\"rsvp\"", $html);
                } elseif (stripos($html, '<section id="amplop"') !== false) {
                    $html = str_ireplace('<section id="amplop"', $liveSectionHtml . "\n    <section id=\"amplop\"", $html);
                }
            }
        } else {
            // Sembunyikan jika tidak ada live streaming
            $html = self::hideSectionAndNav($html, ['livestreaming', 'live-section', 'section-stream', 'stream']);
        }

        return $html;
    }

    /**
     * Sembunyikan section (<section>, <article>, <div>) beserta item nav navigasi terkait.
     */
    private static function hideSectionAndNav(string $html, array $identifiers): string
    {
        foreach ($identifiers as $id) {
            $escaped = preg_quote($id, '/');

            // 1. Sembunyikan tag section / article / div dengan id="$id"
            $html = preg_replace('/<section[^>]*id=["\']' . $escaped . '["\'][^>]*>/is', '<section id="' . $id . '" style="display:none;">', $html);
            $html = preg_replace('/<article[^>]*id=["\']' . $escaped . '["\'][^>]*>/is', '<article id="' . $id . '" style="display:none;">', $html);

            // 2. Sembunyikan jika berupa class="... section-xxx ..."
            $html = preg_replace('/<section([^>]*class=["\'][^"\']*' . $escaped . '[^"\']*["\'][^>]*)>/is', '<section$1 style="display:none;">', $html);
            $html = preg_replace('/<article([^>]*class=["\'][^"\']*' . $escaped . '[^"\']*["\'][^>]*)>/is', '<article$1 style="display:none;">', $html);

            // 3. Hapus atau sembunyikan link / menu nav yang mengarah ke #id (misal <a href="#gallery"...> atau data-section="gallery")
            $html = preg_replace('/<a[^>]*href=["\']#' . $escaped . '["\'][^>]*>.*?<\/a>/is', '', $html);
            $html = preg_replace('/<a[^>]*data-section=["\']' . $escaped . '["\'][^>]*>.*?<\/a>/is', '', $html);

            // 4. Jika ada wrapper pembungkus nav item (misal <div class="col-3 nav-item"><a href="#events"...></div>)
            $html = preg_replace('/<div[^>]*class=["\'][^"\']*nav-item[^"\']*["\'][^>]*>\s*<\/div>/is', '', $html);
        }

        return $html;
    }

    /**
     * Helper untuk mengganti isi konten di dalam tag elemen dengan atribut tertentu.
     * Backreference: ${1} tag pembuka, ${4} tag penutup.
     */
    private static function replaceElementContent(string $html, string $attributePattern, string $newContent): string
    {
        $escapedAttr = preg_quote($attributePattern, '/');
        $pattern = '/(<([a-z0-9]+)[^>]*?' . $escapedAttr . '[^>]*?>)(.*?)(<\/\2>)/is';

        return preg_replace($pattern, '${1}' . $newContent . '${4}', $html);
    }

    /**
     * Format tanggal Indonesia (contoh: Minggu, 29 November 2026).
     */
    private static function formatTglIndo(string $datetime): string
    {
        $time = strtotime($datetime);
        if (!$time) return $datetime;

        $hari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        $bulan = [
            1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        $namaHari = $hari[(int)date('w', $time)];
        $tgl = date('j', $time);
        $bln = $bulan[(int)date('n', $time)];
        $thn = date('Y', $time);

        return "{$namaHari}, {$tgl} {$bln} {$thn}";
    }

    /**
     * Format tanggal cover (contoh: 29 November 2026).
     */
    private static function formatTglCover(string $datetime): string
    {
        $time = strtotime($datetime);
        if (!$time) return $datetime;

        $bulan = [
            1 => 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];

        $tgl = date('j', $time);
        $bln = $bulan[(int)date('n', $time)];
        $thn = date('Y', $time);

        return "{$tgl} {$bln} {$thn}";
    }

    /**
     * Bersihkan aset tema lama saat pergantian tema atau re-compile,
     * tetapi pertahankan data media yang sudah disinkronkan (couple, gallery).
     */
    private static function cleanThemeAssets(string $dir): void
    {
        if (!is_dir($dir)) return;
        $preserve = ['couple', 'gallery', 'data.json'];

        $items = scandir($dir);
        if (!$items) return;

        foreach ($items as $item) {
            if ($item === '.' || $item === '..' || in_array(strtolower($item), $preserve, true)) {
                continue;
            }
            $target = $dir . $item;
            if (is_dir($target)) {
                self::deleteDirectoryRecursive($target);
            } else {
                @unlink($target);
            }
        }
    }

    private static function deleteDirectoryRecursive(string $dir): void
    {
        if (!is_dir($dir)) return;
        $items = scandir($dir);
        if (!$items) return;

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') continue;
            $path = $dir . '/' . $item;
            if (is_dir($path)) {
                self::deleteDirectoryRecursive($path);
            } else {
                @unlink($path);
            }
        }
        @rmdir($dir);
    }

    /**
     * Salin direktori aset tema secara rekursif (melewati file index).
     */
    private static function copyAssets(string $src, string $dst): void
    {
        $dir = opendir($src);
        if (!$dir) return;

        @mkdir($dst, 0755, true);

        while (($file = readdir($dir)) !== false) {
            if ($file === '.' || $file === '..') continue;

            $srcFile = $src . $file;
            $dstFile = $dst . $file;

            if (is_dir($srcFile)) {
                self::copyAssets($srcFile . '/', $dstFile . '/');
            } else {
                // Jangan timpa file index jika sudah ada
                if (in_array(strtolower($file), ['index.html', 'index.php'], true) && file_exists($dstFile)) {
                    continue;
                }
                copy($srcFile, $dstFile);
            }
        }
        closedir($dir);
    }

    /**
     * Sinkronisasi media unggahan pengantin dari uploads/{slug}/ ke dalam {year}/{slug}/
     * agar folder undangan mandiri (self-contained) dan menggunakan path relatif lokal.
     */
    private static function syncUploadedMedia(array &$fullData, string $destDir): void
    {
        $couple = &$fullData['couple'];
        $galleries = &$fullData['galleries'];
        $stories = &$fullData['stories'];
        $wallets = &$fullData['wallets'];

        // Pastikan subfolder tujuan siap
        $coupleDest = $destDir . 'couple/';
        $galleryDest = $destDir . 'gallery/';
        $storyDest = $destDir . 'love-stories/';
        $qrDest = $destDir . 'qrcode/';

        if (!is_dir($coupleDest))  @mkdir($coupleDest, 0755, true);
        if (!is_dir($galleryDest)) @mkdir($galleryDest, 0755, true);
        if (!is_dir($storyDest))   @mkdir($storyDest, 0755, true);
        if (!is_dir($qrDest))      @mkdir($qrDest, 0755, true);

        // 1. Cover Photo
        if (!empty($couple['cover_photo_url'])) {
            $local = self::resolveLocalUploadPath($couple['cover_photo_url']);
            if ($local && file_exists($local)) {
                $ext = pathinfo($local, PATHINFO_EXTENSION) ?: 'jpg';
                $destFile = "cover.{$ext}";
                copy($local, $coupleDest . $destFile);
                $couple['cover_photo_url'] = "couple/{$destFile}";
            }
        }

        // 2. Groom Photo
        if (!empty($couple['groom_photo_url'])) {
            $local = self::resolveLocalUploadPath($couple['groom_photo_url']);
            if ($local && file_exists($local)) {
                $ext = pathinfo($local, PATHINFO_EXTENSION) ?: 'jpg';
                $destFile = "mempelai-pria.{$ext}";
                copy($local, $coupleDest . $destFile);
                $couple['groom_photo_url'] = "couple/{$destFile}";
            }
        }

        // 3. Bride Photo
        if (!empty($couple['bride_photo_url'])) {
            $local = self::resolveLocalUploadPath($couple['bride_photo_url']);
            if ($local && file_exists($local)) {
                $ext = pathinfo($local, PATHINFO_EXTENSION) ?: 'jpg';
                $destFile = "mempelai-wanita.{$ext}";
                copy($local, $coupleDest . $destFile);
                $couple['bride_photo_url'] = "couple/{$destFile}";
            }
        }

        // 4. Gallery Photos
        if (!empty($galleries)) {
            foreach ($galleries as $idx => &$item) {
                if (!empty($item['photo_url'])) {
                    $local = self::resolveLocalUploadPath($item['photo_url']);
                    if ($local && file_exists($local)) {
                        $ext = pathinfo($local, PATHINFO_EXTENSION) ?: 'jpg';
                        $baseName = basename(parse_url($item['photo_url'], PHP_URL_PATH));
                        // Gunakan nama file asli atau standar galeri-{n}
                        $destFilename = !empty($baseName) ? $baseName : 'galeri-' . ($idx + 1) . '.' . $ext;
                        copy($local, $galleryDest . $destFilename);
                        $item['photo_url'] = "gallery/{$destFilename}";
                    }
                }
            }
            unset($item);
        }

        // 5. Love Stories Photos (jika ada)
        if (!empty($stories)) {
            foreach ($stories as $idx => &$st) {
                if (!empty($st['photo_url'])) {
                    $local = self::resolveLocalUploadPath($st['photo_url']);
                    if ($local && file_exists($local)) {
                        $baseName = basename(parse_url($st['photo_url'], PHP_URL_PATH));
                        copy($local, $storyDest . $baseName);
                        $st['photo_url'] = "love-stories/{$baseName}";
                    }
                }
            }
            unset($st);
        }

        // 6. QR Code Wallets (jika ada)
        if (!empty($wallets)) {
            foreach ($wallets as $idx => &$w) {
                if (!empty($w['qr_code_url'])) {
                    $local = self::resolveLocalUploadPath($w['qr_code_url']);
                    if ($local && file_exists($local)) {
                        $baseName = basename(parse_url($w['qr_code_url'], PHP_URL_PATH));
                        copy($local, $qrDest . $baseName);
                        $w['qr_code_url'] = "qrcode/{$baseName}";
                    }
                }
            }
            unset($w);
        }
    }

    /**
     * Resolusi URL gambar di database ke file fisik di disk server.
     */
    private static function resolveLocalUploadPath(string $url): ?string
    {
        $parsedPath = parse_url($url, PHP_URL_PATH);
        if (!$parsedPath) return null;
        $parsedPath = str_replace('\\', '/', $parsedPath);

        // Hapus subpath aplikasi (misal /order-permata/uploads/ -> /uploads/)
        $clean = preg_replace('#^/[^/]+/uploads/#', '/uploads/', $parsedPath);

        if (str_starts_with($clean, '/uploads/')) {
            $real = self::$rootDir . ltrim($clean, '/');
            if (file_exists($real)) {
                return $real;
            }
        }

        $rel = self::$rootDir . ltrim($clean, '/');
        if (file_exists($rel)) {
            return $rel;
        }

        return null;
    }

    private static function extractOuterContainerByMarker(string $html, string $marker, string $containerTag = 'div'): ?string
    {
        $pos = strpos($html, $marker);
        if ($pos === false) return null;

        $searchPos = $pos;
        $fallbackCandidate = null;
        while ($searchPos > 0) {
            $tagPos = strrpos(substr($html, 0, $searchPos), '<' . $containerTag);
            if ($tagPos === false) break;

            $tagHeaderEnd = strpos($html, '>', $tagPos);
            if ($tagHeaderEnd !== false) {
                $tagHeader = substr($html, $tagPos, $tagHeaderEnd - $tagPos + 1);
                if (preg_match('/\b(amplop-card|wallet-card)\b/i', $tagHeader)) {
                    return self::extractBalancedTag($html, $tagPos, $containerTag);
                }
                if (preg_match('/\b(col-[a-z0-9-]+)\b/i', $tagHeader) && strpos($tagHeader, 'wallet') !== false) {
                    return self::extractBalancedTag($html, $tagPos, $containerTag);
                }
                if ($fallbackCandidate === null && preg_match('/\b(account-info|wallet-info|gift-card|card)\b/i', $tagHeader)) {
                    $fallbackCandidate = $tagPos;
                }
            }
            $searchPos = $tagPos;
        }

        if ($fallbackCandidate !== null) {
            return self::extractBalancedTag($html, $fallbackCandidate, $containerTag);
        }

        return null;
    }

    private static function extractBalancedTag(string $html, int $startPos, string $tag = 'div'): ?string
    {
        $depth = 0;
        $len = strlen($html);
        $openTag = '<' . $tag;
        $closeTag = '</' . $tag . '>';
        $i = $startPos;

        while ($i < $len) {
            if (substr($html, $i, strlen($openTag)) === $openTag && (in_array($html[$i + strlen($openTag)], [' ', '>', "\n", "\r", "\t"]))) {
                $depth++;
                $i += strlen($openTag);
            } elseif (substr($html, $i, strlen($closeTag)) === $closeTag) {
                $depth--;
                $i += strlen($closeTag);
                if ($depth === 0) {
                    return substr($html, $startPos, $i - $startPos);
                }
            } else {
                $i++;
            }
        }
        return null;
    }

    private static function slugify(string $text): string
    {
        $text = preg_replace('~[^\pL\d]+~u', '-', $text);
        $text = iconv('utf-8', 'us-ascii//TRANSLIT', $text);
        $text = preg_replace('~[^-\w]+~', '', $text);
        $text = trim($text, '-');
        $text = preg_replace('~-+~', '-', $text);
        return strtolower($text);
    }
}
