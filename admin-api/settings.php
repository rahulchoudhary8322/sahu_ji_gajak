<?php
/**
 * SHREE SHAHI GAJAK - CUSTOM ADMIN PANEL
 * Phase E: Store Settings & Profile Management API
 * Official WordPress & WooCommerce API Integration
 */

require_once __DIR__ . '/config.php';

// Verify Admin Session
$auth = admin_require_auth();
$adminUser = $auth['user'];
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'get';

// Read JSON input
$input = [];
if ($method === 'POST' || $method === 'PUT') {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $input = json_decode($raw, true) ?: [];
    }
}

global $wpdb;

/**
 * Helper: Get Razorpay Status safely without exposing secret keys
 */
function get_razorpay_status_safe() {
    $rzpSettings = get_option('woocommerce_razorpay_settings', []);
    $enabled = !empty($rzpSettings['enabled']) && $rzpSettings['enabled'] === 'yes';
    $keyId = trim($rzpSettings['key_id'] ?? '');
    $keySecret = trim($rzpSettings['key_secret'] ?? '');
    $isConfigured = (!empty($keyId) && !empty($keySecret));

    return [
        'title' => 'Razorpay Payment Gateway (UPI, Cards, Netbanking)',
        'enabled' => $enabled,
        'configured' => $isConfigured,
        'status_label' => $isConfigured ? 'Live & Connected' : 'Razorpay Setup Pending',
        'key_id_masked' => $isConfigured ? substr($keyId, 0, 8) . '...' : null
    ];
}

// ========================================================
// 1. ACTION: GET ALL SETTINGS (GET)
// ========================================================
if ($action === 'get') {
    // 1. Store Identity
    $identity = [
        'store_name' => get_bloginfo('name'),
        'store_description' => get_bloginfo('description'),
        'admin_email' => get_option('admin_email'),
        'store_phone' => get_option('woocommerce_store_phone', '+91 98290 12345'),
        'store_address_1' => get_option('woocommerce_store_address', 'Shree Shahi Gajak Darbar, Johari Bazaar'),
        'store_address_2' => get_option('woocommerce_store_address_2', 'Old City Heritage Complex'),
        'store_city' => get_option('woocommerce_store_city', 'Jaipur'),
        'store_state' => get_option('woocommerce_default_country', 'IN:RJ'),
        'store_postcode' => get_option('woocommerce_store_postcode', '302003'),
        'store_country' => 'India',
        'currency' => get_woocommerce_currency(),
        'currency_symbol' => html_entity_decode(get_woocommerce_currency_symbol(), ENT_QUOTES, 'UTF-8')
    ];

    // 2. Shipping Configuration
    $zones = WC_Shipping_Zones::get_zones();
    $zonesData = [];
    foreach ($zones as $zid => $zdata) {
        $zone = new WC_Shipping_Zone($zid);
        $methodsData = [];
        foreach ($zone->get_shipping_methods() as $m) {
            $cost = $m->get_option('cost', '0');
            $minAmount = $m->get_option('min_amount', '');
            $methodsData[] = [
                'id' => $m->id,
                'instance_id' => $m->instance_id,
                'title' => $m->get_title(),
                'enabled' => $m->is_enabled(),
                'cost' => (float)$cost,
                'min_amount' => $minAmount ? (float)$minAmount : null
            ];
        }
        $zonesData[] = [
            'zone_id' => $zid,
            'zone_name' => $zdata['zone_name'],
            'methods' => $methodsData
        ];
    }

    $srPluginFile = WP_PLUGIN_DIR . '/shiprocket/class-shiprocket-woocommerce-shipping.php';
    $isSrInstalled = file_exists($srPluginFile);
    $srConfigured = !empty(get_option('gajak_shiprocket_email')) || !empty(get_option('gajak_shiprocket_token'));

    $shippingSettings = [
        'zones' => $zonesData,
        'shiprocket' => [
            'installed' => $isSrInstalled,
            'configured' => $srConfigured,
            'status_label' => $srConfigured ? 'Configured' : 'Credentials Not Configured'
        ]
    ];

    // 3. Payment Gateways Status
    $codSettings = get_option('woocommerce_cod_settings', []);
    $codEnabled = !empty($codSettings['enabled']) && $codSettings['enabled'] === 'yes';

    $bacsSettings = get_option('woocommerce_bacs_settings', []);
    $bacsEnabled = !empty($bacsSettings['enabled']) && $bacsSettings['enabled'] === 'yes';

    $paymentGateways = [
        'cod' => [
            'id' => 'cod',
            'title' => 'Cash on Delivery (COD)',
            'enabled' => $codEnabled,
            'status_label' => $codEnabled ? 'Active (Accepting Orders)' : 'Disabled'
        ],
        'razorpay' => get_razorpay_status_safe(),
        'bacs' => [
            'id' => 'bacs',
            'title' => 'Direct Bank Transfer (NEFT/RTGS)',
            'enabled' => $bacsEnabled,
            'status_label' => $bacsEnabled ? 'Active' : 'Disabled'
        ]
    ];

    // 4. Notification Preferences
    $wcMailer = WC()->mailer();
    $wcEmails = $wcMailer->get_emails();
    $notifications = [];
    $trackedKeys = [
        'WC_Email_New_Order' => 'New Order Alert (Admin)',
        'WC_Email_Customer_Processing_Order' => 'Order Processing Confirmation (Customer)',
        'WC_Email_Customer_Completed_Order' => 'Order Delivered / Completed (Customer)',
        'WC_Email_Customer_Note' => 'Fulfilment Dispatch Note (Customer)'
    ];

    foreach ($trackedKeys as $k => $label) {
        if (isset($wcEmails[$k])) {
            $e = $wcEmails[$k];
            $notifications[] = [
                'id' => $k,
                'title' => $label,
                'enabled' => $e->is_enabled(),
                'recipient' => $e->get_recipient() ?: $adminUser->user_email
            ];
        }
    }

    // 5. Admin Profile
    $profile = [
        'id' => $adminUser->ID,
        'username' => $adminUser->user_login,
        'display_name' => $adminUser->display_name ?: $adminUser->user_login,
        'email' => $adminUser->user_email,
        'role' => 'Administrator'
    ];

    json_success([
        'identity' => $identity,
        'shipping' => $shippingSettings,
        'payments' => $paymentGateways,
        'notifications' => $notifications,
        'profile' => $profile
    ]);
}

// ========================================================
// 2. ACTION: UPDATE STORE IDENTITY (POST)
// ========================================================
if ($action === 'update_identity') {
    if ($method !== 'POST') {
        json_error('Method not allowed', 405);
    }

    $storeName = trim($input['store_name'] ?? '');
    $storeDesc = trim($input['store_description'] ?? '');
    $phone = trim($input['store_phone'] ?? '');
    $address1 = trim($input['store_address_1'] ?? '');
    $address2 = trim($input['store_address_2'] ?? '');
    $city = trim($input['store_city'] ?? '');
    $postcode = trim($input['store_postcode'] ?? '');

    if (empty($storeName)) {
        json_error('Store Name is required.', 400);
    }

    update_option('blogname', sanitize_text_field($storeName));
    if (!empty($storeDesc)) {
        update_option('blogdescription', sanitize_text_field($storeDesc));
    }
    if (!empty($phone)) {
        update_option('woocommerce_store_phone', sanitize_text_field($phone));
    }
    if (!empty($address1)) {
        update_option('woocommerce_store_address', sanitize_text_field($address1));
    }
    update_option('woocommerce_store_address_2', sanitize_text_field($address2));
    if (!empty($city)) {
        update_option('woocommerce_store_city', sanitize_text_field($city));
    }
    if (!empty($postcode)) {
        update_option('woocommerce_store_postcode', sanitize_text_field($postcode));
    }

    json_success([
        'store_name' => get_bloginfo('name'),
        'store_city' => get_option('woocommerce_store_city')
    ], 'Store identity and contact details updated successfully in WooCommerce registers.');
}

// ========================================================
// 3. ACTION: UPDATE ADMIN PROFILE (POST)
// ========================================================
if ($action === 'update_profile') {
    if ($method !== 'POST') {
        json_error('Method not allowed', 405);
    }

    $displayName = trim($input['display_name'] ?? '');
    $email = trim($input['email'] ?? '');

    if (empty($displayName) || empty($email)) {
        json_error('Display Name and Email are required.', 400);
    }

    if (!is_email($email)) {
        json_error('Invalid email address format.', 400);
    }

    wp_update_user([
        'ID' => $adminUser->ID,
        'display_name' => sanitize_text_field($displayName),
        'user_email' => sanitize_email($email)
    ]);

    json_success([
        'display_name' => $displayName,
        'email' => $email
    ], 'Administrator profile updated successfully.');
}

// ========================================================
// 4. ACTION: CHANGE ADMIN PASSWORD (POST)
// ========================================================
if ($action === 'change_password') {
    if ($method !== 'POST') {
        json_error('Method not allowed', 405);
    }

    $currentPass = $input['current_password'] ?? '';
    $newPass = $input['new_password'] ?? '';
    $confirmPass = $input['confirm_password'] ?? '';

    if (empty($currentPass) || empty($newPass)) {
        json_error('Please enter both your current password and new password.', 400);
    }

    if ($newPass !== $confirmPass) {
        json_error('New password and confirmation password do not match.', 400);
    }

    if (strlen($newPass) < 8) {
        json_error('New password must be at least 8 characters long for royal security.', 400);
    }

    // Verify current password
    if (!wp_check_password($currentPass, $adminUser->user_pass, $adminUser->ID)) {
        json_error('Current password is incorrect. Verification failed.', 401, 'INVALID_PASSWORD');
    }

    // Set new password
    wp_set_password($newPass, $adminUser->ID);

    // Issue refreshed single-admin token so the active session is not dropped
    $tokenData = generate_admin_token($adminUser->ID, 'admin');

    json_success([
        'new_token' => $tokenData['token'],
        'expires_at' => $tokenData['expires_at']
    ], 'Administrator password updated securely. New authentication credentials active.');
}

json_error("Unknown settings action: $action", 400);
