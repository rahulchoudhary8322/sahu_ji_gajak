<?php
/**
 * SHREE SHAHI GAJAK
 * Central Backend API Entry Point & Router
 */

if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

// Route /api/health
if ($requestUri === '/api/health' || $requestUri === '/api/health.php') {
    require __DIR__ . '/api/health.php';
    exit();
}

// Route /api/products
if ($requestUri === '/api/products' || $requestUri === '/api/products.php') {
    require __DIR__ . '/api/products.php';
    exit();
}

// Route /api/cart
if ($requestUri === '/api/cart' || $requestUri === '/api/cart.php') {
    require __DIR__ . '/api/cart.php';
    exit();
}

// Route /api/wishlist
if ($requestUri === '/api/wishlist' || $requestUri === '/api/wishlist.php') {
    require __DIR__ . '/api/wishlist.php';
    exit();
}

// Route /api/checkout
if ($requestUri === '/api/checkout' || $requestUri === '/api/checkout.php') {
    require __DIR__ . '/api/checkout.php';
    exit();
}

// Route /api/order
if ($requestUri === '/api/order' || $requestUri === '/api/order.php') {
    require __DIR__ . '/api/order.php';
    exit();
}

if (!headers_sent()) {
    header('Content-Type: application/json; charset=UTF-8');
}
require_once __DIR__ . '/config/config.php';

$response = [
    'status' => 'success',
    'app' => 'Shree Shahi Gajak',
    'version' => '1.1.0',
    'timestamp' => date('c'),
    'message' => 'Backend API is operational',
    'endpoints' => [
        'GET /' => 'API Information',
        'GET /api/health' => 'System Health Check',
        'GET /api/products' => '8 Royal Collection Products',
        'GET /api/cart' => 'Retrieve Active Cart',
        'POST /api/cart' => 'Add/Update/Remove Items from Cart'
    ]
];

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
