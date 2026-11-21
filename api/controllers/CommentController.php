<?php

class CommentController extends BaseController
{
    protected string $table = 'comments';
    protected array $fillable = ['order_id', 'guest_name', 'content', 'attendance'];
    protected array $required = ['order_id', 'guest_name', 'content'];
    protected array $enums = ['attendance' => ['hadir', 'tidak_hadir', 'ragu_ragu']];
    protected ?string $orderBy = 'created_at DESC';

    protected function beforeCreate(array &$input): void
    {
        // Rate limit pengiriman ucapan/RSVP: maksimal 5 kali per 60 detik per IP
        $clientIp = RateLimiter::clientIp();
        $rateLimitKey = 'comment:' . $clientIp;
        if (!RateLimiter::attempt($rateLimitKey, 5, 60)) {
            Response::error('Terlalu banyak mengirim ucapan. Silakan tunggu 1 menit sebelum mencoba lagi.', 429);
        }

        // Sanitasi teks input untuk mencegah Stored XSS
        if (isset($input['guest_name'])) {
            $input['guest_name'] = htmlspecialchars(trim((string)$input['guest_name']), ENT_QUOTES, 'UTF-8');
        }
        if (isset($input['content'])) {
            $input['content'] = htmlspecialchars(trim((string)$input['content']), ENT_QUOTES, 'UTF-8');
        }
    }
}

