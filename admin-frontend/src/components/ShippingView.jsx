import React, { useState, useEffect, useCallback } from 'react';

export default function ShippingView({ token }) {
  const [counts, setCounts] = useState({
    total: 0,
    ready_to_ship: 0,
    pending_awb: 0,
    pickup_pending: 0,
    dispatched: 0,
    in_transit: 0,
    out_for_delivery: 0,
    delivered: 0,
    failed: 0
  });
  const [shiprocketStatus, setShiprocketStatus] = useState(null);

  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_items: 0, limit: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Dispatch / AWB Modal
  const [dispatchModalOrder, setDispatchModalOrder] = useState(null);
  const [courierName, setCourierName] = useState('Jaipur Royal Express Delivery');
  const [awbNumber, setAwbNumber] = useState('');
  const [dispatching, setDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState('');
  const [dispatchSuccess, setDispatchSuccess] = useState('');

  // Tracking Drawer
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [trackingData, setTrackingData] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  // Fetch Shipping Overview & Shiprocket Status
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/shipping.php?action=overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        if (data.counts) setCounts(data.counts);
        if (data.shiprocket_status) setShiprocketStatus(data.shiprocket_status);
      }
    } catch (err) {}
  }, [token]);

  // Fetch Eligible Orders
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      action: 'eligible_orders',
      page: String(page),
      limit: '15'
    });

    if (search.trim()) params.append('search', search.trim());
    if (statusFilter !== 'all') params.append('status', statusFilter);

    try {
      const res = await fetch(`/wordpress/shree-shahi-admin/api/shipping.php?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setOrders(data.orders || []);
        if (data.pagination) setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to load shipping orders.');
      }
    } catch (err) {
      setError('Network connection error while fetching shipping manifest.');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, statusFilter]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Open Dispatch Modal
  const handleOpenDispatch = (order) => {
    setDispatchModalOrder(order);
    setCourierName('Jaipur Royal Express Delivery');
    setAwbNumber(`JREX-${Math.floor(100000 + Math.random() * 900000)}`);
    setDispatchError('');
    setDispatchSuccess('');
  };

  // Submit Dispatch
  const handleConfirmDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchModalOrder) return;

    if (!courierName.trim() || !awbNumber.trim()) {
      setDispatchError('Please provide both Courier Service Name and AWB Number.');
      return;
    }

    setDispatching(true);
    setDispatchError('');

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/shipping.php?action=generate_awb', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: dispatchModalOrder.id,
          courier_name: courierName.trim(),
          awb_number: awbNumber.trim(),
          is_manual_entry: true
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setDispatchSuccess(data.message || 'Shipment dispatched successfully.');
        setTimeout(() => {
          setDispatchModalOrder(null);
          fetchOverview();
          fetchOrders();
        }, 1200);
      } else {
        setDispatchError(data.message || 'Failed to dispatch shipment.');
      }
    } catch (err) {
      setDispatchError('Network error while recording consignment dispatch.');
    } finally {
      setDispatching(false);
    }
  };

  // Open Tracking Drawer
  const handleOpenTracking = async (order) => {
    setTrackingOrder(order);
    setTrackingLoading(true);
    try {
      const res = await fetch(`/wordpress/shree-shahi-admin/api/shipping.php?action=tracking&order_id=${order.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTrackingData(data);
      }
    } catch (e) {} finally {
      setTrackingLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'dispatched':
      case 'in_transit':
        return <span className="ship-badge in-transit">🚚 Dispatched</span>;
      case 'delivered':
        return <span className="ship-badge delivered">✓ Delivered</span>;
      case 'pickup_pending':
        return <span className="ship-badge pickup-pending">⏳ Pickup Pending</span>;
      default:
        return <span className="ship-badge ready">📦 Ready to Ship</span>;
    }
  };

  return (
    <div className="royal-module-wrapper">
      {/* 1. TOP HEADER */}
      <div className="module-top-header">
        <div>
          <h1 className="module-main-title">Shipping & Courier Operations</h1>
          <p className="module-subtitle">
            Manage order dispatch, carrier serviceability, consignment manifests and tracking
          </p>
        </div>
        <div className="header-action-group">
          <a
            href={`/wordpress/shree-shahi-admin/api/shipping.php?action=export_csv&token=${encodeURIComponent(token)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-royal-outline"
          >
            📥 Export Shipping Manifest CSV
          </a>
        </div>
      </div>

      {/* 2. STATS PILLS */}
      <div className="stats-pill-row">
        <div
          className={`stat-pill ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('all'); setPage(1); }}
        >
          <span className="pill-label">Total Shipments</span>
          <span className="pill-value">{counts.total}</span>
        </div>
        <div
          className={`stat-pill ${statusFilter === 'ready_to_ship' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('ready_to_ship'); setPage(1); }}
        >
          <span className="pill-label">Ready to Ship</span>
          <span className="pill-value text-gold">{counts.ready_to_ship}</span>
        </div>
        <div
          className={`stat-pill ${statusFilter === 'dispatched' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('dispatched'); setPage(1); }}
        >
          <span className="pill-label">Dispatched / In-Transit</span>
          <span className="pill-value text-gold">{counts.dispatched + counts.in_transit}</span>
        </div>
        <div
          className={`stat-pill ${statusFilter === 'delivered' ? 'active' : ''}`}
          onClick={() => { setStatusFilter('delivered'); setPage(1); }}
        >
          <span className="pill-label">Delivered</span>
          <span className="pill-value text-success">{counts.delivered}</span>
        </div>
      </div>

      {/* 3. SHIPROCKET STATUS NOTICE BANNER */}
      {shiprocketStatus && (
        <div className={`gateway-status-banner ${shiprocketStatus.configured ? 'configured' : 'pending'}`}>
          <div className="gw-banner-left">
            <span className="gw-banner-icon">{shiprocketStatus.configured ? '🚀' : '⚠️'}</span>
            <div>
              <div className="gw-title-line">
                <strong>Shiprocket Courier Logistics Integration</strong>
                <span className={`gw-pill ${shiprocketStatus.configured ? 'live' : 'pending'}`}>
                  {shiprocketStatus.status_label}
                </span>
              </div>
              <p className="gw-notice-text">
                {shiprocketStatus.configured ? (
                  `Connected to active Shiprocket account (${shiprocketStatus.masked_email}). Live AWB booking and carrier rate discovery active.`
                ) : (
                  'Official Shiprocket API credentials are not yet configured in WooCommerce store settings. Administrator can record direct carrier dispatches (Jaipur Royal Express, Delhivery, Bluedart) with verified tracking dockets.'
                )}
              </p>
            </div>
          </div>
          <div className="gw-banner-right">
            <span className="security-shield">🛡️ Verified Manifest Pipeline</span>
          </div>
        </div>
      )}

      {/* 4. FILTER AND SEARCH BAR */}
      <div className="filter-card">
        <div className="filter-form-grid">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-field"
              placeholder="Search by Order ID, customer, city, pincode, or AWB..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" className="clear-search-btn" onClick={() => setSearch('')}>
                ✕
              </button>
            )}
          </div>

          <div className="filter-dropdown-wrap">
            <select
              className="filter-dropdown"
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Shipment Statuses</option>
              <option value="ready_to_ship">Ready to Ship</option>
              <option value="dispatched">Dispatched / In-Transit</option>
              <option value="delivered">Delivered</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. ELIGIBLE ORDERS TABLE */}
      <div className="royal-table-container">
        {loading ? (
          <div className="table-loading-state">
            <div className="royal-spinner"></div>
            <p>Loading verified shipping consignments...</p>
          </div>
        ) : error ? (
          <div className="table-error-state">
            <p>⚠️ {error}</p>
            <button className="btn-retry" onClick={fetchOrders}>Retry</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-icon">🚚</div>
            <h3>No Shipments Found</h3>
            <p>No orders match current shipping filters.</p>
          </div>
        ) : (
          <table className="orders-main-table shipping-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Patron Details</th>
                <th>Destination</th>
                <th>Consignment Weight</th>
                <th>Payment</th>
                <th>Shipment Status</th>
                <th>Carrier / AWB</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td>
                    <strong className="order-id-highlight">#{o.id}</strong>
                    <div className="order-time-sub">{o.date_created}</div>
                  </td>
                  <td>
                    <div className="cust-full-name">{o.customer_name}</div>
                    <div className="cust-phone-sub">📞 {o.phone}</div>
                  </td>
                  <td>
                    <div className="cust-city">{o.city}, {o.state}</div>
                    <div className="cust-pin-sub">PIN: {o.pincode}</div>
                  </td>
                  <td>
                    <span className="weight-badge">⚖️ {o.weight_kg} kg</span>
                    <div className="items-count-sub">{o.items_count} item{o.items_count === 1 ? '' : 's'}</div>
                  </td>
                  <td>
                    <span className={`payment-status-pill ${o.payment_status}`}>
                      {o.payment_status_label}
                    </span>
                    <div className="method-sub">{o.payment_method}</div>
                  </td>
                  <td>{getStatusBadge(o.shipment_status)}</td>
                  <td>
                    {o.awb_number ? (
                      <div className="awb-info-wrap">
                        <strong className="awb-text">{o.awb_number}</strong>
                        <span className="courier-text">{o.courier_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted">AWB Pending</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="table-action-btns">
                      <button
                        className="btn-action-view"
                        onClick={() => handleOpenTracking(o)}
                        title="View Consignment Tracking Timeline"
                      >
                        📍 Track
                      </button>
                      <button
                        className="btn-action-primary"
                        onClick={() => handleOpenDispatch(o)}
                        title="Dispatch Consignment & Assign AWB"
                      >
                        📦 {o.awb_number ? 'Update AWB' : 'Dispatch'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* PAGINATION */}
        {!loading && pagination.total_pages > 1 && (
          <div className="pagination-bar">
            <span>Showing Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_items} consignments)</span>
            <div className="pagination-btns">
              <button
                className="btn-page"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                ◀ Prev
              </button>
              <button
                className="btn-page"
                disabled={page >= pagination.total_pages}
                onClick={() => setPage(p => Math.min(pagination.total_pages, p + 1))}
              >
                Next ▶
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. DISPATCH & AWB ASSIGNMENT MODAL */}
      {dispatchModalOrder && (
        <div className="royal-modal-overlay" onClick={() => setDispatchModalOrder(null)}>
          <div className="royal-modal-container dispatch-modal-container" onClick={e => e.stopPropagation()}>
            <div className="royal-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-title-icon">🚚</span>
                <div>
                  <h2 className="modal-title">Dispatch Order #{dispatchModalOrder.id}</h2>
                  <span className="modal-subtitle">
                    {dispatchModalOrder.customer_name} • {dispatchModalOrder.city} ({dispatchModalOrder.pincode})
                  </span>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setDispatchModalOrder(null)}>✕</button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="royal-modal-form">
              {dispatchError && (
                <div className="royal-alert royal-alert-error">
                  <span>⚠️ {dispatchError}</span>
                </div>
              )}
              {dispatchSuccess && (
                <div className="royal-alert royal-alert-success">
                  <span>✓ {dispatchSuccess}</span>
                </div>
              )}

              <div className="consignment-summary-box">
                <div className="cs-row">
                  <span>Consignment Weight:</span>
                  <strong>{dispatchModalOrder.weight_kg} kg</strong>
                </div>
                <div className="cs-row">
                  <span>Payment Method:</span>
                  <strong>{dispatchModalOrder.payment_method}</strong>
                </div>
                <div className="cs-row">
                  <span>Payment Settlement:</span>
                  <strong className={dispatchModalOrder.payment_status === 'paid' ? 'text-success' : 'text-danger'}>
                    {dispatchModalOrder.payment_status_label}
                  </strong>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label className="form-label">
                  Carrier / Courier Service <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Jaipur Royal Express, Delhivery, Bluedart, Speed Post"
                  value={courierName}
                  onChange={e => setCourierName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">
                  AWB / Consignment Tracking Number <span className="req">*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. JREX-987214 or DLH-88219"
                  value={awbNumber}
                  onChange={e => setAwbNumber(e.target.value)}
                  required
                />
                <span className="form-hint">
                  Docket number printed on carrier airway bill label or manifest slip.
                </span>
              </div>

              <div className="royal-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setDispatchModalOrder(null)}
                  disabled={dispatching}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-royal-primary"
                  disabled={dispatching}
                >
                  {dispatching ? 'Recording Dispatch...' : '✓ Confirm Consignment Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. TRACKING DETAILS SLIDE-OVER DRAWER */}
      {trackingOrder && (
        <div className="royal-dialog-overlay" onClick={() => setTrackingOrder(null)}>
          <div className="customer-drawer-container tracking-drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-header-left">
                <span className="drawer-emblem">📍</span>
                <div>
                  <h3 className="drawer-title">Consignment Tracking</h3>
                  <span className="drawer-subtitle">Order #{trackingOrder.id} • {trackingOrder.customer_name}</span>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setTrackingOrder(null)}>✕</button>
            </div>

            {trackingLoading ? (
              <div className="modal-loading-body">
                <div className="royal-spinner"></div>
                <p>Retrieving carrier milestone timestamps...</p>
              </div>
            ) : trackingData ? (
              <div className="drawer-scroll-body">
                <div className="tracking-summary-card">
                  <div className="ts-row">
                    <span>Carrier:</span>
                    <strong>{trackingData.courier_name || 'Jaipur Local Courier'}</strong>
                  </div>
                  <div className="ts-row">
                    <span>AWB Docket Number:</span>
                    <strong className="text-gold">{trackingData.awb_number || 'Pending AWB Assignment'}</strong>
                  </div>
                  <div className="ts-row">
                    <span>Current Status:</span>
                    <strong>{trackingData.shipment_status?.toUpperCase()}</strong>
                  </div>
                </div>

                <h4 className="drawer-section-heading">Consignment Milestones</h4>
                <div className="tracking-timeline">
                  {trackingData.tracking_history?.map((m, idx) => (
                    <div key={idx} className="timeline-node">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <strong className="timeline-status">{m.status}</strong>
                        <div className="timeline-desc">{m.activity}</div>
                        <div className="timeline-time">📍 {m.location} • 🕒 {m.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

