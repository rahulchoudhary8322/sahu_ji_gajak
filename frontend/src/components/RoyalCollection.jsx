import React from 'react';
import '../styles/RoyalCollection.css';

/**
 * Our Royal Collection - 8 Products (4 + 4 Desktop Grid)
 * Directly matching the reference image layout:
 * - Panoramic royal Rajasthani palace background
 * - Arched ornate maroon & gold badge with royal crown
 * - Compact, luxurious spacing matching reference
 * - Exactly 8 uniform product cards with image, price, stars, Add to Cart & view arrow
 */
export default function RoyalCollection({
  products = [],
  onAddToCart,
  onToggleWishlist,
  wishlistItems = [],
  onSelectProduct
}) {
  return (
    <section className="royal-collection-section" id="shop">
      {/* Scenic Palace Backdrop Layer */}
      <div className="collection-palace-bg-layer" aria-hidden="true" />

      {/* Left and Right Royal Palace Architectural Flanks */}
      <div className="collection-palace-flank flank-left" aria-hidden="true">
        <img src="/assets/palace-left-clean.png" alt="Royal Palace" className="flank-img" />
      </div>
      <div className="collection-palace-flank flank-right" aria-hidden="true">
        <img src="/assets/palace-right-clean.png" alt="Royal Fort" className="flank-img" />
      </div>

      {/* Four Ornamental Corner Brackets */}
      <div className="section-corner-bracket corner-top-left" aria-hidden="true" />
      <div className="section-corner-bracket corner-top-right" aria-hidden="true" />
      <div className="section-corner-bracket corner-bottom-left" aria-hidden="true" />
      <div className="section-corner-bracket corner-bottom-right" aria-hidden="true" />

      <div className="collection-container">
        {/* Compact Royal Header Banner */}
        <div className="collection-header-wrapper">
          <div className="collection-royal-badge">
            <div className="badge-crown-crest">
              <svg viewBox="0 0 60 26" fill="none">
                <path
                  d="M6 22 L12 7 L23 15 L30 2 L37 15 L48 7 L54 22 Z"
                  fill="url(#badgeCrownGold)"
                  stroke="#FFE49E"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <rect x="8" y="22" width="44" height="3" rx="1.5" fill="url(#badgeCrownGold)" />
                <circle cx="30" cy="2" r="2.2" fill="#FFE49E" />
                <circle cx="12" cy="7" r="1.8" fill="#D32F2F" />
                <circle cx="48" cy="7" r="1.8" fill="#D32F2F" />
                <defs>
                  <linearGradient id="badgeCrownGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF2B8" />
                    <stop offset="50%" stopColor="#F5C65B" />
                    <stop offset="100%" stopColor="#C4932B" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="badge-text-row">
              <span className="badge-flourish-wing wing-left">❖</span>
              <h2 className="collection-main-heading">Our Royal Collection</h2>
              <span className="badge-flourish-wing wing-right">❖</span>
            </div>
          </div>

          {/* Subtitle with Royal Golden Divider Lines */}
          <div className="collection-subtitle-row">
            <span className="sub-gold-line line-left" />
            <p className="collection-subtitle">Taste the Royal Tradition</p>
            <span className="sub-gold-line line-right" />
          </div>
        </div>

        {/* The 8 Products Grid: Exactly 4 + 4 on Desktop */}
        <div className="royal-products-grid">
          {products.map((product) => {
            const isWishlisted = wishlistItems.some((w) => w.id === product.id);

            return (
              <div
                key={product.id}
                className="royal-product-card"
                onClick={() => onSelectProduct && onSelectProduct(product)}
              >
                {/* Wishlist Quick Toggle */}
                <button
                  className={`card-wishlist-btn ${isWishlisted ? 'active' : ''}`}
                  title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWishlist && onToggleWishlist(product);
                  }}
                  aria-label="Wishlist"
                >
                  <svg viewBox="0 0 24 24" fill={isWishlisted ? '#D32F2F' : 'none'}>
                    <path
                      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
                      stroke={isWishlisted ? '#D32F2F' : '#9E6D18'}
                      strokeWidth="1.8"
                    />
                  </svg>
                </button>

                {/* Product Image Area */}
                <div className="product-image-frame">
                  <img
                    src={product.image || '/assets/products/til_gajak_hd.jpg'}
                    alt={product.name}
                    className="product-thumbnail"
                    loading="eager"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = '/assets/products/til_gajak_hd.jpg';
                    }}
                  />
                  {product.is_bestseller && (
                    <span className="product-tag-bestseller">Royal Pick</span>
                  )}
                </div>

                {/* Product Info */}
                <div className="product-details">
                  <h3 className="product-name">{product.name}</h3>

                  {/* Rating Stars & Reviews */}
                  <div className="product-rating-row">
                    <span className="stars-gold">★★★★★</span>
                    <span className="rating-score">{product.rating}</span>
                    <span className="review-count">({product.reviews})</span>
                  </div>

                  {/* Price Row */}
                  <div className="product-price-row">
                    <span className="currency-symbol">₹</span>
                    <span className="price-value">{product.price}</span>
                    {product.original_price && (
                      <span className="original-price">₹{product.original_price}</span>
                    )}
                    <span className="weight-badge">{product.weight}</span>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="product-actions-row">
                    <button
                      className="card-add-to-cart-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart && onAddToCart(product);
                      }}
                      title="Add to Royal Cart"
                    >
                      <svg className="btn-cart-icon" viewBox="0 0 24 24" fill="none">
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
                      <span>Add to Cart</span>
                    </button>

                    <button
                      className="card-view-arrow-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProduct && onSelectProduct(product);
                      }}
                      title="View Details"
                      aria-label="View Details"
                    >
                      <svg viewBox="0 0 20 20" fill="none">
                        <path
                          d="M7 4L13 10L7 16"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
