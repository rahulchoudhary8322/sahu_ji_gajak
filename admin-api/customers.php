<?php
/**
 * SHREE SHAHI GAJAK - CUSTOM ADMIN PANEL
 * Customers Management API (WooCommerce HPOS Compatible)
 */

require_once __DIR__ . '/config.php';

// Strict Single Administrator Gate
$auth = admin_require_auth();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'list';

global $wpdb;
$ordersTable = $wpdb->prefix . 'wc_orders';
$addrTable = $wpdb->prefix . 'wc_order_addresses';
$metaTable = $wpdb->prefix . 'wc_orders_meta';
$usersTable = $wpdb->prefix . 'users';

// ========================================================
// 1. ACTION: LIST CUSTOMERS (GET)
// ========================================================
if ($action === 'list') {
    $search = trim($_GET['search'] ?? '');
    $typeFilter = trim($_GET['type'] ?? 'all'); // 'all', 'registered', 'guest'
    $sortBy = trim($_GET['sort_by'] ?? 'spent_desc');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(5, (int)($_GET['limit'] ?? 15)));

    $lookupTable = $wpdb->prefix . 'wc_customer_lookup';

    // Aggregate customers by billing email from HPOS orders
    // Join wp_users by authentic user_email (never conflate o.customer_id with wp_users.ID)
    // Join wp_wc_customer_lookup by email for WooCommerce Analytics customer_id
    $sql = "
        SELECT 
            COALESCE(NULLIF(addr.email, ''), NULLIF(o.billing_email, '')) as email,
            MAX(u.ID) as wp_user_id,
            MAX(u.user_login) as wp_user_login,
            MAX(cl.customer_id) as wc_customer_id,
            MAX(addr.first_name) as first_name,
            MAX(addr.last_name) as last_name,
            MAX(addr.phone) as phone,
            MAX(addr.city) as city,
            MAX(addr.state) as state,
            MAX(addr.postcode) as postcode,
            COUNT(DISTINCT o.id) as order_count,
            SUM(o.total_amount) as lifetime_spent,
            MIN(o.date_created_gmt) as first_order_date,
            MAX(o.date_created_gmt) as last_order_date,
            MAX(u.user_registered) as user_registered
        FROM {$ordersTable} o
        LEFT JOIN {$addrTable} addr ON o.id = addr.order_id AND addr.address_type = 'billing'
        LEFT JOIN {$usersTable} u ON LOWER(u.user_email) = LOWER(COALESCE(NULLIF(addr.email, ''), NULLIF(o.billing_email, '')))
        LEFT JOIN {$lookupTable} cl ON LOWER(cl.email) = LOWER(COALESCE(NULLIF(addr.email, ''), NULLIF(o.billing_email, '')))
        WHERE o.status NOT IN ('trash')
          AND (addr.email IS NOT NULL AND addr.email != '' OR o.billing_email IS NOT NULL AND o.billing_email != '')
    ";

    $params = [];

    // Search filter
    if (!empty($search)) {
        $like = '%' . $wpdb->esc_like($search) . '%';
        $sql .= " AND (addr.first_name LIKE %s OR addr.last_name LIKE %s OR addr.email LIKE %s OR o.billing_email LIKE %s OR addr.phone LIKE %s OR addr.city LIKE %s) ";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    $sql .= " GROUP BY email ";

    // Type filter: registered vs guest
    if ($typeFilter === 'registered') {
        $sql .= " HAVING wp_user_id IS NOT NULL AND wp_user_id > 0 ";
    } elseif ($typeFilter === 'guest') {
        $sql .= " HAVING (wp_user_id IS NULL OR wp_user_id = 0) ";
    }

    // Sorting
    switch ($sortBy) {
        case 'spent_asc':
            $sql .= " ORDER BY lifetime_spent ASC ";
            break;
        case 'orders_desc':
            $sql .= " ORDER BY order_count DESC, lifetime_spent DESC ";
            break;
        case 'orders_asc':
            $sql .= " ORDER BY order_count ASC ";
            break;
        case 'name_asc':
            $sql .= " ORDER BY first_name ASC ";
            break;
        case 'date_desc':
            $sql .= " ORDER BY last_order_date DESC ";
            break;
        case 'date_asc':
            $sql .= " ORDER BY first_order_date ASC ";
            break;
        case 'spent_desc':
        default:
            $sql .= " ORDER BY lifetime_spent DESC ";
            break;
    }

    // Execute query
    if (!empty($params)) {
        $allCustomers = $wpdb->get_results($wpdb->prepare($sql, $params), ARRAY_A);
    } else {
        $allCustomers = $wpdb->get_results($sql, ARRAY_A);
    }

    $totalCustomers = count($allCustomers);
    $registeredCount = 0;
    $guestCount = 0;
    $totalSpendAll = 0.0;

    foreach ($allCustomers as $c) {
        $isReg = !empty($c['wp_user_id']) && ((int)$c['wp_user_id'] > 0);
        if ($isReg) {
            $registeredCount++;
        } else {
            $guestCount++;
        }
        $totalSpendAll += (float)($c['lifetime_spent'] ?? 0);
    }

    $avgSpend = $totalCustomers > 0 ? ($totalSpendAll / $totalCustomers) : 0;

    // Pagination
    $totalPages = max(1, (int)ceil($totalCustomers / $limit));
    $offset = ($page - 1) * $limit;
    $pagedCustomers = array_slice($allCustomers, $offset, $limit);

    $items = [];
    foreach ($pagedCustomers as $c) {
        $wpUserId = !empty($c['wp_user_id']) ? (int)$c['wp_user_id'] : 0;
        $wcCustId = !empty($c['wc_customer_id']) ? (int)$c['wc_customer_id'] : 0;
        $isReg = ($wpUserId > 0);
        $fullName = trim(($c['first_name'] ?? '') . ' ' . ($c['last_name'] ?? ''));
        if (empty($fullName)) {
            $fullName = 'Patron (' . substr($c['email'], 0, strpos($c['email'], '@')) . ')';
        }

        $items[] = [
            'id' => md5(strtolower($c['email'])),
            'customer_id' => $wpUserId,
            'wp_user_id' => $wpUserId,
            'wc_customer_id' => $wcCustId,
            'wp_user_login' => $c['wp_user_login'] ?? null,
            'name' => html_entity_decode($fullName, ENT_QUOTES, 'UTF-8'),
            'first_name' => html_entity_decode($c['first_name'] ?? '', ENT_QUOTES, 'UTF-8'),
            'last_name' => html_entity_decode($c['last_name'] ?? '', ENT_QUOTES, 'UTF-8'),
            'email' => $c['email'],
            'phone' => $c['phone'] ?: '—',
            'city' => $c['city'] ?: '—',
            'state' => $c['state'] ?: '—',
            'type' => $isReg ? 'registered' : 'guest',
            'type_label' => $isReg ? '👑 Registered Patron' : '🏛️ Guest Patron',
            'order_count' => (int)$c['order_count'],
            'lifetime_spent' => (float)$c['lifetime_spent'],
            'first_order_date' => $c['first_order_date'] ? date('d M Y', strtotime($c['first_order_date'])) : null,
            'last_order_date' => $c['last_order_date'] ? date('d M Y, h:i A', strtotime($c['last_order_date'])) : null,
            'user_registered' => (!empty($c['user_registered'])) ? date('d M Y', strtotime($c['user_registered'])) : null
        ];
    }

    json_success([
        'stats' => [
            'total' => $totalCustomers,
            'registered' => $registeredCount,
            'guest' => $guestCount,
            'total_spend' => $totalSpendAll,
            'average_spend' => round($avgSpend, 2)
        ],
        'customers' => $items,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $totalPages,
            'total_items' => $totalCustomers,
            'limit' => $limit
        ]
    ]);
}

// ========================================================
// 2. ACTION: GET CUSTOMER DETAIL & ORDER HISTORY (GET)
// ========================================================
if ($action === 'detail') {
    $email = trim($_GET['email'] ?? '');
    if (empty($email)) {
        json_error('Customer email is required.', 400);
    }

    // Fetch customer's orders from HPOS
    $ordersSql = "
        SELECT 
            o.id,
            o.date_created_gmt,
            o.status,
            o.total_amount,
            o.payment_method,
            o.payment_method_title,
            addr.first_name,
            addr.last_name,
            addr.phone,
            addr.address_1,
            addr.address_2,
            addr.city,
            addr.state,
            addr.postcode,
            addr.country,
            o.customer_id,
            (SELECT meta_value FROM {$metaTable} WHERE order_id = o.id AND meta_key = '_order_platform' LIMIT 1) as platform,
            (SELECT meta_value FROM {$metaTable} WHERE order_id = o.id AND meta_key = '_shahi_fulfilment_status' LIMIT 1) as fulfilment_status,
            (SELECT meta_value FROM {$metaTable} WHERE order_id = o.id AND meta_key = '_shahi_payment_status' LIMIT 1) as payment_status
        FROM {$ordersTable} o
        LEFT JOIN {$addrTable} addr ON o.id = addr.order_id AND addr.address_type = 'billing'
        WHERE (addr.email = %s OR o.billing_email = %s)
          AND o.status NOT IN ('trash')
        ORDER BY o.date_created_gmt DESC
    ";

    $orderRows = $wpdb->get_results($wpdb->prepare($ordersSql, $email, $email), ARRAY_A);

    if (empty($orderRows)) {
        json_error("No customer records found for email: {$email}", 404);
    }

    // Authenticate whether customer is a registered WordPress user by authentic user_email
    $userObj = get_user_by('email', $email);
    $isReg = !empty($userObj);
    $wpUserId = $isReg ? (int)$userObj->ID : 0;
    $username = $isReg ? $userObj->user_login : null;
    $userRoles = ($isReg && !empty($userObj->roles)) ? implode(', ', $userObj->roles) : null;
    $regDate = ($isReg && $userObj->user_registered) ? date('d M Y', strtotime($userObj->user_registered)) : null;

    // Fetch WooCommerce customer lookup ID
    $lookupTable = $wpdb->prefix . 'wc_customer_lookup';
    $wcLookup = $wpdb->get_row($wpdb->prepare(
        "SELECT customer_id FROM {$lookupTable} WHERE LOWER(email) = LOWER(%s) LIMIT 1",
        $email
    ), ARRAY_A);
    $wcCustId = $wcLookup ? (int)$wcLookup['customer_id'] : 0;

    $latest = $orderRows[0];

    $ordersList = [];
    $totalSpend = 0.0;
    $completedCount = 0;
    $cancelledCount = 0;

    foreach ($orderRows as $row) {
        $amt = (float)$row['total_amount'];
        $totalSpend += $amt;
        if ($row['status'] === 'wc-completed') {
            $completedCount++;
        } elseif ($row['status'] === 'wc-cancelled' || $row['status'] === 'wc-failed') {
            $cancelledCount++;
        }

        // Fetch line items summary for order
        $wcOrd = wc_get_order($row['id']);
        $itemNames = [];
        if ($wcOrd) {
            foreach ($wcOrd->get_items() as $item) {
                $itemNames[] = $item->get_name() . ' × ' . $item->get_quantity();
            }
        }

        $ordersList[] = [
            'id' => (int)$row['id'],
            'order_number' => '#' . $row['id'],
            'date' => date('d M Y, h:i A', strtotime($row['date_created_gmt'])),
            'core_status' => $row['status'],
            'fulfilment_status' => $row['fulfilment_status'] ?: 'processing_qc',
            'payment_method' => $row['payment_method_title'] ?: ($row['payment_method'] === 'cod' ? 'Cash on Delivery' : 'Online'),
            'payment_status' => $row['payment_status'] ?: ($row['payment_method'] === 'cod' ? 'unpaid' : 'paid'),
            'total' => $amt,
            'is_react' => ($row['platform'] === 'Shree Shahi Gajak React Portal'),
            'items_summary' => implode(', ', $itemNames)
        ];
    }

    $fullName = trim(($latest['first_name'] ?? '') . ' ' . ($latest['last_name'] ?? ''));
    if (empty($fullName)) {
        $fullName = 'Patron (' . substr($email, 0, strpos($email, '@')) . ')';
    }

    json_success([
        'customer' => [
            'id' => md5(strtolower($email)),
            'customer_id' => $wpUserId,
            'wp_user_id' => $wpUserId,
            'wc_customer_id' => $wcCustId,
            'username' => $username,
            'user_role' => $userRoles,
            'name' => html_entity_decode($fullName, ENT_QUOTES, 'UTF-8'),
            'first_name' => html_entity_decode($latest['first_name'] ?? '', ENT_QUOTES, 'UTF-8'),
            'last_name' => html_entity_decode($latest['last_name'] ?? '', ENT_QUOTES, 'UTF-8'),
            'email' => $email,
            'phone' => $latest['phone'] ?: '—',
            'type' => $isReg ? 'registered' : 'guest',
            'type_label' => $isReg ? '👑 Registered Patron' : '🏛️ Guest Patron',
            'user_registered' => $regDate,
            'billing_address' => [
                'address_1' => $latest['address_1'] ?: '—',
                'address_2' => $latest['address_2'] ?: '',
                'city' => $latest['city'] ?: '—',
                'state' => $latest['state'] ?: '—',
                'postcode' => $latest['postcode'] ?: '—',
                'country' => $latest['country'] ?: 'IN'
            ],
            'financials' => [
                'total_orders' => count($orderRows),
                'completed_orders' => $completedCount,
                'cancelled_orders' => $cancelledCount,
                'lifetime_spent' => $totalSpend,
                'average_order_value' => count($orderRows) > 0 ? round($totalSpend / count($orderRows), 2) : 0
            ],
            'orders' => $ordersList
        ]
    ]);
}

// ========================================================
// 3. ACTION: EXPORT CSV (GET)
// ========================================================
if ($action === 'export_csv') {
    $lookupTable = $wpdb->prefix . 'wc_customer_lookup';

    $sql = "
        SELECT 
            COALESCE(NULLIF(addr.email, ''), NULLIF(o.billing_email, '')) as email,
            MAX(u.ID) as wp_user_id,
            MAX(cl.customer_id) as wc_customer_id,
            MAX(addr.first_name) as first_name,
            MAX(addr.last_name) as last_name,
            MAX(addr.phone) as phone,
            MAX(addr.city) as city,
            MAX(addr.state) as state,
            COUNT(DISTINCT o.id) as order_count,
            SUM(o.total_amount) as lifetime_spent,
            MIN(o.date_created_gmt) as first_order_date,
            MAX(o.date_created_gmt) as last_order_date
        FROM {$ordersTable} o
        LEFT JOIN {$addrTable} addr ON o.id = addr.order_id AND addr.address_type = 'billing'
        LEFT JOIN {$usersTable} u ON LOWER(u.user_email) = LOWER(COALESCE(NULLIF(addr.email, ''), NULLIF(o.billing_email, '')))
        LEFT JOIN {$lookupTable} cl ON LOWER(cl.email) = LOWER(COALESCE(NULLIF(addr.email, ''), NULLIF(o.billing_email, '')))
        WHERE o.status NOT IN ('trash')
          AND (addr.email IS NOT NULL AND addr.email != '' OR o.billing_email IS NOT NULL AND o.billing_email != '')
        GROUP BY email
        ORDER BY lifetime_spent DESC
    ";

    $customers = $wpdb->get_results($sql, ARRAY_A);

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="shree_shahi_customers_' . date('Y_m_d_His') . '.csv"');
    header('Pragma: no-cache');
    header('Expires: 0');

    echo "\xEF\xBB\xBF"; // UTF-8 BOM
    $output = fopen('php://output', 'w');
    fputcsv($output, [
        'Customer Name',
        'Email Address',
        'Phone Number',
        'City',
        'State',
        'Customer Type',
        'WP User ID',
        'WC Lookup ID',
        'Total Orders',
        'Lifetime Spend (INR)',
        'First Order Date',
        'Last Order Date'
    ]);

    foreach ($customers as $c) {
        $wpUserId = !empty($c['wp_user_id']) ? (int)$c['wp_user_id'] : 0;
        $wcCustId = !empty($c['wc_customer_id']) ? (int)$c['wc_customer_id'] : 0;
        $isReg = ($wpUserId > 0);
        $name = trim(($c['first_name'] ?? '') . ' ' . ($c['last_name'] ?? ''));
        fputcsv($output, [
            $name ?: 'Guest Patron',
            $c['email'],
            $c['phone'] ?: 'N/A',
            $c['city'] ?: 'N/A',
            $c['state'] ?: 'N/A',
            $isReg ? 'Registered' : 'Guest',
            $isReg ? $wpUserId : 'N/A',
            $wcCustId ?: 'N/A',
            $c['order_count'],
            number_format((float)$c['lifetime_spent'], 2, '.', ''),
            $c['first_order_date'] ? date('Y-m-d', strtotime($c['first_order_date'])) : '',
            $c['last_order_date'] ? date('Y-m-d', strtotime($c['last_order_date'])) : ''
        ]);
    }

    fclose($output);
    exit();
}

json_error("Unknown customers action: {$action}", 400);

