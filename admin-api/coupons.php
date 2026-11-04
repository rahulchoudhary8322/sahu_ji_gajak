<?php
/**
 * SHREE SHAHI GAJAK - CUSTOM ADMIN PANEL
 * Coupons Management API (WooCommerce Native Coupon Engine)
 */

require_once __DIR__ . '/config.php';

// Strict Single Administrator Gate
$auth = admin_require_auth();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($method === 'POST' ? 'save' : 'list');

// Parse JSON input
$input = [];
if ($method === 'POST' || $method === 'PUT') {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        if (!empty($raw)) {
            $input = json_decode($raw, true) ?: [];
        }
    } else {
        $input = $_POST;
    }
}

// Discount type labels
$discountTypes = [
    'percent' => 'Percentage Discount (%)',
    'fixed_cart' => 'Fixed Cart Discount (₹)',
    'fixed_product' => 'Fixed Product Discount (₹)'
];

// ========================================================
// 1. ACTION: LIST COUPONS (GET)
// ========================================================
if ($action === 'list') {
    $search = trim($_GET['search'] ?? '');
    $statusFilter = trim($_GET['status'] ?? 'all'); // 'all', 'active', 'expired', 'draft'
    $typeFilter = trim($_GET['type'] ?? 'all');

    $args = [
        'post_type' => 'shop_coupon',
        'post_status' => ['publish', 'draft'],
        'posts_per_page' => -1,
        'orderby' => 'date',
        'order' => 'DESC'
    ];

    if (!empty($search)) {
        $args['s'] = $search;
    }

    $rawPosts = get_posts($args);

    $items = [];
    $totalCount = 0;
    $activeCount = 0;
    $expiredCount = 0;
    $totalDiscountGiven = 0.0;

    $now = time();

    foreach ($rawPosts as $p) {
        $coupon = new WC_Coupon($p->ID);
        $code = $coupon->get_code();
        $discType = $coupon->get_discount_type() ?: 'fixed_cart';
        $amount = (float)$coupon->get_amount();
        $expires = $coupon->get_date_expires();
        $isExpired = $expires && ($expires->getTimestamp() < $now);
        $isDraft = ($p->post_status === 'draft');
        $usageCount = (int)$coupon->get_usage_count();
        $usageLimit = $coupon->get_usage_limit();

        $totalCount++;
        if ($isExpired) {
            $expiredCount++;
        } elseif (!$isDraft) {
            $activeCount++;
        }

        // Apply filters
        if ($typeFilter !== 'all' && $discType !== $typeFilter) {
            continue;
        }

        if ($statusFilter === 'active' && ($isExpired || $isDraft)) {
            continue;
        } elseif ($statusFilter === 'expired' && !$isExpired) {
            continue;
        } elseif ($statusFilter === 'draft' && !$isDraft) {
            continue;
        }

        $items[] = [
            'id' => $p->ID,
            'code' => strtoupper($code),
            'discount_type' => $discType,
            'discount_type_label' => $discountTypes[$discType] ?? $discType,
            'amount' => $amount,
            'amount_display' => ($discType === 'percent') ? "{$amount}%" : "₹" . number_format($amount, 2),
            'description' => $coupon->get_description() ?: '',
            'usage_count' => $usageCount,
            'usage_limit' => $usageLimit ? (int)$usageLimit : null,
            'usage_limit_per_user' => $coupon->get_usage_limit_per_user() ? (int)$coupon->get_usage_limit_per_user() : null,
            'minimum_amount' => $coupon->get_minimum_amount() ? (float)$coupon->get_minimum_amount() : null,
            'maximum_amount' => $coupon->get_maximum_amount() ? (float)$coupon->get_maximum_amount() : null,
            'individual_use' => $coupon->get_individual_use(),
            'exclude_sale_items' => $coupon->get_exclude_sale_items(),
            'date_expires' => $expires ? $expires->date('Y-m-d') : null,
            'date_expires_formatted' => $expires ? $expires->date('d M Y') : 'Never Expires',
            'is_expired' => $isExpired,
            'status' => $p->post_status,
            'status_label' => $isExpired ? 'Expired' : ($isDraft ? 'Disabled' : 'Active'),
            'date_created' => $coupon->get_date_created() ? $coupon->get_date_created()->date('d M Y') : ''
        ];
    }

    json_success([
        'stats' => [
            'total' => $totalCount,
            'active' => $activeCount,
            'expired' => $expiredCount
        ],
        'discount_types' => $discountTypes,
        'coupons' => $items,
        'count' => count($items)
    ]);
}

// ========================================================
// 2. ACTION: GET COUPON DETAIL (GET)
// ========================================================
if ($action === 'detail') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        json_error('Coupon ID is required.', 400);
    }

    $coupon = new WC_Coupon($id);
    if (!$coupon->get_id()) {
        json_error('Coupon not found in WooCommerce register.', 404);
    }

    $post = get_post($id);
    $expires = $coupon->get_date_expires();

    json_success([
        'coupon' => [
            'id' => $coupon->get_id(),
            'code' => strtoupper($coupon->get_code()),
            'discount_type' => $coupon->get_discount_type() ?: 'fixed_cart',
            'amount' => (float)$coupon->get_amount(),
            'description' => $coupon->get_description() ?: '',
            'status' => $post ? $post->post_status : 'publish',
            'minimum_amount' => $coupon->get_minimum_amount() ? (float)$coupon->get_minimum_amount() : '',
            'maximum_amount' => $coupon->get_maximum_amount() ? (float)$coupon->get_maximum_amount() : '',
            'individual_use' => (bool)$coupon->get_individual_use(),
            'exclude_sale_items' => (bool)$coupon->get_exclude_sale_items(),
            'date_expires' => $expires ? $expires->date('Y-m-d') : '',
            'usage_limit' => $coupon->get_usage_limit() ?: '',
            'usage_limit_per_user' => $coupon->get_usage_limit_per_user() ?: '',
            'usage_count' => (int)$coupon->get_usage_count(),
            'email_restrictions' => implode(', ', $coupon->get_email_restrictions() ?: []),
            'product_ids' => $coupon->get_product_ids() ?: [],
            'excluded_product_ids' => $coupon->get_excluded_product_ids() ?: [],
            'product_categories' => $coupon->get_product_categories() ?: [],
            'excluded_product_categories' => $coupon->get_excluded_product_categories() ?: []
        ]
    ]);
}

// ========================================================
// 3. ACTION: SAVE COUPON (CREATE OR UPDATE) (POST)
// ========================================================
if ($action === 'save') {
    if ($method !== 'POST') {
        json_error('Method not allowed', 405);
    }

    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $code = trim($input['code'] ?? '');
    $discountType = trim($input['discount_type'] ?? 'fixed_cart');
    $amount = isset($input['amount']) ? (float)$input['amount'] : 0.0;
    $description = trim($input['description'] ?? '');
    $status = trim($input['status'] ?? 'publish');
    $minimumAmount = isset($input['minimum_amount']) && $input['minimum_amount'] !== '' ? (float)$input['minimum_amount'] : '';
    $maximumAmount = isset($input['maximum_amount']) && $input['maximum_amount'] !== '' ? (float)$input['maximum_amount'] : '';
    $individualUse = !empty($input['individual_use']);
    $excludeSaleItems = !empty($input['exclude_sale_items']);
    $dateExpires = trim($input['date_expires'] ?? '');
    $usageLimit = isset($input['usage_limit']) && $input['usage_limit'] !== '' ? (int)$input['usage_limit'] : 0;
    $usageLimitPerUser = isset($input['usage_limit_per_user']) && $input['usage_limit_per_user'] !== '' ? (int)$input['usage_limit_per_user'] : 0;
    $emailRestrictions = isset($input['email_restrictions']) ? array_filter(array_map('trim', explode(',', (string)$input['email_restrictions']))) : [];

    if (empty($code)) {
        json_error('Coupon code is required.', 400);
    }

    if ($amount <= 0) {
        json_error('Discount amount must be greater than zero.', 400);
    }

    if (!isset($discountTypes[$discountType])) {
        json_error("Invalid discount type: {$discountType}", 400);
    }

    // Check duplicate coupon code on new creation
    $existingId = wc_get_coupon_id_by_code($code);
    if ($existingId && $existingId !== $id) {
        json_error("A coupon with code '{$code}' already exists.", 400);
    }

    // Load or instantiate WC_Coupon
    $coupon = new WC_Coupon($id > 0 ? $id : null);
    $coupon->set_code(strtoupper($code));
    $coupon->set_discount_type($discountType);
    $coupon->set_amount($amount);
    $coupon->set_description($description);
    $coupon->set_individual_use($individualUse);
    $coupon->set_exclude_sale_items($excludeSaleItems);

    if ($minimumAmount !== '') {
        $coupon->set_minimum_amount($minimumAmount);
    } else {
        $coupon->set_minimum_amount('');
    }

    if ($maximumAmount !== '') {
        $coupon->set_maximum_amount($maximumAmount);
    } else {
        $coupon->set_maximum_amount('');
    }

    if (!empty($dateExpires)) {
        $coupon->set_date_expires($dateExpires);
    } else {
        $coupon->set_date_expires(null);
    }

    if ($usageLimit > 0) {
        $coupon->set_usage_limit($usageLimit);
    } else {
        $coupon->set_usage_limit(0);
    }

    if ($usageLimitPerUser > 0) {
        $coupon->set_usage_limit_per_user($usageLimitPerUser);
    } else {
        $coupon->set_usage_limit_per_user(0);
    }

    if (!empty($emailRestrictions)) {
        $coupon->set_email_restrictions($emailRestrictions);
    } else {
        $coupon->set_email_restrictions([]);
    }

    $savedId = $coupon->save();
    if (!$savedId) {
        json_error('Failed to save coupon in WooCommerce database.', 500);
    }

    // Update post status (publish vs draft)
    wp_update_post([
        'ID' => $savedId,
        'post_status' => $status
    ]);

    json_success([
        'coupon_id' => $savedId,
        'code' => strtoupper($code),
        'message' => $id > 0 ? "Coupon '{$code}' updated successfully." : "Coupon '{$code}' created successfully."
    ]);
}

// ========================================================
// 4. ACTION: DELETE COUPON (POST)
// ========================================================
if ($action === 'delete') {
    if ($method !== 'POST') {
        json_error('Method not allowed', 405);
    }

    $id = (int)($input['id'] ?? 0);
    if ($id <= 0) {
        json_error('Valid coupon ID required for deletion.', 400);
    }

    $coupon = new WC_Coupon($id);
    if (!$coupon->get_id()) {
        json_error('Coupon not found.', 404);
    }

    $code = $coupon->get_code();
    $res = wp_delete_post($id, true); // Permanent delete

    if (!$res) {
        json_error("Failed to delete coupon '{$code}'.", 500);
    }

    json_success([
        'deleted_id' => $id,
        'code' => $code,
        'message' => "Coupon '{$code}' permanently deleted."
    ]);
}

// ========================================================
// 5. ACTION: EXPORT CSV (GET)
// ========================================================
if ($action === 'export_csv') {
    $coupons = get_posts([
        'post_type' => 'shop_coupon',
        'post_status' => ['publish', 'draft'],
        'posts_per_page' => -1
    ]);

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="shree_shahi_coupons_' . date('Y_m_d_His') . '.csv"');
    header('Pragma: no-cache');
    header('Expires: 0');

    echo "\xEF\xBB\xBF";
    $output = fopen('php://output', 'w');
    fputcsv($output, [
        'Coupon ID',
        'Coupon Code',
        'Discount Type',
        'Discount Amount',
        'Usage Count',
        'Usage Limit',
        'Min Spend (INR)',
        'Max Spend (INR)',
        'Expiry Date',
        'Status'
    ]);

    foreach ($coupons as $p) {
        $c = new WC_Coupon($p->ID);
        $exp = $c->get_date_expires();
        fputcsv($output, [
            $p->ID,
            strtoupper($c->get_code()),
            $discountTypes[$c->get_discount_type()] ?? $c->get_discount_type(),
            $c->get_amount(),
            $c->get_usage_count(),
            $c->get_usage_limit() ?: 'Unlimited',
            $c->get_minimum_amount() ?: 'None',
            $c->get_maximum_amount() ?: 'None',
            $exp ? $exp->date('Y-m-d') : 'Never',
            $p->post_status
        ]);
    }

    fclose($output);
    exit();
}

json_error("Unknown coupons action: {$action}", 400);

