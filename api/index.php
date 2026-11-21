<?php
declare(strict_types=1);

// ---------------------------------------------------------------
// CORS & preflight
// ---------------------------------------------------------------
$allowedOrigin = getenv('ALLOWED_ORIGIN') ?: '*';
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Vary: Origin');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/core/autoload.php';
$db = Database::getConnection();

// ---------------------------------------------------------------
// Parsing URL
// ---------------------------------------------------------------
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';

// Normalisasi berbagai kemungkinan base prefix: /order-permata/api/API, /order-permata/api, /api/API, /api
$possibleBases = [
    '/order-permata/api/API',
    '/order-permata/api',
    '/api/API',
    '/api',
];

$path = $requestUri;
foreach ($possibleBases as $b) {
    if (str_starts_with($path, $b)) {
        $path = substr($path, strlen($b));
        break;
    }
}

$path     = trim($path, '/');
$segments = $path === '' ? [] : explode('/', $path);
$resource = $segments[0] ?? '';
$id       = $segments[1] ?? null;
$method   = $_SERVER['REQUEST_METHOD'];

// ---------------------------------------------------------------
// Auth routes: /auth/login, /auth/logout, /auth/me
// ---------------------------------------------------------------
if ($resource === 'auth') {
    $auth   = new AuthController($db);
    $action = $id;
    if ($action === 'login' && $method === 'POST') {
        $auth->login();
    } elseif ($action === 'logout' && $method === 'POST') {
        $auth->logout();
    } elseif ($action === 'me' && $method === 'GET') {
        $auth->me();
    } else {
        Response::error('Endpoint auth tidak ditemukan', 404);
    }
    exit;
}

// ---------------------------------------------------------------
// Upload
// ---------------------------------------------------------------
if ($resource === 'upload' && $method === 'POST') {
    (new UploadController($db))->upload();
    exit;
}
if ($resource === 'upload-multi' && $method === 'POST') {
    (new UploadController($db))->uploadMultiple();
    exit;
}

// ---------------------------------------------------------------
// Peta resource -> controller
// ---------------------------------------------------------------
$routes = [
    'themes'          => ThemeController::class,
    'orders'          => OrderController::class,
    'couples'         => CoupleController::class,
    'events'          => EventController::class,
    'livestreaming'   => LivestreamingController::class,
    'music'           => MusicController::class,
    'love-stories'    => LoveStoryController::class,
    'digital-wallets' => DigitalWalletController::class,
    'entertainment'   => EntertainmentController::class,
    'galleries'       => GalleryController::class,
    'admins'          => AdminController::class,
    'testimonials'    => TestimonialController::class,
    'comments'        => CommentController::class,
];

// ---------------------------------------------------------------
// ⚡ Special routes — harus SEBELUM generic dispatcher
// ---------------------------------------------------------------

// POST /themes/{id}/copy-assets
if (
    $resource === 'themes' &&
    isset($segments[2]) &&
    $segments[2] === 'copy-assets' &&
    $method === 'POST'
) {
    Middleware::requireAdmin();
    (new ThemeCopyController($db))->copyAssets($segments[1]);
    exit;
}

// GET /orders/stats
if (
    $resource === 'orders' &&
    isset($segments[1]) &&
    $segments[1] === 'stats' &&
    $method === 'GET'
) {
    Middleware::requireAdmin();
    (new OrderController($db))->stats();
    exit;
}

// POST /orders/{id}/recompile
if (
    $resource === 'orders' &&
    isset($segments[2]) &&
    $segments[2] === 'recompile' &&
    $method === 'POST'
) {
    Middleware::requireAdmin();
    (new OrderController($db))->recompile($segments[1]);
    exit;
}

// POST /orders/{id}/view (track view)
if (
    $resource === 'orders' &&
    isset($segments[2]) &&
    $segments[2] === 'view' &&
    $method === 'POST'
) {
    (new OrderController($db))->recordView($segments[1]);
    exit;
}

// POST /orders/public (order dari form publik tanpa auth)
if (
    $resource === 'orders' &&
    isset($segments[1]) &&
    $segments[1] === 'public' &&
    $method === 'POST'
) {
    (new OrderController($db))->storePublic();
    exit;
}

// ---------------------------------------------------------------
// Validasi resource
// ---------------------------------------------------------------
if ($resource === '') {
    Response::success([
        'message'   => 'Wedding Invitation API aktif',
        'resources' => array_keys($routes),
    ]);
    exit;
}

if (!array_key_exists($resource, $routes)) {
    Response::error('Resource tidak ditemukan', 404);
}

// ---------------------------------------------------------------
// Proteksi middleware
// ---------------------------------------------------------------
// Default: Semua mutasi data (POST, PUT, PATCH, DELETE) pada semua resource
// WAJIB login admin (Bearer Token), KECUALI endpoint publik terdaftar eksplisit:
// 1. POST /orders/public (Pemesanan publik dari landing page)
// 2. POST /comments (Buku tamu & RSVP dari undangan)
// ---------------------------------------------------------------
$publicWriteAllowed = [
    'orders'   => ['public'], // POST /orders/public ditangani rute khusus di atas
    'comments' => ['*'],      // POST /comments (RSVP & ucapan publik)
];

$protectedAll = ['admins'];

if (in_array($resource, $protectedAll, true)) {
    Middleware::requireAdmin();
}

if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
    $isPublic = false;
    if ($resource === 'comments' && $method === 'POST') {
        $isPublic = true;
    }

    if (!$isPublic) {
        Middleware::requireAdmin();
    }
}

// ---------------------------------------------------------------
// Generic dispatcher
// ---------------------------------------------------------------
$controllerClass = $routes[$resource];
$controller      = new $controllerClass($db);

switch ($method) {
    case 'GET':
        $id ? $controller->show($id) : $controller->index();
        break;
    case 'POST':
        $controller->store();
        break;
    case 'PUT':
    case 'PATCH':
        if (!$id) Response::error('ID wajib disertakan di URL untuk update', 400);
        $controller->update($id);
        break;
    case 'DELETE':
        if (!$id) Response::error('ID wajib disertakan di URL untuk hapus', 400);
        $controller->destroy($id);
        break;
    default:
        Response::error('Method tidak diizinkan', 405);
}