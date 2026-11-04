import React from 'react';
import '../styles/CartDrawer.css';

/**
 * Royal Wishlist Drawer
 * Displays wishlisted royal sweets with quick Move-to-Cart functionality.
 */
export default function WishlistDrawer({
  isOpen,
  onClose,
  items = [],
  onAddToCart,
  onRemoveFromWishlist,
  onNavigateWishlist
}) {
  if (!isOpen) return null;

  return (
    <div className="cart-drawer-overlay" onClick={onClose}>
      <div className="cart-drawer-panel" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-drawer-header">
          <div className="cart-header-title-row">
            <span className="cart-crown-icon">💖</span>
            <h3 className="cart-title">Royal Wishlist</h3>
            <span className="cart-count-badge">({items.length})</span>
          </div>
          <button className="cart-close-btn" onClick={onClose} aria-label="Close Wishlist">✕</button>
        </div>

        {/* Content */}
        <div className="cart-items-container">
          {items.length === 0 ? (
            <div className="cart-empty-state">
              <span className="empty-icon">🤍</span>
              <h4>Your royal wishlist is empty</h4>
              <p>Save your favorite handcrafted sweets to enjoy or gift on special occasions.</p>
              <button
                className="cart-shop-now-btn"
                onClick={() => {
                  onClose();
                  const shopSec = document.getElementById('shop');
                  if (shopSec) shopSec.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Browse Royal Sweets
              </button>
            </div>
          ) : (
            <ul className="cart-items-list">
              {items.map((item) => (
                <li key={item.id} className="cart-item-card">
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
                        onClick={() => onRemoveFromWishlist && onRemoveFromWishlist(item.id)}
                        title="Remove from Wishlist"
                      >
                        ✕
                      </button>
                    </div>
                    <span className="cart-item-weight">{item.weight || '500g'}</span>
                    <div className="cart-item-bottom">
                      <span className="cart-item-price">₹{item.price}</span>
                      <button
                        className="card-add-to-cart-btn"
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                        onClick={() => {
                          onAddToCart && onAddToCart(item);
                          onRemoveFromWishlist && onRemoveFromWishlist(item.id);
                        }}
                      >
                        Move to Cart
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && onNavigateWishlist && (
          <div className="cart-drawer-footer" style={{ borderTop: '1px solid rgba(212, 163, 61, 0.3)', padding: '16px 20px' }}>
            <button
              onClick={() => {
                onClose();
                onNavigateWishlist();
              }}
              style={{
                width: '100%',
                padding: '12px 18px',
                background: 'linear-gradient(135deg, #3B0707 0%, #5A1010 100%)',
                border: '1.5px solid #d4a33d',
                borderRadius: '30px',
                color: '#f7d288',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(59, 7, 7, 0.25)'
              }}
            >
              <span>View Full Wishlist ({items.length})</span>
              <span>✦</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

