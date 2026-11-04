import React, { useState } from 'react';

const WORKFLOW_STEPS = [
  { key: 'new_order', label: 'New Order', step: 1, icon: '📥' },
  { key: 'confirmed', label: 'Confirmed', step: 2, icon: '✅' },
  { key: 'processing_qc', label: 'Processing & QC', step: 3, icon: '🍳' },
  { key: 'packed', label: 'Packed', step: 4, icon: '📦' },
  { key: 'dispatched', label: 'Dispatched', step: 5, icon: '🚚' },
  { key: 'out_for_delivery', label: 'Out for Delivery', step: 6, icon: '🛵' },
  { key: 'delivered', label: 'Delivered', step: 7, icon: '🎉' },
];

export default function OrderDetailDrawer({
  order,
  token,
  onClose,
  onOrderUpdated,
  onPrint
}) {
  if (!order) return null;

  const [isUpdating, setIsUpdating] = useState(false);
  const [transitionNote, setTransitionNote] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState(null);

  // New Note State
  const [newNote, setNewNote] = useState('');
  const [isCustomerNote, setIsCustomerNote] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState(null);

  // Payment Status state
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const currentStep = order.fulfilment?.step || 1;
  const isDelivered = order.fulfilment?.current_key === 'delivered';
  const isCancelled = order.core_status === 'cancelled';
  const nextKey = order.fulfilment?.next_key;
  const nextLabel = order.fulfilment?.next_label;

  // Handle Advance Status confirmation trigger
  const handleTriggerAdvance = (statusKey) => {
    setTargetStatus(statusKey);
    setShowConfirmModal(true);
  };

  // Perform backend status update
  const handleConfirmAdvance = async () => {
    if (!targetStatus) return;
    setIsUpdating(true);

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/orders.php?action=update_fulfilment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: order.id,
          next_status: targetStatus,
          note: transitionNote.trim()
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setShowConfirmModal(false);
        setTransitionNote('');
        onOrderUpdated();
      } else {
        alert(data.message || 'Could not update status');
      }
    } catch (e) {
      alert('Network error while updating order status');
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Cash Collected (COD Safety)
  const handleMarkCashCollected = async () => {
    if (!window.confirm(`Confirm that cash payment of ₹${order.financials?.total} has been collected for Order #${order.id}?`)) {
      return;
    }

    setIsUpdatingPayment(true);
    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/orders.php?action=update_payment_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: order.id,
          payment_status: 'paid',
          note: 'Cash verified & collected upon delivery.'
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        onOrderUpdated();
      } else {
        alert(data.message || 'Could not record cash collection');
      }
    } catch (e) {
      alert('Network error recording payment');
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  // Handle Adding Order Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    setNoteSuccess(null);

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/orders.php?action=add_note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_id: order.id,
          note: newNote.trim(),
          is_customer_note: isCustomerNote
        })
      });

      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setNewNote('');
        setIsCustomerNote(false);
        setNoteSuccess('Note added to order records!');
        setTimeout(() => setNoteSuccess(null), 3000);
        onOrderUpdated();
      } else {
        alert(data.message || 'Could not add note');
      }
    } catch (e) {
      alert('Network error adding note');
    } finally {
      setIsAddingNote(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="order-detail-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="drawer-title-group">
            <div className="drawer-badges-row">
              <span className="order-id-badge">Order #{order.id}</span>
              {order.is_react ? (
                <span className="badge-source-react">✨ REACT STOREFRONT</span>
              ) : (
                <span className="badge-source-legacy">🏛️ HISTORICAL / TEST</span>
              )}
              <span className={`fulfilment-pill ${order.fulfilment?.badge}`}>
                {order.fulfilment?.label}
              </span>
            </div>
            <p className="order-date-text">Placed on {order.date}</p>
          </div>

          <div className="drawer-header-actions">
            <button className="btn-drawer-print" onClick={() => onPrint(order, 'invoice')}>
              <span>🧾</span>
              <span>Invoice</span>
            </button>
            <button className="btn-drawer-print" onClick={() => onPrint(order, 'packing_slip')}>
              <span>📋</span>
              <span>Packing Slip</span>
            </button>
            <button className="btn-close-drawer" onClick={onClose} title="Close Panel">
              ✕
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="drawer-content-scroll">
          {/* 1. VISUAL 7-STEP FULFILMENT WORKFLOW */}
          <div className="workflow-stepper-card">
            <div className="stepper-title-row">
              <h3>Fulfilment Pipeline</h3>
              <div className="workflow-action-buttons">
                {nextKey && !isCancelled && (
                  <button
                    className="btn-advance-status"
                    disabled={isUpdating}
                    onClick={() => handleTriggerAdvance(nextKey)}
                  >
                    <span>⚡</span>
                    <span>Advance to {nextLabel} →</span>
                  </button>
                )}
                {!isCancelled && !isDelivered && (
                  <button
                    className="btn-cancel-order"
                    onClick={() => handleTriggerAdvance('cancelled')}
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>

            <div className="stepper-track">
              {WORKFLOW_STEPS.map((st) => {
                const isPassed = currentStep > st.step;
                const isCurrent = currentStep === st.step;
                return (
                  <div
                    key={st.key}
                    className={`stepper-step ${isPassed ? 'passed' : ''} ${isCurrent ? 'active' : ''}`}
                  >
                    <div className="step-circle">
                      {isPassed ? '✓' : st.icon}
                    </div>
                    <div className="step-label">{st.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. ORDER CARDS GRID (CUSTOMER, ADDRESSES, PAYMENT) */}
          <div className="drawer-cards-grid">
            {/* Customer Details */}
            <div className="detail-card">
              <div className="card-header-line">
                <span className="card-icon">👤</span>
                <h4>Patron Details</h4>
              </div>
              <div className="card-body-content">
                <p className="field-row">
                  <span className="field-label">Name:</span>
                  <span className="field-val highlight">{order.customer?.name}</span>
                </p>
                <p className="field-row">
                  <span className="field-label">Phone:</span>
                  <a href={`tel:${order.customer?.phone}`} className="field-val phone-link">
                    📞 {order.customer?.phone}
                  </a>
                </p>
                <p className="field-row">
                  <span className="field-label">Email:</span>
                  <a href={`mailto:${order.customer?.email}`} className="field-val email-link">
                    ✉️ {order.customer?.email}
                  </a>
                </p>
                {order.customer_note && order.customer_note !== 'None provided by customer.' && (
                  <div className="customer-note-banner">
                    <strong>Note:</strong> "{order.customer_note}"
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Address */}
            <div className="detail-card">
              <div className="card-header-line">
                <span className="card-icon">📍</span>
                <h4>Delivery Address</h4>
              </div>
              <div className="card-body-content">
                <p className="address-full">
                  <strong>{order.shipping_address?.full_name || order.customer?.name}</strong><br />
                  {order.shipping_address?.address_1}<br />
                  {order.shipping_address?.address_2 && <>{order.shipping_address.address_2}<br /></>}
                  {order.shipping_address?.landmark && order.shipping_address.landmark !== '—' && (
                    <span className="landmark-tag">Landmark: {order.shipping_address.landmark}<br /></span>
                  )}
                  {order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postcode}<br />
                  Contact: {order.shipping_address?.phone || order.customer?.phone}
                </p>
              </div>
            </div>

            {/* Payment Details & COD Safety */}
            <div className="detail-card">
              <div className="card-header-line">
                <span className="card-icon">💳</span>
                <h4>Payment & Settlement</h4>
              </div>
              <div className="card-body-content">
                <p className="field-row">
                  <span className="field-label">Method:</span>
                  <span className="field-val"><strong>{order.payment?.method_title}</strong></span>
                </p>
                <p className="field-row">
                  <span className="field-label">Payment Status:</span>
                  <span className={`payment-status-pill ${order.payment?.is_paid ? 'paid' : 'unpaid'}`}>
                    {order.payment?.status_label}
                  </span>
                </p>
                {order.payment?.transaction_id && (
                  <p className="field-row">
                    <span className="field-label">Txn ID:</span>
                    <span className="field-val font-mono">{order.payment.transaction_id}</span>
                  </p>
                )}
                {/* Strict COD Action Button */}
                {order.payment?.method === 'cod' && !order.payment?.is_paid && (
                  <div className="cod-collection-box">
                    <p className="cod-info-text">
                      ⚠️ Cash on Delivery: Payment has not yet been collected.
                    </p>
                    <button
                      className="btn-mark-paid"
                      disabled={isUpdatingPayment}
                      onClick={handleMarkCashCollected}
                    >
                      <span>💵</span>
                      <span>Mark Cash Collected (₹{order.financials?.total})</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. LINE ITEMS DELICACIES TABLE */}
          <div className="detail-card items-table-card">
            <div className="card-header-line">
              <span className="card-icon">🍯</span>
              <h4>Ordered Confectioneries & Gajak ({order.items?.length || 0} items)</h4>
            </div>

            <div className="table-responsive">
              <table className="drawer-items-table">
                <thead>
                  <tr>
                    <th>Delicacy</th>
                    <th>SKU</th>
                    <th>Weight</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.item_id}>
                      <td className="item-title-cell">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="item-thumb"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=100';
                          }}
                        />
                        <span className="item-name">{item.name}</span>
                      </td>
                      <td className="font-mono">{item.sku}</td>
                      <td>
                        <span className="weight-badge">{item.weight}</span>
                      </td>
                      <td>₹{Number(item.price).toFixed(2)}</td>
                      <td><strong>× {item.quantity}</strong></td>
                      <td style={{ textAlign: 'right' }} className="highlight-price">
                        ₹{Number(item.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="financials-summary-box">
              <div className="fin-row">
                <span>Subtotal:</span>
                <span>₹{Number(order.financials?.subtotal || order.financials?.total).toFixed(2)}</span>
              </div>
              {order.financials?.discount_total > 0 && (
                <div className="fin-row discount">
                  <span>Coupon Discount:</span>
                  <span>-₹{Number(order.financials.discount_total).toFixed(2)}</span>
                </div>
              )}
              <div className="fin-row">
                <span>Shipping Charges:</span>
                <span>{order.financials?.shipping_total > 0 ? `₹${Number(order.financials.shipping_total).toFixed(2)}` : 'FREE'}</span>
              </div>
              <div className="fin-row grand-total">
                <span>Grand Total:</span>
                <span>₹{Number(order.financials?.total).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* 4. ORDER NOTES & STATUS TIMELINE */}
          <div className="detail-card notes-section-card">
            <div className="card-header-line">
              <span className="card-icon">📜</span>
              <h4>Order Notes & Activity History ({order.notes?.length || 0})</h4>
            </div>

            {/* Add Note Form */}
            <form className="add-note-form" onSubmit={handleAddNote}>
              <textarea
                className="note-textarea"
                rows="2"
                placeholder="Add an internal note or customer notification for this order..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                required
              />
              <div className="note-form-actions">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isCustomerNote}
                    onChange={(e) => setIsCustomerNote(e.target.checked)}
                  />
                  <span>Note to Customer (Notify Patron)</span>
                </label>
                <button
                  type="submit"
                  className="btn-add-note"
                  disabled={isAddingNote || !newNote.trim()}
                >
                  {isAddingNote ? 'Saving Note...' : 'Add Order Note'}
                </button>
              </div>
              {noteSuccess && <div className="note-success-msg">✓ {noteSuccess}</div>}
            </form>

            {/* Notes List */}
            <div className="notes-list">
              {order.notes?.map((n) => (
                <div
                  key={n.id}
                  className={`note-entry ${n.customer_note ? 'customer-note-type' : 'internal-note-type'}`}
                >
                  <div className="note-entry-header">
                    <span className="note-author">👤 {n.author}</span>
                    <span className="note-date">{n.date}</span>
                    {n.customer_note && <span className="pill-customer-tag">Customer Note</span>}
                  </div>
                  <div
                    className="note-entry-body"
                    dangerouslySetInnerHTML={{ __html: n.content }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Status Confirmation Modal */}
        {showConfirmModal && (
          <div className="confirm-modal-overlay">
            <div className="confirm-dialog-card">
              <div className="confirm-icon">⚡</div>
              <h3>Confirm Fulfilment Transition</h3>
              <p>
                Are you sure you want to update Order #{order.id} status to{' '}
                <strong>
                  {WORKFLOW_STEPS.find((s) => s.key === targetStatus)?.label || targetStatus}
                </strong>?
              </p>

              <div className="form-group" style={{ textAlign: 'left', marginTop: 16 }}>
                <label className="form-label">Optional Staff Note / Remarks:</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Dispatched via express van, batch #4"
                  value={transitionNote}
                  onChange={(e) => setTransitionNote(e.target.value)}
                />
              </div>

              <div className="confirm-dialog-actions">
                <button
                  className="btn-cancel-dialog"
                  onClick={() => setShowConfirmModal(false)}
                  disabled={isUpdating}
                >
                  Back
                </button>
                <button
                  className="btn-confirm-action"
                  onClick={handleConfirmAdvance}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating in WooCommerce...' : 'Confirm Update'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

