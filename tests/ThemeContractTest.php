<?php
declare(strict_types=1);

require_once __DIR__ . '/PermataAssert.php';

echo "\n[TEST SUITE 1] Validasi Kepatuhan Template Terhadap Kontrak HTML & Standar Web\n";
echo str_repeat('-', 60) . "\n";

$templatesDir = __DIR__ . '/../templates';
$themes = ['pink-elegance', 'premium-elegant-javanese', 'premium-eternal-luxe', 'premium-ivory-grace', 'sakura-zen', 'midnight-luxury', 'fresh-minimal', 'royal-premium'];

foreach ($themes as $theme) {
    echo "\nMenguji Template: {$theme}\n";
    $themeDir = "{$templatesDir}/{$theme}";
    
    // 1. Uji keberadaan file utama (HTML/PHP, CSS, JS)
    PermataAssert::assertTrue(file_exists("{$themeDir}/index.html") || file_exists("{$themeDir}/index.php"), "File master index ada di {$theme}");
    $hasCss = is_dir("{$themeDir}/css") || file_exists("{$themeDir}/assets/custom.css");
    $hasJs = is_dir("{$themeDir}/js") || is_dir("{$themeDir}/assets");
    PermataAssert::assertTrue($hasCss, "Folder css/ atau assets/custom.css ada di {$theme}");
    PermataAssert::assertTrue($hasJs, "Folder js/ atau assets/ ada di {$theme}");

    $html = file_exists("{$themeDir}/index.html") ? file_get_contents("{$themeDir}/index.html") : file_get_contents("{$themeDir}/index.php");

    // 2. Uji Larangan Hardcode Mutlak
    PermataAssert::assertNotContains('window.INVITATION_DATA =', $html, "Tidak menyuntikkan script berat window.INVITATION_DATA");
    
    // 3. Uji Kepatuhan JavaScript (Pencegahan bentrok Identifier 'CONFIG')
    $jsFiles = array_merge(glob("{$themeDir}/js/*.js") ?: [], glob("{$themeDir}/assets/*.js") ?: []);
    foreach ($jsFiles as $jsFile) {
        $jsCode = file_get_contents($jsFile);
        $baseJs = basename($jsFile);
        PermataAssert::assertFalse(
            (bool)preg_match('/^\s*const\s+CONFIG\s*=/m', $jsCode),
            "File {$baseJs} ({$theme}) TIDAK mendeklarasikan 'const CONFIG =' yang bertabrakan dengan runtime config"
        );
    }

    // 4. Uji Penanganan Musik (Pencegahan 404 cdn)
    foreach ($jsFiles as $jsFile) {
        $jsCode = file_get_contents($jsFile);
        if (str_contains($jsCode, 'renderMusic')) {
            $baseJs = basename($jsFile);
            PermataAssert::assertTrue(
                str_contains($jsCode, 'cdn/') && str_contains($jsCode, '../../'),
                "File {$baseJs} ({$theme}) memiliki resolver path '../../cdn/' untuk audio lokal"
            );
        }
    }

    // 5. Uji Aksesibilitas & Modern Web (Audio Tag Standar)
    PermataAssert::assertTrue(
        str_contains($html, 'id="bg-music"'),
        "Tag audio #bg-music tersedia di HTML {$theme}"
    );

    // 6. Uji Komponen Form RSVP & Komentar
    PermataAssert::assertTrue(
        str_contains($html, 'id="rsvp"') || str_contains($html, 'section-rsvp') || str_contains($html, 'rsvp-form'),
        "Section atau Form RSVP tersedia di {$theme}"
    );
}

if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'] ?? '')) {
    exit(PermataAssert::printSummary());
}
