import React, { useState } from 'react';
import '../styles/CartPage.css';

/**
 * Royal Shopping Cart Page
 * Shree Shahi Gajak
 * 
 * Features:
 * - Dynamic list of basket items with variations (250g, 500g, 1kg)
 * - Immediate quantity updates with stock validation
 * - Removal of individual items & clear entire cart with confirmation modal
 * - Interactive Free Shipping progress meter (Threshold: ₹499)
 * - Promo code support ('ROYAL10' for 10% discount)
 * - Order summary with real-time recalculation
 * - Regal empty-cart state
 */
export default function CartPage({
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onNavigateShop,
  onNavigateHome,
  onSelectProduct,
  onCheckout
}) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponError, setCouponError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Calculations
  const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const freeShippingThreshold = 499;
  const isFreeShipping = subtotal >= freeShippingThreshold || items.length === 0;
  const shippingFee = isFreeShipping ? 0 : 50;

  // Coupon discount (ROYAL10 = 10%)
  const discountAmount = appliedCoupon === 'ROYAL10' ? Math.round(subtotal * 0.10) : 0;
  const finalTotal = Math.max(0, subtotal + shippingFee - discountAmount);

  const shippingProgress = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = promoCode.trim().toUpperCase();
    if (code === 'ROYAL10') {
      setAppliedCoupon('ROYAL10');
      setPromoCode('');
    } else {
      setCouponError('Invalid coupon. Try "ROYAL10" for 10% royal savings.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon('');
    setCouponError('');
  };

  const handleClearConfirmed = () => {
    setShowClearConfirm(false);
    if (onClearCart) onClearCart();
  };

  // If basket is empty
  if (items.length === 0) {
    return (
      <div className="cart-page-wrapper">
        <div className="cart-breadcrumbs">
          <div className="cart-breadcrumbs-inner">
            <button className="crumb-btn" onClick={onNavigateHome}>Home</button>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Your Royal Basket</span>
          </div>
        </div>

        <div className="cart-empty-card">
          <div className="empty-cart-ornament">
            <svg viewBox="0 0 80 80" fill="none" className="empty-cart-svg">
              <circle cx="40" cy="40" r="38" stroke="#D4A33D" strokeWidth="1.5" />
              <path
                d="M24 28H28L32 50H54L58 34H30"
                stroke="#D4A33D"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="35" cy="58" r="3" fill="#D4A33D" />
              <circle cx="51" cy="58" r="3" fill="#D4A33D" />
              <path d="M40 18L42 22L46 22L43 25L44 29L40 26L36 29L37 25L34 22L38 22Z" fill="#F5C65B" />
            </svg>
          </div>

          <h2 className="empty-cart-title">Your Royal Basket is Waiting</h2>
          <p className="empty-cart-desc">
            Your basket is currently empty. Explore our handcrafted royal gajak, rewari, and winter delicacies prepared with organic jaggery and pure desi ghee.
          </p>

          <button className="empty-cart-btn" onClick={onNavigateShop}>
            <span>Explore Royal Collection</span>
            <svg viewBox="0 0 20 20" fill="none" className="arrow-svg">
              <path d="M7 4L13 10L7 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page-wrapper">
      {/* Breadcrumbs */}
      <div className="cart-breadcrumbs">
        <div className="cart-breadcrumbs-inner">
          <button className="crumb-btn" onClick={onNavigateHome}>Home</button>
          <span className="crumb-sep">/</span>
          <button className="crumb-btn" onClick={onNavigateShop}>Shop All</button>
          <span className="crumb-sep">/</span>
          <span className="crumb-active">Your Royal Basket ({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
        </div>
      </div>

      <div className="cart-page-container">
        {/* Page Title & Free Shipping Meter */}
        <div className="cart-header-section">
          <div className="cart-title-row">
            <span className="cart-crown-crest">👑</span>
            <h1 className="cart-main-heading">Your Royal Basket</h1>
            <span className="cart-items-tag">
              {items.reduce((acc, i) => acc + i.quantity, 0)} Handcrafted Items
            </span>
          </div>

          {/* Free Shipping Meter */}
          <div className="cart-shipping-banner">
            <div className="shipping-text-row">
              {isFreeShipping ? (
                <span className="shipping-status-unlocked">
                  🎉 <strong>Royal Delivery Unlocked!</strong> Your order qualifies for Free Express Shipping across India.
                </span>
              ) : (
                <span className="shipping-status-pending">
                  Add <strong>₹{freeShippingThreshold - subtotal}</strong> more to unlock <strong>Free Royal Express Delivery</strong>!
                </span>
              )}
              <span className="shipping-pct">{shippingProgress}%</span>
            </div>
            <div className="shipping-progress-bar">
              <div
                className={`progress-fill ${isFreeShipping ? 'unlocked' : ''}`}
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2-Column Layout: Left Items Table, Right Order Summary */}
        <div className="cart-layout-grid">
          {/* ====================================================
              LEFT COLUMN: CART ITEMS TABLE
             ==================================================== */}
          <div className="cart-items-col">
            <div className="cart-table-card">
              <div className="cart-table-header">
                <span className="th-product">Royal Delicacy</span>
                <span className="th-price">Price</span>
                <span className="th-qty">Quantity</span>
                <span className="th-subtotal">Subtotal</span>
                <span className="th-action" />
              </div>

              <div className="cart-table-body">
                {items.map((item) => {
                  const itemKey = item.cart_key || `${item.id}-${item.weight || '500g'}`;
                  const itemSubtotal = item.price * item.quantity;
                  const maxStock = item.stock_quantity || 20;

                  return (
                    <div key={itemKey} className="cart-item-row">
                      {/* Product Thumbnail & Details */}
                      <div className="item-cell product-info-cell">
                        <div
                          className="item-img-box"
                          onClick={() => onSelectProduct && onSelectProduct(item)}
                          title="View Delicacy Details"
                        >
                          <img
                            src={item.image || '/assets/products/til_gajak_hd.jpg'}
                            alt={item.name}
                            className="item-img"
                          />
                        </div>

                        <div className="item-meta">
                          <h3
                            className="item-name"
                            onClick={() => onSelectProduct && onSelectProduct(item)}
                            title={item.name}
                          >
                            {item.name}
                          </h3>
                          <div className="item-badge-row">
                            <span className="item-weight-pill">
                              ⚖️ Pack: {item.weight || '500g'}
                            </span>
                            <span className="item-fresh-tag">✦ Fresh Kiln Batch</span>
                          </div>
                        </div>
                      </div>

                      {/* Unit Price */}
                      <div className="item-cell price-cell">
                        <span className="cell-mobile-label">Unit Price:</span>
                        <span className="unit-price">₹{item.price}</span>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="item-cell qty-cell">
                        <span className="cell-mobile-label">Quantity:</span>
                        <div className="cart-qty-stepper">
                          <button
                            className="stepper-action-btn"
                            onClick={() =>
                              onUpdateQuantity &&
                              onUpdateQuantity(item.id, item.quantity - 1, item.weight)
                            }
                            disabled={item.quantity <= 1}
                            title="Decrease quantity"
                            aria-label="Decrease quantity"
                          >
                            −
                          </button>
                          <span className="stepper-count">{item.quantity}</span>
                          <button
                            className="stepper-action-btn"
                            onClick={() =>
                              onUpdateQuantity &&
                              onUpdateQuantity(item.id, item.quantity + 1, item.weight)
                            }
                            disabled={item.quantity >= maxStock}
                            title="Increase quantity"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Item Subtotal */}
                      <div className="item-cell subtotal-cell">
                        <span className="cell-mobile-label">Item Total:</span>
                        <span className="item-total-price">₹{itemSubtotal}</span>
                      </div>

                      {/* Remove Button */}
                      <div className="item-cell action-cell">
                        <button
                          className="item-remove-btn"
                          onClick={() => onRemoveItem && onRemoveItem(item.id, item.weight)}
                          title="Remove from basket"
                          aria-label={`Remove ${item.name} from basket`}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bottom Actions Row */}
              <div className="cart-table-footer">
                <button className="btn-continue-shopping" onClick={onNavigateShop}>
                  <svg viewBox="0 0 20 20" fill="none" className="btn-arrow-left">
                    <path d="M13 16L7 10L13 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                  <span>Continue Shopping</span>
                </button>

                <button className="btn-clear-cart" onClick={() => setShowClearConfirm(true)}>
                  <span>Clear Entire Basket</span>
                </button>
              </div>
            </div>
          </div>

          {/* ====================================================
              RIGHT COLUMN: ORDER SUMMARY
             ==================================================== */}
          <div className="cart-summary-col">
            <div className="cart-summary-card">
              <h2 className="summary-title">Royal Order Summary</h2>

              {/* Cost Rows */}
              <div className="summary-rows-group">
                <div className="summary-line">
                  <span className="line-label">Bag Subtotal</span>
                  <span className="line-value">₹{subtotal}</span>
                </div>

                <div className="summary-line">
                  <span className="line-label">
                    Royal Express Delivery
                    {isFreeShipping && <span className="free-tag">FREE</span>}
                  </span>
                  <span className="line-value">
                    {isFreeShipping ? '₹0' : `₹${shippingFee}`}
                  </span>
                </div>

                {appliedCoupon && (
                  <div className="summary-line discount-line">
                    <span className="line-label">
                      Royal Privilege Discount ({appliedCoupon})
                      <button className="remove-coupon-link" onClick={handleRemoveCoupon}>
                        (remove)
                      </button>
                    </span>
                    <span className="line-value discount-val">−₹{discountAmount}</span>
                  </div>
                )}

                <div className="summary-total-divider" />

                <div className="summary-total-line">
                  <div className="total-label-box">
                    <span className="total-label">Grand Total</span>
                    <span className="total-tax-note">(Inclusive of all taxes)</span>
                  </div>
                  <span className="total-amount">₹{finalTotal}</span>
                </div>
              </div>

              {/* Promo Code Form */}
              <form className="coupon-form" onSubmit={handleApplyCoupon}>
                <div className="coupon-input-wrapper">
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. ROYAL10)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="coupon-input"
                  />
                  <button type="submit" className="coupon-apply-btn">
                    Apply
                  </button>
                </div>
                {couponError && <p className="coupon-error-msg">{couponError}</p>}
                {!appliedCoupon && !couponError && (
                  <p className="coupon-hint-msg">💡 Hint: Use <strong>ROYAL10</strong> for 10% Royal Discount!</p>
                )}
              </form>

              {/* Checkout CTA */}
              <button className="btn-proceed-checkout" onClick={onCheckout}>
                <span className="checkout-btn-text">Proceed to Royal Checkout</span>
                <span className="checkout-total-pill">₹{finalTotal}</span>
              </button>

              {/* Trust Badges */}
              <div className="summary-trust-grid">
                <div className="trust-badge-cell">
                  <span className="trust-icon">🛡️</span>
                  <span>100% Safe & Secure Checkout</span>
                </div>
                <div className="trust-badge-cell">
                  <span className="trust-icon">🧈</span>
                  <span>Pure A2 Bilona Desi Ghee</span>
                </div>
                <div className="trust-badge-cell">
                  <span className="trust-icon">📦</span>
                  <span>Damage-Proof Airtight Tin Packaging</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CLEAR BASKET CONFIRMATION MODAL */}
      {showClearConfirm && (
        <div className="cart-modal-backdrop" onClick={() => setShowClearConfirm(false)}>
          <div className="clear-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <span className="confirm-icon">⚠️</span>
            <h3>Empty Your Royal Basket?</h3>
            <p>Are you sure you want to remove all handcrafted delicacies from your basket?</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setShowClearConfirm(false)}>
                No, Keep Items
              </button>
              <button className="btn-confirm-delete" onClick={handleClearConfirmed}>
                Yes, Empty Basket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
