import React, { useState, useEffect, useCallback } from 'react';

export default function PaymentsView({ token }) {
  const [metrics, setMetrics] = useState({
    total_gross: 0,
    total_paid: 0,
    total_unpaid_cod: 0,
    total_collected_cod: 0,
    total_online_paid: 0,
    count_total: 0,
    count_paid: 0,
    count_unpaid_cod: 0
  });
  const [methodsBreakdown, setMethodsBreakdown] = useState({});
  const [razorpayStatus, setRazorpayStatus] = useState(null);

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_items: 0, limit: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);

  // COD Collection Dialog
  const [collectCodOrder, setCollectCodOrder] = useState(null);
  const [collecting, setCollecting] = useState(false);

  // Fetch Overview & Metrics
  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/payments.php?action=overview', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        if (data.metrics) setMetrics(data.metrics);
        if (data.methods_breakdown) setMethodsBreakdown(data.methods_breakdown);
        if (data.razorpay_status) setRazorpayStatus(data.razorpay_status);
      }
    } catch (err) {}
  }, [token]);

  // Fetch Transactions List
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      action: 'transactions',
      page: String(page),
      limit: '15'
    });

    if (search.trim()) params.append('search', search.trim());
    if (methodFilter !== 'all') params.append('method', methodFilter);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (dateFrom) params.append('date_from', dateFrom);
    if (dateTo) params.append('date_to', dateTo);

    try {
      const res = await fetch(`/wordpress/shree-shahi-admin/api/payments.php?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setTransactions(data.transactions || []);
        if (data.pagination) setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to load payments.');
      }
    } catch (err) {
      setError('Network connection error while fetching transactions.');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, methodFilter, statusFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Handle Cash on Delivery Collection Confirmation
  const handleConfirmCollectCod = async () => {
    if (!collectCodOrder) return;
    setCollecting(true);

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/payments.php?action=collect_cod', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id: collectCodOrder.order_id })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setCollectCodOrder(null);
        fetchOverview();
        fetchTransactions();
      } else {
        alert(data.message || 'Failed to record cash collection.');
      }
    } catch (err) {
      alert('Network error while recording cash collection.');
    } finally {
      setCollecting(false);
    }
  };

  return (
    <div className="royal-module-wrapper">
      {/* 1. TOP HEADER */}
      <div className="module-top-header">
        <div>
          <h1 className="module-main-title">Payments & Financial Reconciliation</h1>
          <p className="module-subtitle">
            WooCommerce settlement registers, verified Razorpay online transactions, and Cash on Delivery safety
          </p>
        </div>
        <div className="header-action-group">
          <a
            href={`/wordpress/shree-shahi-admin/api/payments.php?action=export_csv&token=${encodeURIComponent(token)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-royal-outline"
          >
            📥 Export Payments CSV
          </a>
        </div>
      </div>

      {/* 2. FINANCIAL OVERVIEW METRICS */}
      <div className="stats-pill-row">
        <div className="stat-pill active">
          <span className="pill-label">Total Gross Volume</span>
          <span className="pill-value">₹{metrics.total_gross.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="stat-pill">
          <span className="pill-label">Verified Settled Amount</span>
          <span className="pill-value text-success">₹{metrics.total_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="stat-pill">
          <span className="pill-label">COD Uncollected Due</span>
          <span className="pill-value text-danger">₹{metrics.total_unpaid_cod.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="stat-pill">
          <span className="pill-label">COD Cash Collected</span>
          <span className="pill-value text-gold">₹{metrics.total_collected_cod.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="stat-pill">
          <span className="pill-label">Online Payments</span>
          <span className="pill-value text-gold">₹{metrics.total_online_paid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* 3. RAZORPAY GATEWAY STATUS BANNER */}
      {razorpayStatus && (
        <div className={`gateway-status-banner ${razorpayStatus.configured ? 'configured' : 'pending'}`}>
          <div className="gw-banner-left">
            <span className="gw-banner-icon">{razorpayStatus.configured ? '💳' : '⚠️'}</span>
            <div>
              <div className="gw-title-line">
                <strong>{razorpayStatus.title}</strong>
                <span className={`gw-pill ${razorpayStatus.configured ? 'live' : 'pending'}`}>
                  {razorpayStatus.display_status}
                </span>
              </div>
              <p className="gw-notice-text">
                {razorpayStatus.configured ? (
                  `Connected to live merchant account (Key ID: ${razorpayStatus.key_id_masked})`
                ) : (
                  'Live Razorpay merchant API credentials (Key ID and Secret) have not yet been configured in WooCommerce. Orders currently select Cash on Delivery or test transfer.'
                )}
              </p>
            </div>
          </div>
          <div className="gw-banner-right">
            <span className="security-shield">🛡️ Secure Payment Pipeline</span>
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
              placeholder="Search by Order ID, customer, transaction ID..."
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
              value={methodFilter}
              onChange={e => setMethodFilter(e.target.value)}
            >
              <option value="all">All Payment Methods</option>
              <option value="cod">Cash on Delivery (COD)</option>
              <option value="razorpay">Razorpay / Online UPI</option>
              <option value="bacs">Bank Transfer</option>
            </select>
          </div>

          <div className="filter-dropdown-wrap">
            <select
              className="filter-dropdown"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Payment Statuses</option>
              <option value="paid">Paid (Collected / Settled)</option>
              <option value="unpaid">Unpaid (COD Due on Handover)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. TRANSACTIONS TABLE */}
      <div className="royal-table-container">
        {loading ? (
          <div className="table-loading-state">
            <div className="royal-spinner"></div>
            <p>Auditing WooCommerce payment registers...</p>
          </div>
        ) : error ? (
          <div className="table-error-state">
            <p>⚠️ {error}</p>
            <button className="btn-retry" onClick={fetchTransactions}>Retry</button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-icon">💳</div>
            <h3>No Transactions Found</h3>
            <p>No payment records match your filters.</p>
          </div>
        ) : (
          <table className="orders-main-table payments-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Order Date</th>
                <th>Customer Patron</th>
                <th>Payment Method</th>
                <th>Transaction Reference</th>
                <th>Amount (₹)</th>
                <th>Settlement Status</th>
                <th>Settled At</th>
                <th style={{ textAlign: 'right' }}>COD Action</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.order_id}>
                  <td>
                    <div className="order-id-cell">
                      <strong>{t.order_number}</strong>
                      {t.is_react && <span className="react-tiny-tag">React Store</span>}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: '#4B5563' }}>{t.date}</span>
                  </td>
                  <td>
                    <div className="pay-patron-col">
                      <strong>{t.customer_name}</strong>
                      <span className="pay-patron-contact">{t.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="pay-method-badge">
                      <span>{t.is_cod ? '💵' : '💳'}</span>
                      <span>{t.payment_method_title}</span>
                    </div>
                  </td>
                  <td>
                    <code className="txn-ref-code">{t.transaction_id}</code>
                  </td>
                  <td>
                    <strong className="pay-amount-text">
                      ₹{t.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </td>
                  <td>
                    <span className={`payment-pill ${t.is_paid ? 'paid' : 'unpaid'}`}>
                      {t.status_label}
                    </span>
                  </td>
                  <td>
                    <span className="settled-date-text">
                      {t.date_paid ? t.date_paid : (t.is_paid ? 'At Checkout' : 'Pending Handover')}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {t.is_cod && !t.is_paid ? (
                      <button
                        className="btn-collect-cod-table"
                        onClick={() => setCollectCodOrder(t)}
                        title="Mark cash as collected for this COD order"
                      >
                        💵 Record Cash
                      </button>
                    ) : (
                      <span className="reconciled-check">✓ Reconciled</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 6. PAGINATION CONTROLS */}
      {!loading && pagination.total_pages > 1 && (
        <div className="royal-pagination-bar">
          <span className="pagination-info">
            Showing Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_items} transactions)
          </span>
          <div className="pagination-buttons">
            <button
              className="btn-page-nav"
              disabled={pagination.current_page <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
            >
              ← Previous
            </button>
            {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map(pageNum => (
              <button
                key={pageNum}
                className={`btn-page-num ${pageNum === pagination.current_page ? 'active' : ''}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}
            <button
              className="btn-page-nav"
              disabled={pagination.current_page >= pagination.total_pages}
              onClick={() => setPage(prev => Math.min(pagination.total_pages, prev + 1))}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* 7. RECORD COD CASH MODAL */}
      {collectCodOrder && (
        <div className="royal-dialog-overlay" onClick={() => setCollectCodOrder(null)}>
          <div className="royal-dialog-box" onClick={e => e.stopPropagation()}>
            <div className="dialog-icon-wrap" style={{ color: '#2E7D32' }}>
              💵
            </div>
            <h3 className="dialog-title">Record COD Cash Handover?</h3>
            <p className="dialog-desc">
              Confirm that cash payment of <strong>₹{collectCodOrder.amount.toFixed(2)}</strong> for Order <strong>#{collectCodOrder.order_id}</strong> has been physically received from patron <strong>{collectCodOrder.customer_name}</strong>.
            </p>
            <p style={{ fontSize: 12, color: '#6B7280', marginTop: 6 }}>
              This updates the order's payment status to Paid, timestamps the collection, and records an official audit entry in WooCommerce.
            </p>
            <div className="dialog-action-buttons">
              <button
                className="btn-cancel-dialog"
                onClick={() => setCollectCodOrder(null)}
                disabled={collecting}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-dialog"
                style={{ background: '#2E7D32', borderColor: '#1B5E20' }}
                onClick={handleConfirmCollectCod}
                disabled={collecting}
              >
                {collecting ? 'Recording...' : 'Yes, Cash Received'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

