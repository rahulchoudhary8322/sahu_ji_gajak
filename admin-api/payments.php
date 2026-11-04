<?php
/**
 * SHREE SHAHI GAJAK - CUSTOM ADMIN PANEL
 * Payments & Financial Reconciliation API (WooCommerce HPOS Compatible)
 */

require_once __DIR__ . '/config.php';

// Strict Single Administrator Gate
$auth = admin_require_auth();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'overview';

global $wpdb;
$ordersTable = $wpdb->prefix . 'wc_orders';
$addrTable = $wpdb->prefix . 'wc_order_addresses';
$metaTable = $wpdb->prefix . 'wc_orders_meta';

// Helper: Inspect official Razorpay gateway configuration safely
function get_razorpay_gateway_status() {
    $rzpSettings = get_option('woocommerce_razorpay_settings');
    $isEnabled = false;
    $isConfigured = false;
    $keyIdMasked = null;

    if (is_array($rzpSettings)) {
        $isEnabled = ($rzpSettings['enabled'] ?? 'no') === 'yes';
        $keyId = trim($rzpSettings['key_id'] ?? '');
        $keySecret = trim($rzpSettings['key_secret'] ?? '');

        if (!empty($keyId) && !empty($keySecret)) {
            $isConfigured = true;
            // Masked display: rzp_live_****1234
            $keyIdMasked = substr($keyId, 0, 8) . '••••' . substr($keyId, -4);
        }
    }

    return [
        'gateway_id' => 'razorpay',
        'title' => 'Razorpay (UPI, Credit/Debit Cards, NetBanking)',
        'enabled' => $isEnabled,
        'configured' => $isConfigured,
        'display_status' => $isConfigured ? ($isEnabled ? 'Active & Receiving Payments' : 'Disabled in Store Settings') : 'Razorpay Setup Pending',
        'key_id_masked' => $keyIdMasked,
        'notice' => $isConfigured ? 'Connected to live merchant account' : 'Official WooCommerce Razorpay credentials not yet configured by store owner'
    ];
}

// ========================================================
// 1. ACTION: PAYMENTS OVERVIEW & METRICS (GET)
// ========================================================
if ($action === 'overview') {
    $dateFrom = trim($_GET['date_from'] ?? '');
    $dateTo = trim($_GET['date_to'] ?? '');

    $where = ["o.status NOT IN ('trash', 'wc-cancelled')"];
    $params = [];

    if (!empty($dateFrom)) {
        $where[] = "o.date_created_gmt >= %s";
        $params[] = $dateFrom . ' 00:00:00';
    }
    if (!empty($dateTo)) {
        $where[] = "o.date_created_gmt <= %s";
        $params[] = $dateTo . ' 23:59:59';
    }

    $whereSql = implode(' AND ', $where);

    // HPOS Aggregate Financial Queries
    $sql = "
        SELECT 
            o.id,
            o.total_amount,
            o.payment_method,
            o.transaction_id,
            (SELECT meta_value FROM {$metaTable} WHERE order_id = o.id AND meta_key = '_shahi_payment_status' LIMIT 1) as custom_pay_status
        FROM {$ordersTable} o
        WHERE {$whereSql}
    ";

    if (!empty($params)) {
        $rows = $wpdb->get_results($wpdb->prepare($sql, $params), ARRAY_A);
    } else {
        $rows = $wpdb->get_results($sql, ARRAY_A);
    }

    $totalGross = 0.0;
    $totalPaid = 0.0;
    $totalUnpaidCod = 0.0;
    $totalCollectedCod = 0.0;
    $totalOnlinePaid = 0.0;

    $countTotal = count($rows);
    $countPaid = 0;
    $countUnpaidCod = 0;

    $methodsBreakdown = [
        'cod' => ['label' => 'Cash on Delivery (COD)', 'count' => 0, 'amount' => 0.0, 'paid_amount' => 0.0, 'unpaid_amount' => 0.0],
        'razorpay' => ['label' => 'Razorpay / Online UPI', 'count' => 0, 'amount' => 0.0, 'paid_amount' => 0.0, 'unpaid_amount' => 0.0],
        'bacs' => ['label' => 'Direct Bank Transfer', 'count' => 0, 'amount' => 0.0, 'paid_amount' => 0.0, 'unpaid_amount' => 0.0]
    ];

    foreach ($rows as $r) {
        $amt = (float)$r['total_amount'];
        $m = $r['payment_method'] ?: 'cod';
        if ($m === 'gajak_razorpay') $m = 'razorpay';

        $totalGross += $amt;

        if (!isset($methodsBreakdown[$m])) {
            $methodsBreakdown[$m] = ['label' => ucfirst($m), 'count' => 0, 'amount' => 0.0, 'paid_amount' => 0.0, 'unpaid_amount' => 0.0];
        }
        $methodsBreakdown[$m]['count']++;
        $methodsBreakdown[$m]['amount'] += $amt;

        if ($m === 'cod') {
            // Strict COD payment safety
            if ($r['custom_pay_status'] === 'paid') {
                $totalPaid += $amt;
                $totalCollectedCod += $amt;
                $countPaid++;
                $methodsBreakdown[$m]['paid_amount'] += $amt;
            } else {
                $totalUnpaidCod += $amt;
                $countUnpaidCod++;
                $methodsBreakdown[$m]['unpaid_amount'] += $amt;
            }
        } else {
            // Online/Prepaid transactions
            $totalPaid += $amt;
            $totalOnlinePaid += $amt;
            $countPaid++;
            $methodsBreakdown[$m]['paid_amount'] += $amt;
        }
    }

    json_success([
        'metrics' => [
            'total_gross' => $totalGross,
            'total_paid' => $totalPaid,
            'total_unpaid_cod' => $totalUnpaidCod,
            'total_collected_cod' => $totalCollectedCod,
            'total_online_paid' => $totalOnlinePaid,
            'count_total' => $countTotal,
            'count_paid' => $countPaid,
            'count_unpaid_cod' => $countUnpaidCod
        ],
        'methods_breakdown' => $methodsBreakdown,
        'razorpay_status' => get_razorpay_gateway_status()
    ]);
}

// ========================================================
// 2. ACTION: PAYMENT TRANSACTIONS LIST (GET)
// ========================================================
if ($action === 'transactions') {
    $search = trim($_GET['search'] ?? '');
    $methodFilter = trim($_GET['method'] ?? 'all');
    $statusFilter = trim($_GET['status'] ?? 'all'); // 'all', 'paid', 'unpaid'
    $dateFrom = trim($_GET['date_from'] ?? '');
    $dateTo = trim($_GET['date_to'] ?? '');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(5, (int)($_GET['limit'] ?? 15)));

    $where = ["o.status NOT IN ('trash')"];
    $params = [];

    if (!empty($search)) {
        if (is_numeric($search)) {
            $where[] = "(o.id = %d OR o.transaction_id LIKE %s OR addr.phone LIKE %s)";
            $params[] = (int)$search;
            $params[] = '%' . $wpdb->esc_like($search) . '%';
            $params[] = '%' . $wpdb->esc_like($search) . '%';
        } else {
            $like = '%' . $wpdb->esc_like($search) . '%';
            $where[] = "(addr.first_name LIKE %s OR addr.last_name LIKE %s OR addr.email LIKE %s OR o.billing_email LIKE %s OR o.transaction_id LIKE %s)";
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
            $params[] = $like;
        }
    }

    if ($methodFilter !== 'all' && !empty($methodFilter)) {
        if ($methodFilter === 'razorpay') {
            $where[] = "(o.payment_method = 'razorpay' OR o.payment_method = 'gajak_razorpay')";
        } else {
            $where[] = "o.payment_method = %s";
            $params[] = $methodFilter;
        }
    }

    if ($statusFilter === 'paid') {
        $where[] = "((o.payment_method != 'cod' AND o.status NOT IN ('wc-pending', 'wc-failed', 'wc-cancelled')) OR EXISTS (SELECT 1 FROM {$metaTable} WHERE order_id = o.id AND meta_key = '_shahi_payment_status' AND meta_value = 'paid'))";
    } elseif ($statusFilter === 'unpaid') {
        $where[] = "(o.payment_method = 'cod' AND NOT EXISTS (SELECT 1 FROM {$metaTable} WHERE order_id = o.id AND meta_key = '_shahi_payment_status' AND meta_value = 'paid'))";
    }

    if (!empty($dateFrom)) {
        $where[] = "o.date_created_gmt >= %s";
        $params[] = $dateFrom . ' 00:00:00';
    }
    if (!empty($dateTo)) {
        $where[] = "o.date_created_gmt <= %s";
        $params[] = $dateTo . ' 23:59:59';
    }

    $whereSql = implode(' AND ', $where);

    // Total Count
    $countSql = "SELECT COUNT(o.id) FROM {$ordersTable} o LEFT JOIN {$addrTable} addr ON o.id = addr.order_id AND addr.address_type = 'billing' WHERE {$whereSql}";
    if (!empty($params)) {
        $totalItems = (int)$wpdb->get_var($wpdb->prepare($countSql, $params));
    } else {
        $totalItems = (int)$wpdb->get_var($countSql);
    }

    $totalPages = max(1, (int)ceil($totalItems / $limit));
    $offset = ($page - 1) * $limit;

    // Fetch Paginated
    $querySql = "
        SELECT 
            o.id,
            o.date_created_gmt,
            o.date_updated_gmt,
            o.status,
            o.total_amount,
            o.payment_method,
            o.payment_method_title,
            o.transaction_id,
            addr.first_name,
            addr.last_name,
            COALESCE(addr.email, o.billing_email) as email,
            addr.phone,
            (SELECT meta_value FROM {$metaTable} WHERE order_id = o.id AND meta_key = '_shahi_payment_status' LIMIT 1) as custom_pay_status,
            (SELECT meta_value FROM {$metaTable} WHERE order_id = o.id AND meta_key = '_shahi_payment_collected_at' LIMIT 1) as collected_at,
            (SELECT meta_value FROM {$metaTable} WHERE order_id = o.id AND meta_key = '_order_platform' LIMIT 1) as platform
        FROM {$ordersTable} o
        LEFT JOIN {$addrTable} addr ON o.id = addr.order_id AND addr.address_type = 'billing'
        WHERE {$whereSql}
        ORDER BY o.date_created_gmt DESC
        LIMIT %d OFFSET %d
    ";

    $queryParams = array_merge($params, [$limit, $offset]);
    $rows = $wpdb->get_results($wpdb->prepare($querySql, $queryParams), ARRAY_A);

    $items = [];
    foreach ($rows as $r) {
        $methodKey = $r['payment_method'] ?: 'cod';
        if ($methodKey === 'gajak_razorpay') $methodKey = 'razorpay';

        $isCod = ($methodKey === 'cod');
        $isPaid = false;

        if ($isCod) {
            $isPaid = ($r['custom_pay_status'] === 'paid');
        } else {
            $isPaid = ($r['custom_pay_status'] === 'paid' || in_array($r['status'], ['wc-processing', 'wc-completed']) || !empty($r['transaction_id']));
        }

        $custName = trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? ''));
        if (empty($custName)) $custName = 'Guest Patron';

        $methodDisplay = $r['payment_method_title'] ?: ($isCod ? 'Cash on Delivery (COD)' : 'Razorpay / UPI');

        $items[] = [
            'order_id' => (int)$r['id'],
            'order_number' => '#' . $r['id'],
            'date' => date('d M Y, h:i A', strtotime($r['date_created_gmt'])),
            'customer_name' => html_entity_decode($custName, ENT_QUOTES, 'UTF-8'),
            'email' => $r['email'],
            'phone' => $r['phone'] ?: '—',
            'amount' => (float)$r['total_amount'],
            'payment_method' => $methodKey,
            'payment_method_title' => $methodDisplay,
            'is_cod' => $isCod,
            'is_paid' => $isPaid,
            'status_label' => $isPaid ? ($isCod ? 'Paid (Cash Collected)' : 'Paid (Prepaid)') : 'Unpaid (COD - Due)',
            'status_badge' => $isPaid ? 'badge-paid' : 'badge-unpaid',
            'transaction_id' => $r['transaction_id'] ?: ($isCod ? ($isPaid ? 'COD-CASH-RECVD' : 'COD-PENDING') : 'RAZORPAY-TXN'),
            'date_paid' => $r['collected_at'] ? date('d M Y, h:i A', strtotime($r['collected_at'])) : ($isPaid ? date('d M Y, h:i A', strtotime($r['date_updated_gmt'])) : null),
            'is_react' => ($r['platform'] === 'Shree Shahi Gajak React Portal')
        ];
    }

    json_success([
        'transactions' => $items,
        'pagination' => [
            'total_items' => $totalItems,
            'total_pages' => $totalPages,
            'current_page' => $page,
            'limit' => $limit
        ]
    ]);
}

// ========================================================
// 3. ACTION: COLLECT COD CASH (POST)
// ========================================================
if ($action === 'collect_cod') {
    if ($method !== 'POST') {
        json_error('Method not allowed', 405);
    }

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];
    $orderId = (int)($data['order_id'] ?? 0);

    if ($orderId <= 0) {
        json_error('Valid Order ID is required.', 400);
    }

    $order = wc_get_order($orderId);
    if (!$order) {
        json_error("Order #{$orderId} not found.", 404);
    }

    $adminName = $auth['display_name'] ?: ($auth['username'] ?: 'Sahu Ji');
    $timestamp = current_time('mysql');

    // Update payment metadata safely
    $order->update_meta_data('_shahi_payment_status', 'paid');
    $order->update_meta_data('_shahi_payment_collected_at', $timestamp);
    $order->update_meta_data('_shahi_payment_collected_by', $adminName);

    // Add native order note
    $amountFormatted = number_format($order->get_total(), 2);
    $order->add_order_note(
        "💵 [Payment Verification] Cash on Delivery of ₹{$amountFormatted} collected and verified by Administrator {$adminName}.",
        false,
        true
    );

    $order->save();

    json_success([
        'order_id' => $orderId,
        'payment_status' => 'paid',
        'collected_at' => date('d M Y, h:i A', strtotime($timestamp)),
        'message' => "Cash on Delivery for Order #{$orderId} recorded as collected."
    ]);
}

// ========================================================
// 4. ACTION: EXPORT CSV (GET)
// ========================================================
if ($action === 'export_csv') {
    $sql = "
        SELECT 
            o.id,
            o.date_created_gmt,
            o.total_amount,
            o.payment_method,
            o.payment_method_title,
            o.transaction_id,
            addr.first_name,
            addr.last_name,
            addr.email,
            (SELECT meta_value FROM {$metaTable} WHERE order_id = o.id AND meta_key = '_shahi_payment_status' LIMIT 1) as custom_pay_status,
            (SELECT meta_value FROM {$metaTable} WHERE order_id = o.id AND meta_key = '_shahi_payment_collected_at' LIMIT 1) as collected_at
        FROM {$ordersTable} o
        LEFT JOIN {$addrTable} addr ON o.id = addr.order_id AND addr.address_type = 'billing'
        WHERE o.status NOT IN ('trash')
        ORDER BY o.date_created_gmt DESC
    ";

    $rows = $wpdb->get_results($sql, ARRAY_A);

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="shree_shahi_payments_' . date('Y_m_d_His') . '.csv"');
    header('Pragma: no-cache');
    header('Expires: 0');

    echo "\xEF\xBB\xBF";
    $output = fopen('php://output', 'w');
    fputcsv($output, [
        'Order ID',
        'Order Date',
        'Customer Name',
        'Customer Email',
        'Payment Method',
        'Order Amount (INR)',
        'Payment Status',
        'Transaction ID',
        'Settlement Date'
    ]);

    foreach ($rows as $r) {
        $isCod = ($r['payment_method'] === 'cod');
        $isPaid = ($isCod ? ($r['custom_pay_status'] === 'paid') : true);
        $name = trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? ''));

        fputcsv($output, [
            $r['id'],
            date('Y-m-d H:i:s', strtotime($r['date_created_gmt'])),
            $name ?: 'Guest Patron',
            $r['email'],
            $r['payment_method_title'] ?: ($isCod ? 'Cash on Delivery' : 'Online'),
            number_format((float)$r['total_amount'], 2, '.', ''),
            $isPaid ? 'Paid' : 'Unpaid (COD)',
            $r['transaction_id'] ?: ($isCod ? ($isPaid ? 'COD-CASH' : 'PENDING') : 'ONLINE'),
            $r['collected_at'] ? date('Y-m-d H:i:s', strtotime($r['collected_at'])) : ($isPaid ? date('Y-m-d H:i:s', strtotime($r['date_created_gmt'])) : '')
        ]);
    }

    fclose($output);
    exit();
}

json_error("Unknown payments action: {$action}", 400);

