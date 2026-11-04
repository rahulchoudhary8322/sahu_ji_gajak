<?php
/**
 * SHREE SHAHI GAJAK - CUSTOM ADMIN PANEL
 * Products & Categories Management API (WooCommerce Native)
 */

require_once __DIR__ . '/config.php';

// Strict Single Administrator Access Check
$auth = admin_require_auth();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? ($method === 'POST' ? 'save' : 'list');

// Read JSON input for POST/PUT if Content-Type is application/json
$input = [];
if ($method === 'POST' || $method === 'PUT') {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    if (strpos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        if (!empty($raw)) {
            $input = json_decode($raw, true) ?: [];
        }
    } else {
        // Form post or multipart
        $input = $_POST;
    }
}

// ========================================================
// 1. ACTION: LIST PRODUCTS (GET)
// ========================================================
if ($action === 'list') {
    $search = trim($_GET['search'] ?? '');
    $categoryFilter = trim($_GET['category'] ?? '');
    $typeFilter = trim($_GET['type'] ?? '');
    $stockFilter = trim($_GET['stock_status'] ?? '');
    $featuredFilter = trim($_GET['featured'] ?? '');
    $sortBy = trim($_GET['sort_by'] ?? 'date_desc');
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(5, (int)($_GET['limit'] ?? 15)));

    // Base query args for wc_get_products
    $queryArgs = [
        'limit' => -1, // Get all matching for custom filtering and accurate stats
        'paginate' => false,
        'status' => ['publish', 'draft', 'pending', 'private'],
    ];

    if (!empty($search)) {
        $queryArgs['s'] = $search;
    }

    if (!empty($categoryFilter) && $categoryFilter !== 'all') {
        $queryArgs['category'] = [$categoryFilter];
    }

    if (!empty($typeFilter) && $typeFilter !== 'all') {
        $queryArgs['type'] = [$typeFilter];
    }

    if (!empty($stockFilter) && $stockFilter !== 'all') {
        $queryArgs['stock_status'] = $stockFilter;
    }

    if ($featuredFilter === '1' || $featuredFilter === 'featured') {
        $queryArgs['featured'] = true;
    }

    $allMatchingProducts = wc_get_products($queryArgs);

    // Compute Global Stats across all products
    $allWcProducts = wc_get_products(['limit' => -1, 'status' => ['publish', 'draft', 'pending', 'private']]);
    $totalCount = count($allWcProducts);
    $inStockCount = 0;
    $lowStockCount = 0;
    $outOfStockCount = 0;
    $variableCount = 0;

    foreach ($allWcProducts as $p) {
        $status = $p->get_stock_status();
        $qty = $p->get_stock_quantity();
        if ($p->is_type('variable')) {
            $variableCount++;
        }
        if ($status === 'outofstock' || ($qty !== null && $qty <= 0)) {
            $outOfStockCount++;
        } else {
            $inStockCount++;
            if ($qty !== null && $qty > 0 && $qty <= 10) {
                $lowStockCount++;
            }
        }
    }

    // Sort matching products
    usort($allMatchingProducts, function($a, $b) use ($sortBy) {
        switch ($sortBy) {
            case 'price_asc':
                return (float)$a->get_price() <=> (float)$b->get_price();
            case 'price_desc':
                return (float)$b->get_price() <=> (float)$a->get_price();
            case 'name_asc':
                return strcasecmp($a->get_name(), $b->get_name());
            case 'name_desc':
                return strcasecmp($b->get_name(), $a->get_name());
            case 'stock_asc':
                return (int)$a->get_stock_quantity() <=> (int)$b->get_stock_quantity();
            case 'stock_desc':
                return (int)$b->get_stock_quantity() <=> (int)$a->get_stock_quantity();
            case 'date_asc':
                $da = $a->get_date_created() ? $a->get_date_created()->getTimestamp() : 0;
                $db = $b->get_date_created() ? $b->get_date_created()->getTimestamp() : 0;
                return $da <=> $db;
            case 'date_desc':
            default:
                $da = $a->get_date_created() ? $a->get_date_created()->getTimestamp() : 0;
                $db = $b->get_date_created() ? $b->get_date_created()->getTimestamp() : 0;
                return $db <=> $da;
        }
    });

    $filteredTotal = count($allMatchingProducts);
    $totalPages = max(1, (int)ceil($filteredTotal / $limit));
    $offset = ($page - 1) * $limit;
    $pagedProducts = array_slice($allMatchingProducts, $offset, $limit);

    $items = [];
    foreach ($pagedProducts as $p) {
        $imgId = $p->get_image_id();
        $imgUrl = $imgId ? wp_get_attachment_image_url($imgId, 'medium') : '';
        if (empty($imgUrl)) {
            $imgUrl = wc_placeholder_img_src('medium');
        }

        // Categories
        $catIds = $p->get_category_ids();
        $cats = [];
        foreach ($catIds as $cid) {
            $term = get_term($cid, 'product_cat');
            if ($term && !is_wp_error($term)) {
                $cats[] = [
                    'id' => $term->term_id,
                    'name' => html_entity_decode($term->name, ENT_QUOTES, 'UTF-8'),
                    'slug' => $term->slug
                ];
            }
        }

        $type = $p->get_type();
        $variationsCount = 0;
        $variationsSummary = '';

        if ($p->is_type('variable')) {
            $children = $p->get_children();
            $variationsCount = count($children);
            $prices = $p->get_variation_prices();
            if (!empty($prices['price'])) {
                $minP = min($prices['price']);
                $maxP = max($prices['price']);
                $variationsSummary = ($minP == $maxP) ? '₹' . number_format($minP, 2) : '₹' . number_format($minP, 2) . ' - ₹' . number_format($maxP, 2);
            }
        }

        $items[] = [
            'id' => $p->get_id(),
            'name' => html_entity_decode($p->get_name(), ENT_QUOTES, 'UTF-8'),
            'slug' => $p->get_slug(),
            'sku' => $p->get_sku() ?: '—',
            'type' => $type,
            'status' => $p->get_status(),
            'price' => (float)$p->get_price(),
            'regular_price' => (float)$p->get_regular_price(),
            'sale_price' => $p->get_sale_price() ? (float)$p->get_sale_price() : null,
            'on_sale' => $p->is_on_sale(),
            'stock_status' => $p->get_stock_status(),
            'stock_quantity' => $p->get_stock_quantity(),
            'manage_stock' => $p->get_manage_stock(),
            'featured' => $p->is_featured(),
            'image' => [
                'id' => (int)$imgId,
                'url' => $imgUrl
            ],
            'categories' => $cats,
            'weight' => $p->get_weight() ? (float)$p->get_weight() : null,
            'variations_count' => $variationsCount,
            'variations_summary' => $variationsSummary,
            'date_created' => $p->get_date_created() ? $p->get_date_created()->date('Y-m-d H:i:s') : null,
        ];
    }

    json_success([
        'stats' => [
            'total' => $totalCount,
            'in_stock' => $inStockCount,
            'low_stock' => $lowStockCount,
            'out_of_stock' => $outOfStockCount,
            'variable' => $variableCount
        ],
        'products' => $items,
        'pagination' => [
            'current_page' => $page,
            'total_pages' => $totalPages,
            'total_items' => $filteredTotal,
            'limit' => $limit
        ]
    ]);
}

// ========================================================
// 2. ACTION: GET PRODUCT DETAIL (GET)
// ========================================================
if ($action === 'detail') {
    $id = (int)($_GET['id'] ?? 0);
    if ($id <= 0) {
        json_error('Valid product ID is required.', 400);
    }

    $product = wc_get_product($id);
    if (!$product) {
        json_error('Product not found in WooCommerce register.', 404);
    }

    $imgId = $product->get_image_id();
    $imgUrl = $imgId ? wp_get_attachment_image_url($imgId, 'large') : wc_placeholder_img_src('large');

    // Gallery images
    $galleryIds = $product->get_gallery_image_ids();
    $gallery = [];
    foreach ($galleryIds as $gid) {
        $url = wp_get_attachment_image_url($gid, 'medium');
        if ($url) {
            $gallery[] = [
                'id' => (int)$gid,
                'url' => $url
            ];
        }
    }

    // Categories
    $catIds = $product->get_category_ids();
    $cats = [];
    foreach ($catIds as $cid) {
        $term = get_term($cid, 'product_cat');
        if ($term && !is_wp_error($term)) {
            $cats[] = [
                'id' => $term->term_id,
                'name' => html_entity_decode($term->name, ENT_QUOTES, 'UTF-8'),
                'slug' => $term->slug
            ];
        }
    }

    // Variations & Attributes
    $variations = [];
    $attributes = [];

    $rawAttributes = $product->get_attributes();
    foreach ($rawAttributes as $attrKey => $attrObj) {
        if (is_a($attrObj, 'WC_Product_Attribute')) {
            $attributes[] = [
                'name' => $attrObj->get_name(),
                'slug' => sanitize_title($attrObj->get_name()),
                'options' => $attrObj->get_options(),
                'visible' => $attrObj->get_visible(),
                'variation' => $attrObj->get_variation(),
            ];
        }
    }

    if ($product->is_type('variable')) {
        $children = $product->get_children();
        foreach ($children as $cid) {
            $var = wc_get_product($cid);
            if (!$var) continue;

            $varImgId = $var->get_image_id();
            $varImgUrl = $varImgId ? wp_get_attachment_image_url($varImgId, 'medium') : $imgUrl;

            $variations[] = [
                'id' => $var->get_id(),
                'sku' => $var->get_sku() ?: '',
                'regular_price' => (float)$var->get_regular_price(),
                'sale_price' => $var->get_sale_price() ? (float)$var->get_sale_price() : null,
                'price' => (float)$var->get_price(),
                'manage_stock' => $var->get_manage_stock(),
                'stock_quantity' => $var->get_stock_quantity(),
                'stock_status' => $var->get_stock_status(),
                'weight' => $var->get_weight() ? (float)$var->get_weight() : null,
                'attributes' => $var->get_attributes(),
                'image' => [
                    'id' => (int)$varImgId,
                    'url' => $varImgUrl
                ]
            ];
        }
    }

    json_success([
        'product' => [
            'id' => $product->get_id(),
            'name' => html_entity_decode($product->get_name(), ENT_QUOTES, 'UTF-8'),
            'slug' => $product->get_slug(),
            'sku' => $product->get_sku(),
            'type' => $product->get_type(),
            'status' => $product->get_status(),
            'featured' => $product->is_featured(),
            'description' => $product->get_description(),
            'short_description' => $product->get_short_description(),
            'regular_price' => (float)$product->get_regular_price(),
            'sale_price' => $product->get_sale_price() ? (float)$product->get_sale_price() : null,
            'price' => (float)$product->get_price(),
            'manage_stock' => $product->get_manage_stock(),
            'stock_quantity' => $product->get_stock_quantity(),
            'stock_status' => $product->get_stock_status(),
            'weight' => $product->get_weight() ? (float)$product->get_weight() : null,
            'length' => $product->get_length() ? (float)$product->get_length() : null,
            'width' => $product->get_width() ? (float)$product->get_width() : null,
            'height' => $product->get_height() ? (float)$product->get_height() : null,
            'image' => [
                'id' => (int)$imgId,
                'url' => $imgUrl
            ],
            'gallery' => $gallery,
            'categories' => $cats,
            'attributes' => $attributes,
            'variations' => $variations,
            'date_created' => $product->get_date_created() ? $product->get_date_created()->date('Y-m-d H:i:s') : null,
            'date_modified' => $product->get_date_modified() ? $product->get_date_modified()->date('Y-m-d H:i:s') : null,
        ]
    ]);
}

// ========================================================
// 3. ACTION: SAVE PRODUCT (CREATE OR UPDATE) (POST)
// ========================================================
if ($action === 'save') {
    if ($method !== 'POST') {
        json_error('Method not allowed. Use POST.', 405);
    }

    $id = isset($input['id']) ? (int)$input['id'] : 0;
    $name = trim($input['name'] ?? '');
    $type = trim($input['type'] ?? 'simple'); // 'simple' or 'variable'
    $sku = trim($input['sku'] ?? '');
    $status = trim($input['status'] ?? 'publish');
    $featured = !empty($input['featured']);
    $description = $input['description'] ?? '';
    $shortDescription = $input['short_description'] ?? '';
    $regularPrice = isset($input['regular_price']) ? trim((string)$input['regular_price']) : '';
    $salePrice = isset($input['sale_price']) && $input['sale_price'] !== '' ? trim((string)$input['sale_price']) : '';
    $manageStock = !empty($input['manage_stock']);
    $stockQuantity = isset($input['stock_quantity']) && $input['stock_quantity'] !== '' ? (int)$input['stock_quantity'] : null;
    $stockStatus = trim($input['stock_status'] ?? 'instock');
    $weight = isset($input['weight']) && $input['weight'] !== '' ? trim((string)$input['weight']) : '';
    $length = isset($input['length']) && $input['length'] !== '' ? trim((string)$input['length']) : '';
    $width = isset($input['width']) && $input['width'] !== '' ? trim((string)$input['width']) : '';
    $height = isset($input['height']) && $input['height'] !== '' ? trim((string)$input['height']) : '';
    $categoryIds = isset($input['category_ids']) ? array_map('intval', (array)$input['category_ids']) : [];
    $imageId = isset($input['image_id']) ? (int)$input['image_id'] : 0;
    $galleryIds = isset($input['gallery_image_ids']) ? array_map('intval', (array)$input['gallery_image_ids']) : [];
    
    // Variations array for variable products
    $variationsData = isset($input['variations']) ? (array)$input['variations'] : [];
    $deletedVariationIds = isset($input['deleted_variation_ids']) ? array_map('intval', (array)$input['deleted_variation_ids']) : [];
    $attributesData = isset($input['attributes']) ? (array)$input['attributes'] : [];

    if (empty($name)) {
        json_error('Product name is required.', 400);
    }

    // Instantiate or load product
    if ($id > 0) {
        $product = wc_get_product($id);
        if (!$product) {
            json_error('Product not found for update.', 404);
        }

        // If product type changed from simple to variable or vice versa
        if ($product->get_type() !== $type) {
            wp_set_object_terms($id, $type, 'product_type');
            $product = wc_get_product($id);
        }
    } else {
        if ($type === 'variable') {
            $product = new WC_Product_Variable();
        } else {
            $product = new WC_Product_Simple();
        }
    }

    $product->set_name($name);
    $product->set_status($status);
    $product->set_featured($featured);
    $product->set_description($description);
    $product->set_short_description($shortDescription);

    if (!empty($sku)) {
        $product->set_sku($sku);
    }

    if ($type === 'simple') {
        $product->set_regular_price($regularPrice);
        $product->set_sale_price($salePrice);
        $product->set_manage_stock($manageStock);
        if ($manageStock) {
            $product->set_stock_quantity($stockQuantity);
            $product->set_stock_status($stockQuantity > 0 ? 'instock' : 'outofstock');
        } else {
            $product->set_stock_status($stockStatus);
        }
    } else {
        // Variable products manage prices/stock on children variations,
        // but can have an overarching stock status
        $product->set_manage_stock(false);
    }

    if ($weight !== '') $product->set_weight($weight);
    if ($length !== '') $product->set_length($length);
    if ($width !== '') $product->set_width($width);
    if ($height !== '') $product->set_height($height);

    if (!empty($categoryIds)) {
        $product->set_category_ids($categoryIds);
    }

    if ($imageId > 0) {
        $product->set_image_id($imageId);
    }

    if (!empty($galleryIds)) {
        $product->set_gallery_image_ids($galleryIds);
    }

    // Save parent product
    $savedId = $product->save();
    if (!$savedId) {
        json_error('Failed to save product in WooCommerce.', 500);
    }

    // Handle Variable Product Attributes and Variations
    if ($type === 'variable') {
        // 1. Setup attributes
        $wcAttributes = [];
        $attributeOptionsMap = [];

        if (!empty($attributesData)) {
            foreach ($attributesData as $attrItem) {
                $attrName = trim($attrItem['name'] ?? '');
                $options = isset($attrItem['options']) ? (array)$attrItem['options'] : [];
                if (empty($attrName) || empty($options)) continue;

                $attr = new WC_Product_Attribute();
                $attr->set_id(0); // custom product attribute
                $attr->set_name($attrName);
                $attr->set_options($options);
                $attr->set_position(0);
                $attr->set_visible(true);
                $attr->set_variation(true);

                $wcAttributes[sanitize_title($attrName)] = $attr;
                $attributeOptionsMap[sanitize_title($attrName)] = $options;
            }
        } elseif (!empty($variationsData)) {
            // Auto-detect attributes from variations if not explicitly supplied
            $autoOptions = [];
            foreach ($variationsData as $v) {
                if (!empty($v['attributes'])) {
                    foreach ($v['attributes'] as $attrK => $attrV) {
                        $key = sanitize_title($attrK);
                        if (!isset($autoOptions[$key])) $autoOptions[$key] = [];
                        if (!in_array($attrV, $autoOptions[$key])) {
                            $autoOptions[$key][] = $attrV;
                        }
                    }
                }
            }
            foreach ($autoOptions as $k => $opts) {
                $attr = new WC_Product_Attribute();
                $attr->set_id(0);
                $attr->set_name(ucwords(str_replace('-', ' ', $k)));
                $attr->set_options($opts);
                $attr->set_position(0);
                $attr->set_visible(true);
                $attr->set_variation(true);
                $wcAttributes[$k] = $attr;
            }
        }

        if (!empty($wcAttributes)) {
            $product->set_attributes($wcAttributes);
            $product->save();
        }

        // 2. Delete removed variations
        if (!empty($deletedVariationIds)) {
            foreach ($deletedVariationIds as $delVarId) {
                $childVar = wc_get_product($delVarId);
                if ($childVar && $childVar->get_parent_id() === $savedId) {
                    $childVar->delete(true);
                }
            }
        }

        // 3. Create / update variations
        foreach ($variationsData as $varRow) {
            $varId = isset($varRow['id']) ? (int)$varRow['id'] : 0;
            $varRegPrice = isset($varRow['regular_price']) ? trim((string)$varRow['regular_price']) : '';
            $varSalePrice = isset($varRow['sale_price']) && $varRow['sale_price'] !== '' ? trim((string)$varRow['sale_price']) : '';
            $varSku = trim($varRow['sku'] ?? '');
            $varWeight = isset($varRow['weight']) && $varRow['weight'] !== '' ? trim((string)$varRow['weight']) : '';
            $varManageStock = !empty($varRow['manage_stock']);
            $varStockQty = isset($varRow['stock_quantity']) && $varRow['stock_quantity'] !== '' ? (int)$varRow['stock_quantity'] : null;
            $varStockStatus = trim($varRow['stock_status'] ?? 'instock');
            $varAttributes = isset($varRow['attributes']) ? (array)$varRow['attributes'] : [];
            $varImgId = isset($varRow['image_id']) ? (int)$varRow['image_id'] : 0;

            if ($varId > 0) {
                $variation = wc_get_product($varId);
                if (!$variation || $variation->get_parent_id() !== $savedId) {
                    $variation = new WC_Product_Variation();
                    $variation->set_parent_id($savedId);
                }
            } else {
                $variation = new WC_Product_Variation();
                $variation->set_parent_id($savedId);
            }

            if (!empty($varSku)) {
                $variation->set_sku($varSku);
            }
            if ($varRegPrice !== '') {
                $variation->set_regular_price($varRegPrice);
            }
            if ($varSalePrice !== '') {
                $variation->set_sale_price($varSalePrice);
            }
            if ($varWeight !== '') {
                $variation->set_weight($varWeight);
            }

            $variation->set_manage_stock($varManageStock);
            if ($varManageStock) {
                $variation->set_stock_quantity($varStockQty);
                $variation->set_stock_status($varStockQty > 0 ? 'instock' : 'outofstock');
            } else {
                $variation->set_stock_status($varStockStatus);
            }

            if ($varImgId > 0) {
                $variation->set_image_id($varImgId);
            }

            // Set variation attributes
            if (!empty($varAttributes)) {
                $sanitizedAttrs = [];
                foreach ($varAttributes as $k => $v) {
                    $sanitizedAttrs[sanitize_title($k)] = $v;
                }
                $variation->set_attributes($sanitizedAttrs);
            }

            $variation->save();
        }

        // Sync variable product caches & price ranges
        WC_Product_Variable::sync($savedId);
        wc_delete_product_transients($savedId);
    }

    json_success([
        'product_id' => $savedId,
        'message' => $id > 0 ? 'Product updated successfully.' : 'Product created successfully.'
    ]);
}

// ========================================================
// 4. ACTION: DELETE PRODUCT (POST)
// ========================================================
if ($action === 'delete') {
    if ($method !== 'POST') {
        json_error('Method not allowed. Use POST.', 405);
    }

    $id = (int)($input['id'] ?? 0);
    if ($id <= 0) {
        json_error('Valid product ID is required for deletion.', 400);
    }

    $product = wc_get_product($id);
    if (!$product) {
        json_error('Product not found in WooCommerce.', 404);
    }

    $productName = $product->get_name();
    $force = !empty($input['force']); // If true, permanently delete; if false, move to trash

    $result = $product->delete($force);
    if (!$result) {
        json_error('Failed to delete product from database.', 500);
    }

    json_success([
        'deleted_id' => $id,
        'product_name' => $productName,
        'message' => "Product '{$productName}' deleted successfully."
    ]);
}

// ========================================================
// 5. ACTION: TOGGLE FEATURED (POST)
// ========================================================
if ($action === 'toggle_featured') {
    if ($method !== 'POST') {
        json_error('Method not allowed.', 405);
    }

    $id = (int)($input['id'] ?? 0);
    $product = wc_get_product($id);
    if (!$product) {
        json_error('Product not found.', 404);
    }

    $newFeatured = !$product->is_featured();
    $product->set_featured($newFeatured);
    $product->save();

    json_success([
        'id' => $id,
        'featured' => $newFeatured,
        'message' => $newFeatured ? 'Product marked as featured.' : 'Product removed from featured.'
    ]);
}

// ========================================================
// 6. ACTION: BULK ACTION (POST)
// ========================================================
if ($action === 'bulk_action') {
    if ($method !== 'POST') {
        json_error('Method not allowed.', 405);
    }

    $actionType = trim($input['action_type'] ?? '');
    $productIds = isset($input['product_ids']) ? array_map('intval', (array)$input['product_ids']) : [];

    if (empty($actionType) || empty($productIds)) {
        json_error('Action type and list of product IDs are required.', 400);
    }

    $processed = 0;
    foreach ($productIds as $pid) {
        $p = wc_get_product($pid);
        if (!$p) continue;

        switch ($actionType) {
            case 'delete':
                $p->delete(true);
                $processed++;
                break;
            case 'set_instock':
                $p->set_stock_status('instock');
                $p->save();
                $processed++;
                break;
            case 'set_outofstock':
                $p->set_stock_status('outofstock');
                $p->save();
                $processed++;
                break;
            case 'mark_featured':
                $p->set_featured(true);
                $p->save();
                $processed++;
                break;
            case 'unmark_featured':
                $p->set_featured(false);
                $p->save();
                $processed++;
                break;
        }
    }

    json_success([
        'action' => $actionType,
        'processed' => $processed,
        'message' => "Successfully processed {$processed} product(s)."
    ]);
}

// ========================================================
// 7. ACTION: UPLOAD PRODUCT IMAGE (POST MULTIPART)
// ========================================================
if ($action === 'upload_image') {
    if ($method !== 'POST') {
        json_error('Method not allowed.', 405);
    }

    if (empty($_FILES['image']) && empty($_FILES['file'])) {
        json_error('No image file was provided in the upload request.', 400);
    }

    $fileKey = !empty($_FILES['image']) ? 'image' : 'file';

    require_once ABSPATH . 'wp-admin/includes/image.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/media.php';

    $attachmentId = media_handle_upload($fileKey, 0);

    if (is_wp_error($attachmentId)) {
        json_error('Image upload failed: ' . $attachmentId->get_error_message(), 500);
    }

    $url = wp_get_attachment_image_url($attachmentId, 'full');
    $thumbUrl = wp_get_attachment_image_url($attachmentId, 'medium');

    json_success([
        'id' => $attachmentId,
        'url' => $url,
        'thumbnail_url' => $thumbUrl,
        'message' => 'Image uploaded to media library successfully.'
    ]);
}

// ========================================================
// 8. ACTION: EXPORT CSV (GET)
// ========================================================
if ($action === 'export_csv') {
    $products = wc_get_products(['limit' => -1]);

    header('Content-Type: text/csv; charset=UTF-8');
    header('Content-Disposition: attachment; filename="shree_shahi_products_' . date('Y_m_d_His') . '.csv"');
    header('Pragma: no-cache');
    header('Expires: 0');

    // UTF-8 BOM for Microsoft Excel compatibility
    echo "\xEF\xBB\xBF";

    $output = fopen('php://output', 'w');
    fputcsv($output, [
        'Product ID',
        'SKU',
        'Name',
        'Type',
        'Status',
        'Featured',
        'Categories',
        'Regular Price (INR)',
        'Sale Price (INR)',
        'Active Price (INR)',
        'Stock Status',
        'Stock Quantity',
        'Weight (kg)',
        'Variations Count',
        'Date Created'
    ]);

    foreach ($products as $p) {
        $catNames = [];
        foreach ($p->get_category_ids() as $cid) {
            $t = get_term($cid, 'product_cat');
            if ($t && !is_wp_error($t)) {
                $catNames[] = $t->name;
            }
        }

        $varCount = $p->is_type('variable') ? count($p->get_children()) : 0;

        fputcsv($output, [
            $p->get_id(),
            $p->get_sku(),
            $p->get_name(),
            $p->get_type(),
            $p->get_status(),
            $p->is_featured() ? 'Yes' : 'No',
            implode(' | ', $catNames),
            $p->get_regular_price(),
            $p->get_sale_price(),
            $p->get_price(),
            $p->get_stock_status(),
            $p->get_stock_quantity() ?? 'N/A',
            $p->get_weight(),
            $varCount,
            $p->get_date_created() ? $p->get_date_created()->date('Y-m-d H:i:s') : ''
        ]);
    }

    fclose($output);
    exit();
}

// ========================================================
// 9. ACTION: CATEGORIES LIST (GET)
// ========================================================
if ($action === 'categories_list') {
    $terms = get_terms([
        'taxonomy' => 'product_cat',
        'hide_empty' => false,
        'orderby' => 'name',
        'order' => 'ASC'
    ]);

    $categories = [];
    if (!is_wp_error($terms)) {
        foreach ($terms as $t) {
            $thumbId = get_term_meta($t->term_id, 'thumbnail_id', true);
            $thumbUrl = $thumbId ? wp_get_attachment_image_url($thumbId, 'medium') : '';
            if (empty($thumbUrl)) {
                $thumbUrl = wc_placeholder_img_src('medium');
            }

            $categories[] = [
                'id' => $t->term_id,
                'name' => html_entity_decode($t->name, ENT_QUOTES, 'UTF-8'),
                'slug' => $t->slug,
                'description' => html_entity_decode($t->description, ENT_QUOTES, 'UTF-8'),
                'parent' => (int)$t->parent,
                'count' => (int)$t->count,
                'thumbnail_id' => (int)$thumbId,
                'thumbnail_url' => $thumbUrl
            ];
        }
    }

    json_success([
        'categories' => $categories,
        'total' => count($categories)
    ]);
}

// ========================================================
// 10. ACTION: CATEGORY SAVE (CREATE OR UPDATE) (POST)
// ========================================================
if ($action === 'category_save') {
    if ($method !== 'POST') {
        json_error('Method not allowed.', 405);
    }

    $termId = isset($input['id']) ? (int)$input['id'] : 0;
    $name = trim($input['name'] ?? '');
    $slug = trim($input['slug'] ?? '');
    $description = trim($input['description'] ?? '');
    $parent = isset($input['parent']) ? (int)$input['parent'] : 0;
    $thumbnailId = isset($input['thumbnail_id']) ? (int)$input['thumbnail_id'] : 0;

    if (empty($name)) {
        json_error('Category name is required.', 400);
    }

    $args = [
        'description' => $description,
        'parent' => $parent
    ];
    if (!empty($slug)) {
        $args['slug'] = sanitize_title($slug);
    }

    if ($termId > 0) {
        $args['name'] = $name;
        $result = wp_update_term($termId, 'product_cat', $args);
        if (is_wp_error($result)) {
            json_error('Failed to update category: ' . $result->get_error_message(), 400);
        }
        $savedTermId = $termId;
    } else {
        $result = wp_insert_term($name, 'product_cat', $args);
        if (is_wp_error($result)) {
            json_error('Failed to create category: ' . $result->get_error_message(), 400);
        }
        $savedTermId = (int)$result['term_id'];
    }

    if ($thumbnailId > 0) {
        update_term_meta($savedTermId, 'thumbnail_id', $thumbnailId);
    } elseif (isset($input['thumbnail_id']) && $thumbnailId === 0) {
        delete_term_meta($savedTermId, 'thumbnail_id');
    }

    json_success([
        'id' => $savedTermId,
        'name' => $name,
        'message' => $termId > 0 ? "Category '{$name}' updated." : "Category '{$name}' created."
    ]);
}

// ========================================================
// 11. ACTION: CATEGORY DELETE (POST)
// ========================================================
if ($action === 'category_delete') {
    if ($method !== 'POST') {
        json_error('Method not allowed.', 405);
    }

    $termId = (int)($input['id'] ?? 0);
    if ($termId <= 0) {
        json_error('Valid category term ID is required.', 400);
    }

    $term = get_term($termId, 'product_cat');
    if (!$term || is_wp_error($term)) {
        json_error('Category not found.', 404);
    }

    $termName = $term->name;
    $res = wp_delete_term($termId, 'product_cat');
    if (!$res || is_wp_error($res)) {
        json_error('Failed to delete category.', 500);
    }

    // Clean thumbnail meta
    delete_term_meta($termId, 'thumbnail_id');

    json_success([
        'deleted_id' => $termId,
        'name' => $termName,
        'message' => "Category '{$termName}' deleted successfully."
    ]);
}

// Fallback: Unknown action
json_error("Unknown products action: {$action}", 400);

