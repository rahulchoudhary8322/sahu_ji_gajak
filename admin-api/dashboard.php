<?php
/**
 * SHREE SHAHI GAJAK - CUSTOM ADMIN PANEL
 * Dashboard Real-Time Metrics & Analytics API
 */

require_once __DIR__ . '/config.php';

// Authentication Check
$auth = admin_require_auth();

global $wpdb;

$ordersTable = $wpdb->prefix . 'wc_orders';
$itemsTable = $wpdb->prefix . 'woocommerce_order_items';
$itemMetaTable = $wpdb->prefix . 'woocommerce_order_itemmeta';

// Date range parsing
$range = $_GET['range'] ?? '7days';
$todayStart = date('Y-m-d 00:00:00');
$todayEnd = date('Y-m-d 23:59:59');

switch ($range) {
    case 'today':
        $startDate = $todayStart;
        $endDate = $todayEnd;
        break;
    case 'yesterday':
        $startDate = date('Y-m-d 00:00:00', strtotime('-1 day'));
        $endDate = date('Y-m-d 23:59:59', strtotime('-1 day'));
        break;
    case '7days':
        $startDate = date('Y-m-d 00:00:00', strtotime('-6 days'));
        $endDate = $todayEnd;
        break;
    case '30days':
        $startDate = date('Y-m-d 00:00:00', strtotime('-29 days'));
        $endDate = $todayEnd;
        break;
    case 'this_month':
        $startDate = date('Y-m-01 00:00:00');
        $endDate = $todayEnd;
        break;
    case 'all':
    default:
        $startDate = '2020-01-01 00:00:00';
        $endDate = $todayEnd;
        break;
}

// Custom Date Override
if (!empty($_GET['start_date']) && !empty($_GET['end_date'])) {
    $startDate = sanitize_text_field($_GET['start_date']) . ' 00:00:00';
    $endDate = sanitize_text_field($_GET['end_date']) . ' 23:59:59';
    $range = 'custom';
}

// -------------------------------------------------------------
// 1. TODAY'S METRICS
// -------------------------------------------------------------
$todayQuery = $wpdb->get_row($wpdb->prepare(
    "SELECT 
        COUNT(id) as today_orders,
        COALESCE(SUM(CASE WHEN status NOT IN ('wc-cancelled', 'wc-failed', 'wc-refunded') THEN total_amount ELSE 0 END), 0) as today_revenue
     FROM {$ordersTable}
     WHERE date_created_gmt >= %s AND date_created_gmt <= %s",
    $todayStart,
    $todayEnd
), ARRAY_A);

$todayOrders = (int)($todayQuery['today_orders'] ?? 0);
$todayRevenue = (float)($todayQuery['today_revenue'] ?? 0);

// -------------------------------------------------------------
// 2. LIFETIME & ACTIVE STATUS TOTALS
// -------------------------------------------------------------
$statusCounts = [
    'wc-pending' => 0,
    'wc-processing' => 0,
    'wc-on-hold' => 0,
    'wc-completed' => 0,
    'wc-cancelled' => 0,
    'wc-refunded' => 0,
    'wc-failed' => 0
];

$allStatusRows = $wpdb->get_results(
    "SELECT status, COUNT(id) as count, SUM(total_amount) as revenue 
     FROM {$ordersTable} 
     GROUP BY status",
    ARRAY_A
);

$totalOrdersCount = 0;
$totalRevenueLifetime = 0.0;

foreach ($allStatusRows as $sr) {
    $st = $sr['status'];
    $cnt = (int)$sr['count'];
    $rev = (float)$sr['revenue'];

    $totalOrdersCount += $cnt;
    if (!in_array($st, ['wc-cancelled', 'wc-failed', 'wc-refunded'])) {
        $totalRevenueLifetime += $rev;
    }

    if (isset($statusCounts[$st])) {
        $statusCounts[$st] = $cnt;
    } else {
        $statusCounts[$st] = $cnt;
    }
}

// -------------------------------------------------------------
// 3. RANGE METRICS (SELECTED FILTER)
// -------------------------------------------------------------
$rangeQuery = $wpdb->get_row($wpdb->prepare(
    "SELECT 
        COUNT(id) as range_orders,
        COALESCE(SUM(CASE WHEN status NOT IN ('wc-cancelled', 'wc-failed', 'wc-refunded') THEN total_amount ELSE 0 END), 0) as range_revenue
     FROM {$ordersTable}
     WHERE date_created_gmt >= %s AND date_created_gmt <= %s",
    $startDate,
    $endDate
), ARRAY_A);

$rangeOrders = (int)($rangeQuery['range_orders'] ?? 0);
$rangeRevenue = (float)($rangeQuery['range_revenue'] ?? 0);

// -------------------------------------------------------------
// 4. LOW STOCK PRODUCTS (High-Performance Indexed Lookup)
// -------------------------------------------------------------
$lowStockRaw = $wpdb->get_results(
    "SELECT p.ID, p.post_title, l.sku, l.min_price as price, l.stock_quantity, l.stock_status
     FROM {$wpdb->prefix}wc_product_meta_lookup l
     INNER JOIN {$wpdb->prefix}posts p ON l.product_id = p.ID
     WHERE p.post_status = 'publish' 
       AND (l.stock_status = 'outofstock' OR (l.stock_quantity IS NOT NULL AND l.stock_quantity <= 15))
     ORDER BY l.stock_quantity ASC
     LIMIT 10",
    ARRAY_A
);

$lowStockItems = [];
foreach ($lowStockRaw as $ls) {
    $lowStockItems[] = [
        'id' => (int)$ls['ID'],
        'name' => $ls['post_title'],
        'sku' => $ls['sku'] ?: 'SKU-' . $ls['ID'],
        'price' => (float)$ls['price'],
        'stock_quantity' => $ls['stock_quantity'] !== null ? (int)$ls['stock_quantity'] : 0,
        'stock_status' => $ls['stock_status']
    ];
}

// -------------------------------------------------------------
// 5. RECENT ORDERS (LATEST 8)
// -------------------------------------------------------------
$recentOrdersRaw = $wpdb->get_results(
    "SELECT id, status, total_amount, currency, payment_method_title, date_created_gmt, billing_email
     FROM {$ordersTable}
     ORDER BY id DESC
     LIMIT 8",
    ARRAY_A
);

$recentOrders = [];
foreach ($recentOrdersRaw as $ro) {
    // Billing Name & Items
    $firstName = $wpdb->get_var($wpdb->prepare(
        "SELECT first_name FROM {$wpdb->prefix}wc_order_addresses WHERE order_id = %d AND address_type = 'billing'",
        $ro['id']
    ));
    $lastName = $wpdb->get_var($wpdb->prepare(
        "SELECT last_name FROM {$wpdb->prefix}wc_order_addresses WHERE order_id = %d AND address_type = 'billing'",
        $ro['id']
    ));
    $custName = trim(($firstName ?: '') . ' ' . ($lastName ?: ''));
    if (empty($custName)) {
        $custName = $ro['billing_email'] ?: 'Guest Patron';
    }

    // Line items summary
    $items = $wpdb->get_results($wpdb->prepare(
        "SELECT order_item_name FROM {$itemsTable} WHERE order_id = %d AND order_item_type = 'line_item' LIMIT 2",
        $ro['id']
    ), ARRAY_A);
    $itemsSummary = array_map(function($i) { return $i['order_item_name']; }, $items);

    $idempotency = $wpdb->get_var($wpdb->prepare(
        "SELECT meta_value FROM {$wpdb->prefix}wc_orders_meta WHERE order_id = %d AND meta_key = '_idempotency_key'",
        $ro['id']
    ));

    $recentOrders[] = [
        'id' => (int)$ro['id'],
        'order_number' => '#' . $ro['id'],
        'date' => date('d M Y, h:i A', strtotime($ro['date_created_gmt'])),
        'customer_name' => $custName,
        'email' => $ro['billing_email'],
        'payment_method' => $ro['payment_method_title'] ?: 'Cash on Delivery',
        'status' => str_replace('wc-', '', $ro['status']),
        'total' => (float)$ro['total_amount'],
        'items_count' => count($items),
        'items_summary' => implode(', ', $itemsSummary),
        'is_react_checkout' => !empty($idempotency)
    ];
}

// -------------------------------------------------------------
// 6. TOP SELLING PRODUCTS
// -------------------------------------------------------------
$topSellingRaw = $wpdb->get_results(
    "SELECT 
        order_item_name as product_name,
        COUNT(order_item_id) as orders_count,
        SUM(CAST(meta_qty.meta_value AS UNSIGNED)) as total_quantity,
        SUM(CAST(meta_total.meta_value AS DECIMAL(10,2))) as total_revenue
     FROM {$itemsTable} as oi
     INNER JOIN {$ordersTable} as o ON oi.order_id = o.id
     LEFT JOIN {$itemMetaTable} as meta_qty ON oi.order_item_id = meta_qty.order_item_id AND meta_qty.meta_key = '_qty'
     LEFT JOIN {$itemMetaTable} as meta_total ON oi.order_item_id = meta_total.order_item_id AND meta_total.meta_key = '_line_total'
     WHERE oi.order_item_type = 'line_item'
       AND o.status NOT IN ('wc-cancelled', 'wc-failed', 'wc-refunded')
     GROUP BY order_item_name
     ORDER BY total_quantity DESC
     LIMIT 5",
    ARRAY_A
);

$topSelling = [];
foreach ($topSellingRaw as $ts) {
    $topSelling[] = [
        'name' => $ts['product_name'],
        'quantity_sold' => (int)($ts['total_quantity'] ?: 1),
        'revenue' => (float)($ts['total_revenue'] ?: 0),
        'orders_count' => (int)$ts['orders_count']
    ];
}

// -------------------------------------------------------------
// 7. DAILY REVENUE TREND FOR RANGE (CHART DATA)
// -------------------------------------------------------------
$dailyTrendRaw = $wpdb->get_results($wpdb->prepare(
    "SELECT 
        DATE(date_created_gmt) as order_day,
        COUNT(id) as count,
        COALESCE(SUM(CASE WHEN status NOT IN ('wc-cancelled', 'wc-failed', 'wc-refunded') THEN total_amount ELSE 0 END), 0) as revenue
     FROM {$ordersTable}
     WHERE date_created_gmt >= %s AND date_created_gmt <= %s
     GROUP BY DATE(date_created_gmt)
     ORDER BY order_day ASC",
    $startDate,
    $endDate
), ARRAY_A);

$dailyTrend = [];
foreach ($dailyTrendRaw as $dt) {
    $dailyTrend[] = [
        'date' => date('d M', strtotime($dt['order_day'])),
        'full_date' => $dt['order_day'],
        'orders' => (int)$dt['count'],
        'revenue' => (float)$dt['revenue']
    ];
}

// Return unified real-time dashboard data
json_success([
    'range' => $range,
    'date_from' => date('d M Y', strtotime($startDate)),
    'date_to' => date('d M Y', strtotime($endDate)),
    'kpis' => [
        'today_orders' => $todayOrders,
        'today_revenue' => $todayRevenue,
        'total_orders' => $totalOrdersCount,
        'total_revenue' => $totalRevenueLifetime,
        'pending_orders' => $statusCounts['wc-pending'] ?? 0,
        'processing_orders' => $statusCounts['wc-processing'] ?? 0,
        'completed_orders' => $statusCounts['wc-completed'] ?? 0,
        'on_hold_orders' => $statusCounts['wc-on-hold'] ?? 0,
        'cancelled_orders' => $statusCounts['wc-cancelled'] ?? 0,
        'low_stock_count' => count($lowStockItems)
    ],
    'status_breakdown' => $statusCounts,
    'recent_orders' => $recentOrders,
    'top_selling' => $topSelling,
    'low_stock_products' => $lowStockItems,
    'revenue_trend' => $dailyTrend
]);
