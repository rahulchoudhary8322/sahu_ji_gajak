<?php
/**
 * SHREE SHAHI GAJAK - CUSTOM ADMIN PANEL
 * Central API Configuration & Security Layer
 */

// Error handling: Clean JSON responses
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', 0);

// Set CORS and JSON Headers
if (!headers_sent()) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Admin-Token');
    header('Content-Type: application/json; charset=UTF-8');
}

// Handle CORS Preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Define WordPress Base Path
if (!defined('WP_PATH')) {
    define('WP_PATH', 'C:/xampp/htdocs/wordpress/gachak');
}

// Bootstrap WordPress & WooCommerce Core (Headless API Mode - skip frontend themes)
if (!defined('WP_USE_THEMES')) {
    define('WP_USE_THEMES', false);
}

if (!defined('ABSPATH')) {
    $wpLoad = WP_PATH . '/wp-load.php';
    if (!file_exists($wpLoad)) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'WordPress core bootstrap file not found at: ' . WP_PATH
        ]);
        exit();
    }
    require_once $wpLoad;
}

if (!class_exists('WooCommerce')) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'WooCommerce plugin is not active in the WordPress installation.'
    ]);
    exit();
}

// Secret Salt for Admin Tokens
$adminSecret = defined('AUTH_KEY') ? AUTH_KEY : 'Shahi_Gajak_Admin_Secret_2026_Secure';

/**
 * Standardized JSON Responses
 */
function json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function json_success($data = [], $message = 'Success') {
    json_response(array_merge(['status' => 'success', 'message' => $message], $data), 200);
}

function json_error($message, $statusCode = 400, $errorCode = 'ERROR') {
    json_response([
        'status' => 'error',
        'code' => $errorCode,
        'message' => $message
    ], $statusCode);
}

/**
 * Generate Secure Cryptographic Token
 */
function generate_admin_token($userId, $role = 'admin') {
    global $adminSecret;
    $issuedAt = time();
    $expiresAt = $issuedAt + (60 * 60 * 24); // 24 hours validity
    $payload = "$userId|$role|$issuedAt|$expiresAt";
    $signature = hash_hmac('sha256', $payload, $adminSecret);
    $token = base64_encode("$payload|$signature");

    // Store active token in user meta for single-session verification / revocation
    update_user_meta($userId, '_shahi_admin_active_token', $signature);
    update_user_meta($userId, '_shahi_admin_last_login', current_time('mysql'));

    return [
        'token' => $token,
        'expires_at' => $expiresAt
    ];
}

/**
 * Verify Admin Token
 */
function verify_admin_token($token) {
    global $adminSecret;
    if (empty($token)) return false;

    $decoded = base64_decode($token, true);
    if (!$decoded) return false;

    $parts = explode('|', $decoded);
    if (count($parts) !== 5) return false;

    list($userId, $role, $issuedAt, $expiresAt, $signature) = $parts;

    // Check expiration
    if (time() > (int)$expiresAt) return false;

    // Verify HMAC signature
    $payload = "$userId|$role|$issuedAt|$expiresAt";
    $expectedSignature = hash_hmac('sha256', $payload, $adminSecret);
    if (!hash_equals($expectedSignature, $signature)) return false;

    // Verify against user record
    $user = get_user_by('id', (int)$userId);
    if (!$user) return false;

    // Check if token signature is still active (Must match active token in user meta)
    $activeSig = get_user_meta($user->ID, '_shahi_admin_active_token', true);
    if (empty($activeSig) || !hash_equals($activeSig, $signature)) {
        // Token was revoked, logged out, or superseded
        return false;
    }

    return $user;
}

/**
 * Authentication Gate Middleware
 */
function admin_require_auth() {
    $token = '';

    // Check Authorization header: Bearer <token>
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? ($_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '');
    
    // Check getallheaders() if Apache stripped $_SERVER['HTTP_AUTHORIZATION']
    if (empty($authHeader) && function_exists('getallheaders')) {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? ($headers['authorization'] ?? '');
    }

    if (!empty($authHeader) && preg_match('/Bearer\s+(\S+)/i', $authHeader, $matches)) {
        $token = $matches[1];
    }

    // Check X-Admin-Token header
    if (empty($token) && !empty($_SERVER['HTTP_X_ADMIN_TOKEN'])) {
        $token = $_SERVER['HTTP_X_ADMIN_TOKEN'];
    }
    if (empty($token) && function_exists('getallheaders')) {
        $headers = getallheaders();
        $token = $headers['X-Admin-Token'] ?? ($headers['x-admin-token'] ?? '');
    }

    // Check Cookie
    if (empty($token) && !empty($_COOKIE['shahi_admin_token'])) {
        $token = $_COOKIE['shahi_admin_token'];
    }

    // Check query parameter fallback
    if (empty($token) && !empty($_GET['token'])) {
        $token = $_GET['token'];
    }

    if (empty($token)) {
        json_error('Authentication required. Missing token.', 401, 'UNAUTHORIZED');
    }

    $user = verify_admin_token($token);
    if (!$user) {
        json_error('Session expired or invalid token. Please log in again.', 401, 'INVALID_TOKEN');
    }

    // Verify that the authenticated user has genuine Administrator privileges
    $roles = (array)$user->roles;
    if (!in_array('administrator', $roles)) {
        json_error('Access denied. Administrator privileges required.', 403, 'FORBIDDEN');
    }

    return [
        'id' => $user->ID,
        'user' => $user,
        'username' => $user->user_login,
        'email' => $user->user_email,
        'display_name' => $user->display_name ?: $user->user_login,
        'role' => 'admin',
        'is_admin' => true,
        'roles' => $roles
    ];
}

/**
 * Role Check Helper (Unified Single Administrator Model)
 * Every authorized administrator has full access to all admin modules and operations.
 */
function admin_require_role($allowedRoles = ['admin']) {
    return admin_require_auth();
}

/**
 * Rate Limiter for Login Protection
 */
function admin_rate_limit($ip, $maxAttempts = 5, $decaySeconds = 300) {
    $transientKey = 'admin_login_attempts_' . md5($ip);
    $attempts = (int)get_transient($transientKey);
    if ($attempts >= $maxAttempts) {
        return false;
    }
    set_transient($transientKey, $attempts + 1, $decaySeconds);
    return true;
}

function admin_rate_limit_clear($ip) {
    delete_transient('admin_login_attempts_' . md5($ip));
}
