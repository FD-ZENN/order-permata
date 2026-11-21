<?php

class Middleware
{
    /**
     * Ambil & verifikasi Bearer token dari header Authorization.
     * Return payload JWT (berisi sub/username/name/iat/exp) kalau valid,
     * atau null kalau header tidak ada / token invalid / kedaluwarsa.
     */
    public static function getAuthPayload(): ?array
    {
        $header = self::getAuthorizationHeader();
        if (!$header || stripos($header, 'Bearer ') !== 0) {
            return null;
        }

        $token = trim(substr($header, 7));
        if ($token === '') {
            return null;
        }

        return JWT::decode($token, JWT_SECRET);
    }

    /**
     * Wajibkan token admin yang valid. Menghentikan request (401) kalau tidak ada/invalid.
     * Return payload JWT supaya controller pemanggil bisa tahu siapa admin yang login.
     */
    public static function requireAdmin(): array
    {
        $payload = self::getAuthPayload();

        if (!$payload || empty($payload['sub'])) {
            Response::error('Unauthorized, token tidak ada / tidak valid / sudah kedaluwarsa', 401);
        }

        return $payload;
    }

    private static function getAuthorizationHeader(): ?string
    {
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            return $_SERVER['HTTP_AUTHORIZATION'];
        }

        if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        // Cek header alternatif jika web server me-rewrite authorization
        if (!empty($_SERVER['HTTP_X_AUTHORIZATION'])) {
            return $_SERVER['HTTP_X_AUTHORIZATION'];
        }

        // Cek query string / body token jika header terpotong habis oleh proxy/server
        if (!empty($_GET['token'])) {
            return 'Bearer ' . trim($_GET['token']);
        }

        // Beberapa konfigurasi Apache/PHP-FPM (mod_php, CGI) tidak meneruskan
        // header Authorization ke $_SERVER secara default, jadi cek juga di sini.
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            foreach ($headers as $name => $value) {
                if (strcasecmp($name, 'Authorization') === 0 || strcasecmp($name, 'X-Authorization') === 0) {
                    return $value;
                }
            }
        }

        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $name => $value) {
                if (strcasecmp($name, 'Authorization') === 0 || strcasecmp($name, 'X-Authorization') === 0) {
                    return $value;
                }
            }
        }

        return null;
    }
}
