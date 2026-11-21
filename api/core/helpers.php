<?php

/**
 * Membuat UUID v4 di sisi PHP.
 * Dipakai karena kolom id di database CHAR(36) dengan DEFAULT (UUID()),
 * tapi PDO::lastInsertId() tidak bisa mengambil nilai UUID (hanya untuk AUTO_INCREMENT).
 * Jadi id di-generate dulu di PHP lalu disisipkan eksplisit saat INSERT.
 */
function generate_uuid(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40); // versi 4
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80); // varian

    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}
