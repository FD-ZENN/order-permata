<?php
declare(strict_types=1);

require_once __DIR__ . '/PermataAssert.php';
require_once __DIR__ . '/../api/config/database.php';
require_once __DIR__ . '/../api/core/InvitationCompiler.php';

echo "\n[TEST SUITE 2] Validasi True Static Compiler & Sinkronisasi Media (Opsi A)\n";
echo str_repeat('-', 60) . "\n";

$pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET, DB_USER, DB_PASS);

// 1. Dapatkan order agung-fitri
$stmt = $pdo->query("SELECT o.id, c.slug_url FROM orders o JOIN couples c ON c.order_id = o.id WHERE c.slug_url = 'agung-fitri' LIMIT 1");
$order = $stmt->fetch(PDO::FETCH_ASSOC);

PermataAssert::assertTrue(!empty($order), "Order pengantin agung-fitri ditemukan di database");
if (!$order) {
    if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    exit(PermataAssert::printSummary());
}
}

$orderId = $order['id'];
$slug = $order['slug_url'];

// 2. Jalankan Build
$buildResult = InvitationCompiler::build($pdo, $orderId);

PermataAssert::assertTrue($buildResult['success'] === true, "Proses compile build sukses dijalankan");
PermataAssert::assertEquals($slug, $buildResult['slug'], "Slug build sesuai dengan database ({$slug})");
PermataAssert::assertEquals('2026', $buildResult['year'], "Tahun folder sesuai dengan event 2026");

$buildPath = rtrim(str_replace('\\', '/', $buildResult['path']), '/') . '/';
$destIndex = $buildPath . 'index.html';

PermataAssert::assertTrue(file_exists($destIndex), "File hasil compile index.html berhasil dibuat di {$buildPath}");
PermataAssert::assertFalse(file_exists($buildPath . 'index.php'), "File index.php lama otomatis dibersihkan");

$html = file_get_contents($destIndex);

// 3. Uji True Static Pre-Rendering pada Elemen HTML
PermataAssert::assertContains('Agung Prastiyo', $html, "Nama lengkap pria ter-render statis di HTML");
PermataAssert::assertContains('Nur Safitri', $html, "Nama lengkap wanita ter-render statis di HTML");
PermataAssert::assertContains('687501046673539', $html, "Nomor rekening BRI ter-render statis di HTML");
PermataAssert::assertContains('0770757185', $html, "Nomor rekening BCA ter-render statis di HTML");

// 4. Uji Sinkronisasi Media Foto (Opsi A)
$coverDest = $buildPath . 'couple/cover.jpg';
$masterCover = __DIR__ . "/../uploads/{$slug}/couple/cover.jpg";

PermataAssert::assertTrue(file_exists($coverDest), "File cover.jpg tersinkronisasi ke folder couple/");
PermataAssert::assertEquals(
    hash_file('sha256', $masterCover),
    hash_file('sha256', $coverDest),
    "File cover.jpg di folder build identik dengan master di uploads/{$slug}/ (SHA256 match)"
);

// 5. Uji Path Gambar Lokal Murni di HTML (Self-Contained)
PermataAssert::assertTrue(
    str_contains($html, 'src="couple/mempelai-pria.') || str_contains($html, 'couple/cover.'),
    "Tag foto pengantin menggunakan path lokal relatif murni 'couple/...'"
);
PermataAssert::assertNotContains('src="/uploads/agung-fitri/gallery/', $html, "Tag galeri tidak lagi menggunakan path '/uploads/...'");
PermataAssert::assertContains('gallery/galeri-', $html, "Tag galeri menggunakan path lokal 'gallery/galeri-*'");

// 6. Uji Audio Musik & Fallback Komentar
PermataAssert::assertContains('../../cdn/uploads/music/', $html, "Audio musik di index.html menggunakan path '../../cdn/uploads/music/...'");

// 7. Uji Minimal Config Injected & Lightweight View Tracker
PermataAssert::assertContains('window.CONFIG.ORDER_ID =', $html, "Config minimal disuntikkan dengan ORDER_ID");
PermataAssert::assertContains('window.CONFIG.apiBase =', $html, "Config minimal menghitung apiBase secara dinamis");
PermataAssert::assertContains('/orders/\' + encodeURIComponent(oid) + \'/view', $html, "Lightweight View Tracker otomatis diinjeksi");
PermataAssert::assertNotContains('window.INVITATION_DATA =', $html, "HTML bersih dari injeksi data besar INVITATION_DATA");

// 8. Uji Resolusi URL Absolut Penuh pada Meta Tag OpenGraph (Mendukung WhatsApp/Telegram Crawler)
PermataAssert::assertContains('property="og:url" id="meta-og-url" content="https://invitation.permatawedding.com/2026/agung-fitri/"', $html, "Meta og:url ter-render dengan URL absolut penuh");
PermataAssert::assertContains('property="og:image" id="meta-og-image" content="https://invitation.permatawedding.com/2026/agung-fitri/couple/cover.jpg', $html, "Meta og:image ter-render dengan URL absolut penuh");

// 9. Uji Blueprint Cloning Data Berulang (8 Story & 5 Rekening)
PermataAssert::assertContains('data-key="story-7-label"', $html, "Blueprint cloning berhasil menggandakan hingga Story ke-8 (story-7)");
PermataAssert::assertContains('data-key="wallet-4-bank"', $html, "Blueprint cloning berhasil menggandakan hingga Rekening ke-5 (wallet-4)");

if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    exit(PermataAssert::printSummary());
}
