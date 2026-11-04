import React, { useState, useEffect, useCallback } from 'react';
import OrderDetailDrawer from './OrderDetailDrawer';
import PrintDocumentsModal from './PrintDocumentsModal';

export default function OrdersView({ token }) {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ total_items: 0, total_pages: 1, current_page: 1, per_page: 15 });
  const [counts, setCounts] = useState({ total: 0, processing: 0, completed: 0, react: 0, cod_unpaid: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters State
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all'); // 'all', 'react', 'legacy'
  const [fulfilment, setFulfilment] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all'); // 'all', 'paid', 'unpaid'
  const [paymentMethod, setPaymentMethod] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orderby, setOrderby] = useState('date');
  const [orderDir, setOrderDir] = useState('DESC');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(15);

  // Selection & Bulk Actions
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [bulkTargetStatus, setBulkTargetStatus] = useState('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Drawer / Print State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [printDoc, setPrintDoc] = useState(null); // { order, type: 'invoice' | 'packing_slip' }

  // Fetch Orders
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const queryParams = new URLSearchParams({
      action: 'list',
      page: String(page),
      per_page: String(perPage),
      orderby,
      order: orderDir,
      source,
      fulfilment,
      payment_status: paymentStatus,
      payment_method: paymentMethod
    });

    if (search.trim()) queryParams.set('search', search.trim());
    if (dateFrom) queryParams.set('date_from', dateFrom);
    if (dateTo) queryParams.set('date_to', dateTo);

    try {
      const res = await fetch(`/wordpress/shree-shahi-admin/api/orders.php?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setOrders(data.orders || []);
        setPagination(data.pagination || { total_items: 0, total_pages: 1, current_page: 1, per_page: 15 });
        setCounts(data.counts || {});
      } else {
        setError(data.message || 'Failed to load orders.');
      }
    } catch (err) {
      setError('Unable to communicate with the WooCommerce Orders API.');
    } finally {
      setIsLoading(false);
    }
  }, [token, page, perPage, orderby, orderDir, source, fulfilment, paymentStatus, paymentMethod, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Open full detail for an order
  const handleOpenDetail = async (orderId) => {
    try {
      const res = await fetch(`/wordpress/shree-shahi-admin/api/orders.php?action=detail&id=${orderId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSelectedOrder(data.order);
      } else {
        alert(data.message || 'Could not fetch order details');
      }
    } catch (e) {
      alert('Error fetching order details');
    }
  };

  // Select all checkbox
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedOrderIds(orders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedOrderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk status update
  const handleApplyBulk = async () => {
    if (!bulkTargetStatus || selectedOrderIds.length === 0) return;
    if (!window.confirm(`Update ${selectedOrderIds.length} orders to ${bulkTargetStatus.toUpperCase()}?`)) return;

    setIsBulkUpdating(true);
    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/orders.php?action=bulk_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          order_ids: selectedOrderIds,
          fulfilment_status: bulkTargetStatus
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert(data.message);
        setSelectedOrderIds([]);
        setBulkTargetStatus('');
        fetchOrders();
      } else {
        alert(data.message || 'Bulk update failed');
      }
    } catch (e) {
      alert('Network error during bulk update');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Handle CSV Export
  const handleExportCSV = () => {
    const exportUrl = `/wordpress/shree-shahi-admin/api/orders.php?action=export_csv&token=${encodeURIComponent(token)}&source=${source}&status=all`;
    window.open(exportUrl, '_blank');
  };

  return (
    <div className="orders-module-view">
      {/* 1. TOP HEADER & QUICK STATS BAR */}
      <div className="orders-header-bar">
        <div className="orders-title-block">
          <h2>Kitchen & Store Orders</h2>
          <p className="orders-subtext">
            Real-time WooCommerce HPOS order management, dispatch workflow & packing slips
          </p>
        </div>

        <div className="orders-action-block">
          <button className="btn-export-csv" onClick={handleExportCSV} title="Export orders to CSV">
            <span>📥</span>
            <span>Export CSV</span>
          </button>
          <button className="btn-refresh-orders" onClick={fetchOrders} title="Refresh live orders">
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. STATS PILLS */}
      <div className="orders-stats-pills">
        <button
          className={`stat-pill ${source === 'all' && fulfilment === 'all' ? 'active' : ''}`}
          onClick={() => { setSource('all'); setFulfilment('all'); setPage(1); }}
        >
          <span className="stat-num">{counts.total || 0}</span>
          <span className="stat-lbl">All Orders</span>
        </button>

        <button
          className={`stat-pill highlight-react ${source === 'react' ? 'active' : ''}`}
          onClick={() => { setSource('react'); setPage(1); }}
        >
          <span className="stat-num">{counts.react || 0}</span>
          <span className="stat-lbl">✨ React Storefront</span>
        </button>

        <button
          className={`stat-pill ${source === 'legacy' ? 'active' : ''}`}
          onClick={() => { setSource('legacy'); setPage(1); }}
        >
          <span className="stat-num">{(counts.total || 0) - (counts.react || 0)}</span>
          <span className="stat-lbl">🏛️ Historical / Test</span>
        </button>

        <button
          className={`stat-pill ${fulfilment === 'processing_qc' ? 'active' : ''}`}
          onClick={() => { setFulfilment('processing_qc'); setPage(1); }}
        >
          <span className="stat-num">{counts.processing || 0}</span>
          <span className="stat-lbl">In Kitchen / QC</span>
        </button>

        <button
          className={`stat-pill ${paymentStatus === 'unpaid' ? 'active' : ''}`}
          onClick={() => { setPaymentStatus('unpaid'); setPage(1); }}
        >
          <span className="stat-num">{counts.cod_unpaid || 0}</span>
          <span className="stat-lbl">COD Payment Due</span>
        </button>
      </div>

      {/* 3. SEARCH & FILTERS TOOLBAR */}
      <div className="orders-filter-card">
        <div className="filter-row-top">
          {/* Search Box */}
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by Order ID, Customer name, Phone, Email, or City..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
            {search && (
              <button className="clear-search-btn" onClick={() => { setSearch(''); setPage(1); }}>
                ✕
              </button>
            )}
          </div>

          {/* Quick Date Range Picker */}
          <div className="date-filter-group">
            <span className="date-icon">📅</span>
            <input
              type="date"
              className="date-input"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              title="From Date"
            />
            <span className="date-sep">to</span>
            <input
              type="date"
              className="date-input"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              title="To Date"
            />
            {(dateFrom || dateTo) && (
              <button
                className="clear-date-btn"
                onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
                title="Clear dates"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter Dropdowns Bar */}
        <div className="filter-dropdowns-bar">
          {/* Fulfilment Status */}
          <div className="filter-select-item">
            <label>Fulfilment:</label>
            <select
              className="filter-select"
              value={fulfilment}
              onChange={(e) => { setFulfilment(e.target.value); setPage(1); }}
            >
              <option value="all">All Stages</option>
              <option value="new_order">1. New Order</option>
              <option value="confirmed">2. Confirmed</option>
              <option value="processing_qc">3. Processing & QC</option>
              <option value="packed">4. Packed</option>
              <option value="dispatched">5. Dispatched</option>
              <option value="out_for_delivery">6. Out for Delivery</option>
              <option value="delivered">7. Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Payment Method */}
          <div className="filter-select-item">
            <label>Payment Method:</label>
            <select
              className="filter-select"
              value={paymentMethod}
              onChange={(e) => { setPaymentMethod(e.target.value); setPage(1); }}
            >
              <option value="all">All Methods</option>
              <option value="cod">Cash on Delivery (COD)</option>
              <option value="bacs">Direct Bank Transfer</option>
              <option value="razorpay">Razorpay Gateway</option>
            </select>
          </div>

          {/* Payment Status */}
          <div className="filter-select-item">
            <label>Settlement:</label>
            <select
              className="filter-select"
              value={paymentStatus}
              onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid Only</option>
              <option value="unpaid">Unpaid Only</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="filter-select-item">
            <label>Sort By:</label>
            <select
              className="filter-select"
              value={`${orderby}_${orderDir}`}
              onChange={(e) => {
                const [ob, dir] = e.target.value.split('_');
                setOrderby(ob);
                setOrderDir(dir);
                setPage(1);
              }}
            >
              <option value="date_DESC">Newest First</option>
              <option value="date_ASC">Oldest First</option>
              <option value="total_DESC">Highest Amount</option>
              <option value="total_ASC">Lowest Amount</option>
              <option value="id_DESC">Order ID (High → Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. BULK ACTIONS BAR (Visible when items selected) */}
      {selectedOrderIds.length > 0 && (
        <div className="bulk-actions-floating-bar">
          <div className="bulk-info">
            <span className="bulk-count-badge">{selectedOrderIds.length}</span>
            <span>orders selected</span>
          </div>
          <div className="bulk-controls">
            <select
              className="bulk-select"
              value={bulkTargetStatus}
              onChange={(e) => setBulkTargetStatus(e.target.value)}
            >
              <option value="">Choose Fulfilment Stage...</option>
              <option value="confirmed">Mark as Confirmed</option>
              <option value="processing_qc">Move to Processing & QC</option>
              <option value="packed">Mark as Packed</option>
              <option value="dispatched">Mark as Dispatched</option>
              <option value="delivered">Mark as Delivered</option>
              <option value="cancelled">Mark as Cancelled</option>
            </select>
            <button
              className="btn-apply-bulk"
              disabled={!bulkTargetStatus || isBulkUpdating}
              onClick={handleApplyBulk}
            >
              {isBulkUpdating ? 'Updating...' : 'Apply to Selected'}
            </button>
            <button
              className="btn-clear-selection"
              onClick={() => setSelectedOrderIds([])}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* 5. MAIN ORDERS TABLE */}
      <div className="orders-table-card">
        {isLoading ? (
          <div className="loading-state-box">
            <div className="loading-spinner">⏳</div>
            <p>Loading verified WooCommerce orders...</p>
          </div>
        ) : error ? (
          <div className="error-state-box">
            <span>⚠️</span>
            <p>{error}</p>
            <button className="btn-retry" onClick={fetchOrders}>Retry</button>
          </div>
        ) : orders.length === 0 ? (
          <div className="empty-state-box">
            <span>📦</span>
            <h3>No Orders Found</h3>
            <p>No orders match the selected filters or search parameters.</p>
            <button
              className="btn-reset-filters"
              onClick={() => {
                setSearch('');
                setSource('all');
                setFulfilment('all');
                setPaymentStatus('all');
                setPaymentMethod('all');
                setDateFrom('');
                setDateTo('');
                setPage(1);
              }}
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="orders-main-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.length > 0 && selectedOrderIds.length === orders.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th>Order #</th>
                  <th>Date & Time</th>
                  <th>Customer Patron</th>
                  <th>Products</th>
                  <th>Payment</th>
                  <th>Settlement</th>
                  <th>Total</th>
                  <th>Fulfilment Status</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((ord) => {
                  const isChecked = selectedOrderIds.includes(ord.id);
                  return (
                    <tr
                      key={ord.id}
                      className={`${isChecked ? 'row-selected' : ''}`}
                      onClick={() => handleOpenDetail(ord.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(ord.id)}
                        />
                      </td>

                      <td className="order-num-cell">
                        <div className="order-id-main">#{ord.id}</div>
                        {ord.is_react ? (
                          <span className="badge-source-react">REACT</span>
                        ) : (
                          <span className="badge-source-legacy">HISTORICAL</span>
                        )}
                      </td>

                      <td className="order-date-cell">
                        <div className="date-primary">{ord.date.split(',')[0]}</div>
                        <div className="date-secondary">{ord.date.split(',')[1] || ''}</div>
                      </td>

                      <td className="customer-cell">
                        <div className="cust-name-main">{ord.customer_name}</div>
                        <div className="cust-contact-sub">
                          <span className="cust-phone">{ord.phone}</span>
                          {ord.city !== '—' && <span className="cust-city">• {ord.city}</span>}
                        </div>
                      </td>

                      <td className="products-cell">
                        <div className="products-summary-text" title={ord.items_summary}>
                          {ord.items_summary}
                        </div>
                        <span className="items-count-badge">{ord.items_count} items</span>
                      </td>

                      <td className="payment-cell">
                        <span className="payment-method-name">{ord.payment_method}</span>
                      </td>

                      <td className="settlement-cell">
                        <span className={`payment-status-pill ${ord.is_paid ? 'paid' : 'unpaid'}`}>
                          {ord.payment_status}
                        </span>
                      </td>

                      <td className="total-cell">
                        <strong>{ord.formatted_total}</strong>
                      </td>

                      <td className="fulfilment-cell">
                        <span className={`fulfilment-pill ${ord.fulfilment_badge}`}>
                          {ord.fulfilment_label}
                        </span>
                      </td>

                      <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                        <div className="action-buttons-group">
                          <button
                            className="btn-action-view"
                            onClick={() => handleOpenDetail(ord.id)}
                            title="View Full Order Details"
                          >
                            Details
                          </button>

                          <button
                            className="btn-action-icon"
                            onClick={async () => {
                              const res = await fetch(`/wordpress/shree-shahi-admin/api/orders.php?action=detail&id=${ord.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              const d = await res.json();
                              if (d.order) setPrintDoc({ order: d.order, type: 'invoice' });
                            }}
                            title="Print Invoice"
                          >
                            🧾
                          </button>

                          <button
                            className="btn-action-icon"
                            onClick={async () => {
                              const res = await fetch(`/wordpress/shree-shahi-admin/api/orders.php?action=detail&id=${ord.id}`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                              });
                              const d = await res.json();
                              if (d.order) setPrintDoc({ order: d.order, type: 'packing_slip' });
                            }}
                            title="Print Packing Slip"
                          >
                            📋
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. SERVER-SIDE PAGINATION */}
        {!isLoading && orders.length > 0 && (
          <div className="orders-pagination-bar">
            <div className="pagination-left">
              <span>
                Showing <strong>{((pagination.current_page - 1) * pagination.per_page) + 1}</strong> to{' '}
                <strong>{Math.min(pagination.current_page * pagination.per_page, pagination.total_items)}</strong> of{' '}
                <strong>{pagination.total_items}</strong> orders
              </span>
              <div className="per-page-selector">
                <label>Per page:</label>
                <select
                  value={perPage}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                >
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>

            <div className="pagination-controls">
              <button
                className="btn-page-nav"
                disabled={pagination.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                ← Previous
              </button>

              <span className="page-indicator">
                Page {pagination.current_page} of {pagination.total_pages}
              </span>

              <button
                className="btn-page-nav"
                disabled={pagination.current_page >= pagination.total_pages}
                onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. SLIDE-OVER DETAIL DRAWER */}
      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          token={token}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={() => {
            fetchOrders();
            handleOpenDetail(selectedOrder.id);
          }}
          onPrint={(ord, type) => setPrintDoc({ order: ord, type })}
        />
      )}

      {/* 8. PRINT INVOICE / PACKING SLIP MODAL */}
      {printDoc && (
        <PrintDocumentsModal
          order={printDoc.order}
          documentType={printDoc.type}
          onClose={() => setPrintDoc(null)}
        />
      )}
    </div>
  );
}

