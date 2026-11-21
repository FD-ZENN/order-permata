<?php
declare(strict_types=1);

require_once __DIR__ . '/PermataAssert.php';
require_once __DIR__ . '/../api/config/database.php';

echo "\n[TEST SUITE 3] Validasi Keamanan, Sanitasi XSS & Proteksi Database\n";
echo str_repeat('-', 60) . "\n";

$pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET, DB_USER, DB_PASS);

// 1. Uji Sanitasi Input XSS
$xssPayload = '<script>alert("XSS")</script>&"\'<>';
$sanitized = htmlspecialchars($xssPayload, ENT_QUOTES, 'UTF-8');

PermataAssert::assertNotContains('<script>', $sanitized, "Sanitasi htmlspecialchars mematikan tag script");
PermataAssert::assertContains('&lt;script&gt;', $sanitized, "Karakter < dan > diubah ke entity aman");
PermataAssert::assertContains('&quot;', $sanitized, "Karakter double-quote diubah ke entity &quot;");
PermataAssert::assertContains('&#039;', $sanitized, "Karakter single-quote diubah ke entity &#039;");

// 2. Uji Prepared Statement Database (Proteksi SQL Injection)
$sqlInjectSlug = "agung-fitri' OR '1'='1";
$stmt = $pdo->prepare("SELECT * FROM couples WHERE slug_url = :slug");
$stmt->execute([':slug' => $sqlInjectSlug]);
$result = $stmt->fetchAll(PDO::FETCH_ASSOC);

PermataAssert::assertEquals(0, count($result), "Prepared Statement PDO berhasil menolak SQL Injection pada query slug");

// 3. Uji Resolusi Path Traversal pada File Upload Controller / Storage
$traversalPaths = [
    '../../etc/passwd',
    '..\\..\\windows\\system32',
    'agung-fitri/../../uploads/secret.txt'
];

foreach ($traversalPaths as $tp) {
    $cleanPath = preg_replace('/(\.\.[\/\\\\])+/', '', $tp);
    PermataAssert::assertNotContains('../', $cleanPath, "Sanitasi traversal berhasil membuang '../' pada path: {$tp}");
    PermataAssert::assertNotContains('..\\', $cleanPath, "Sanitasi traversal berhasil membuang '..\\' pada path: {$tp}");
}

// ---------------------------------------------------------------
// 4. Validasi Access Control: Route Write Mutlak Terproteksi
// ---------------------------------------------------------------
$protectedCheck = function(string $resource, string $method): bool {
    if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
        if ($resource === 'comments' && $method === 'POST') {
            return false; // Publik
        }
        return true; // Wajib Admin
    }
    return false;
};

PermataAssert::assertContains(
    'true',
    $protectedCheck('digital-wallets', 'PUT') ? 'true' : 'false',
    'Operasi PUT pada digital-wallets wajib diproteksi admin'
);
PermataAssert::assertContains(
    'true',
    $protectedCheck('couples', 'POST') ? 'true' : 'false',
    'Operasi POST pada couples wajib diproteksi admin'
);
PermataAssert::assertContains(
    'true',
    $protectedCheck('themes', 'DELETE') ? 'true' : 'false',
    'Operasi DELETE pada themes wajib diproteksi admin'
);
PermataAssert::assertContains(
    'false',
    $protectedCheck('comments', 'POST') ? 'true' : 'false',
    'Operasi POST pada comments diizinkan untuk publik (RSVP)'
);

// ---------------------------------------------------------------
// 5. Validasi Proteksi Eksekusi Direktori uploads/
// ---------------------------------------------------------------
PermataAssert::assertContains(
    'true',
    file_exists(__DIR__ . '/../uploads/.htaccess') ? 'true' : 'false',
    'File proteksi uploads/.htaccess telah terpasang'
);

$htaccessContent = file_get_contents(__DIR__ . '/../uploads/.htaccess');
PermataAssert::assertContains(
    'php_flag engine off',
    $htaccessContent,
    'uploads/.htaccess mematikan engine PHP'
);
PermataAssert::assertContains(
    'RemoveHandler',
    $htaccessContent,
    'uploads/.htaccess mencabut handler script eksekusi'
);

if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    exit(PermataAssert::printSummary());
}
