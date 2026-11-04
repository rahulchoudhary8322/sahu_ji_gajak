<?php
/**
 * SHREE SHAHI GAJAK
 * Secure Order Confirmation & Details API Endpoint
 * 
 * Security: Requires both Order ID and Order Key (token) to prevent unauthorized access.
 */

error_reporting(0);
ini_set('display_errors', 0);

if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Content-Type: application/json; charset=UTF-8');
}

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/config.php';

// Bootstrap WordPress & WooCommerce
if (!defined('ABSPATH')) {
    $wpLoad = WP_PATH . '/wp-load.php';
    if (file_exists($wpLoad)) {
        require_once $wpLoad;
    }
}

if (!class_exists('WooCommerce')) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'WooCommerce core unavailable.']);
    exit();
}

$orderId = intval($_GET['id'] ?? 0);
$orderKey = sanitize_text_field($_GET['key'] ?? '');

if (!$orderId || empty($orderKey)) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Order ID and Order Access Key are required.']);
    exit();
}

$order = wc_get_order($orderId);
if (!$order) {
    http_response_code(404);
    echo json_encode(['status' => 'error', 'message' => 'Royal order not found.']);
    exit();
}

// Token / Order Key security verification
if ($order->get_order_key() !== $orderKey) {
    http_response_code(403);
    echo json_encode(['status' => 'error', 'message' => 'Access denied: Invalid order security key.']);
    exit();
}

// Format items
$items = [];
foreach ($order->get_items() as $itemId => $item) {
    $product = $item->get_product();
    $weightMeta = $item->get_meta('Weight');
    if (empty($weightMeta) && $product) {
        $weightMeta = $product->get_weight() ? $product->get_weight() . 'g' : '500g';
    }

    $image = '/assets/products/til_gajak_hd.jpg';
    if ($product) {
        $thumbId = $product->get_image_id();
        if ($thumbId) {
            $imgSrc = wp_get_attachment_image_url($thumbId, 'medium');
            if ($imgSrc) {
                if (preg_match('/wp-content\/uploads\/(.+)$/', $imgSrc, $m)) {
                    $image = '/assets/uploads/' . $m[1];
                } else {
                    $image = $imgSrc;
                }
            }
        }
    }

    $items[] = [
        'id' => $item->get_id(),
        'product_id' => $item->get_product_id(),
        'name' => $item->get_name(),
        'quantity' => $item->get_quantity(),
        'unit_price' => floatval($item->get_subtotal()) / max(1, $item->get_quantity()),
        'subtotal' => floatval($item->get_subtotal()),
        'total' => floatval($item->get_total()),
        'weight' => $weightMeta ?: '500g',
        'image' => $image
    ];
}

// Format delivery address
$landmark = $order->get_meta('_delivery_landmark');

$orderData = [
    'status' => 'success',
    'order' => [
        'id' => $order->get_id(),
        'order_number' => $order->get_order_number(),
        'order_key' => $order->get_order_key(),
        'status' => $order->get_status(),
        'status_name' => wc_get_order_status_name($order->get_status()),
        'date_created' => $order->get_date_created() ? $order->get_date_created()->date('d M Y, h:i A') : date('d M Y'),
        'payment_method' => $order->get_payment_method(),
        'payment_method_title' => $order->get_payment_method_title(),
        'currency' => $order->get_currency(),
        'subtotal' => floatval($order->get_subtotal()),
        'shipping_total' => floatval($order->get_shipping_total()),
        'shipping_method' => $order->get_shipping_method() ?: 'Royal Express Delivery',
        'discount_total' => floatval($order->get_discount_total()),
        'total' => floatval($order->get_total()),
        'customer' => [
            'first_name' => $order->get_billing_first_name(),
            'last_name' => $order->get_billing_last_name(),
            'phone' => $order->get_billing_phone(),
            'email' => $order->get_billing_email(),
        ],
        'shipping_address' => [
            'first_name' => $order->get_shipping_first_name() ?: $order->get_billing_first_name(),
            'last_name' => $order->get_shipping_last_name() ?: $order->get_billing_last_name(),
            'address_1' => $order->get_shipping_address_1() ?: $order->get_billing_address_1(),
            'address_2' => $order->get_shipping_address_2() ?: $order->get_billing_address_2(),
            'landmark' => $landmark ?: '',
            'city' => $order->get_shipping_city() ?: $order->get_billing_city(),
            'state' => $order->get_shipping_state() ?: $order->get_billing_state(),
            'postcode' => $order->get_shipping_postcode() ?: $order->get_billing_postcode(),
            'country' => $order->get_shipping_country() ?: 'IN'
        ],
        'items' => $items
    ]
];

echo json_encode($orderData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
