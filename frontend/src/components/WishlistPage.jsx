import React, { useState } from 'react';
import '../styles/WishlistPage.css';

/**
 * Royal Wishlist Page
 * Shree Shahi Gajak
 * 
 * Features:
 * - Dynamic grid of saved royal sweets
 * - Full integration with Cart (Move to Basket / Add all to basket)
 * - Remove single item or clear entire wishlist with confirmation
 * - Stock availability pill
 * - Direct navigation to Product Details
 * - Regal empty-wishlist state with CTA to Shop All
 */
export default function WishlistPage({
  items = [],
  onAddToCart,
  onRemoveFromWishlist,
  onClearWishlist,
  onNavigateShop,
  onNavigateHome,
  onSelectProduct
}) {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleMoveAllToCart = () => {
    if (items.length === 0) return;
    items.forEach((item) => {
      if (onAddToCart) onAddToCart(item, 1);
    });
    if (onClearWishlist) onClearWishlist();
  };

  const handleClearConfirmed = () => {
    setShowClearConfirm(false);
    if (onClearWishlist) onClearWishlist();
  };

  // If Wishlist is empty
  if (items.length === 0) {
    return (
      <div className="wishlist-page-wrapper">
        <div className="wishlist-breadcrumbs">
          <div className="wishlist-breadcrumbs-inner">
            <button className="crumb-btn" onClick={onNavigateHome}>Home</button>
            <span className="crumb-sep">/</span>
            <button className="crumb-btn" onClick={onNavigateShop}>Shop All</button>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Your Royal Wishlist</span>
          </div>
        </div>

        <div className="wishlist-empty-card">
          <div className="empty-wishlist-ornament">
            <svg viewBox="0 0 80 80" fill="none" className="empty-wishlist-svg">
              <circle cx="40" cy="40" r="38" stroke="#D4A33D" strokeWidth="1.5" />
              <path
                d="M40 58C40 58 20 45 20 31C20 23.5 25.5 18 33 18C36.8 18 40 21 40 21C40 21 43.2 18 47 18C54.5 18 60 23.5 60 31C60 45 40 58 40 58Z"
                stroke="#D4A33D"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M40 26L41.5 29.5L45 29.5L42.5 32L43.5 35.5L40 33L36.5 35.5L37.5 32L35 29.5L38.5 29.5Z" fill="#F5C65B" />
            </svg>
          </div>

          <h2 className="empty-wishlist-title">Your Royal Wishlist is Waiting</h2>
          <p className="empty-wishlist-desc">
            You haven’t saved any royal sweets yet. Explore our handcrafted collection of pure desi ghee gajaks, jaggery delights, and dry-fruit confections to add your favorites here.
          </p>

          <button className="empty-wishlist-btn" onClick={onNavigateShop}>
            <span>Explore Royal Collection</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="btn-arrow-icon">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page-wrapper">
      {/* Breadcrumbs */}
      <div className="wishlist-breadcrumbs">
        <div className="wishlist-breadcrumbs-inner">
          <button className="crumb-btn" onClick={onNavigateHome}>Home</button>
          <span className="crumb-sep">/</span>
          <button className="crumb-btn" onClick={onNavigateShop}>Shop All</button>
          <span className="crumb-sep">/</span>
          <span className="crumb-active">Your Royal Wishlist</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="wishlist-container">
        {/* Header */}
        <div className="wishlist-header">
          <div className="wishlist-title-group">
            <span className="wishlist-eyebrow">SAVED TREASURES</span>
            <h1 className="wishlist-main-title">Your Royal Wishlist</h1>
            <p className="wishlist-subtitle">
              Handcrafted delicacies reserved for your family celebrations and gifting.
            </p>
          </div>

          <div className="wishlist-header-actions">
            <span className="wishlist-count-badge">
              <span className="gold-sparkle">✦</span>
              {items.length} {items.length === 1 ? 'Delicacy Saved' : 'Delicacies Saved'}
            </span>

            {items.length > 1 && (
              <button
                className="wishlist-move-all-btn"
                onClick={handleMoveAllToCart}
                title="Add all wishlisted items to your Royal Basket"
              >
                <span>Move All to Basket</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="btn-basket-icon">
                  <path d="M6 6h15l-1.68 8.39a2 2 0 0 1-2 1.61H9.68a2 2 0 0 1-2-1.61L6 6z" />
                  <circle cx="9" cy="20" r="1" />
                  <circle cx="18" cy="20" r="1" />
                  <path d="M6 6H3" />
                </svg>
              </button>
            )}

            <button
              className="wishlist-clear-all-btn"
              onClick={() => setShowClearConfirm(true)}
              title="Clear entire wishlist"
            >
              Clear Wishlist
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="wishlist-grid">
          {items.map((product) => {
            const hasDiscount = product.regular_price && product.regular_price > product.price;
            const savingsPercent = hasDiscount
              ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100)
              : 0;

            return (
              <div key={product.id} className="wishlist-card">
                {/* Remove button */}
                <button
                  className="wishlist-item-remove-btn"
                  onClick={() => onRemoveFromWishlist(product.id)}
                  title="Remove from wishlist"
                  aria-label="Remove item"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="remove-cross-svg">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>

                {/* Card Media / Image */}
                <div
                  className="wishlist-card-media"
                  onClick={() => onSelectProduct && onSelectProduct(product)}
                >
                  <img
                    src={product.image || '/assets/products/til_gajak_hd.jpg'}
                    alt={product.name}
                    className="wishlist-card-img"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/products/til_gajak_hd.jpg';
                    }}
                  />
                  <div className="wishlist-media-overlay">
                    <span className="view-product-hint">Quick View ✦</span>
                  </div>

                  {hasDiscount && (
                    <span className="wishlist-discount-badge">{savingsPercent}% OFF</span>
                  )}
                  {product.is_bestseller && (
                    <span className="wishlist-bestseller-badge">Royal Choice</span>
                  )}
                </div>

                {/* Card Body */}
                <div className="wishlist-card-body">
                  <div className="wishlist-category-tag">
                    {product.category || 'Traditional Gajak'}
                  </div>

                  <h3
                    className="wishlist-product-name"
                    onClick={() => onSelectProduct && onSelectProduct(product)}
                    title={product.name}
                  >
                    {product.name}
                  </h3>

                  {product.rating && (
                    <div className="wishlist-rating-row">
                      <span className="rating-stars">★★★★★</span>
                      <span className="rating-score">{product.rating}</span>
                      {product.reviews && (
                        <span className="rating-count">({product.reviews})</span>
                      )}
                    </div>
                  )}

                  <div className="wishlist-stock-info">
                    <span className="stock-dot in-stock"></span>
                    <span className="stock-text">In Stock • Fresh Batch</span>
                    <span className="stock-weight-pill">{product.weight || '500g'}</span>
                  </div>

                  {/* Price */}
                  <div className="wishlist-price-row">
                    <span className="wishlist-currency">₹</span>
                    <span className="wishlist-current-price">{product.price}</span>
                    {hasDiscount && (
                      <span className="wishlist-regular-price">₹{product.regular_price}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="wishlist-card-actions">
                    <button
                      className="wishlist-add-basket-btn"
                      onClick={() => {
                        if (onAddToCart) onAddToCart(product, 1);
                        if (onRemoveFromWishlist) onRemoveFromWishlist(product.id);
                      }}
                      title="Move to basket"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="btn-cart-svg">
                        <path d="M6 6h15l-1.68 8.39a2 2 0 0 1-2 1.61H9.68a2 2 0 0 1-2-1.61L6 6z" />
                        <circle cx="9" cy="20" r="1" />
                        <circle cx="18" cy="20" r="1" />
                        <path d="M6 6H3" />
                      </svg>
                      <span>Move to Basket</span>
                    </button>

                    <button
                      className="wishlist-view-btn"
                      onClick={() => onSelectProduct && onSelectProduct(product)}
                      title="View product details"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="btn-eye-svg">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Wishlist Royal Footer Banner */}
        <div className="wishlist-footer-banner">
          <div className="banner-item">
            <span className="banner-icon">👑</span>
            <div className="banner-text">
              <strong>Royal Darbar Heritage</strong>
              <span>Prepared fresh in small artisanal batches</span>
            </div>
          </div>
          <div className="banner-item">
            <span className="banner-icon">🚚</span>
            <div className="banner-text">
              <strong>Free Royal Delivery</strong>
              <span>On all orders above ₹499 across India</span>
            </div>
          </div>
          <div className="banner-item">
            <span className="banner-icon">🌿</span>
            <div className="banner-text">
              <strong>100% Pure Desi Ghee</strong>
              <span>No preservatives, no artificial palm oils</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Wishlist */}
      {showClearConfirm && (
        <div className="wishlist-modal-backdrop" onClick={() => setShowClearConfirm(false)}>
          <div className="wishlist-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-ornament">✦ 👑 ✦</div>
            <h3 className="modal-title">Clear Your Wishlist?</h3>
            <p className="modal-text">
              Are you sure you want to remove all {items.length} items from your royal wishlist? This action cannot be undone.
            </p>
            <div className="modal-btn-row">
              <button
                className="modal-cancel-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                Keep Items
              </button>
              <button
                className="modal-confirm-btn"
                onClick={handleClearConfirmed}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

