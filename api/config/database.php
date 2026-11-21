<?php
/**
 * Konfigurasi koneksi database.
 * Sesuaikan nilai di bawah ini dengan environment Anda.
 * Untuk produksi, sebaiknya nilai ini diambil dari environment variable,
 * bukan ditulis langsung di file (agar tidak ikut ter-commit ke git).
 */

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'invitation_permatawedding');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') !== false ? getenv('DB_PASS') : (file_exists(__DIR__ . '/../../.env') ? '' : ''));
define('DB_CHARSET', 'utf8mb4');
