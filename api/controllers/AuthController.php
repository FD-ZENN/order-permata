<?php

class AuthController
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function login(): void
    {
        $raw   = file_get_contents('php://input');
        $input = json_decode($raw, true);
        if (!is_array($input)) {
            $input = $_POST;
        }

        $username = trim((string) ($input['username'] ?? ''));
        $password = (string) ($input['password'] ?? '');

        if ($username === '' || $password === '') {
            Response::error('Username dan password wajib diisi', 422);
        }

        // Rate limit per kombinasi IP + username: maksimal 5 percobaan per 5 menit.
        // Kalau melebihi, IP tersebut di-lock 5 menit sebelum boleh mencoba lagi.
        $rateLimitKey = 'login:' . RateLimiter::clientIp() . ':' . strtolower($username);
        if (!RateLimiter::attempt($rateLimitKey, 5, 300)) {
            Response::error('Terlalu banyak percobaan login gagal. Coba lagi dalam beberapa menit.', 429);
        }

        $stmt = $this->db->prepare('SELECT * FROM admins WHERE username = :u AND is_active = 1 LIMIT 1');
        $stmt->execute([':u' => $username]);
        $admin = $stmt->fetch();

        if (!$admin) {
            Response::error('Username atau password salah', 401);
        }

        $storedPassword = $admin['password'];
        $isHashed       = (bool) password_get_info($storedPassword)['algo'];

        // Mendukung data seed lama yang passwordnya masih plain-text.
        $valid = $isHashed
            ? password_verify($password, $storedPassword)
            : hash_equals($storedPassword, $password);

        if (!$valid) {
            Response::error('Username atau password salah', 401);
        }

        // Login sukses -> reset counter rate limit supaya tidak ikut terkunci nanti
        RateLimiter::clear($rateLimitKey);

        // Migrasi otomatis: password plain-text di-hash ulang setelah login sukses.
        if (!$isHashed) {
            $newHash = password_hash($password, PASSWORD_BCRYPT);
            $upd     = $this->db->prepare('UPDATE admins SET password = :p WHERE id = :id');
            $upd->execute([':p' => $newHash, ':id' => $admin['id']]);
        }

        $upd = $this->db->prepare('UPDATE admins SET last_login_at = NOW() WHERE id = :id');
        $upd->execute([':id' => $admin['id']]);

        $token = JWT::encode([
            'sub'      => $admin['id'],
            'username' => $admin['username'],
            'name'     => $admin['name'],
        ], JWT_SECRET, JWT_EXPIRY);

        unset($admin['password']);

        Response::success([
            'admin'        => $admin,
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'expires_in'   => JWT_EXPIRY,
        ], 'Login berhasil');
    }

    public function logout(): void
    {
        // JWT bersifat stateless — server tidak menyimpan sesi apa pun,
        // jadi logout cukup dilakukan client dengan menghapus token yang tersimpan
        // (localStorage/secure storage). Endpoint ini disediakan untuk konsistensi API.
        Response::success(null, 'Logout berhasil. Hapus token yang tersimpan di sisi client.');
    }

    public function me(): void
    {
        $payload = Middleware::requireAdmin(); // otomatis stop (401) kalau token tidak valid

        $stmt = $this->db->prepare(
            'SELECT id, username, name, is_active, last_login_at FROM admins WHERE id = :id LIMIT 1'
        );
        $stmt->execute([':id' => $payload['sub']]);
        $admin = $stmt->fetch();

        if (!$admin) {
            Response::error('Admin tidak ditemukan', 404);
        }

        Response::success($admin);
    }
}
