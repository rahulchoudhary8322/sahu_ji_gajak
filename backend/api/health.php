<?php
/**
 * Health Check API Endpoint
 */

if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Content-Type: application/json; charset=UTF-8');
}

require_once __DIR__ . '/../config/config.php';

echo json_encode([
    'status' => 'healthy',
    'app' => APP_NAME,
    'environment' => APP_ENV,
    'php_version' => PHP_VERSION,
    'timestamp' => date('c')
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
