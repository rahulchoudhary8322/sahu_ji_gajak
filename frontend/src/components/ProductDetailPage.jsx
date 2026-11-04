import React, { useState, useEffect, useMemo } from 'react';
import '../styles/ProductDetailPage.css';

/**
 * Royal Product Detail Page
 * Shree Shahi Gajak
 * 
 * Features:
 * - Breadcrumbs navigation
 * - Main image with click-to-zoom & smooth gallery thumbnail switcher
 * - Dynamic price calculation based on real WooCommerce variations
 * - Stock status, quantity stepper, Add to Cart, Buy Now, Wishlist
 * - Information tabs: Description, Ingredients, Details, Shipping, Reviews
 * - "You May Also Like" related products section
 */
export default function ProductDetailPage({
  product,
  allProducts = [],
  onBack,
  onNavigateHome,
  onNavigateShop,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  wishlistItems = [],
  onBuyNow
}) {
  if (!product) return null;

  const FALLBACK_PRODUCT_IMAGE = '/assets/products/til_gajak_hd.jpg';

  // Active Gallery Image
  const [activeImage, setActiveImage] = useState(
    product.image || FALLBACK_PRODUCT_IMAGE
  );

  // Zoom overlay modal state
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // Selected Variation / Pack Size
  const variations = product.variations || [];
  const defaultVariation = variations.length > 0 ? variations[0] : null;
  const [selectedVar, setSelectedVar] = useState(defaultVariation);
  const [selectedWeight, setSelectedWeight] = useState(
    defaultVariation ? defaultVariation.weight : (product.weight || '500g')
  );

  // Quantity
  const [quantity, setQuantity] = useState(1);

  // Active Information Tab
  const [activeTab, setActiveTab] = useState('description');

  // Add to cart feedback
  const [addedNotice, setAddedNotice] = useState(false);

  // Reset state when product changes
  useEffect(() => {
    setActiveImage(product.image || FALLBACK_PRODUCT_IMAGE);
    const firstVar = product.variations && product.variations.length > 0 ? product.variations[0] : null;
    setSelectedVar(firstVar);
    setSelectedWeight(firstVar ? firstVar.weight : (product.weight || '500g'));
    setQuantity(1);
    setActiveTab('description');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  // Gallery array
  const galleryImages = useMemo(() => {
    const list = [];
    if (product.image) list.push(product.image);
    if (Array.isArray(product.gallery)) {
      product.gallery.forEach((img) => {
        if (img && !list.includes(img)) list.push(img);
      });
    }
    if (list.length === 0) list.push('/assets/products/til_gajak_hd.jpg');
    return list;
  }, [product]);

  // Current calculated price based on variation
  const currentPrice = selectedVar ? selectedVar.price : product.price;
  const currentRegPrice = selectedVar
    ? (selectedVar.regular_price || selectedVar.price)
    : (product.regular_price || product.price);
  const hasDiscount = currentRegPrice > currentPrice;
  const discountPercent = hasDiscount
    ? Math.round(((currentRegPrice - currentPrice) / currentRegPrice) * 100)
    : 0;

  const isOutOfStock =
    (selectedVar && selectedVar.stock_status === 'outofstock') ||
    product.stock_status === 'outofstock';

  const isWishlisted = wishlistItems.some((w) => w.id === product.id);

  // Related products from the same category
  const relatedProducts = useMemo(() => {
    return allProducts
      .filter((p) => p.id !== product.id)
      .filter((p) => {
        if (p.category === product.category) return true;
        if (Array.isArray(p.categories) && Array.isArray(product.categories)) {
          return p.categories.some((c) => product.categories.includes(c));
        }
        return false;
      })
      .slice(0, 4);
  }, [allProducts, product]);

  const handleVariationSelect = (v) => {
    setSelectedVar(v);
    setSelectedWeight(v.weight);
  };

  const handleAdd = () => {
    const itemToAdd = {
      ...product,
      price: currentPrice,
      weight: selectedWeight,
      variation_id: selectedVar ? selectedVar.id : null
    };
    if (onAddToCart) onAddToCart(itemToAdd, quantity);

    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 1800);
  };

  const handleBuyNowClick = () => {
    const itemToAdd = {
      ...product,
      price: currentPrice,
      weight: selectedWeight,
      variation_id: selectedVar ? selectedVar.id : null
    };
    if (onBuyNow) {
      onBuyNow(itemToAdd, quantity);
    } else if (onAddToCart) {
      onAddToCart(itemToAdd, quantity);
    }
  };

  return (
    <div className="product-detail-page">
      {/* Royal Breadcrumbs Bar */}
      <div className="product-breadcrumbs-bar">
        <div className="breadcrumbs-container">
          <button className="breadcrumb-link" onClick={onNavigateHome}>
            Home
          </button>
          <span className="breadcrumb-sep">/</span>
          <button className="breadcrumb-link" onClick={onNavigateShop || onBack}>
            Shop All
          </button>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-cat">{product.category}</span>
          <span className="breadcrumb-sep">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </div>
      </div>

      <div className="product-detail-container">
        {/* TOP SECTION: 2-COLUMN DISPLAY */}
        <div className="product-showcase-grid">
          {/* ====================================================
              LEFT COLUMN: MAIN IMAGE & THUMBNAIL GALLERY
             ==================================================== */}
          <div className="showcase-left-col">
            {/* Main Image Frame with Zoom Overlay Trigger */}
            <div className="main-image-frame" onClick={() => setIsZoomOpen(true)}>
              <img
                src={activeImage}
                alt={product.name}
                className="main-display-image"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                }}
              />

              {/* Badges */}
              <div className="frame-badges">
                {hasDiscount && (
                  <span className="frame-badge badge-sale">{discountPercent}% OFF</span>
                )}
                {product.is_bestseller && (
                  <span className="frame-badge badge-bestseller">Royal Heritage</span>
                )}
              </div>

              {/* Click-to-Zoom Tooltip Pill */}
              <div className="zoom-hint-pill" title="Click to expand full resolution">
                <svg viewBox="0 0 24 24" fill="none" className="zoom-icon">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path d="M16.5 16.5L21.5 21.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path d="M11 8V14M8 11H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>Click to Zoom</span>
              </div>

              {/* Corner Brackets */}
              <span className="frame-corner c-tl" />
              <span className="frame-corner c-tr" />
              <span className="frame-corner c-bl" />
              <span className="frame-corner c-br" />
            </div>

            {/* Thumbnail Carousel Row */}
            {galleryImages.length > 1 && (
              <div className="thumbnails-row">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    className={`thumb-btn ${activeImage === img ? 'active' : ''}`}
                    onClick={() => setActiveImage(img)}
                    title={`View perspective ${idx + 1}`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Quality Seals / Trust Badges */}
            <div className="heritage-trust-strip">
              <div className="trust-item">
                <span className="trust-icon">🌿</span>
                <div className="trust-text">
                  <strong>100% Pure Veg</strong>
                  <span>No Animal Fat</span>
                </div>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🧈</span>
                <div className="trust-text">
                  <strong>Pure Desi Ghee</strong>
                  <span>Traditional Bilona</span>
                </div>
              </div>
              <div className="trust-item">
                <span className="trust-icon">👑</span>
                <div className="trust-text">
                  <strong>Jaipur Craft</strong>
                  <span>Since 1952</span>
                </div>
              </div>
              <div className="trust-item">
                <span className="trust-icon">🔒</span>
                <div className="trust-text">
                  <strong>Airtight Fresh</strong>
                  <span>Sealed Crispness</span>
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================
              RIGHT COLUMN: PRODUCT DETAILS & ORDERING
             ==================================================== */}
          <div className="showcase-right-col">
            {/* Category & Origin Tag */}
            <div className="product-meta-header">
              <span className="product-category-tag">{product.category}</span>
              <span className="product-origin-tag">✦ Authentic Rajasthan Royal Recipe</span>
            </div>

            {/* Main Product Heading */}
            <h1 className="product-title">{product.name}</h1>

            {/* Ratings & Verified Reviews */}
            <div className="product-rating-strip">
              <div className="stars-cluster">
                <span className="gold-stars">★★★★★</span>
                <span className="rating-score">{product.rating || '4.8'}</span>
              </div>
              <span className="rating-divider">•</span>
              <span className="reviews-label">
                {product.reviews_count || product.reviews || '850'} Verified Royal Reviews
              </span>
              <span className="rating-divider">•</span>
              <span className="sku-label">SKU: SSG-{product.id}</span>
            </div>

            {/* Price Box */}
            <div className="product-pricing-card">
              <div className="price-row">
                <span className="price-curr">₹</span>
                <span className="price-val">{currentPrice}</span>
                {hasDiscount && (
                  <span className="price-original-val">₹{currentRegPrice}</span>
                )}
                {hasDiscount && (
                  <span className="discount-tag">Save ₹{currentRegPrice - currentPrice} ({discountPercent}%)</span>
                )}
              </div>
              <p className="price-tax-note">
                Inclusive of all taxes • <strong>Free Royal Express Shipping</strong> on orders above ₹499
              </p>
            </div>

            {/* Stock Availability */}
            <div className="stock-status-row">
              {isOutOfStock ? (
                <div className="stock-badge badge-out">
                  <span className="status-dot dot-red" />
                  <span>Currently Sold Out — Fresh Batch In Woodfire Kiln</span>
                </div>
              ) : (
                <div className="stock-badge badge-in">
                  <span className="status-dot dot-green" />
                  <span>In Stock — Freshly Handcrafted & Ready for Royal Dispatch</span>
                </div>
              )}
            </div>

            {/* Short Description */}
            <p className="product-short-desc">
              {product.short_description || product.description}
            </p>

            {/* Pack Size / Weight Variations Selection */}
            {variations.length > 0 ? (
              <div className="option-section-block">
                <div className="option-label-row">
                  <span className="option-label">Select Pack Size / Weight:</span>
                  <span className="option-selected-hint">Selected: <strong>{selectedWeight}</strong></span>
                </div>
                <div className="weight-chips-row">
                  {variations.map((v) => {
                    const isSelected = selectedVar && selectedVar.id === v.id;
                    return (
                      <button
                        key={v.id}
                        className={`weight-chip-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleVariationSelect(v)}
                      >
                        <span className="chip-weight">{v.weight}</span>
                        <span className="chip-price">₹{v.price}</span>
                        {isSelected && <span className="chip-check">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="option-section-block">
                <div className="option-label-row">
                  <span className="option-label">Standard Pack Size:</span>
                  <span className="option-selected-hint"><strong>{selectedWeight}</strong></span>
                </div>
              </div>
            )}

            {/* Quantity Stepper & CTA Buttons */}
            <div className="purchasing-actions-block">
              <div className="qty-row">
                <span className="qty-label">Quantity:</span>
                <div className="qty-stepper-box">
                  <button
                    className="stepper-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="stepper-value">{quantity}</span>
                  <button
                    className="stepper-btn"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <span className="subtotal-display">
                  Subtotal: <strong>₹{currentPrice * quantity}</strong>
                </span>
              </div>

              {/* Main CTA Buttons Row */}
              <div className="action-buttons-row">
                {/* Add to Cart */}
                <button
                  className={`btn-add-cart-primary ${addedNotice ? 'added' : ''}`}
                  onClick={handleAdd}
                  disabled={isOutOfStock}
                >
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 4H5.2L7.2 14.5C7.35 15.3 8.05 15.9 8.85 15.9H18.2C18.95 15.9 19.65 15.35 19.8 14.6L21.3 7.5H6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="9" cy="19.5" r="1.8" fill="currentColor" />
                    <circle cx="17.5" cy="19.5" r="1.8" fill="currentColor" />
                  </svg>
                  <span>{addedNotice ? '✓ Added to Royal Basket!' : 'Add to Royal Basket'}</span>
                </button>

                {/* Buy Now Button */}
                <button
                  className="btn-buy-now-gold"
                  onClick={handleBuyNowClick}
                  disabled={isOutOfStock}
                >
                  <span>👑 Buy Now</span>
                </button>

                {/* Wishlist Button */}
                <button
                  className={`btn-wishlist-toggle ${isWishlisted ? 'active' : ''}`}
                  onClick={() => onToggleWishlist && onToggleWishlist(product)}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  aria-label="Wishlist"
                >
                  <svg viewBox="0 0 24 24" fill={isWishlisted ? '#D32F2F' : 'none'}>
                    <path
                      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
                      stroke={isWishlisted ? '#D32F2F' : '#8A5D18'}
                      strokeWidth="2"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quick Guarantees Strip */}
            <div className="quick-guarantees-grid">
              <div className="guarantee-cell">
                <span className="g-icon">🚀</span>
                <span>Fast 48h Dispatch</span>
              </div>
              <div className="guarantee-cell">
                <span className="g-icon">💯</span>
                <span>Authentic Taste Guarantee</span>
              </div>
              <div className="guarantee-cell">
                <span className="g-icon">🛡️</span>
                <span>Safe & Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>

        {/* ====================================================
            BOTTOM SECTION: 5 TABBED PRODUCT INFORMATION
           ==================================================== */}
        <section className="product-information-tabs-section">
          {/* Tabs Navigation Header */}
          <div className="tabs-nav-bar" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'description'}
              className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              ✦ Description
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'ingredients'}
              className={`tab-btn ${activeTab === 'ingredients' ? 'active' : ''}`}
              onClick={() => setActiveTab('ingredients')}
            >
              🌿 Royal Ingredients
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'details'}
              className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              📋 Product Details
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'shipping'}
              className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
              onClick={() => setActiveTab('shipping')}
            >
              📦 Shipping & Delivery
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'reviews'}
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              ★ Customer Reviews ({product.reviews_count || '1.2k+'})
            </button>
          </div>

          {/* Active Tab Panel */}
          <div className="tab-content-panel">
            {/* 1. Description */}
            {activeTab === 'description' && (
              <div className="tab-pane-fade">
                <h3 className="tab-pane-title">The Royal Jaipur Tradition</h3>
                <p className="tab-pane-text">
                  {product.description ||
                    'Sahu Ji Gajak is prepared using our grandfather’s century-old artisanal recipe. Pure Kolhapuri sugarcane jaggery is gently caramelized over controlled woodfire stoves and blended with hand-roasted winter sesame seeds. Master craftsmen beat the mixture repeatedly with heavy wooden mallets to introduce thousands of airy microscopic layers, delivering an unmatched feather-light crunch that melts on your palate.'}
                </p>
                <div className="features-bullet-grid">
                  <div className="feature-bullet">
                    <span className="bullet-crest">❖</span>
                    <div>
                      <strong>Slow Embers Roasting:</strong> Sesame seeds are toasted to a fragrant golden hazel color without any burning.
                    </div>
                  </div>
                  <div className="feature-bullet">
                    <span className="bullet-crest">❖</span>
                    <div>
                      <strong>Traditional Wooden Mallet Beating:</strong> Over 400 rhythmic strikes to produce feather-light crunchy layers.
                    </div>
                  </div>
                  <div className="feature-bullet">
                    <span className="bullet-crest">❖</span>
                    <div>
                      <strong>Pure Desi Ghee Infusion:</strong> Fragrant aroma and soft, melt-in-the-mouth texture with zero stickiness.
                    </div>
                  </div>
                  <div className="feature-bullet">
                    <span className="bullet-crest">❖</span>
                    <div>
                      <strong>Zero Additives:</strong> Free from artificial preservatives, artificial flavors, liquid glucose, or synthetic food colors.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Ingredients */}
            {activeTab === 'ingredients' && (
              <div className="tab-pane-fade">
                <h3 className="tab-pane-title">100% Natural Royal Ingredients</h3>
                <p className="tab-pane-text">
                  Every ingredient is hand-inspected for purity and freshness before entering our royal kitchen.
                </p>
                <div className="ingredients-pill-grid">
                  {(product.ingredients || [
                    'Hand-Selected White Sesame (Til)',
                    'Pure Desi Ghee',
                    'Organic Kolhapuri Jaggery (Gur)',
                    'Green Cardamom (Elaichi)',
                    'Kewra Water Essence'
                  ]).map((ing, idx) => (
                    <div key={idx} className="royal-ingredient-card">
                      <span className="ing-icon">✦</span>
                      <span className="ing-name">{ing}</span>
                    </div>
                  ))}
                </div>
                <div className="allergen-note">
                  <strong>Allergen Information:</strong> Contains Sesame Seeds and Milk Solid (Desi Ghee). May contain traces of tree nuts (Cashews, Almonds, Pistachios).
                </div>
              </div>
            )}

            {/* 3. Product Details */}
            {activeTab === 'details' && (
              <div className="tab-pane-fade">
                <h3 className="tab-pane-title">Product Specifications</h3>
                <div className="details-specs-table">
                  <div className="spec-row">
                    <span className="spec-key">Net Weight:</span>
                    <span className="spec-val">{selectedWeight} (Airtight Sealed)</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-key">Dietary Type:</span>
                    <span className="spec-val">100% Vegetarian (Green Dot)</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-key">Shelf Life:</span>
                    <span className="spec-val">90 Days from the date of manufacturing</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-key">Storage Instructions:</span>
                    <span className="spec-val">Store in an airtight container in a cool, dry place away from direct sunlight. Do not refrigerate.</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-key">Place of Origin:</span>
                    <span className="spec-val">Jaipur, Rajasthan, India</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-key">Manufacturer:</span>
                    <span className="spec-val">Sahu Ji Gajak Bhandar, Johari Bazaar, Jaipur, Rajasthan</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Shipping & Delivery */}
            {activeTab === 'shipping' && (
              <div className="tab-pane-fade">
                <h3 className="tab-pane-title">Pan-India Royal Dispatch</h3>
                <p className="tab-pane-text">
                  We take utmost care to ensure your delicate gajak arrives in perfect, crispy, unbroken condition.
                </p>
                <div className="shipping-steps-grid">
                  <div className="shipping-step-card">
                    <span className="step-num">1</span>
                    <h4>Fresh Woodfire Baking</h4>
                    <p>Prepared daily in small batches so you always receive maximum crispness.</p>
                  </div>
                  <div className="shipping-step-card">
                    <span className="step-num">2</span>
                    <h4>Airtight Foil Sealed</h4>
                    <p>Packaged in food-grade, vacuum-sealed tins to lock out winter humidity.</p>
                  </div>
                  <div className="shipping-step-card">
                    <span className="step-num">3</span>
                    <h4>Cushioned Packaging</h4>
                    <p>Heavy-duty bubble wrap and reinforced royal boxes prevent transit breakage.</p>
                  </div>
                  <div className="shipping-step-card">
                    <span className="step-num">4</span>
                    <h4>Express Delivery</h4>
                    <p>Delivered within 2 to 4 business days via Bluedart / Delhivery Express with live tracking.</p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Customer Reviews */}
            {activeTab === 'reviews' && (
              <div className="tab-pane-fade">
                <div className="reviews-summary-bar">
                  <div className="reviews-big-score">
                    <span className="big-num">{product.rating || '4.8'}</span>
                    <div className="big-stars">★★★★★</div>
                    <span className="big-count">Based on {product.reviews_count || '1,240'} verified reviews</span>
                  </div>
                  <div className="reviews-badge-trust">
                    <span>👑 99.4% of Royal Connoisseurs recommend this gajak</span>
                  </div>
                </div>

                {/* Review Cards */}
                <div className="reviews-list">
                  <div className="royal-review-item">
                    <div className="review-item-header">
                      <div className="reviewer-info">
                        <strong>Rajeshwari Rathore</strong>
                        <span className="verified-pill">✓ Verified Buyer • Jaipur</span>
                      </div>
                      <span className="review-date">October 28, 2026</span>
                    </div>
                    <div className="review-stars">★★★★★</div>
                    <p className="review-body">
                      "Unbelievable texture and crunch! It took me straight back to childhood winter mornings in Jaipur. The jaggery flavor is pure and earthy, and the desi ghee aroma is unmistakable. Arrived in pristine condition with zero broken pieces."
                    </p>
                  </div>

                  <div className="royal-review-item">
                    <div className="review-item-header">
                      <div className="reviewer-info">
                        <strong>Vikramaditya Sharma</strong>
                        <span className="verified-pill">✓ Verified Buyer • New Delhi</span>
                      </div>
                      <span className="review-date">October 15, 2026</span>
                    </div>
                    <div className="review-stars">★★★★★</div>
                    <p className="review-body">
                      "Ordered 4 boxes for Diwali gifting and everyone called me back asking where I bought them! The packaging is regal, the gajak is thin, crisp, and delightfully fresh. Best Gajak in India without a doubt."
                    </p>
                  </div>

                  <div className="royal-review-item">
                    <div className="review-item-header">
                      <div className="reviewer-info">
                        <strong>Ananya Singhania</strong>
                        <span className="verified-pill">✓ Verified Buyer • Mumbai</span>
                      </div>
                      <span className="review-date">September 30, 2026</span>
                    </div>
                    <div className="review-stars">★★★★★</div>
                    <p className="review-body">
                      "Pure desi ghee aroma hits you the moment you unseal the tin. It melts like cotton candy in the mouth without sticking to teeth. Truly deserving of the royal title!"
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ====================================================
            RELATED PRODUCTS: "YOU MAY ALSO LIKE"
           ==================================================== */}
        {relatedProducts.length > 0 && (
          <section className="related-products-section">
            <div className="related-header">
              <div className="related-crest">❖</div>
              <h2 className="related-title">You May Also Like</h2>
              <p className="related-subtitle">Royal Complements from the Same Hearth</p>
            </div>

            <div className="related-grid">
              {relatedProducts.map((rel) => (
                <div
                  key={rel.id}
                  className="related-product-card"
                  onClick={() => onSelectProduct && onSelectProduct(rel)}
                >
                  <div className="related-img-frame">
                    <img src={rel.image} alt={rel.name} loading="lazy" />
                  </div>
                  <div className="related-info">
                    <span className="related-cat">{rel.category}</span>
                    <h3 className="related-name">{rel.name}</h3>
                    <div className="related-price-row">
                      <span className="r-curr">₹</span>
                      <span className="r-price">{rel.price}</span>
                      {rel.regular_price > rel.price && (
                        <span className="r-orig">₹{rel.regular_price}</span>
                      )}
                    </div>
                    <button
                      className="related-add-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart && onAddToCart(rel);
                      }}
                    >
                      Add to Basket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* FULL RESOLUTION CLICK-TO-ZOOM MODAL */}
      {isZoomOpen && (
        <div className="image-zoom-overlay" onClick={() => setIsZoomOpen(false)}>
          <div className="zoom-modal-container" onClick={(e) => e.stopPropagation()}>
            <button
              className="zoom-close-btn"
              onClick={() => setIsZoomOpen(false)}
              aria-label="Close Zoom"
            >
              ✕
            </button>
            <img
              src={activeImage}
              alt={product.name}
              className="zoomed-image-large"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
              }}
            />
            <div className="zoom-caption">
              <strong>{product.name}</strong> • 4K High Resolution View
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

