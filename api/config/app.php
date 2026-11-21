<?php
// Jika user ketik spasi di input URL
$audioUrl = trim($mu['url'] ?? '');
// empty('') = true → skip ✅
// empty('  ') sebelum trim = false → TIDAK skip ❌
/**
 * Konfigurasi umum aplikasi.
 *
 * PENTING: Ganti JWT_SECRET dengan string acak yang panjang & rahasia
 * sebelum deploy ke production. Jangan commit nilai asli ke git —
 * sebaiknya di-set lewat environment variable JWT_SECRET.
 *
 * Contoh generate secret yang aman:
 *   php -r "echo bin2hex(random_bytes(32));"
 */
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'ganti-dengan-secret-key-yang-sangat-rahasia-dan-panjang');
define('JWT_EXPIRY', (int) (getenv('JWT_EXPIRY') ?: 86400)); // detik, default 24 jam

/**
 * APP_DEBUG mengontrol apakah detail error internal (mis. pesan mentah dari
 * PDOException) ditampilkan di response API.
 * WAJIB false di production — detail error database bisa membocorkan
 * struktur tabel/kolom ke penyerang. Set true hanya saat development lokal.
 */
define('APP_DEBUG', filter_var(getenv('APP_DEBUG') ?: false, FILTER_VALIDATE_BOOLEAN));

/**
 * RATE_LIMIT_ENABLED mengontrol apakah rate limiter aktif.
 * Set false di .env atau di sini untuk mematikan sementara rate limit saat testing/development.
 */
define('RATE_LIMIT_ENABLED', filter_var(getenv('RATE_LIMIT_ENABLED') ?? true, FILTER_VALIDATE_BOOLEAN));
