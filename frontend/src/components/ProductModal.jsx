import React, { useState } from 'react';
import '../styles/ProductModal.css';

/**
 * Royal Product Detail Modal
 * Full product view with weight selection, ingredients, nutrition and add-to-cart.
 */
export default function ProductModal({ product, onClose, onAddToCart }) {
  if (!product) return null;

  const [selectedWeight, setSelectedWeight] = useState('500g');
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Weight pricing multipliers
  const weightMultipliers = {
    '250g': 0.55,
    '500g': 1.0,
    '1kg': 1.85
  };

  const calculatedPrice = Math.round(product.price * (weightMultipliers[selectedWeight] || 1));

  const handleAdd = () => {
    onAddToCart({
      ...product,
      weight: selectedWeight,
      price: calculatedPrice
    }, quantity);

    setAddedNotice(true);
    setTimeout(() => {
      setAddedNotice(false);
      onClose();
    }, 700);
  };

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div className="product-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="modal-close-btn" onClick={onClose} aria-label="Close Product View">✕</button>

        <div className="modal-grid">
          {/* Left Column: Image & Badges */}
          <div className="modal-image-col">
            <div className="modal-image-wrapper">
              <img
                src={product.image || '/assets/products/til_gajak_hd.jpg'}
                alt={product.name}
                className="modal-product-img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/assets/products/til_gajak_hd.jpg';
                }}
              />
              <div className="modal-heritage-badge">Jaipur Heritage</div>
            </div>

            {/* Quality Seals */}
            <div className="modal-quality-seals">
              <div className="quality-seal">
                <span className="seal-icon">🌿</span>
                <span className="seal-text">100% Veg</span>
              </div>
              <div className="quality-seal">
                <span className="seal-icon">🧈</span>
                <span className="seal-text">Pure Desi Ghee</span>
              </div>
              <div className="quality-seal">
                <span className="seal-icon">✨</span>
                <span className="seal-text">No Preservatives</span>
              </div>
            </div>
          </div>

          {/* Right Column: Details & Ordering */}
          <div className="modal-info-col">
            <span className="modal-category">{product.category}</span>
            <h2 className="modal-title">{product.name}</h2>

            {/* Rating Stars */}
            <div className="modal-rating-row">
              <span className="modal-stars">★★★★★</span>
              <span className="modal-score">{product.rating}</span>
              <span className="modal-reviews">({product.reviews} verified reviews)</span>
            </div>

            {/* Price */}
            <div className="modal-price-box">
              <span className="modal-currency">₹</span>
              <span className="modal-current-price">{calculatedPrice}</span>
              {product.original_price && (
                <span className="modal-original-price">
                  ₹{Math.round(product.original_price * (weightMultipliers[selectedWeight] || 1))}
                </span>
              )}
              <span className="modal-tax-note">(Inclusive of all taxes)</span>
            </div>

            {/* Description */}
            <p className="modal-description">{product.description}</p>

            {/* Weight Selection */}
            <div className="modal-section-block">
              <label className="section-label">Select Pack Size:</label>
              <div className="weight-options-row">
                {['250g', '500g', '1kg'].map((w) => (
                  <button
                    key={w}
                    className={`weight-chip ${selectedWeight === w ? 'selected' : ''}`}
                    onClick={() => setSelectedWeight(w)}
                  >
                    {w}
                  </button>
                ))}
              </div>
            </div>

            {/* Authentic Ingredients List */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div className="modal-section-block">
                <label className="section-label">Royal Ingredients:</label>
                <div className="ingredients-pill-row">
                  {product.ingredients.map((ing, idx) => (
                    <span key={idx} className="ingredient-pill">
                      ✦ {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity and Add to Cart */}
            <div className="modal-purchase-row">
              <div className="modal-qty-stepper">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>

              <button
                className={`modal-add-cart-btn ${addedNotice ? 'added' : ''}`}
                onClick={handleAdd}
                disabled={addedNotice}
              >
                {addedNotice ? (
                  <span>✓ Added to Royal Basket!</span>
                ) : (
                  <span>Add to Royal Basket • ₹{calculatedPrice * quantity}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

