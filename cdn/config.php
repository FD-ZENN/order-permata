<?php
/**
 * CDN Permata Wedding - Configuration
 * cdn.permatawedding.com
 * 
 */

// Enable error reporting during development; can be turned off in production
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Session security: prevent JavaScript access to session cookie & enforce same-site
ini_set('session.cookie_httponly', 1);
ini_set('session.use_only_cookies', 1);
ini_set('session.cookie_samesite', 'Lax');

// Session start if needed
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Timezone
date_default_timezone_set('Asia/Jakarta');

// Directory paths
define('ROOT_PATH', __DIR__);
define('UPLOAD_DIR', ROOT_PATH . DIRECTORY_SEPARATOR . 'uploads');
define('MUSIC_DIR', UPLOAD_DIR . DIRECTORY_SEPARATOR . 'music');
define('VIDEO_DIR', UPLOAD_DIR . DIRECTORY_SEPARATOR . 'videos');
define('DATA_DIR', ROOT_PATH . DIRECTORY_SEPARATOR . 'data');
define('DB_FILE', DATA_DIR . DIRECTORY_SEPARATOR . 'media_database.json');

// Ensure necessary directories exist
$dirsToCreate = [UPLOAD_DIR, MUSIC_DIR, VIDEO_DIR, DATA_DIR];
foreach ($dirsToCreate as $dir) {
    if (!file_exists($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// Ensure database file exists
if (!file_exists(DB_FILE)) {
    $initialDb = [
        'music' => [],
        'videos' => [],
        'settings' => [
            'site_name' => 'Permata Wedding CDN',
            'api_version' => '1.0.0',
            'allowed_origins' => '*',
            'max_upload_size_mb' => 50,
            'default_compression_kbps' => 128
        ]
    ];
    file_put_contents(DB_FILE, json_encode($initialDb, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

/**
 * Auto-detect Base URL with Anti-Host-Header-Injection hardening
 */
function getBaseUrl() {
    // If running in CLI, detect based on htdocs path or default
    if (php_sapi_name() === 'cli' || empty($_SERVER['HTTP_HOST'])) {
        $normalizedRoot = str_replace('\\', '/', ROOT_PATH);
        if (($pos = strpos($normalizedRoot, '/htdocs')) !== false) {
            $subPath = substr($normalizedRoot, $pos + 7);
            return 'http://localhost' . $subPath;
        }
        return 'http://localhost/cdn.permatawedding.com';
    }

    // Check if HTTPS
    $isHttps = (
        (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
        (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ||
        (!empty($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
    );
    $protocol = $isHttps ? 'https://' : 'http://';
    
    // Sanitize Host header to prevent Host Header Injection / XSS
    $rawHost = $_SERVER['HTTP_HOST'] ?? 'localhost';
    $host = preg_replace('/[^a-zA-Z0-9\.\-\:]/', '', $rawHost);
    if (empty($host)) {
        $host = 'localhost';
    }
    
    // Script path calculation
    $scriptName = str_replace('\\', '/', $_SERVER['SCRIPT_NAME'] ?? '');
    $baseDir = dirname($scriptName);
    
    // If inside /api or /assets subdirectory, navigate up to root
    if (basename($baseDir) === 'api' || basename($baseDir) === 'assets') {
        $baseDir = dirname($baseDir);
    }
    
    $baseDir = rtrim($baseDir, '/\\');
    if ($baseDir === '.' || $baseDir === '/') {
        $baseDir = '';
    }
    
    return $protocol . $host . $baseDir;
}

define('BASE_URL', getBaseUrl());

/**
 * Send Security and CORS Headers
 * Protects against XSS, Clickjacking, MIME-sniffing, and provides CORS
 */
function sendCorsHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Origin, Accept, X-API-KEY");
    header("Access-Control-Max-Age: 86400"); // 24 hours cache

    // Anti-XSS & Anti-MIME-Sniffing security headers
    header("X-Content-Type-Options: nosniff");
    header("X-Frame-Options: SAMEORIGIN");
    header("X-XSS-Protection: 1; mode=block");
    header("Referrer-Policy: strict-origin-when-cross-origin");

    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Anti-XSS HTML Escaper
 */
function safeHtml($str) {
    return htmlspecialchars((string)$str, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}

/**
 * Anti-Directory-Traversal Filename Sanitizer
 */
function sanitizeFilename($filename) {
    $filename = str_replace(chr(0), '', (string)$filename);
    $base = basename($filename);
    $clean = preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $base);
    $clean = ltrim($clean, '.');
    return empty($clean) ? 'media_' . time() : $clean;
}

/**
 * Anti-Injection Text Sanitizer
 */
function sanitizeText($text, $maxLength = 200) {
    $text = str_replace(chr(0), '', (string)$text);
    $text = strip_tags($text);
    $text = trim($text);
    if (mb_strlen($text, 'UTF-8') > $maxLength) {
        $text = mb_substr($text, 0, $maxLength, 'UTF-8');
    }
    return $text;
}

/**
 * Safe JSON Response with Anti-XSS Hex Encoding
 */
function sendJsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode(
        $data,
        JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT
    );
    exit();
}

/**
 * Format bytes into human readable format
 */
function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= pow(1024, $pow);
    return round($bytes, $precision) . ' ' . $units[$pow];
}


define('AUTH_USERNAME', 'permata');
define('AUTH_PASSWORD', 'PermataWedding1');

/**
 * Check if current user is logged in via session
 */
function isLoggedIn() {
    return !empty($_SESSION['cdn_auth_user']) && $_SESSION['cdn_auth_user'] === AUTH_USERNAME;
}

/**
 * Enforce login for dashboard pages
 */
function requireDashboardAuth() {
    if (!isLoggedIn()) {
        $loginUrl = BASE_URL . '/login.php';
        header("Location: " . $loginUrl);
        exit();
    }
}

/**
 * Check authentication for write API endpoints (Upload, Process, Delete, Update)
 * Supports:
 * 1. Active PHP Session (from Web Dashboard)
 * 2. HTTP Basic Auth (permata:PermataWedding1)
 * 3. Authorization: Bearer PermataWedding1
 * 4. Header or Query param 'X-API-KEY' / 'api_key'
 */
function checkApiAuth() {
    // 1. Session check
    if (isLoggedIn()) {
        return true;
    }

    // 2. HTTP Basic Auth
    $authUser = $_SERVER['PHP_AUTH_USER'] ?? '';
    $authPass = $_SERVER['PHP_AUTH_PW'] ?? '';
    if ($authUser === AUTH_USERNAME && $authPass === AUTH_PASSWORD) {
        return true;
    }

    // 3. Bearer Token or X-API-KEY
    $headers = [];
    if (function_exists('getallheaders')) {
        $headers = (array)getallheaders();
    } else {
        foreach ($_SERVER as $name => $value) {
            if (strpos($name, 'HTTP_') === 0) {
                $headerName = str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))));
                $headers[$headerName] = $value;
            }
        }
    }
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        if ($matches[1] === AUTH_PASSWORD) {
            return true;
        }
    }

    $apiKey = $headers['X-API-KEY'] ?? $headers['x-api-key'] ?? $_SERVER['HTTP_X_API_KEY'] ?? $_GET['api_key'] ?? $_POST['api_key'] ?? '';
    if ($apiKey === AUTH_PASSWORD) {
        return true;
    }

    return false;
}

/**
 * Require API Auth or terminate with 401 JSON
 */
function requireApiAuth() {
    if (!checkApiAuth()) {
        http_response_code(401);
        echo json_encode([
            'status' => 'error',
            'code' => 401,
            'message' => 'Unauthorized: Authentication required. Please log in or provide valid credentials.'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit();
    }
}

