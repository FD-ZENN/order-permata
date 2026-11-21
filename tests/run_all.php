<?php
declare(strict_types=1);

/**
 * MASTER UNIT TEST RUNNER - ORDER PERMATA
 * Menjalankan seluruh test suite otomatis:
 * 1. Theme Contract & HTML Standards Test
 * 2. Compiler Build & Media Sync Test (Opsi A)
 * 3. Security Sanitization & SQL Protection Test
 */

echo "============================================================\n";
echo "   ORDER PERMATA AUTOMATED UNIT TEST SUITE                  \n";
echo "============================================================\n";

require_once __DIR__ . '/PermataAssert.php';
require_once __DIR__ . '/ThemeContractTest.php';
require_once __DIR__ . '/CompilerBuildTest.php';
require_once __DIR__ . '/SecuritySanitizationTest.php';

exit(PermataAssert::printSummary());
