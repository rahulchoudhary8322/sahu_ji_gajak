<?php
/**
 * Wishlist API Endpoint
 * Shree Shahi Gajak
 * 
 * Supports session-backed and persistent wishlist syncing
 */

if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=UTF-8');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

session_start();

if (!isset($_SESSION['wishlist']) || !is_array($_SESSION['wishlist'])) {
    $_SESSION['wishlist'] = [];
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo json_encode([
        'status' => 'success',
        'count' => count($_SESSION['wishlist']),
        'items' => array_values($_SESSION['wishlist'])
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? 'toggle';
$product = $input['product'] ?? null;

if ($method === 'POST') {
    if ($action === 'toggle' && $product && isset($product['id'])) {
        $id = (int)$product['id'];
        if (isset($_SESSION['wishlist'][$id])) {
            unset($_SESSION['wishlist'][$id]);
            $msg = 'Removed from wishlist';
            $isWishlisted = false;
        } else {
            $_SESSION['wishlist'][$id] = $product;
            $msg = 'Added to wishlist';
            $isWishlisted = true;
        }

        echo json_encode([
            'status' => 'success',
            'message' => $msg,
            'is_wishlisted' => $isWishlisted,
            'count' => count($_SESSION['wishlist']),
            'items' => array_values($_SESSION['wishlist'])
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit();
    } elseif ($action === 'add' && $product && isset($product['id'])) {
        $id = (int)$product['id'];
        $_SESSION['wishlist'][$id] = $product;
    } elseif ($action === 'remove' && isset($input['id'])) {
        $id = (int)$input['id'];
        unset($_SESSION['wishlist'][$id]);
    } elseif ($action === 'clear') {
        $_SESSION['wishlist'] = [];
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Wishlist updated successfully',
        'count' => count($_SESSION['wishlist']),
        'items' => array_values($_SESSION['wishlist'])
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit();
}

