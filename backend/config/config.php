<?php
/**
 * Application Configuration
 * Shree Shahi Gajak
 */

define('APP_NAME', 'Sahu Ji Gajak');
define('APP_ENV', 'development');
define('APP_URL', 'http://localhost:8000');
define('FRONTEND_URL', 'http://localhost:5173');

// Database configuration
if (!defined('DB_HOST')) define('DB_HOST', '127.0.0.1');
if (!defined('DB_USER')) define('DB_USER', 'root');
if (!defined('DB_PASS')) define('DB_PASS', '');
if (!defined('DB_NAME')) define('DB_NAME', 'sahu_ji_gajak');

// WordPress / WooCommerce Path
if (!defined('WP_PATH')) define('WP_PATH', 'C:/xampp/htdocs/wordpress/gachak');
