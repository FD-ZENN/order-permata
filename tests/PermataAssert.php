<?php
declare(strict_types=1);

/**
 * Permata Test Runner & Assertion Library
 * Unit test framework ringan murni PHP tanpa dependensi composer.
 */
class PermataAssert
{
    private static int $passed = 0;
    private static int $failed = 0;
    private static array $errors = [];

    public static function assertTrue(bool $condition, string $message = ''): void
    {
        if ($condition) {
            self::$passed++;
            echo "  ✓ {$message}\n";
        } else {
            self::$failed++;
            self::$errors[] = "FAIL: {$message} (Expected true, got false)";
            echo "  ✗ {$message}\n";
        }
    }

    public static function assertFalse(bool $condition, string $message = ''): void
    {
        self::assertTrue(!$condition, $message);
    }

    public static function assertEquals(mixed $expected, mixed $actual, string $message = ''): void
    {
        if ($expected === $actual) {
            self::$passed++;
            echo "  ✓ {$message}\n";
        } else {
            self::$failed++;
            $expStr = is_scalar($expected) ? (string)$expected : json_encode($expected);
            $actStr = is_scalar($actual) ? (string)$actual : json_encode($actual);
            self::$errors[] = "FAIL: {$message} (Expected: {$expStr}, Got: {$actStr})";
            echo "  ✗ {$message} [Expected: {$expStr}, Got: {$actStr}]\n";
        }
    }

    public static function assertContains(string $needle, string $haystack, string $message = ''): void
    {
        if (str_contains($haystack, $needle)) {
            self::$passed++;
            echo "  ✓ {$message}\n";
        } else {
            self::$failed++;
            self::$errors[] = "FAIL: {$message} (String does not contain '{$needle}')";
            echo "  ✗ {$message}\n";
        }
    }

    public static function assertNotContains(string $needle, string $haystack, string $message = ''): void
    {
        if (!str_contains($haystack, $needle)) {
            self::$passed++;
            echo "  ✓ {$message}\n";
        } else {
            self::$failed++;
            self::$errors[] = "FAIL: {$message} (String unexpectedly contains '{$needle}')";
            echo "  ✗ {$message}\n";
        }
    }

    public static function printSummary(): int
    {
        echo "\n" . str_repeat('=', 60) . "\n";
        echo "HASIL UNIT TEST:\n";
        echo "Passed: " . self::$passed . " test(s)\n";
        echo "Failed: " . self::$failed . " test(s)\n";

        if (!empty(self::$errors)) {
            echo "\nRincian Error:\n";
            foreach (self::$errors as $err) {
                echo " - {$err}\n";
            }
            echo str_repeat('=', 60) . "\n";
            return 1;
        }

        echo "Status: 100% SEMUA TEST BERHASIL (SUCCESS)\n";
        echo str_repeat('=', 60) . "\n";
        return 0;
    }
}
