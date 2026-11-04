<?php
/**
 * SHREE SHAHI GAJAK - CUSTOM ADMIN PANEL
 * Orders Management & Fulfilment API (HPOS Compatible)
 */

require_once __DIR__ . '/config.php';

// Strict Single Administrator Gate
$auth = admin_require_auth();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($method === 'POST' ? 'update_fulfilment' : 'list');

// Parse JSON input for POST/PUT requests
$input = [];
if ($method === 'POST' || $method === 'PUT') {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $input = json_decode($raw, true) ?: [];
    }
}

global $wpdb;
$ordersTable = $wpdb->prefix . 'wc_orders';
$ordersMetaTable = $wpdb->prefix . 'wc_orders_meta';
$addressesTable = $wpdb->prefix . 'wc_order_addresses';
$itemsTable = $wpdb->prefix . 'woocommerce_order_items';
$itemMetaTable = $wpdb->prefix . 'woocommerce_order_itemmeta';

// Standard 7-Step Fulfilment Workflow
$workflowSteps = [
    'new_order' => [
        'key' => 'new_order',
        'label' => 'New Order',
        'step' => 1,
        'badge' => 'badge-new',
        'next' => 'confirmed'
    ],
    'confirmed' => [
        'key' => 'confirmed',
        'label' => 'Confirmed',
        'step' => 2,
        'badge' => 'badge-confirmed',
        'next' => 'processing_qc'
    ],
    'processing_qc' => [
        'key' => 'processing_qc',
        'label' => 'Processing & QC',
        'step' => 3,
        'badge' => 'badge-qc',
        'next' => 'packed'
    ],
    'packed' => [
        'key' => 'packed',
        'label' => 'Packed',
        'step' => 4,
        'badge' => 'badge-packed',
        'next' => 'dispatched'
    ],
    'dispatched' => [
        'key' => 'dispatched',
        'label' => 'Dispatched',
        'step' => 5,
        'badge' => 'badge-dispatched',
        'next' => 'out_for_delivery'
    ],
    'out_for_delivery' => [
        'key' => 'out_for_delivery',
        'label' => 'Out for Delivery',
        'step' => 6,
        'badge' => 'badge-out-delivery',
        'next' => 'delivered'
    ],
    'delivered' => [
        'key' => 'delivered',
        'label' => 'Delivered',
        'step' => 7,
        'badge' => 'badge-delivered',
        'next' => null
    ],
    'cancelled' => [
        'key' => 'cancelled',
        'label' => 'Cancelled',
        'step' => 0,
        'badge' => 'badge-cancelled',
        'next' => null
    ]
];

// Helper: Get fulfilment status for an order
function get_order_fulfilment_data($order) {
    global $workflowSteps;
    $statusKey = $order->get_meta('_shahi_fulfilment_status');
    $coreStatus = $order->get_status();

    if ($coreStatus === 'cancelled' || $coreStatus === 'failed') {
        $statusKey = 'cancelled';
    } elseif (empty($statusKey)) {
        // Derive initial step from core status
        if ($coreStatus === 'completed') {
            $statusKey = 'delivered';
        } elseif ($coreStatus === 'processing') {
            $statusKey = 'processing_qc';
        } elseif ($coreStatus === 'on-hold') {
            $statusKey = 'new_order';
        } else {
            $statusKey = 'new_order';
        }
    }

    $current = $workflowSteps[$statusKey] ?? $workflowSteps['new_order'];
    $history = $order->get_meta('_shahi_fulfilment_history') ?: [];

    return [
        'current_key' => $current['key'],
        'label' => $current['label'],
        'step' => $current['step'],
        'badge' => $current['badge'],
        'next_key' => $current['next'],
        'next_label' => $current['next'] ? ($workflowSteps[$current['next']]['label'] ?? null) : null,
        'history' => $history
    ];
}

// Helper: Get payment status with COD safety
function get_order_payment_data($order) {
    $method = $order->get_payment_method();
    $methodTitle = $order->get_payment_method_title() ?: 'Cash on Delivery';
    $customPayStatus = $order->get_meta('_shahi_payment_status');
    $txnId = $order->get_transaction_id();
    $datePaid = $order->get_date_paid();

    $isPaid = false;
    $statusLabel = 'Unpaid';

    if ($method === 'cod') {
        // Strict COD Safety: Unpaid until cash collection is explicitly recorded
        if ($customPayStatus === 'paid') {
            $isPaid = true;
            $statusLabel = 'Paid (Cash Collected)';
        } else {
            $isPaid = false;
            $statusLabel = 'Unpaid (COD - Due on Delivery)';
        }
    } else {
        if ($customPayStatus === 'paid' || $order->is_paid() || !empty($txnId)) {
            $isPaid = true;
            $statusLabel = 'Paid';
        } else {
            $isPaid = false;
            $statusLabel = 'Pending Payment';
        }
    }

    return [
        'method' => $method,
        'method_title' => $methodTitle,
        'is_paid' => $isPaid,
        'status_label' => $statusLabel,
        'status_key' => $isPaid ? 'paid' : 'unpaid',
        'transaction_id' => $txnId ?: null,
        'date_paid' => $datePaid ? $datePaid->format('Y-m-d H:i:s') : null
    ];
}

// =========================================================================
// ACTION 1: LIST ORDERS (SEARCH, FILTER, SORT, PAGINATE)
// =========================================================================
if ($action === 'list') {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $perPage = max(5, min(100, (int)($_GET['per_page'] ?? 15)));
    $offset = ($page - 1) * $perPage;

    $search = trim($_GET['search'] ?? '');
    $status = trim($_GET['status'] ?? 'all');
    $fulfilment = trim($_GET['fulfilment'] ?? 'all');
    $paymentMethod = trim($_GET['payment_method'] ?? 'all');
    $paymentStatus = trim($_GET['payment_status'] ?? 'all');
    $source = trim($_GET['source'] ?? 'all'); // 'all', 'react', 'legacy'
    $dateFrom = trim($_GET['date_from'] ?? '');
    $dateTo = trim($_GET['date_to'] ?? '');
    $orderby = trim($_GET['orderby'] ?? 'date');
    $orderDir = strtoupper(trim($_GET['order'] ?? 'DESC')) === 'ASC' ? 'ASC' : 'DESC';

    // Base WHERE conditions
    $where = ["1=1"];
    $params = [];

    // Search: ID, Customer name, Phone, Email
    if (!empty($search)) {
        if (is_numeric($search)) {
            $where[] = "(o.id = %d OR addr.phone LIKE %s OR addr.email LIKE %s OR o.billing_email LIKE %s)";
            $params[] = (int)$search;
            $params[] = '%' . $wpdb->esc_like($search) . '%';
            $params[] = '%' . $wpdb->esc_like($search) . '%';
            $params[] = '%' . $wpdb->esc_like($search) . '%';
        } else {
            $term = '%' . $wpdb->esc_like($search) . '%';
            $where[] = "(CONCAT(COALESCE(addr.first_name, ''), ' ', COALESCE(addr.last_name, '')) LIKE %s OR addr.email LIKE %s OR o.billing_email LIKE %s OR addr.phone LIKE %s OR addr.city LIKE %s)";
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
            $params[] = $term;
        }
    }

    // Core WooCommerce Status filter
    if ($status !== 'all' && !empty($status)) {
        $st = str_starts_with($status, 'wc-') ? $status : 'wc-' . $status;
        $where[] = "o.status = %s";
        $params[] = $st;
    }

    // Payment Method filter
    if ($paymentMethod !== 'all' && !empty($paymentMethod)) {
        $where[] = "o.payment_method = %s";
        $params[] = $paymentMethod;
    }

    // Date range filter
    if (!empty($dateFrom)) {
        $where[] = "o.date_created_gmt >= %s";
        $params[] = date('Y-m-d 00:00:00', strtotime($dateFrom));
    }
    if (!empty($dateTo)) {
        $where[] = "o.date_created_gmt <= %s";
        $params[] = date('Y-m-d 23:59:59', strtotime($dateTo));
    }

    // Source Filter: React vs Legacy
    if ($source === 'react') {
        $where[] = "EXISTS (SELECT 1 FROM {$ordersMetaTable} WHERE order_id = o.id AND meta_key = '_order_platform' AND meta_value = 'Shree Shahi Gajak React Portal')";
    } elseif ($source === 'legacy') {
        $where[] = "NOT EXISTS (SELECT 1 FROM {$ordersMetaTable} WHERE order_id = o.id AND meta_key = '_order_platform' AND meta_value = 'Shree Shahi Gajak React Portal')";
    }

    // Fulfilment Filter
    if ($fulfilment !== 'all' && !empty($fulfilment)) {
        $where[] = "EXISTS (SELECT 1 FROM {$ordersMetaTable} WHERE order_id = o.id AND meta_key = '_shahi_fulfilment_status' AND meta_value = %s)";
        $params[] = $fulfilment;
    }

    // Payment Status Filter (Paid vs Unpaid)
    if ($paymentStatus === 'paid') {
        $where[] = "((o.payment_method != 'cod' AND o.status NOT IN ('wc-pending', 'wc-failed', 'wc-cancelled')) OR EXISTS (SELECT 1 FROM {$ordersMetaTable} WHERE order_id = o.id AND meta_key = '_shahi_payment_status' AND meta_value = 'paid'))";
    } elseif ($paymentStatus === 'unpaid') {
        $where[] = "(o.payment_method = 'cod' AND NOT EXISTS (SELECT 1 FROM {$ordersMetaTable} WHERE order_id = o.id AND meta_key = '_shahi_payment_status' AND meta_value = 'paid'))";
    }

    $whereSql = implode(' AND ', $where);

    // Sorting columns
    $sortCol = 'o.date_created_gmt';
    if ($orderby === 'total') $sortCol = 'o.total_amount';
    elseif ($orderby === 'id') $sortCol = 'o.id';
    elseif ($orderby === 'customer') $sortCol = 'addr.first_name';

    // Count Total Items
    $countSql = "SELECT COUNT(o.id) FROM {$ordersTable} o LEFT JOIN {$addressesTable} addr ON o.id = addr.order_id AND addr.address_type = 'billing' WHERE {$whereSql}";
    if (!empty($params)) {
        $totalItems = (int)$wpdb->get_var($wpdb->prepare($countSql, $params));
    } else {
        $totalItems = (int)$wpdb->get_var($countSql);
    }

    // Fetch Paginated Orders
    $querySql = "
        SELECT 
            o.id,
            o.date_created_gmt,
            o.status,
            o.total_amount,
            addr.first_name as billing_first_name,
            addr.last_name as billing_last_name,
            COALESCE(addr.email, o.billing_email) as billing_email,
            addr.phone as billing_phone,
            addr.city as billing_city,
            addr.state as billing_state,
            o.payment_method,
            o.payment_method_title,
            (SELECT meta_value FROM {$ordersMetaTable} WHERE order_id = o.id AND meta_key = '_order_platform' LIMIT 1) as platform,
            (SELECT meta_value FROM {$ordersMetaTable} WHERE order_id = o.id AND meta_key = '_shahi_fulfilment_status' LIMIT 1) as fulfilment_meta,
            (SELECT meta_value FROM {$ordersMetaTable} WHERE order_id = o.id AND meta_key = '_shahi_payment_status' LIMIT 1) as payment_meta
        FROM {$ordersTable} o
        LEFT JOIN {$addressesTable} addr ON o.id = addr.order_id AND addr.address_type = 'billing'
        WHERE {$whereSql}
        ORDER BY {$sortCol} {$orderDir}
        LIMIT %d OFFSET %d
    ";

    $queryParams = array_merge($params, [$perPage, $offset]);
    $rawOrders = $wpdb->get_results($wpdb->prepare($querySql, $queryParams), ARRAY_A);

    // Collect Order IDs to batch-fetch items summary
    $orderIds = array_column($rawOrders, 'id');
    $itemsMap = [];
    if (!empty($orderIds)) {
        $idList = implode(',', array_map('intval', $orderIds));
        $itemRows = $wpdb->get_results("
            SELECT order_id, order_item_name 
            FROM {$itemsTable} 
            WHERE order_id IN ({$idList}) AND order_item_type = 'line_item'
            ORDER BY order_item_id ASC
        ", ARRAY_A);
        foreach ($itemRows as $ir) {
            $itemsMap[$ir['order_id']][] = $ir['order_item_name'];
        }
    }

    // Format final order list
    $orders = [];
    foreach ($rawOrders as $ro) {
        $oid = (int)$ro['id'];
        $isReact = ($ro['platform'] === 'Shree Shahi Gajak React Portal');
        $custName = trim($ro['billing_first_name'] . ' ' . $ro['billing_last_name']);
        if (empty($custName)) $custName = 'Guest Customer';

        // Fulfilment status resolution
        $fulfilmentKey = $ro['fulfilment_meta'];
        $coreStatus = str_replace('wc-', '', $ro['status']);
        if ($coreStatus === 'cancelled') {
            $fulfilmentKey = 'cancelled';
        } elseif (empty($fulfilmentKey)) {
            $fulfilmentKey = ($coreStatus === 'completed') ? 'delivered' : (($coreStatus === 'processing') ? 'processing_qc' : 'new_order');
        }
        $wfData = $workflowSteps[$fulfilmentKey] ?? $workflowSteps['new_order'];

        // Payment status resolution
        $isPaid = false;
        $payLabel = 'Unpaid';
        if ($ro['payment_method'] === 'cod') {
            if ($ro['payment_meta'] === 'paid') {
                $isPaid = true;
                $payLabel = 'Paid (Cash Collected)';
            } else {
                $isPaid = false;
                $payLabel = 'Unpaid (COD)';
            }
        } else {
            if ($ro['payment_meta'] === 'paid' || in_array($coreStatus, ['processing', 'completed'])) {
                $isPaid = true;
                $payLabel = 'Paid';
            } else {
                $isPaid = false;
                $payLabel = 'Pending Payment';
            }
        }

        $items = $itemsMap[$oid] ?? [];
        $itemsSummary = !empty($items) ? implode(', ', array_slice($items, 0, 2)) . (count($items) > 2 ? ' +' . (count($items) - 2) . ' more' : '') : 'Delicacies';

        $orders[] = [
            'id' => $oid,
            'date' => date('d M Y, h:i A', strtotime($ro['date_created_gmt'])),
            'raw_date' => $ro['date_created_gmt'],
            'customer_name' => $custName,
            'email' => $ro['billing_email'],
            'phone' => $ro['billing_phone'] ?: '—',
            'city' => $ro['billing_city'] ?: '—',
            'total' => (float)$ro['total_amount'],
            'formatted_total' => '₹' . number_format((float)$ro['total_amount'], 2),
            'payment_method' => $ro['payment_method_title'] ?: 'Cash on Delivery',
            'payment_code' => $ro['payment_method'],
            'payment_status' => $payLabel,
            'is_paid' => $isPaid,
            'core_status' => $coreStatus,
            'fulfilment_key' => $wfData['key'],
            'fulfilment_label' => $wfData['label'],
            'fulfilment_step' => $wfData['step'],
            'fulfilment_badge' => $wfData['badge'],
            'is_react' => $isReact,
            'source_badge' => $isReact ? 'REACT STOREFRONT' : 'HISTORICAL / TEST',
            'items_count' => count($items),
            'items_summary' => $itemsSummary
        ];
    }

    // Get Quick Summary Stats for Order Header
    $counts = [
        'total' => (int)$wpdb->get_var("SELECT COUNT(id) FROM {$ordersTable}"),
        'processing' => (int)$wpdb->get_var("SELECT COUNT(id) FROM {$ordersTable} WHERE status = 'wc-processing'"),
        'completed' => (int)$wpdb->get_var("SELECT COUNT(id) FROM {$ordersTable} WHERE status = 'wc-completed'"),
        'react' => (int)$wpdb->get_var("SELECT COUNT(DISTINCT order_id) FROM {$ordersMetaTable} WHERE meta_key = '_order_platform' AND meta_value = 'Shree Shahi Gajak React Portal'"),
        'cod_unpaid' => (int)$wpdb->get_var("SELECT COUNT(o.id) FROM {$ordersTable} o WHERE o.payment_method = 'cod' AND NOT EXISTS (SELECT 1 FROM {$ordersMetaTable} WHERE order_id = o.id AND meta_key = '_shahi_payment_status' AND meta_value = 'paid')")
    ];

    json_success([
        'orders' => $orders,
        'pagination' => [
            'total_items' => $totalItems,
            'total_pages' => ceil($totalItems / $perPage),
            'current_page' => $page,
            'per_page' => $perPage
        ],
        'counts' => $counts,
        'workflow_steps' => array_values($workflowSteps)
    ]);
}

// =========================================================================
// ACTION 2: ORDER DETAILS (FULL HPOS DATA, LINE ITEMS, NOTES & WORKFLOW)
// =========================================================================
if ($action === 'detail') {
    $orderId = (int)($_GET['id'] ?? 0);
    if ($orderId <= 0) {
        json_error('Invalid Order ID.', 400);
    }

    $order = wc_get_order($orderId);
    if (!$order) {
        json_error("Order #{$orderId} not found in WooCommerce database.", 404);
    }

    $fulfilmentData = get_order_fulfilment_data($order);
    $paymentData = get_order_payment_data($order);

    // Line items with high-res thumbnails and variation metadata
    $items = [];
    foreach ($order->get_items() as $itemId => $item) {
        $product = $item->get_product();
        $sku = $product ? $product->get_sku() : '';
        $imgId = $product ? $product->get_image_id() : 0;
        $imgUrl = $imgId ? wp_get_attachment_image_url($imgId, 'medium') : '';
        if (empty($imgUrl) && $product) {
            $imgUrl = wp_get_attachment_url($product->get_image_id());
        }

        // Format variation/weight attribute
        $variationData = [];
        $metaData = $item->get_meta_data();
        foreach ($metaData as $meta) {
            $key = $meta->key;
            if (!str_starts_with($key, '_')) {
                $variationData[$key] = $meta->value;
            }
        }
        $weightStr = $variationData['Weight'] ?? ($variationData['pa_weight'] ?? ($product ? $product->get_weight() : ''));

        $items[] = [
            'item_id' => $itemId,
            'product_id' => $item->get_product_id(),
            'variation_id' => $item->get_variation_id(),
            'name' => $item->get_name(),
            'sku' => $sku ?: 'GAJAK-STD',
            'quantity' => (int)$item->get_quantity(),
            'weight' => $weightStr ?: 'Standard Pack',
            'subtotal' => (float)$item->get_subtotal(),
            'total' => (float)$item->get_total(),
            'price' => (float)($item->get_quantity() > 0 ? ($item->get_total() / $item->get_quantity()) : $item->get_total()),
            'image_url' => $imgUrl ?: '/assets/delicacy-default.jpg'
        ];
    }

    // Comprehensive Order Notes History
    $rawNotes = wc_get_order_notes(['order_id' => $orderId]);
    $notes = [];
    foreach ($rawNotes as $rn) {
        $notes[] = [
            'id' => $rn->id,
            'date' => $rn->date_created->format('d M Y, h:i A'),
            'raw_date' => $rn->date_created->format('Y-m-d H:i:s'),
            'author' => $rn->added_by ?: 'System',
            'content' => $rn->content,
            'customer_note' => (bool)$rn->customer_note
        ];
    }

    // Source classification
    $platform = $order->get_meta('_order_platform');
    $isReact = ($platform === 'Shree Shahi Gajak React Portal');
    $landmark = $order->get_meta('_delivery_landmark');

    $detail = [
        'id' => $order->get_id(),
        'order_number' => '#' . $order->get_id(),
        'date' => $order->get_date_created()->format('d M Y, h:i A'),
        'raw_date' => $order->get_date_created()->format('Y-m-d H:i:s'),
        'core_status' => $order->get_status(),
        'is_react' => $isReact,
        'source_label' => $isReact ? 'React Storefront Portal' : 'Legacy / Historical Order',
        'customer' => [
            'name' => $order->get_formatted_billing_full_name() ?: 'Guest Customer',
            'first_name' => $order->get_billing_first_name(),
            'last_name' => $order->get_billing_last_name(),
            'email' => $order->get_billing_email() ?: 'No email on file',
            'phone' => $order->get_billing_phone() ?: 'No phone provided',
            'customer_id' => $order->get_customer_id()
        ],
        'billing_address' => [
            'full_name' => $order->get_formatted_billing_full_name(),
            'address_1' => $order->get_billing_address_1() ?: '—',
            'address_2' => $order->get_billing_address_2() ?: '',
            'city' => $order->get_billing_city() ?: '—',
            'state' => $order->get_billing_state() ?: '—',
            'postcode' => $order->get_billing_postcode() ?: '—',
            'country' => $order->get_billing_country() ?: 'IN'
        ],
        'shipping_address' => [
            'full_name' => $order->get_formatted_shipping_full_name() ?: $order->get_formatted_billing_full_name(),
            'address_1' => $order->get_shipping_address_1() ?: $order->get_billing_address_1() ?: '—',
            'address_2' => $order->get_shipping_address_2() ?: $order->get_billing_address_2() ?: '',
            'city' => $order->get_shipping_city() ?: $order->get_billing_city() ?: '—',
            'state' => $order->get_shipping_state() ?: $order->get_billing_state() ?: '—',
            'postcode' => $order->get_shipping_postcode() ?: $order->get_billing_postcode() ?: '—',
            'country' => $order->get_shipping_country() ?: 'IN',
            'phone' => $order->get_shipping_phone() ?: $order->get_billing_phone(),
            'landmark' => $landmark ?: '—'
        ],
        'financials' => [
            'subtotal' => (float)$order->get_subtotal(),
            'discount_total' => (float)$order->get_discount_total(),
            'shipping_total' => (float)$order->get_shipping_total(),
            'tax_total' => (float)$order->get_total_tax(),
            'total' => (float)$order->get_total(),
            'currency' => $order->get_currency() ?: 'INR',
            'currency_symbol' => '₹'
        ],
        'payment' => $paymentData,
        'fulfilment' => $fulfilmentData,
        'customer_note' => $order->get_customer_note() ?: 'None provided by customer.',
        'items' => $items,
        'notes' => $notes
    ];

    json_success(['order' => $detail]);
}

// =========================================================================
// ACTION 3: ADVANCE / UPDATE FULFILMENT STATUS (REAL BACKEND OPERATION)
// =========================================================================
if ($action === 'update_fulfilment') {
    if ($method !== 'POST') {
        json_error('Method not allowed', 405);
    }

    $orderId = (int)($input['order_id'] ?? 0);
    $targetStatus = trim($input['next_status'] ?? ($input['new_status'] ?? ($input['status'] ?? '')));
    $staffNote = trim($input['note'] ?? ($input['remarks'] ?? ''));

    if ($orderId <= 0 || empty($targetStatus)) {
        json_error('Missing Order ID or Target Fulfilment Status.', 400);
    }

    if (!isset($workflowSteps[$targetStatus])) {
        json_error("Invalid fulfilment status '{$targetStatus}'.", 400);
    }

    $order = wc_get_order($orderId);
    if (!$order) {
        json_error("Order #{$orderId} not found.", 404);
    }

    $fulfilmentData = get_order_fulfilment_data($order);
    $currentKey = $fulfilmentData['current_key'];
    $targetStep = $workflowSteps[$targetStatus];

    // Transition Validation: Allow advance, cancel, or step change
    // Prevent setting same status again
    if ($currentKey === $targetStatus) {
        json_error("Order is already at status '{$targetStep['label']}'.", 400);
    }

    $adminName = $auth['display_name'] ?: ($auth['username'] ?: 'Sahu Ji');
    $timestamp = current_time('mysql');
    $formattedDate = date('d M Y, h:i A', strtotime($timestamp));

    // 1. Build audit history record
    $historyRecord = [
        'status' => $targetStatus,
        'label' => $targetStep['label'],
        'from_status' => $currentKey,
        'timestamp' => $timestamp,
        'formatted_date' => $formattedDate,
        'admin_name' => $adminName,
        'admin_id' => $auth['id'],
        'note' => $staffNote ?: "Status advanced to {$targetStep['label']}"
    ];

    $existingHistory = (array)$order->get_meta('_shahi_fulfilment_history') ?: [];
    $existingHistory[] = $historyRecord;

    // 2. Update order metadata
    $order->update_meta_data('_shahi_fulfilment_status', $targetStatus);
    $order->update_meta_data('_shahi_fulfilment_history', $existingHistory);
    $order->update_meta_data('_shahi_last_updated_by', $adminName);
    $order->update_meta_data('_shahi_last_updated_at', $timestamp);

    // 3. Sync WooCommerce Core Status
    if ($targetStatus === 'delivered') {
        // Order completed & delivered
        $order->set_status('completed', "Delivered to patron. Fulfilment marked complete by Administrator {$adminName}.");
    } elseif ($targetStatus === 'cancelled') {
        $order->set_status('cancelled', "Order cancelled by Administrator {$adminName}." . ($staffNote ? " Reason: {$staffNote}" : ""));
    } else {
        // Keep in processing state while in kitchen/dispatch pipeline
        if ($order->get_status() !== 'processing') {
            $order->set_status('processing', "Fulfilment updated to {$targetStep['label']} by Administrator {$adminName}.");
        }
    }

    // 4. Add official WooCommerce Order Note
    $orderNoteContent = "👑 [Royal Fulfilment] Status updated to '{$targetStep['label']}' by Administrator {$adminName}.";
    if (!empty($staffNote)) {
        $orderNoteContent .= " Note: " . esc_html($staffNote);
    }
    $order->add_order_note($orderNoteContent, false, true);

    // 5. Save changes
    $order->save();

    json_success([
        'order_id' => $orderId,
        'fulfilment_status' => $targetStatus,
        'fulfilment_label' => $targetStep['label'],
        'fulfilment' => get_order_fulfilment_data($order),
        'message' => "Order #{$orderId} fulfilment status successfully advanced to '{$targetStep['label']}'."
    ]);
}

// =========================================================================
// ACTION 4: RECORD COD CASH COLLECTION / UPDATE PAYMENT STATUS
// =========================================================================
if ($action === 'update_payment_status') {
    if ($method !== 'POST') {
        json_error('Method not allowed', 405);
    }

    $orderId = (int)($input['order_id'] ?? 0);
    $payStatus = trim($input['payment_status'] ?? ''); // 'paid' or 'unpaid'
    $txnId = trim($input['transaction_id'] ?? '');
    $staffNote = trim($input['note'] ?? '');

    if ($orderId <= 0 || !in_array($payStatus, ['paid', 'unpaid'])) {
        json_error('Invalid parameters. Status must be paid or unpaid.', 400);
    }

    $order = wc_get_order($orderId);
    if (!$order) {
        json_error("Order #{$orderId} not found.", 404);
    }

    $adminName = $auth['display_name'] ?: 'Sahu Ji';
    $timestamp = current_time('mysql');

    if ($payStatus === 'paid') {
        $order->update_meta_data('_shahi_payment_status', 'paid');
        $order->update_meta_data('_shahi_payment_verified_by', $adminName);
        $order->update_meta_data('_shahi_payment_verified_at', $timestamp);
        if (!empty($txnId)) {
            $order->set_transaction_id($txnId);
        }

        // Official note
        $noteMsg = "💰 [Payment Verified] Order payment marked as PAID (Cash collected / verified) by Administrator {$adminName}. Amount: ₹" . $order->get_total();
        if ($staffNote) $noteMsg .= " | Note: " . esc_html($staffNote);
        $order->add_order_note($noteMsg, false, true);
    } else {
        $order->update_meta_data('_shahi_payment_status', 'unpaid');
        $noteMsg = "⚠️ [Payment Reverted] Order payment status reverted to UNPAID by Administrator {$adminName}.";
        if ($staffNote) $noteMsg .= " | Note: " . esc_html($staffNote);
        $order->add_order_note($noteMsg, false, true);
    }

    $order->save();

    json_success([
        'order_id' => $orderId,
        'payment' => get_order_payment_data($order),
        'message' => "Payment status for Order #{$orderId} successfully updated to " . strtoupper($payStatus) . "."
    ]);
}

// =========================================================================
// ACTION 5: ADD ADMIN ORDER NOTE
// =========================================================================
if ($action === 'add_note') {
    if ($method !== 'POST') {
        json_error('Method not allowed', 405);
    }

    $orderId = (int)($input['order_id'] ?? 0);
    $noteText = trim($input['note'] ?? '');
    $isCustomerNote = !empty($input['is_customer_note']);

    if ($orderId <= 0 || empty($noteText)) {
        json_error('Order ID and note text are required.', 400);
    }

    $order = wc_get_order($orderId);
    if (!$order) {
        json_error("Order #{$orderId} not found.", 404);
    }

    $adminName = $auth['display_name'] ?: 'Sahu Ji';
    $prefixedNote = "👑 [{$adminName}]: " . esc_html($noteText);
    $commentId = $order->add_order_note($prefixedNote, $isCustomerNote, true);

    json_success([
        'note_id' => $commentId,
        'message' => 'Order note added successfully.',
        'notes' => array_map(function($rn) {
            return [
                'id' => $rn->id,
                'date' => $rn->date_created->format('d M Y, h:i A'),
                'author' => $rn->added_by ?: 'System',
                'content' => $rn->content,
                'customer_note' => (bool)$rn->customer_note
            ];
        }, wc_get_order_notes(['order_id' => $orderId]))
    ]);
}

// =========================================================================
// ACTION 6: BULK STATUS UPDATE
// =========================================================================
if ($action === 'bulk_status') {
    if ($method !== 'POST') {
        json_error('Method not allowed', 405);
    }

    $orderIds = (array)($input['order_ids'] ?? []);
    $targetFulfilment = trim($input['fulfilment_status'] ?? '');

    if (empty($orderIds) || empty($targetFulfilment) || !isset($workflowSteps[$targetFulfilment])) {
        json_error('Please select orders and a valid target fulfilment status.', 400);
    }

    $adminName = $auth['display_name'] ?: 'Sahu Ji';
    $step = $workflowSteps[$targetFulfilment];
    $updatedCount = 0;

    foreach ($orderIds as $id) {
        $order = wc_get_order((int)$id);
        if ($order) {
            $order->update_meta_data('_shahi_fulfilment_status', $targetFulfilment);
            $order->update_meta_data('_shahi_last_updated_by', $adminName);
            $order->update_meta_data('_shahi_last_updated_at', current_time('mysql'));

            if ($targetFulfilment === 'delivered') {
                $order->set_status('completed', "Delivered (Bulk update by Administrator {$adminName})");
            } elseif ($targetFulfilment === 'cancelled') {
                $order->set_status('cancelled', "Cancelled (Bulk update by Administrator {$adminName})");
            }

            $order->add_order_note("👑 [Bulk Update] Fulfilment advanced to '{$step['label']}' by Administrator {$adminName}.", false, true);
            $order->save();
            $updatedCount++;
        }
    }

    json_success([
        'updated_count' => $updatedCount,
        'message' => "Successfully updated {$updatedCount} orders to '{$step['label']}'."
    ]);
}

// =========================================================================
// ACTION 7: EXPORT ORDERS TO CSV
// =========================================================================
if ($action === 'export_csv') {
    $search = trim($_GET['search'] ?? '');
    $status = trim($_GET['status'] ?? 'all');
    $source = trim($_GET['source'] ?? 'all');

    // Fetch orders for CSV
    $where = ["1=1"];
    $params = [];
    if (!empty($search)) {
        $term = '%' . $wpdb->esc_like($search) . '%';
        $where[] = "(CONCAT(o.billing_first_name, ' ', o.billing_last_name) LIKE %s OR o.billing_email LIKE %s OR o.billing_phone LIKE %s)";
        $params[] = $term; $params[] = $term; $params[] = $term;
    }
    if ($status !== 'all' && !empty($status)) {
        $where[] = "o.status = %s";
        $params[] = str_starts_with($status, 'wc-') ? $status : 'wc-' . $status;
    }
    if ($source === 'react') {
        $where[] = "EXISTS (SELECT 1 FROM {$ordersMetaTable} WHERE order_id = o.id AND meta_key = '_order_platform' AND meta_value = 'Shree Shahi Gajak React Portal')";
    }

    $whereSql = implode(' AND ', $where);
    $query = "SELECT id FROM {$ordersTable} o WHERE {$whereSql} ORDER BY o.id DESC LIMIT 500";
    $ids = !empty($params) ? $wpdb->get_col($wpdb->prepare($query, $params)) : $wpdb->get_col($query);

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename=shree_shahi_gajak_orders_' . date('Y-m-d_His') . '.csv');

    $output = fopen('php://output', 'w');
    // Add UTF-8 BOM for Excel compatibility
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    fputcsv($output, [
        'Order ID', 'Date', 'Customer Name', 'Customer Email', 'Phone',
        'Billing City', 'Billing State', 'Billing PIN',
        'Total Amount (INR)', 'Payment Method', 'Payment Status',
        'Fulfilment Status', 'Core Status', 'Store Source'
    ]);

    foreach ($ids as $id) {
        $order = wc_get_order($id);
        if (!$order) continue;
        $fulfil = get_order_fulfilment_data($order);
        $pay = get_order_payment_data($order);
        $isReact = ($order->get_meta('_order_platform') === 'Shree Shahi Gajak React Portal');

        fputcsv($output, [
            $order->get_id(),
            $order->get_date_created()->format('Y-m-d H:i:s'),
            $order->get_formatted_billing_full_name(),
            $order->get_billing_email(),
            $order->get_billing_phone(),
            $order->get_billing_city(),
            $order->get_billing_state(),
            $order->get_billing_postcode(),
            $order->get_total(),
            $order->get_payment_method_title(),
            $pay['status_label'],
            $fulfil['label'],
            $order->get_status(),
            $isReact ? 'React Storefront' : 'Historical'
        ]);
    }

    fclose($output);
    exit();
}

json_error('Invalid action requested.', 400);
