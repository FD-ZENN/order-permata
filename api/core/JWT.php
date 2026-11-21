<?php

/**
 * Implementasi JWT (JSON Web Token) minimal, algoritma HS256.
 * Ditulis manual (tanpa composer/library luar) supaya project tetap
 * zero-dependency dan mudah di-deploy di shared hosting mana pun.
 */
class JWT
{
    public static function encode(array $payload, string $secret, int $expirySeconds = 86400): string
    {
        $header = ['typ' => 'JWT', 'alg' => 'HS256'];

        $now             = time();
        $payload['iat']  = $now;
        $payload['exp']  = $now + $expirySeconds;

        $segments = [
            self::base64UrlEncode(json_encode($header)),
            self::base64UrlEncode(json_encode($payload)),
        ];

        $signature  = hash_hmac('sha256', implode('.', $segments), $secret, true);
        $segments[] = self::base64UrlEncode($signature);

        return implode('.', $segments);
    }

    /**
     * Mengembalikan payload (array) kalau token valid & belum kedaluwarsa,
     * atau null kalau tidak valid / rusak / kedaluwarsa.
     */
    public static function decode(string $token, string $secret): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return null;
        }

        [$headerB64, $payloadB64, $signatureB64] = $parts;

        $expectedSignature = hash_hmac('sha256', "$headerB64.$payloadB64", $secret, true);
        $actualSignature   = self::base64UrlDecode($signatureB64);

        // hash_equals mencegah timing attack saat membandingkan signature
        if (!hash_equals($expectedSignature, $actualSignature)) {
            return null;
        }

        $payload = json_decode(self::base64UrlDecode($payloadB64), true);
        if (!is_array($payload)) {
            return null;
        }

        if (isset($payload['exp']) && time() >= (int) $payload['exp']) {
            return null; // token sudah kedaluwarsa
        }

        return $payload;
    }

    private static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64UrlDecode(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }

        return base64_decode(strtr($data, '-_', '+/'));
    }
}
