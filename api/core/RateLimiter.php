<?php

/**
 * Rate limiter sederhana berbasis file, tanpa dependency luar.
 * Cocok untuk single-server deployment. Kalau nanti API di-scale ke
 * banyak server, ganti storage-nya ke Redis/Memcached/tabel database
 * supaya hitungannya konsisten lintas server.
 */
class RateLimiter
{
    private static function storageDir(): string
    {
        $dir = sys_get_temp_dir() . '/wedding_api_ratelimit';
        if (!is_dir($dir)) {
            mkdir($dir, 0700, true);
        }
        return $dir;
    }

    /**
     * Cek & catat percobaan untuk sebuah key (mis. "login:1.2.3.4").
     * Return true kalau MASIH DIIZINKAN, false kalau sudah melebihi limit.
     */
    public static function attempt(string $key, int $maxAttempts, int $windowSeconds): bool
    {
        $safeName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
        $file = self::storageDir() . '/' . $safeName . '.json';

        $now  = time();
        $data = ['attempts' => [], 'locked_until' => 0];

        if (is_file($file)) {
            $decoded = json_decode((string) file_get_contents($file), true);
            if (is_array($decoded)) {
                $data = $decoded;
            }
        }

        // Kalau sedang dalam masa lockout, tolak langsung
        if (!empty($data['locked_until']) && $now < $data['locked_until']) {
            return false;
        }

        // Buang attempt yang sudah di luar window waktu
        $data['attempts'] = array_values(array_filter(
            $data['attempts'],
            fn ($t) => $t > ($now - $windowSeconds)
        ));

        $data['attempts'][] = $now;

        if (count($data['attempts']) > $maxAttempts) {
            $data['locked_until'] = $now + $windowSeconds;
            file_put_contents($file, json_encode($data));
            return false;
        }

        file_put_contents($file, json_encode($data));
        return true;
    }

    /** Panggil setelah login SUKSES untuk mereset counter percobaan gagal */
    public static function clear(string $key): void
    {
        $safeName = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $key);
        $file = self::storageDir() . '/' . $safeName . '.json';
        if (is_file($file)) {
            unlink($file);
        }
    }

    public static function clientIp(): string
    {
        return $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    }
}
