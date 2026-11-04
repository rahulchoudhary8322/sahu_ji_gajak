import React from 'react';
import '../styles/CartDrawer.css';

/**
 * Royal Cart Drawer
 * Interactive slide-out cart displaying live items, quantities, subtotal, and checkout.
 */
export default function CartDrawer({
  isOpen,
  onClose,
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onNavigateCart
}) {
  if (!isOpen) return null;

  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const freeShippingThreshold = 499;
  const progressToFreeShipping = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="cart-header-title-row">
            <span className="cart-crown-icon">👑</span>
            <h3 className="cart-title">Your Royal Basket</h3>
            <span className="cart-count-badge">({items.reduce((acc, i) => acc + i.quantity, 0)})</span>
          </div>
          <button className="cart-close-btn" onClick={onClose} aria-label="Close Basket">✕</button>
        </div>

        {/* Free Shipping Meter */}
        <div className="free-shipping-meter">
          {subtotal >= freeShippingThreshold ? (
            <p className="shipping-congrats">🎉 Congratulations! You have unlocked Free Royal Delivery!</p>
          ) : (
            <p className="shipping-prompt">
              Add <strong>₹{freeShippingThreshold - subtotal}</strong> more for Free Royal Delivery!
            </p>
          )}
          <div className="shipping-track">
            <div className="shipping-fill" style={{ width: `${progressToFreeShipping}%` }} />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="cart-items-container">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <span className="empty-icon">🛒</span>
              <h4>Your royal basket is empty</h4>
              <p>Explore our royal collection to savor authentic handmade Gajak.</p>
              <button
                className="cart-shop-now-btn"
                onClick={() => {
                  onClose();
                  const shopSec = document.getElementById('shop');
                  if (shopSec) shopSec.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Explore Royal Collection
              </button>
            </div>
          ) : (
            <ul className="cart-items-list">
              {items.map((item) => {
                const itemKey = item.cart_key || `${item.id}-${item.weight || '500g'}`;
                return (
                  <li key={itemKey} className="cart-item-card">
                    <img
                      src={item.image || '/assets/products/til_gajak_hd.jpg'}
                      alt={item.name}
                      className="cart-item-img"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/products/til_gajak_hd.jpg';
                      }}
                    />
                    <div className="cart-item-info">
                      <div className="cart-item-top">
                        <h4 className="cart-item-name">{item.name}</h4>
                        <button
                          className="cart-item-remove-btn"
                          onClick={() => onRemoveItem && onRemoveItem(item.id, item.weight)}
                          title="Remove Item"
                        >
                          🗑️
                        </button>
                      </div>
                      <span className="cart-item-weight">{item.weight || '500g'}</span>
                      <div className="cart-item-bottom">
                        <span className="cart-item-price">₹{item.price * item.quantity}</span>
                        <div className="cart-qty-stepper">
                          <button
                            onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity - 1, item.weight)}
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity + 1, item.weight)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Summary & Checkout */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-summary-row">
              <span>Subtotal:</span>
              <span className="summary-price">₹{subtotal}</span>
            </div>
            <div className="cart-summary-row subtle">
              <span>Taxes & Packaging:</span>
              <span>Included</span>
            </div>
            <div className="cart-summary-row subtle">
              <span>Delivery:</span>
              <span>{subtotal >= freeShippingThreshold ? 'FREE' : '₹49'}</span>
            </div>

            <button
              className="cart-checkout-btn"
              onClick={() => {
                if (onCheckout) onCheckout(items, subtotal);
                else alert('Proceeding to secure royal checkout with Razorpay & UPI!');
              }}
            >
              <span>Proceed to Royal Checkout</span>
              <span className="checkout-btn-arrow">→</span>
            </button>

            {onNavigateCart && (
              <button
                className="cart-view-full-btn"
                onClick={() => {
                  onClose();
                  onNavigateCart();
                }}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px 16px',
                  background: 'transparent',
                  border: '1.5px solid #d4a33d',
                  borderRadius: '30px',
                  color: '#f7d288',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>View Full Basket & Offers</span>
                <span>✦</span>
              </button>
            )}
            <p className="checkout-trust-note">🔒 100% Authentic Jaipur Sweets • Safe & Secure Payment</p>
          </div>
        )}
      </div>
    </div>
  );
}

