import React from 'react';

export default function PrintDocumentsModal({ order, documentType, onClose }) {
  if (!order) return null;

  const isInvoice = documentType === 'invoice';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-modal-overlay">
      <div className="print-modal-controls no-print">
        <div className="controls-left">
          <span className="doc-title-badge">
            {isInvoice ? '🧾 Tax Invoice Preview' : '📋 Dispatch Packing Slip Preview'}
          </span>
          <span className="doc-sub">Order #{order.id} • {order.customer?.name}</span>
        </div>
        <div className="controls-right">
          <button className="btn-print-action" onClick={handlePrint}>
            <span>🖨️</span>
            <span>Print A4 Document</span>
          </button>
          <button className="btn-close-modal" onClick={onClose} title="Close Preview">
            ✕
          </button>
        </div>
      </div>

      <div className="print-document-container">
        {/* Printable Paper Area (A4) */}
        <div className="a4-paper">
          {/* Header */}
          <div className="print-header">
            <div className="print-brand">
              <div className="print-emblem">👑</div>
              <div className="print-brand-info">
                <h1>SAHU JI GAJAK</h1>
                <p>Purveyors of Royal Sweets & Traditional Winter Delicacies</p>
                <p className="print-origin">Authentic Jaipur Heritage • Made with 100% Pure Desi Ghee</p>
              </div>
            </div>
            <div className="print-meta-box">
              <div className="meta-doc-type">
                {isInvoice ? 'RETAIL INVOICE' : 'PACKING & DISPATCH SLIP'}
              </div>
              <div className="meta-row">
                <span className="meta-lbl">Order No:</span>
                <span className="meta-val">#{order.id}</span>
              </div>
              <div className="meta-row">
                <span className="meta-lbl">Date:</span>
                <span className="meta-val">{order.date}</span>
              </div>
              <div className="meta-row">
                <span className="meta-lbl">Payment:</span>
                <span className="meta-val">{order.payment?.method_title || 'Cash on Delivery'}</span>
              </div>
              <div className="meta-row">
                <span className="meta-lbl">Pay Status:</span>
                <span className="meta-val">{order.payment?.status_label || 'Unpaid'}</span>
              </div>
            </div>
          </div>

          <div className="print-divider" />

          {/* Customer & Shipping Section */}
          <div className="print-addresses-grid">
            <div className="address-box">
              <h3>Billed To (Patron):</h3>
              <p className="cust-name"><strong>{order.customer?.name}</strong></p>
              <p>{order.billing_address?.address_1}</p>
              {order.billing_address?.address_2 && <p>{order.billing_address.address_2}</p>}
              <p>{order.billing_address?.city}, {order.billing_address?.state} - {order.billing_address?.postcode}</p>
              <p>Phone: <strong>{order.customer?.phone}</strong></p>
              <p>Email: {order.customer?.email}</p>
            </div>

            <div className="address-box">
              <h3>Delivered To (Shipping):</h3>
              <p className="cust-name"><strong>{order.shipping_address?.full_name || order.customer?.name}</strong></p>
              <p>{order.shipping_address?.address_1}</p>
              {order.shipping_address?.address_2 && <p>{order.shipping_address.address_2}</p>}
              {order.shipping_address?.landmark && order.shipping_address.landmark !== '—' && (
                <p className="landmark-text">Landmark: <strong>{order.shipping_address.landmark}</strong></p>
              )}
              <p>{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postcode}</p>
              <p>Contact: <strong>{order.shipping_address?.phone || order.customer?.phone}</strong></p>
            </div>
          </div>

          {/* Items Table */}
          <table className="print-items-table">
            <thead>
              <tr>
                <th style={{ width: '8%', textAlign: 'center' }}>#</th>
                <th style={{ width: '45%' }}>Delicacy Description</th>
                <th style={{ width: '15%', textAlign: 'center' }}>SKU</th>
                <th style={{ width: '12%', textAlign: 'center' }}>Qty</th>
                {isInvoice && <th style={{ width: '10%', textAlign: 'right' }}>Price</th>}
                {isInvoice && <th style={{ width: '10%', textAlign: 'right' }}>Total</th>}
                {!isInvoice && <th style={{ width: '20%', textAlign: 'center' }}>QC Verified</th>}
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={item.item_id || idx}>
                  <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <div className="item-meta-sub">{item.weight}</div>
                  </td>
                  <td style={{ textAlign: 'center' }} className="font-mono">{item.sku}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="print-qty">{item.quantity}</span>
                  </td>
                  {isInvoice && (
                    <td style={{ textAlign: 'right' }}>
                      ₹{Number(item.price).toFixed(2)}
                    </td>
                  )}
                  {isInvoice && (
                    <td style={{ textAlign: 'right' }}>
                      <strong>₹{Number(item.total).toFixed(2)}</strong>
                    </td>
                  )}
                  {!isInvoice && (
                    <td style={{ textAlign: 'center' }}>
                      <div className="qc-checkbox-box">☐ Packed</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financials / Packing Summary */}
          {isInvoice ? (
            <div className="print-totals-wrapper">
              <div className="totals-left-notes">
                <p><strong>Patron Note:</strong> {order.customer_note || 'None'}</p>
                <p className="terms-text">
                  * All delicacies are prepared fresh and dispatched in tamper-evident royal food-grade sealed tins.
                  Store in a cool, dry place. Best consumed within 60 days.
                </p>
              </div>
              <div className="totals-right-box">
                <div className="tot-row">
                  <span>Subtotal:</span>
                  <span>₹{Number(order.financials?.subtotal || order.financials?.total).toFixed(2)}</span>
                </div>
                {order.financials?.discount_total > 0 && (
                  <div className="tot-row discount">
                    <span>Coupon Discount:</span>
                    <span>-₹{Number(order.financials.discount_total).toFixed(2)}</span>
                  </div>
                )}
                <div className="tot-row">
                  <span>Shipping Charges:</span>
                  <span>{order.financials?.shipping_total > 0 ? `₹${Number(order.financials.shipping_total).toFixed(2)}` : 'FREE'}</span>
                </div>
                <div className="tot-row grand-total">
                  <span>Final Grand Total:</span>
                  <span>₹{Number(order.financials?.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="print-packing-checklist">
              <div className="checklist-col">
                <h4>Packer & QC Checklist:</h4>
                <p>☑ Outer Tamper-proof Box & Gold Ribbon</p>
                <p>☑ Moisture-proof Desiccant Included</p>
                <p>☑ Royal Greeting Card Inserted</p>
              </div>
              <div className="sign-col">
                <div className="sign-line">Packed By (Kitchen Staff)</div>
                <div className="sign-line">Inspected By (Administrator)</div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="print-footer">
            <p>Thank you for choosing Sahu Ji Gajak — Preserving Rajasthan's Royal Flavors</p>
            <p className="footer-sub">For inquiries or bulk orders: support@shreeshahigajak.com • Customer Care: +91 98281 03222</p>
          </div>
        </div>
      </div>
    </div>
  );
}

