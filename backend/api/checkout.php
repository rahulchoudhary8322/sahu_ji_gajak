<?php
/**
 * SHREE SHAHI GAJAK
 * WooCommerce Checkout & Order Creation API Endpoint
 * 
 * Features:
 * - Real-time address/shipping calculation from WooCommerce shipping zones
 * - Real-time coupon validation with WC_Coupon (expiry, usage, min-spend)
 * - Anti-tampering price & inventory re-verification from database
 * - Secure WooCommerce order placement with native HPOS support
 * - Idempotency protection against duplicate submissions
 * - Strict input sanitization and Indian mobile/PIN validation
 */

error_reporting(0);
ini_set('display_errors', 0);

if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
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
    echo json_encode([
        'status' => 'error',
        'message' => 'WooCommerce core is not available. Please verify backend environment.'
    ]);
    exit();
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? ($_GET['action'] ?? 'config');

/**
 * -------------------------------------------------------------
 * 1. ACTION: 'config' or 'shipping'
 * Retrieve active payment gateways and calculate shipping
 * -------------------------------------------------------------
 */
// Route based on action
if ($action === 'config' || $action === 'calculate' || ($method === 'GET' && $action !== 'validate_coupon')) {
    $state = sanitize_text_field($_GET['state'] ?? ($input['state'] ?? 'RJ'));
    $pincode = sanitize_text_field($_GET['pincode'] ?? ($input['pincode'] ?? '302001'));
    $subtotal = floatval($_GET['subtotal'] ?? ($input['subtotal'] ?? 0));

    // A. Payment Gateways Inspection
    $gateways = WC()->payment_gateways->payment_gateways();
    $paymentMethods = [];

    // Cash on Delivery
    if (isset($gateways['cod']) && $gateways['cod']->enabled === 'yes') {
        $paymentMethods[] = [
            'id' => 'cod',
            'title' => 'Cash on Delivery (COD)',
            'description' => 'Pay cash upon delivery at your doorstep.',
            'active' => true,
            'is_default' => true
        ];
    }

    // Direct Bank Transfer
    if (isset($gateways['bacs']) && $gateways['bacs']->enabled === 'yes') {
        $paymentMethods[] = [
            'id' => 'bacs',
            'title' => 'Direct Bank Transfer / UPI',
            'description' => 'Make your payment directly into our royal bank account (NEFT / IMPS / UPI).',
            'active' => true,
            'is_default' => false
        ];
    }

    // Razorpay Gateway Check
    $razorpayActive = false;
    $razorpayMsg = 'Pending store owner API credentials in WooCommerce settings.';
    if (isset($gateways['razorpay'])) {
        $keyId = $gateways['razorpay']->get_option('key_id');
        $keySecret = $gateways['razorpay']->get_option('key_secret');
        if (!empty($keyId) && !empty($keySecret) && $gateways['razorpay']->enabled === 'yes') {
            $razorpayActive = true;
            $razorpayMsg = 'Instant payment via UPI, Credit/Debit Cards, NetBanking, and Wallets.';
        }
    }

    $paymentMethods[] = [
        'id' => 'razorpay',
        'title' => 'Razorpay (UPI / Cards / NetBanking)',
        'description' => $razorpayMsg,
        'active' => $razorpayActive,
        'configured' => $razorpayActive,
        'is_default' => false
    ];

    // B. Shipping Calculation based on State & Pincode
    $shippingMethods = [];
    $matchedZoneName = 'Default Zone';
    $shippingCost = 0;
    $shippingTitle = 'Standard Royal Delivery';

    try {
        $package = [
            'destination' => [
                'country' => 'IN',
                'state' => $state,
                'postcode' => $pincode,
                'city' => ''
            ],
            'contents' => [],
            'contents_cost' => $subtotal
        ];

        $matchedZone = WC_Shipping_Zones::get_zone_matching_package($package);
        if ($matchedZone) {
            $matchedZoneName = $matchedZone->get_zone_name();
            $zoneMethods = $matchedZone->get_shipping_methods(true);

            $hasFreeShipping = false;
            foreach ($zoneMethods as $zm) {
                if ($zm->id === 'free_shipping') {
                    $minAmount = floatval($zm->min_amount ?? 0);
                    if ($subtotal >= $minAmount) {
                        $hasFreeShipping = true;
                        $shippingMethods[] = [
                            'id' => $zm->id,
                            'title' => $zm->title ?: 'Free Royal Delivery',
                            'cost' => 0,
                            'min_amount' => $minAmount,
                            'selected' => true
                        ];
                        $shippingCost = 0;
                        $shippingTitle = $zm->title ?: 'Free Royal Delivery';
                        break;
                    }
                }
            }

            if (!$hasFreeShipping) {
                foreach ($zoneMethods as $zm) {
                    if ($zm->id === 'flat_rate') {
                        $cost = floatval($zm->cost ?? 0);
                        $shippingMethods[] = [
                            'id' => $zm->id,
                            'title' => $zm->title ?: 'Flat Rate Delivery',
                            'cost' => $cost,
                            'selected' => true
                        ];
                        $shippingCost = $cost;
                        $shippingTitle = $zm->title ?: 'Flat Rate Delivery';
                        break;
                    }
                }
            }
        }
    } catch (Exception $e) {
        $shippingMethods[] = [
            'id' => 'standard',
            'title' => 'Royal Express Delivery',
            'cost' => 0,
            'selected' => true
        ];
    }

    if (empty($shippingMethods)) {
        $shippingMethods[] = [
            'id' => 'free_standard',
            'title' => 'Complimentary Royal Delivery',
            'cost' => 0,
            'selected' => true
        ];
    }

    echo json_encode([
        'status' => 'success',
        'payment_methods' => $paymentMethods,
        'shipping' => [
            'zone' => $matchedZoneName,
            'cost' => $shippingCost,
            'title' => $shippingTitle,
            'methods' => $shippingMethods
        ]
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit();
}

/**
 * -------------------------------------------------------------
 * 2. ACTION: 'validate_coupon'
 * Real WooCommerce coupon validation (WC_Coupon)
 * -------------------------------------------------------------
 */
if ($action === 'validate_coupon') {
    $code = strtoupper(trim(sanitize_text_field($input['code'] ?? '')));
    $subtotal = floatval($input['subtotal'] ?? 0);

    if (empty($code)) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'Please enter a coupon code.'
        ]);
        exit();
    }

    $coupon = new WC_Coupon($code);
    if (!$coupon->get_id() || $coupon->get_status() !== 'publish') {
        http_response_code(404);
        echo json_encode([
            'status' => 'error',
            'message' => 'The coupon code "' . htmlspecialchars($code) . '" is invalid or does not exist.'
        ]);
        exit();
    }

    // Check expiration date
    $expiry = $coupon->get_date_expires();
    if ($expiry && $expiry->getTimestamp() < time()) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'This coupon expired on ' . $expiry->date_i18n(wc_date_format()) . '.'
        ]);
        exit();
    }

    // Check usage limits
    $usageLimit = $coupon->get_usage_limit();
    $usageCount = $coupon->get_usage_count();
    if ($usageLimit > 0 && $usageCount >= $usageLimit) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'This coupon has reached its maximum usage limit.'
        ]);
        exit();
    }

    // Check minimum spend
    $minSpend = floatval($coupon->get_minimum_amount());
    if ($minSpend > 0 && $subtotal < $minSpend) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'A minimum cart subtotal of ₹' . number_format($minSpend, 2) . ' is required to apply this coupon.'
        ]);
        exit();
    }

    // Check maximum spend
    $maxSpend = floatval($coupon->get_maximum_amount());
    if ($maxSpend > 0 && $subtotal > $maxSpend) {
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'The maximum spend for this coupon is ₹' . number_format($maxSpend, 2) . '.'
        ]);
        exit();
    }

    // Calculate discount value
    $discountType = $coupon->get_discount_type();
    $couponAmount = floatval($coupon->get_amount());
    $discountValue = 0;

    if ($discountType === 'percent') {
        $discountValue = round(($subtotal * $couponAmount) / 100, 2);
    } elseif ($discountType === 'fixed_cart') {
        $discountValue = min($subtotal, $couponAmount);
    } else {
        $discountValue = min($subtotal, $couponAmount);
    }

    echo json_encode([
        'status' => 'success',
        'code' => $coupon->get_code(),
        'discount_type' => $discountType,
        'coupon_amount' => $couponAmount,
        'discount_value' => $discountValue,
        'description' => $coupon->get_description() ?: 'Royal Discount Applied',
        'message' => 'Coupon "' . $coupon->get_code() . '" applied successfully! You save ₹' . number_format($discountValue, 2) . '.'
    ]);
    exit();
}

/**
 * -------------------------------------------------------------
 * 3. ACTION: 'create_order'
 * Full genuine WooCommerce order creation with server validation
 * -------------------------------------------------------------
 */
if ($action === 'create_order') {
    // A. Validate Customer Information
    $firstName = sanitize_text_field($input['first_name'] ?? '');
    $lastName = sanitize_text_field($input['last_name'] ?? '');
    $fullName = sanitize_text_field($input['full_name'] ?? '');
    if (empty($firstName) && !empty($fullName)) {
        $parts = explode(' ', trim($fullName), 2);
        $firstName = $parts[0];
        $lastName = $parts[1] ?? '.';
    }
    if (empty($lastName)) {
        $lastName = '.';
    }

    $phone = preg_replace('/[^0-9]/', '', sanitize_text_field($input['phone'] ?? ''));
    $email = sanitize_email($input['email'] ?? '');

    if (empty($firstName) || strlen($firstName) < 2) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please provide a valid Full Name.']);
        exit();
    }

    // Validate Indian Mobile Number (10 digits starting with 6, 7, 8, or 9)
    if (!preg_match('/^[6-9]\d{9}$/', $phone)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please provide a valid 10-digit Indian mobile number.']);
        exit();
    }

    // Validate Email Address
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please provide a valid email address.']);
        exit();
    }

    // B. Validate Delivery Address
    $address1 = sanitize_text_field($input['address_1'] ?? ($input['house_flat'] ?? ''));
    $address2 = sanitize_text_field($input['address_2'] ?? ($input['street_area'] ?? ''));
    $landmark = sanitize_text_field($input['landmark'] ?? '');
    $city = sanitize_text_field($input['city'] ?? '');
    $state = sanitize_text_field($input['state'] ?? 'RJ');
    $postcode = preg_replace('/[^0-9]/', '', sanitize_text_field($input['postcode'] ?? ($input['pincode'] ?? '')));
    $country = 'IN';

    if (empty($address1) || strlen($address1) < 3) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please provide your House/Flat number and building details.']);
        exit();
    }
    if (empty($address2) || strlen($address2) < 3) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please provide your Street, Colony, or Area name.']);
        exit();
    }
    if (empty($city) || strlen($city) < 2) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please provide your City.']);
        exit();
    }
    if (empty($state)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please select your State.']);
        exit();
    }
    // Validate Indian PIN Code (6 digits, first digit 1-9)
    if (!preg_match('/^[1-9][0-9]{5}$/', $postcode)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Please provide a valid 6-digit Indian PIN code.']);
        exit();
    }

    // C. Validate Payment Method
    $paymentMethod = sanitize_text_field($input['payment_method'] ?? 'cod');
    $validGateways = ['cod', 'bacs'];
    if ($paymentMethod === 'razorpay') {
        // Check if Razorpay is configured
        $gateways = WC()->payment_gateways->payment_gateways();
        $keyId = isset($gateways['razorpay']) ? $gateways['razorpay']->get_option('key_id') : null;
        if (empty($keyId)) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Razorpay online gateway is currently pending merchant credential setup by the store owner. Please choose Cash on Delivery (COD) or Direct Bank Transfer.'
            ]);
            exit();
        }
        $validGateways[] = 'razorpay';
    }

    if (!in_array($paymentMethod, $validGateways, true)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Selected payment method is currently unavailable.']);
        exit();
    }

    // D. Duplicate Order Protection (Idempotency Key)
    $idempotencyKey = sanitize_text_field($input['idempotency_key'] ?? '');
    if (!empty($idempotencyKey)) {
        global $wpdb;
        $existingOrderId = $wpdb->get_var($wpdb->prepare(
            "SELECT order_id FROM {$wpdb->prefix}wc_orders_meta WHERE meta_key = '_idempotency_key' AND meta_value = %s LIMIT 1",
            $idempotencyKey
        ));

        if (!$existingOrderId) {
            // Also check postmeta for backward compatibility
            $existingOrderId = $wpdb->get_var($wpdb->prepare(
                "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_idempotency_key' AND meta_value = %s LIMIT 1",
                $idempotencyKey
            ));
        }

        if ($existingOrderId) {
            $existingOrder = wc_get_order($existingOrderId);
            if ($existingOrder) {
                echo json_encode([
                    'status' => 'success',
                    'duplicate_prevented' => true,
                    'order_id' => $existingOrder->get_id(),
                    'order_number' => $existingOrder->get_order_number(),
                    'order_key' => $existingOrder->get_order_key(),
                    'total' => $existingOrder->get_total(),
                    'message' => 'Order already placed successfully!'
                ]);
                exit();
            }
        }
    }

    // E. Server-Side Cart & Inventory Validation
    $clientCart = $input['cart_items'] ?? ($_SESSION['cart'] ?? []);
    if (empty($clientCart) || !is_array($clientCart)) {
        http_response_code(400);
        echo json_encode(['status' => 'error', 'message' => 'Your royal cart is empty. Please add items to proceed.']);
        exit();
    }

    $verifiedItems = [];
    $serverSubtotal = 0;

    foreach ($clientCart as $item) {
        $productId = intval($item['id'] ?? ($item['product_id'] ?? 0));
        $qty = max(1, intval($item['quantity'] ?? 1));
        $selectedWeight = sanitize_text_field($item['weight'] ?? '500g');

        $product = wc_get_product($productId);
        if (!$product || $product->get_status() !== 'publish') {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Product "' . htmlspecialchars($item['name'] ?? "ID $productId") . '" is no longer available.'
            ]);
            exit();
        }

        if (!$product->is_in_stock()) {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => 'Product "' . $product->get_name() . '" is currently out of stock.'
            ]);
            exit();
        }

        // Never trust client price: read real price from WooCommerce
        $realPrice = floatval($product->get_price());
        $lineSubtotal = round($realPrice * $qty, 2);
        $serverSubtotal += $lineSubtotal;

        $verifiedItems[] = [
            'product' => $product,
            'quantity' => $qty,
            'real_price' => $realPrice,
            'line_subtotal' => $lineSubtotal,
            'weight' => $selectedWeight
        ];
    }

    // F. Re-validate Coupon Server-Side
    $couponCode = strtoupper(trim(sanitize_text_field($input['coupon_code'] ?? '')));
    $discountTotal = 0;
    $validCoupon = null;

    if (!empty($couponCode)) {
        $testCoupon = new WC_Coupon($couponCode);
        if ($testCoupon->get_id() && $testCoupon->get_status() === 'publish' && $testCoupon->is_valid()) {
            $minSpend = floatval($testCoupon->get_minimum_amount());
            if ($minSpend <= 0 || $serverSubtotal >= $minSpend) {
                $validCoupon = $testCoupon;
                $discType = $testCoupon->get_discount_type();
                $cAmount = floatval($testCoupon->get_amount());
                if ($discType === 'percent') {
                    $discountTotal = round(($serverSubtotal * $cAmount) / 100, 2);
                } else {
                    $discountTotal = min($serverSubtotal, $cAmount);
                }
            }
        }
    }

    // G. Calculate Actual Shipping Server-Side
    $shippingFee = 0;
    $shippingTitle = 'Standard Royal Delivery';
    $package = [
        'destination' => [
            'country' => 'IN',
            'state' => $state,
            'postcode' => $postcode,
            'city' => $city
        ],
        'contents' => [],
        'contents_cost' => $serverSubtotal
    ];

    try {
        $matchedZone = WC_Shipping_Zones::get_zone_matching_package($package);
        if ($matchedZone) {
            $methods = $matchedZone->get_shipping_methods(true);
            $hasFree = false;
            foreach ($methods as $m) {
                if ($m->id === 'free_shipping') {
                    $minAmt = floatval($m->min_amount ?? 0);
                    if ($serverSubtotal >= $minAmt) {
                        $hasFree = true;
                        $shippingFee = 0;
                        $shippingTitle = $m->title ?: 'Free Royal Delivery';
                        break;
                    }
                }
            }
            if (!$hasFree) {
                foreach ($methods as $m) {
                    if ($m->id === 'flat_rate') {
                        $shippingFee = floatval($m->cost ?? 0);
                        $shippingTitle = $m->title ?: 'Flat Rate Delivery';
                        break;
                    }
                }
            }
        }
    } catch (Exception $e) {
        $shippingFee = 0;
    }

    $finalTotal = round(max(0, $serverSubtotal - $discountTotal + $shippingFee), 2);

    // H. Create Genuine WooCommerce Order (HPOS Compatible)
    try {
        $order = wc_create_order();
        if (!$order) {
            throw new Exception('Could not initialize WooCommerce order.');
        }

        // 1. Add line items
        foreach ($verifiedItems as $vItem) {
            $order->add_product($vItem['product'], $vItem['quantity'], [
                'subtotal' => $vItem['line_subtotal'],
                'total' => $vItem['line_subtotal'],
                'variation' => ['Weight' => $vItem['weight']]
            ]);
        }

        // 2. Add shipping line
        $shippingItem = new WC_Order_Item_Shipping();
        $shippingItem->set_method_title($shippingTitle);
        $shippingItem->set_method_id('shahi_shipping');
        $shippingItem->set_total($shippingFee);
        $order->add_item($shippingItem);

        // 3. Apply coupon line if verified
        if ($validCoupon) {
            $order->apply_coupon($validCoupon->get_code());
        }

        // 4. Set Billing Details
        $order->set_billing_first_name($firstName);
        $order->set_billing_last_name($lastName);
        $order->set_billing_phone($phone);
        $order->set_billing_email($email);
        $order->set_billing_address_1($address1);
        $order->set_billing_address_2($address2 . (!empty($landmark) ? " (Landmark: $landmark)" : ''));
        $order->set_billing_city($city);
        $order->set_billing_state($state);
        $order->set_billing_postcode($postcode);
        $order->set_billing_country('IN');

        // 5. Set Shipping Details
        $order->set_shipping_first_name($firstName);
        $order->set_shipping_last_name($lastName);
        $order->set_shipping_phone($phone);
        $order->set_shipping_address_1($address1);
        $order->set_shipping_address_2($address2 . (!empty($landmark) ? " (Landmark: $landmark)" : ''));
        $order->set_shipping_city($city);
        $order->set_shipping_state($state);
        $order->set_shipping_postcode($postcode);
        $order->set_shipping_country('IN');

        // 6. Payment Method & Order Status Assignment
        if ($paymentMethod === 'cod') {
            $order->set_payment_method('cod');
            $order->set_payment_method_title('Cash on Delivery (COD)');
            $order->set_status('processing', 'Royal Order Placed via React Portal (Cash on Delivery)');
        } elseif ($paymentMethod === 'bacs') {
            $order->set_payment_method('bacs');
            $order->set_payment_method_title('Direct Bank Transfer');
            $order->set_status('on-hold', 'Awaiting direct bank transfer / UPI payment receipt');
        } else {
            $order->set_payment_method('pending');
            $order->set_payment_method_title('Online Gateway');
            $order->set_status('pending', 'Pending payment authorization');
        }

        // 7. Save custom order metadata
        if (!empty($idempotencyKey)) {
            $order->update_meta_data('_idempotency_key', $idempotencyKey);
        }
        $order->update_meta_data('_order_platform', 'Shree Shahi Gajak React Portal');
        $order->update_meta_data('_delivery_landmark', $landmark);
        $order->update_meta_data('_customer_mobile', $phone);

        // 8. Calculate final totals & save to database (HPOS + Posts table)
        $order->calculate_totals();
        $orderId = $order->save();

        // 9. Clear session cart
        $_SESSION['cart'] = [];

        // 10. Format order response
        echo json_encode([
            'status' => 'success',
            'order_id' => $order->get_id(),
            'order_number' => $order->get_order_number(),
            'order_key' => $order->get_order_key(),
            'total' => floatval($order->get_total()),
            'currency' => 'INR',
            'payment_method' => $paymentMethod,
            'status_label' => wc_get_order_status_name($order->get_status()),
            'message' => 'Royal order #' . $order->get_order_number() . ' has been successfully placed!'
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        exit();

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to create royal order: ' . $e->getMessage()
        ]);
        exit();
    }
}

// Fallback for unknown actions
http_response_code(400);
echo json_encode(['status' => 'error', 'message' => 'Invalid action request.']);
exit();
