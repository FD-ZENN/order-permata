<?php
/**
 * CDN Permata Wedding - Logout Handler
 * cdn.permatawedding.com
 */

require_once __DIR__ . '/config.php';

// Unset auth session
unset($_SESSION['cdn_auth_user']);
unset($_SESSION['cdn_auth_time']);

// Destroy session
if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
}

header("Location: login.php?logout=1");
exit();
