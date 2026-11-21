<?php
/**
 * CDN Permata Wedding - Authentication Login
 * cdn.permatawedding.com
 * Styled consistently with Permata Wedding (C:\xampp\htdocs\invitation)
 */

require_once __DIR__ . '/config.php';

// Send anti-XSS, anti-clickjacking security headers
sendCorsHeaders();

// If already logged in, redirect to dashboard
if (isLoggedIn()) {
    header("Location: index.php");
    exit();
}

$error = '';
$loggedOut = isset($_GET['logout']);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === AUTH_USERNAME && $password === AUTH_PASSWORD) {
        $_SESSION['cdn_auth_user'] = AUTH_USERNAME;
        $_SESSION['cdn_auth_time'] = time();

        header("Location: index.php");
        exit();
    } else {
        $error = 'Username atau password salah. Silakan coba lagi.';
    }
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Permata Wedding — Login CDN Studio</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap" rel="stylesheet">
    
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    
    <!-- Custom Theme CSS -->
    <link rel="stylesheet" href="assets/css/style.css">

    <style>
        .login-page-wrap {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem 1rem;
            background: radial-gradient(circle at 50% 30%, rgba(244, 63, 110, 0.08) 0%, #fafafa 70%);
        }

        .login-card {
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 15px 40px rgba(0, 0, 0, 0.08);
            border: 1px solid var(--border-light);
            width: 100%;
            max-width: 440px;
            padding: 2.75rem 2.25rem;
            text-align: center;
            animation: fadeIn 0.3s ease;
        }

        .login-logo-badge {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: var(--brand-rose-light);
            border: 1px solid var(--brand-rose-border);
            color: var(--brand-rose);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.8rem;
            margin: 0 auto 1.25rem;
            box-shadow: var(--brand-rose-shadow);
        }

        .alert-error {
            background: #fff1f2;
            border: 1px solid rgba(244, 63, 110, 0.3);
            color: #e11d48;
            font-size: 0.85rem;
            font-weight: 600;
            padding: 10px 16px;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 8px;
            text-align: left;
        }

        .alert-success {
            background: #f0fdf4;
            border: 1px solid rgba(34, 197, 94, 0.3);
            color: #16a34a;
            font-size: 0.85rem;
            font-weight: 600;
            padding: 10px 16px;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 8px;
            text-align: left;
        }

        .form-group-login {
            text-align: left;
            margin-bottom: 1.25rem;
        }

        .form-group-login label {
            display: block;
            font-size: 0.82rem;
            font-weight: 700;
            color: var(--text-title);
            margin-bottom: 6px;
        }
    </style>
</head>
<body>

    <div class="login-page-wrap">
        <div class="login-card">
            
            <div class="header-eyebrow" style="margin-bottom: 8px;">
                <span>✦</span> Permata Wedding <span>✦</span>
            </div>

            <div class="login-logo-badge">
                <i class="bi bi-music-note-beamed"></i>
            </div>

            <h1 class="site-title" style="font-size: 2rem; margin-bottom: 6px;">Login CDN Studio</h1>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.75rem;">
                Akses manajemen asset musik & video cdn.permatawedding.com
            </p>

            <?php if ($error): ?>
                <div class="alert-error">
                    <i class="bi bi-exclamation-triangle-fill"></i>
                    <span><?php echo htmlspecialchars($error); ?></span>
                </div>
            <?php endif; ?>

            <?php if ($loggedOut): ?>
                <div class="alert-success">
                    <i class="bi bi-check-circle-fill"></i>
                    <span>Anda telah berhasil logout dari sistem.</span>
                </div>
            <?php endif; ?>

            <form method="POST" action="login.php">
                <div class="form-group-login">
                    <label for="username">Username</label>
                    <div style="position: relative;">
                        <input type="text" id="username" name="username" class="form-input-custom" placeholder="Masukkan username" required autofocus style="padding-left: 2.5rem;" value="<?php echo htmlspecialchars($_POST['username'] ?? 'permata'); ?>">
                        <i class="bi bi-person-fill" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                    </div>
                </div>

                <div class="form-group-login">
                    <label for="password">Password</label>
                    <div style="position: relative;">
                        <input type="password" id="password" name="password" class="form-input-custom" placeholder="Masukkan password" required style="padding-left: 2.5rem;">
                        <i class="bi bi-lock-fill" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
                    </div>
                </div>

                <div style="margin-top: 1.75rem;">
                    <button type="submit" class="btn-rose" style="width: 100%; justify-content: center; padding: 12px 24px; font-size: 1rem;">
                        <i class="bi bi-box-arrow-in-right"></i> Masuk ke Dashboard
                    </button>
                </div>
            </form>

            <div style="margin-top: 2rem; font-size: 0.78rem; color: var(--text-muted);">
                &copy; <?php echo date('Y'); ?> Permata Wedding. All rights reserved.
            </div>

        </div>
    </div>

</body>
</html>
