<?php
/**
 * SHREE SHAHI GAJAK - CUSTOM ADMIN PANEL
 * Phase E: Reports & Business Analytics API
 * Official WooCommerce & HPOS Compatible
 */

require_once __DIR__ . '/config.php';

// Verify Admin Session
$auth = admin_require_auth();
$adminUser = $auth['user'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'overview';

global $wpdb;

$ordersTable = "{$wpdb->prefix}wc_orders";
$metaTable = "{$wpdb->prefix}wc_orders_meta";
$lookupTable = "{$wpdb->prefix}wc_order_product_lookup";
$postsTable = $wpdb->posts;
$postmetaTable = $wpdb->postmeta;

// ========================================================
// 1. ACTION: SALES OVERVIEW & FINANCIAL METRICS (GET)
// ========================================================
if ($action === 'overview') {
    $now = current_time('mysql');
    $todayStart = date('Y-m-d 00:00:00', strtotime($now));
    $yesterdayStart = date('Y-m-d 00:00:00', strtotime('-1 day', strtotime($now)));
    $yesterdayEnd = date('Y-m-d 23:59:59', strtotime('-1 day', strtotime($now)));
    $weekStart = date('Y-m-d 00:00:00', strtotime('monday this week', strtotime($now)));
    $monthStart = date('Y-m-01 00:00:00', strtotime($now));

    // Valid order statuses (exclude cancelled, failed, trash)
    $validStatusSql = "status NOT IN ('wc-cancelled', 'wc-failed', 'wc-trash')";

    // Lifetime
    $lifetime = $wpdb->get_row("
        SELECT 
            COUNT(id) as total_orders,
            COALESCE(SUM(total_amount), 0) as gross_sales,
            COALESCE(SUM(tax_amount), 0) as tax_amount,
            COALESCE(AVG(total_amount), 0) as avg_order_val
        FROM $ordersTable
        WHERE $validStatusSql
    ");

    // Today
    $today = $wpdb->get_row($wpdb->prepare("
        SELECT COUNT(id) as orders_count, COALESCE(SUM(total_amount), 0) as sales
        FROM $ordersTable
        WHERE $validStatusSql AND date_created_gmt >= %s
    ", $todayStart));

    // Yesterday
    $yesterday = $wpdb->get_row($wpdb->prepare("
        SELECT COUNT(id) as orders_count, COALESCE(SUM(total_amount), 0) as sales
        FROM $ordersTable
        WHERE $validStatusSql AND date_created_gmt >= %s AND date_created_gmt <= %s
    ", $yesterdayStart, $yesterdayEnd));

    // This Week
    $thisWeek = $wpdb->get_row($wpdb->prepare("
        SELECT COUNT(id) as orders_count, COALESCE(SUM(total_amount), 0) as sales
        FROM $ordersTable
        WHERE $validStatusSql AND date_created_gmt >= %s
    ", $weekStart));

    // This Month
    $thisMonth = $wpdb->get_row($wpdb->prepare("
        SELECT COUNT(id) as orders_count, COALESCE(SUM(total_amount), 0) as sales
        FROM $ordersTable
        WHERE $validStatusSql AND date_created_gmt >= %s
    ", $monthStart));

    // Paid Revenue vs Unpaid COD
    $paymentTotals = $wpdb->get_results("
        SELECT 
            o.payment_method,
            COALESCE(pm.meta_value, '') as payment_status,
            o.status as order_status,
            o.total_amount
        FROM $ordersTable o
        LEFT JOIN $metaTable pm ON pm.order_id = o.id AND pm.meta_key = '_shahi_payment_status'
        WHERE o.status NOT IN ('wc-cancelled', 'wc-failed', 'wc-trash')
    ");

    $paidRevenue = 0.0;
    $unpaidCod = 0.0;
    $discountsTotal = 0.0;

    foreach ($paymentTotals as $row) {
        $amt = (float)$row->total_amount;
        $isCod = (stripos($row->payment_method, 'cod') !== false);
        $stat = $row->payment_status;

        if ($stat === 'paid' || (!$isCod && $row->order_status !== 'wc-failed') || $row->order_status === 'wc-completed') {
            $paidRevenue += $amt;
        } elseif ($isCod && $stat !== 'paid') {
            $unpaidCod += $amt;
        }
    }

    // Discounts from coupons lookup if available
    $discVal = $wpdb->get_var("SELECT COALESCE(SUM(discount_amount), 0) FROM {$wpdb->prefix}wc_order_coupon_lookup");
    $discountsTotal = $discVal ? (float)$discVal : 0.0;

    json_success([
        'sales_overview' => [
            'total_sales' => (float)$lifetime->gross_sales,
            'net_sales' => max(0, (float)$lifetime->gross_sales - $discountsTotal),
            'total_orders' => (int)$lifetime->total_orders,
            'avg_order_value' => round((float)$lifetime->avg_order_val, 2),
            'paid_revenue' => round($paidRevenue, 2),
            'unpaid_cod_due' => round($unpaidCod, 2),
            'discounts_given' => round($discountsTotal, 2),
            'today_sales' => (float)$today->sales,
            'today_orders' => (int)$today->orders_count,
            'yesterday_sales' => (float)$yesterday->sales,
            'yesterday_orders' => (int)$yesterday->orders_count,
            'this_week_sales' => (float)$thisWeek->sales,
            'this_week_orders' => (int)$thisWeek->orders_count,
            'this_month_sales' => (float)$thisMonth->sales,
            'this_month_orders' => (int)$thisMonth->orders_count
        ]
    ]);
}

// ========================================================
// 2. ACTION: SALES CHART DATA (GET)
// ========================================================
if ($action === 'sales_chart') {
    $period = trim($_GET['period'] ?? 'last_30_days'); // 'last_7_days', 'last_30_days', 'monthly'
    $dateFrom = trim($_GET['date_from'] ?? '');
    $dateTo = trim($_GET['date_to'] ?? '');

    $where = ["status NOT IN ('wc-cancelled', 'wc-failed', 'wc-trash')"];
    $params = [];

    if ($period === 'last_7_days') {
        $where[] = "date_created_gmt >= %s";
        $params[] = date('Y-m-d 00:00:00', strtotime('-7 days'));
        $groupBy = "DATE(date_created_gmt)";
        $labelFormat = '%Y-%m-%d';
    } elseif ($period === 'last_30_days') {
        $where[] = "date_created_gmt >= %s";
        $params[] = date('Y-m-d 00:00:00', strtotime('-30 days'));
        $groupBy = "DATE(date_created_gmt)";
        $labelFormat = '%Y-%m-%d';
    } elseif ($period === 'monthly') {
        $where[] = "date_created_gmt >= %s";
        $params[] = date('Y-01-01 00:00:00', strtotime('-1 year'));
        $groupBy = "DATE_FORMAT(date_created_gmt, '%Y-%m')";
        $labelFormat = '%Y-%m';
    } elseif ($dateFrom && $dateTo) {
        $where[] = "date_created_gmt >= %s AND date_created_gmt <= %s";
        $params[] = "$dateFrom 00:00:00";
        $params[] = "$dateTo 23:59:59";
        $groupBy = "DATE(date_created_gmt)";
        $labelFormat = '%Y-%m-%d';
    } else {
        $where[] = "date_created_gmt >= %s";
        $params[] = date('Y-m-d 00:00:00', strtotime('-30 days'));
        $groupBy = "DATE(date_created_gmt)";
        $labelFormat = '%Y-%m-%d';
    }

    $whereSql = implode(' AND ', $where);
    $sql = "
        SELECT 
            $groupBy as bucket,
            COUNT(id) as orders_count,
            COALESCE(SUM(total_amount), 0) as gross_sales,
            COALESCE(AVG(total_amount), 0) as aov
        FROM $ordersTable
        WHERE $whereSql
        GROUP BY bucket
        ORDER BY bucket ASC
    ";

    $results = !empty($params) ? $wpdb->get_results($wpdb->prepare($sql, $params)) : $wpdb->get_results($sql);

    $chartPoints = [];
    foreach ($results as $r) {
        $displayDate = date('d M', strtotime($r->bucket));
        if ($period === 'monthly') {
            $displayDate = date('M Y', strtotime($r->bucket . '-01'));
        }
        $chartPoints[] = [
            'date_key' => $r->bucket,
            'label' => $displayDate,
            'orders' => (int)$r->orders_count,
            'sales' => (float)$r->gross_sales,
            'aov' => round((float)$r->aov, 2)
        ];
    }

    json_success([
        'period' => $period,
        'points' => $chartPoints,
        'count' => count($chartPoints)
    ]);
}

// ========================================================
// 3. ACTION: PRODUCT PERFORMANCE & INVENTORY (GET)
// ========================================================
if ($action === 'product_reports') {
    // Top selling products aggregated from order product lookup
    $topProducts = $wpdb->get_results("
        SELECT 
            p.ID as product_id,
            p.post_title as product_name,
            COALESCE(SUM(l.product_qty), 0) as total_qty_sold,
            COALESCE(SUM(l.product_gross_revenue), 0) as total_revenue
        FROM {$wpdb->posts} p
        INNER JOIN {$wpdb->prefix}wc_order_product_lookup l ON l.product_id = p.ID
        WHERE p.post_type IN ('product', 'product_variation')
        GROUP BY p.ID, p.post_title
        ORDER BY total_qty_sold DESC
        LIMIT 10
    ");

    $productsReport = [];
    foreach ($topProducts as $tp) {
        $product = wc_get_product($tp->product_id);
        $stock = $product ? $product->get_stock_quantity() : null;
        $stockStatus = $product ? $product->get_stock_status() : 'instock';

        $productsReport[] = [
            'product_id' => (int)$tp->product_id,
            'name' => $tp->product_name,
            'qty_sold' => (int)$tp->total_qty_sold,
            'gross_revenue' => (float)$tp->total_revenue,
            'stock_quantity' => $stock !== null ? (int)$stock : '∞',
            'stock_status' => $stockStatus,
            'stock_status_label' => ($stockStatus === 'outofstock') ? 'Out of Stock' : (($stockStatus === 'onbackorder') ? 'Backorder' : 'In Stock')
        ];
    }

    // Low stock & out-of-stock products
    $allCatalogProducts = wc_get_products(['limit' => -1]);
    $lowStockProducts = [];
    $outOfStockCount = 0;
    $totalInventoryValue = 0.0;
    $totalCatalogUnits = 0;

    foreach ($allCatalogProducts as $prod) {
        $price = (float)$prod->get_price();
        $stock = $prod->get_stock_quantity();
        $status = $prod->get_stock_status();

        if ($stock !== null) {
            $totalCatalogUnits += $stock;
            $totalInventoryValue += ($price * $stock);

            if ($stock <= 5 && $stock > 0) {
                $lowStockProducts[] = [
                    'id' => $prod->get_id(),
                    'name' => $prod->get_name(),
                    'stock' => $stock,
                    'price' => $price,
                    'status' => 'Low Stock'
                ];
            }
        }

        if ($status === 'outofstock' || ($stock !== null && $stock <= 0)) {
            $outOfStockCount++;
        }
    }

    json_success([
        'top_sellers' => $productsReport,
        'low_stock_items' => array_slice($lowStockProducts, 0, 10),
        'inventory_summary' => [
            'catalog_products_count' => count($allCatalogProducts),
            'total_units_in_stock' => $totalCatalogUnits,
            'out_of_stock_count' => $outOfStockCount,
            'estimated_inventory_valuation' => round($totalInventoryValue, 2)
        ]
    ]);
}

// ========================================================
// 4. ACTION: ORDER & PAYMENT STATUS BREAKDOWNS (GET)
// ========================================================
if ($action === 'order_reports') {
    // Orders by status
    $statusCounts = $wpdb->get_results("
        SELECT status, COUNT(id) as count, COALESCE(SUM(total_amount), 0) as volume
        FROM $ordersTable
        GROUP BY status
    ");

    $statusBreakdown = [];
    $totalOrders = 0;
    foreach ($statusCounts as $sc) {
        $cleanStatus = str_replace('wc-', '', $sc->status);
        $statusBreakdown[$cleanStatus] = [
            'status' => $cleanStatus,
            'label' => wc_get_order_status_name($cleanStatus),
            'count' => (int)$sc->count,
            'volume' => (float)$sc->volume
        ];
        $totalOrders += (int)$sc->count;
    }

    // Orders by payment method (COD vs Razorpay vs BACS)
    $methodCounts = $wpdb->get_results("
        SELECT 
            COALESCE(payment_method, 'unknown') as method_slug,
            COALESCE(payment_method_title, 'Cash on Delivery') as method_title,
            COUNT(id) as count,
            COALESCE(SUM(total_amount), 0) as volume
        FROM $ordersTable
        WHERE status NOT IN ('wc-cancelled', 'wc-failed', 'wc-trash')
        GROUP BY method_slug, method_title
    ");

    $methods = [];
    foreach ($methodCounts as $mc) {
        $methods[] = [
            'method' => $mc->method_slug,
            'title' => $mc->method_title,
            'count' => (int)$mc->count,
            'volume' => (float)$mc->volume,
            'percentage' => $totalOrders > 0 ? round(($mc->count / $totalOrders) * 100, 1) : 0
        ];
    }

    json_success([
        'statuses' => array_values($statusBreakdown),
        'payment_methods' => $methods
    ]);
}

// ========================================================
// 5. ACTION: EXPORT COMPREHENSIVE SALES REPORT CSV (GET)
// ========================================================
if ($action === 'export_csv') {
    $period = trim($_GET['period'] ?? 'all');
    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="shree_shahi_sales_analytics_' . date('Y-m-d') . '.csv"');
    header('Pragma: no-cache');
    header('Expires: 0');

    $out = fopen('php://output', 'w');
    // UTF-8 BOM
    fputs($out, "\xEF\xBB\xBF");

    fputcsv($out, [
        'Order ID',
        'Customer Name',
        'Date Created',
        'Order Status',
        'Payment Method',
        'Payment Status',
        'Gross Amount (INR)',
        'City',
        'Pincode'
    ]);

    $addressTable = "{$wpdb->prefix}wc_order_addresses";
    $rawOrders = $wpdb->get_results("
        SELECT 
            o.id,
            CONCAT(COALESCE(a.first_name, ''), ' ', COALESCE(a.last_name, '')) as customer_name,
            o.date_created_gmt,
            o.status,
            o.payment_method_title,
            COALESCE(pm.meta_value, '') as payment_status,
            o.total_amount,
            COALESCE(a.city, '') as city,
            COALESCE(a.postcode, '') as postcode
        FROM $ordersTable o
        LEFT JOIN $addressTable a ON a.order_id = o.id AND a.address_type = 'billing'
        LEFT JOIN $metaTable pm ON pm.order_id = o.id AND pm.meta_key = '_shahi_payment_status'
        WHERE o.status NOT IN ('wc-cancelled', 'wc-failed', 'wc-trash')
        ORDER BY o.id DESC
    ");

    foreach ($rawOrders as $r) {
        $cleanStatus = str_replace('wc-', '', $r->status);
        $payStat = $r->payment_status ?: ((stripos($r->payment_method_title, 'cash') !== false && $cleanStatus !== 'completed') ? 'unpaid' : 'paid');

        fputcsv($out, [
            $r->id,
            trim($r->customer_name) ?: 'Valued Patron',
            $r->date_created_gmt,
            wc_get_order_status_name($cleanStatus),
            $r->payment_method_title ?: 'Cash on Delivery',
            strtoupper($payStat),
            $r->total_amount,
            $r->city,
            $r->postcode
        ]);
    }

    fclose($out);
    exit();
}

json_error("Unknown reports action: $action", 400);
