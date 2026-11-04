import React, { useState, useEffect } from 'react';
import '../styles/OrderConfirmationPage.css';

export default function OrderConfirmationPage({
  orderId,
  orderKey,
  initialOrderData = null,
  onNavigateHome,
  onNavigateShop
}) {
  const [order, setOrder] = useState(initialOrderData?.order || null);
  const [loading, setLoading] = useState(!initialOrderData?.order);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (order && order.id === orderId) return;

    if (!orderId || !orderKey) {
      setError('Order identification and access token are required.');
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`http://127.0.0.1:8000/api/order?id=${orderId}&key=${encodeURIComponent(orderKey)}`)
      .then((res) => {
        if (!res.ok) {
          if (res.status === 403) throw new Error('Access denied: Unauthorized order token.');
          if (res.status === 404) throw new Error('Order not found.');
          throw new Error('Unable to retrieve royal order details.');
        }
        return res.json();
      })
      .then((data) => {
        if (data.status === 'success' && data.order) {
          setOrder(data.order);
        } else {
          setError(data.message || 'Error fetching order details.');
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [orderId, orderKey]);

  if (loading) {
    return (
      <div className="order-conf-loading-screen">
        <div className="conf-loading-box">
          <div className="conf-crown-pulse">👑</div>
          <h2 className="conf-loading-title">Retrieving Royal Decree...</h2>
          <p className="conf-loading-subtitle">Verifying authentic WooCommerce order record & cryptographic security token.</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-conf-error-screen">
        <div className="conf-error-card">
          <div className="conf-error-icon">🛡️</div>
          <h2 className="conf-error-title">Order Access Restricted</h2>
          <p className="conf-error-msg">{error || 'Unable to view this order decree.'}</p>
          <button className="conf-btn-gold" onClick={onNavigateHome}>
            Return to Royal Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-confirmation-wrapper">
      <div className="order-conf-container">
        {/* Celebration Header Banner */}
        <div className="conf-celebration-hero">
          <div className="conf-emblem-badge">
            <span className="conf-emblem-crown">👑</span>
          </div>
          <span className="conf-royal-proclamation">✦ Royal Decree of Order Confirmation ✦</span>
          <h1 className="conf-hero-title">Your Royal Order has been Placed!</h1>
          <p className="conf-hero-desc">
            Greetings from the master artisans of Jaipur. Your authentic handcrafted sweets order has been accepted into our kitchen registers.
          </p>

          <div className="conf-order-meta-pills">
            <div className="meta-pill-item">
              <span className="meta-pill-label">Order Number:</span>
              <strong className="meta-pill-value gold">#{order.order_number}</strong>
            </div>
            <div className="meta-pill-item">
              <span className="meta-pill-label">Date:</span>
              <strong className="meta-pill-value">{order.date_created}</strong>
            </div>
            <div className="meta-pill-item">
              <span className="meta-pill-label">Status:</span>
              <span className="status-badge-live">{order.status_name}</span>
            </div>
            <div className="meta-pill-item">
              <span className="meta-pill-label">Payment:</span>
              <strong className="meta-pill-value">{order.payment_method_title}</strong>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="conf-details-grid">
          {/* Left Column: Products List & Breakdown */}
          <div className="conf-left-column">
            <div className="conf-card">
              <div className="conf-card-header">
                <h3 className="conf-card-title">Handcrafted Delicacies in Your Order</h3>
                <span className="conf-badge-count">{order.items?.length || 0} Delicacies</span>
              </div>
              <div className="conf-card-body">
                <div className="conf-items-table">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="conf-item-row">
                      <div className="conf-item-image-box">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="conf-item-img"
                          onError={(e) => {
                            e.target.src = '/assets/products/til_gajak_hd.jpg';
                          }}
                        />
                      </div>
                      <div className="conf-item-info">
                        <h4 className="conf-product-name">{item.name}</h4>
                        <div className="conf-product-meta">
                          <span className="meta-weight-badge">{item.weight || '500g'}</span>
                          <span className="meta-qty-tag">Qty: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="conf-item-prices">
                        <span className="conf-unit-price">₹{Math.round(item.unit_price)} each</span>
                        <strong className="conf-subtotal-price">₹{Math.round(item.subtotal)}</strong>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Financial Summary */}
                <div className="conf-summary-breakdown">
                  <div className="conf-sum-row">
                    <span>Delicacies Subtotal:</span>
                    <span>₹{order.subtotal}</span>
                  </div>
                  {order.discount_total > 0 && (
                    <div className="conf-sum-row discount">
                      <span>Royal Coupon Discount:</span>
                      <span>-₹{order.discount_total}</span>
                    </div>
                  )}
                  <div className="conf-sum-row">
                    <span>Shipping Charges ({order.shipping_method}):</span>
                    <span>{order.shipping_total === 0 ? 'FREE' : `₹${order.shipping_total}`}</span>
                  </div>
                  <div className="conf-sum-row grand-total">
                    <span>Total Amount Paid / Payable:</span>
                    <strong className="grand-price">₹{order.total}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Customer Info, Shipping Address, Security Certificate */}
          <div className="conf-right-column">
            {/* Delivery Address Card */}
            <div className="conf-card">
              <div className="conf-card-header">
                <h3 className="conf-card-title">Delivery Address</h3>
              </div>
              <div className="conf-card-body address-body">
                <h4 className="customer-full-name">
                  {order.shipping_address?.first_name} {order.shipping_address?.last_name}
                </h4>
                <p className="address-line">{order.shipping_address?.address_1}</p>
                <p className="address-line">{order.shipping_address?.address_2}</p>
                <p className="address-line">
                  {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postcode}
                </p>
                <p className="address-line country">{order.shipping_address?.country === 'IN' ? 'India' : order.shipping_address?.country}</p>

                <div className="contact-meta-group">
                  <div className="contact-meta-row">
                    <span className="contact-icon">📱</span>
                    <span>+91 {order.customer?.phone}</span>
                  </div>
                  <div className="contact-meta-row">
                    <span className="contact-icon">✉️</span>
                    <span>{order.customer?.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="conf-card">
              <div className="conf-card-header">
                <h3 className="conf-card-title">Payment Method</h3>
              </div>
              <div className="conf-card-body">
                <div className="payment-confirmation-row">
                  <span className="payment-conf-icon">💳</span>
                  <div>
                    <strong className="payment-conf-title">{order.payment_method_title}</strong>
                    <p className="payment-conf-note">
                      {order.payment_method === 'cod'
                        ? 'Please keep exact cash ready upon arrival of your royal parcel.'
                        : 'Please complete your bank transfer using the credentials provided.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Royal Quality Seal Card */}
            <div className="conf-card quality-seal-card">
              <div className="seal-crest">⚜️</div>
              <h4 className="seal-title">Authentic Jaipur Quality Guarantee</h4>
              <p className="seal-text">
                Your order is freshly roasted and packaged in damage-proof airtight heritage tin boxes to guarantee authentic crispness.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="conf-actions-stack">
              <button className="conf-btn-gold" onClick={onNavigateShop}>
                <span>Continue Royal Shopping</span>
                <span className="btn-arrow">→</span>
              </button>
              <button
                type="button"
                className="conf-btn-outline"
                onClick={() => window.print()}
              >
                🖨️ Print Royal Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

