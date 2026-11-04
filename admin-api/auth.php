<?php
/**
 * SHREE SHAHI GAJAK - CUSTOM ADMIN PANEL
 * Authentication & Session Management Endpoint
 */

require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($method === 'POST' ? 'login' : 'me');

// Read JSON input for POST
$input = [];
if ($method === 'POST' || $method === 'PUT') {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $input = json_decode($raw, true) ?: [];
    }
}

// ========================================================
// 1. ACTION: LOGIN (POST)
// ========================================================
if ($action === 'login') {
    if ($method !== 'POST') {
        json_error('Method not allowed', 405);
    }

    $username = trim($input['username'] ?? '');
    $password = $input['password'] ?? '';
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

    if (empty($username) || empty($password)) {
        json_error('Please enter both username/email and password.', 400);
    }

    // Rate Limiting (5 failed attempts per 5 minutes)
    if (!admin_rate_limit($ip, 5, 300)) {
        json_error('Too many failed login attempts. Please wait 5 minutes before retrying.', 429, 'RATE_LIMITED');
    }

    // Authenticate against WordPress credentials securely
    $user = wp_authenticate($username, $password);

    if (is_wp_error($user)) {
        json_error('Invalid royal credentials. Please verify your username and password.', 401, 'INVALID_CREDENTIALS');
    }

    // Strict Single-Admin Check: Verify genuine Administrator privileges
    $roles = (array)$user->roles;
    if (!in_array('administrator', $roles)) {
        json_error('Access denied. Administrator privileges required to access the operations panel.', 403, 'FORBIDDEN');
    }

    // Clear rate limiter upon successful authentication
    admin_rate_limit_clear($ip);

    // Single unified Admin role
    $primaryRole = 'admin';

    // Generate Cryptographic Token
    $tokenData = generate_admin_token($user->ID, $primaryRole);

    // Set HTTP-Only Cookie
    setcookie('shahi_admin_token', $tokenData['token'], [
        'expires' => $tokenData['expires_at'],
        'path' => '/wordpress/shree-shahi-admin/',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    json_success([
        'token' => $tokenData['token'],
        'expires_at' => $tokenData['expires_at'],
        'user' => [
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'display_name' => $user->display_name ?: $user->user_login,
            'role' => 'admin',
            'is_admin' => true
        ]
    ], 'Welcome to Shree Shahi Gajak Operations Panel.');
}

// ========================================================
// 2. ACTION: ME / VERIFY SESSION (GET)
// ========================================================
if ($action === 'me') {
    $auth = admin_require_auth();

    json_success([
        'user' => [
            'id' => $auth['id'],
            'username' => $auth['username'],
            'email' => $auth['email'],
            'display_name' => $auth['display_name'],
            'role' => 'admin',
            'is_admin' => true
        ]
    ]);
}

// ========================================================
// 3. ACTION: LOGOUT (POST)
// ========================================================
if ($action === 'logout') {
    // If authenticated, invalidate token in database
    try {
        $auth = admin_require_auth();
        delete_user_meta($auth['id'], '_shahi_admin_active_token');
    } catch (Exception $e) {}

    // Clear Cookie
    setcookie('shahi_admin_token', '', [
        'expires' => time() - 3600,
        'path' => '/wordpress/shree-shahi-admin/',
        'httponly' => true,
        'samesite' => 'Lax'
    ]);

    json_success([], 'Successfully logged out.');
}

json_error('Invalid action requested', 400);

