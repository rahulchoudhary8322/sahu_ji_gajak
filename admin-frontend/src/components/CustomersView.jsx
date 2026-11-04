import React, { useState, useEffect, useCallback } from 'react';

export default function CustomersView({ token, onNavigateOrder }) {
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total: 0, registered: 0, guest: 0, total_spend: 0, average_spend: 0 });
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_items: 0, limit: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('spent_desc');
  const [page, setPage] = useState(1);

  // Drawer detail state
  const [selectedCustomerEmail, setSelectedCustomerEmail] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerError, setDrawerError] = useState('');

  // Fetch Customers List
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      action: 'list',
      page: String(page),
      limit: '15',
      sort_by: sortBy
    });

    if (search.trim()) params.append('search', search.trim());
    if (typeFilter !== 'all') params.append('type', typeFilter);

    try {
      const res = await fetch(`/wordpress/shree-shahi-admin/api/customers.php?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setCustomers(data.customers || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to fetch customers from WooCommerce.');
      }
    } catch (err) {
      setError('Network connection error while fetching customers.');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, typeFilter, sortBy]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Fetch Customer Detail Drawer
  useEffect(() => {
    if (!selectedCustomerEmail) {
      setCustomerDetail(null);
      return;
    }

    setDrawerLoading(true);
    setDrawerError('');

    fetch(`/wordpress/shree-shahi-admin/api/customers.php?action=detail&email=${encodeURIComponent(selectedCustomerEmail)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Admin-Token': token
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.customer) {
          setCustomerDetail(data.customer);
        } else {
          setDrawerError(data.message || 'Failed to load customer dossier.');
        }
      })
      .catch(() => {
        setDrawerError('Network error loading customer dossier.');
      })
      .finally(() => {
        setDrawerLoading(false);
      });
  }, [selectedCustomerEmail, token]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  return (
    <div className="royal-module-wrapper">
      {/* 1. TOP HEADER */}
      <div className="module-top-header">
        <div>
          <h1 className="module-main-title">Patrons & Customer Register</h1>
          <p className="module-subtitle">
            Authentic registered patrons and guest patrons from genuine WooCommerce order transactions
          </p>
        </div>
        <div className="header-action-group">
          <a
            href={`/wordpress/shree-shahi-admin/api/customers.php?action=export_csv&token=${encodeURIComponent(token)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-royal-outline"
          >
            📥 Export Customers CSV
          </a>
        </div>
      </div>

      {/* 2. STATS PILLS */}
      <div className="stats-pill-row">
        <div
          className={`stat-pill ${typeFilter === 'all' ? 'active' : ''}`}
          onClick={() => { setTypeFilter('all'); setPage(1); }}
        >
          <span className="pill-label">Total Patrons</span>
          <span className="pill-value">{stats.total}</span>
        </div>
        <div
          className={`stat-pill ${typeFilter === 'registered' ? 'active' : ''}`}
          onClick={() => { setTypeFilter('registered'); setPage(1); }}
        >
          <span className="pill-label">Registered Accounts</span>
          <span className="pill-value text-gold">{stats.registered}</span>
        </div>
        <div
          className={`stat-pill ${typeFilter === 'guest' ? 'active' : ''}`}
          onClick={() => { setTypeFilter('guest'); setPage(1); }}
        >
          <span className="pill-label">Guest Patrons</span>
          <span className="pill-value text-muted">{stats.guest}</span>
        </div>
        <div className="stat-pill">
          <span className="pill-label">Total Patron Spend</span>
          <span className="pill-value text-success">₹{stats.total_spend.toLocaleString()}</span>
        </div>
        <div className="stat-pill">
          <span className="pill-label">Avg Lifetime Value</span>
          <span className="pill-value text-gold">₹{Math.round(stats.average_spend).toLocaleString()}</span>
        </div>
      </div>

      {/* 3. FILTER & SEARCH BAR */}
      <div className="filter-card">
        <form onSubmit={handleSearchSubmit} className="filter-form-grid">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-field"
              placeholder="Search by patron name, email, phone, city..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-search-btn"
                onClick={() => { setSearch(''); setPage(1); }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-dropdown-wrap">
            <select
              className="filter-dropdown"
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Patron Types</option>
              <option value="registered">Registered Accounts Only</option>
              <option value="guest">Guest Patrons Only</option>
            </select>
          </div>

          <div className="filter-dropdown-wrap">
            <select
              className="filter-dropdown"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="spent_desc">Highest Spend First</option>
              <option value="spent_asc">Lowest Spend First</option>
              <option value="orders_desc">Most Orders</option>
              <option value="orders_asc">Fewest Orders</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="date_desc">Most Recent Order</option>
            </select>
          </div>
        </form>
      </div>

      {/* 4. MAIN CUSTOMERS TABLE */}
      <div className="royal-table-container">
        {loading ? (
          <div className="table-loading-state">
            <div className="royal-spinner"></div>
            <p>Loading patrons from WooCommerce registers...</p>
          </div>
        ) : error ? (
          <div className="table-error-state">
            <p>⚠️ {error}</p>
            <button className="btn-retry" onClick={fetchCustomers}>Retry</button>
          </div>
        ) : customers.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-icon">👥</div>
            <h3>No Patrons Found</h3>
            <p>No customers match "{search}".</p>
          </div>
        ) : (
          <table className="orders-main-table customers-table">
            <thead>
              <tr>
                <th>Patron Name</th>
                <th>Contact Details</th>
                <th>Location</th>
                <th>Account Type</th>
                <th style={{ textAlign: 'center' }}>Total Orders</th>
                <th>Lifetime Spend (₹)</th>
                <th>Last Order</th>
                <th style={{ textAlign: 'right' }}>Dossier</th>
              </tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="customer-name-wrap">
                      <div className="customer-avatar-badge">
                        {c.type === 'registered' ? '👑' : '👤'}
                      </div>
                      <div>
                        <strong className="cust-full-name">{c.name}</strong>
                        {c.customer_id > 0 && (
                          <div className="wp-user-id-tag">WP User #{c.customer_id}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-col">
                      <span className="cust-email">{c.email}</span>
                      <span className="cust-phone">📞 {c.phone}</span>
                    </div>
                  </td>
                  <td>
                    <span className="cust-city">{c.city}{c.state && c.state !== '—' ? `, ${c.state}` : ''}</span>
                  </td>
                  <td>
                    <span className={`cust-type-pill ${c.type}`}>
                      {c.type_label}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="cust-orders-badge">
                      {c.order_count} {c.order_count === 1 ? 'order' : 'orders'}
                    </span>
                  </td>
                  <td>
                    <strong className="cust-spend-amount">
                      ₹{c.lifetime_spent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </td>
                  <td>
                    <span className="cust-date-text">{c.last_order_date || '—'}</span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn-action-view"
                      onClick={() => setSelectedCustomerEmail(c.email)}
                    >
                      👁️ View Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. PAGINATION CONTROLS */}
      {!loading && pagination.total_pages > 1 && (
        <div className="royal-pagination-bar">
          <span className="pagination-info">
            Showing Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_items} patrons)
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

      {/* 6. CUSTOMER DETAIL SLIDE-OVER DRAWER */}
      {selectedCustomerEmail && (
        <div className="royal-dialog-overlay" onClick={() => setSelectedCustomerEmail(null)}>
          <div className="customer-drawer-container" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-header-left">
                <span className="drawer-emblem">👑</span>
                <div>
                  <h3 className="drawer-title">Patron Dossier & Order History</h3>
                  <span className="drawer-subtitle">{selectedCustomerEmail}</span>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setSelectedCustomerEmail(null)}>✕</button>
            </div>

            {drawerLoading ? (
              <div className="modal-loading-body">
                <div className="royal-spinner"></div>
                <p>Retrieving complete purchase history from WooCommerce HPOS...</p>
              </div>
            ) : drawerError ? (
              <div className="royal-alert royal-alert-error" style={{ margin: 20 }}>
                <span>⚠️ {drawerError}</span>
              </div>
            ) : customerDetail ? (
              <div className="drawer-scroll-body">
                {/* Profile Header Card */}
                <div className="customer-profile-card">
                  <div className="profile-top-row">
                    <div className="profile-avatar">
                      {customerDetail.type === 'registered' ? '👑' : '👤'}
                    </div>
                    <div className="profile-meta">
                      <h2>{customerDetail.name}</h2>
                      <div className="profile-tags">
                        <span className={`cust-type-pill ${customerDetail.type}`}>
                          {customerDetail.type_label}
                        </span>
                        {customerDetail.wp_user_id > 0 && (
                          <span className="wp-user-id-tag">
                            WP User #{customerDetail.wp_user_id} ({customerDetail.username || 'Account'})
                          </span>
                        )}
                        {customerDetail.user_registered && (
                          <span className="member-since-tag">
                            Member since {customerDetail.user_registered}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="profile-contact-grid">
                    <div>
                      <span className="meta-label">Email Address</span>
                      <strong>{customerDetail.email}</strong>
                    </div>
                    <div>
                      <span className="meta-label">Phone Contact</span>
                      <strong>📞 {customerDetail.phone}</strong>
                    </div>
                    <div>
                      <span className="meta-label">Billing Location</span>
                      <strong>{customerDetail.billing_address?.city}, {customerDetail.billing_address?.state}</strong>
                    </div>
                  </div>
                </div>

                {/* 4 Financial Metric Cards */}
                <div className="customer-metrics-row">
                  <div className="cust-metric-card">
                    <span className="m-label">Lifetime Value</span>
                    <strong className="m-val text-success">
                      ₹{customerDetail.financials?.lifetime_spent?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="cust-metric-card">
                    <span className="m-label">Total Orders</span>
                    <strong className="m-val">{customerDetail.financials?.total_orders}</strong>
                  </div>
                  <div className="cust-metric-card">
                    <span className="m-label">Average Order</span>
                    <strong className="m-val text-gold">
                      ₹{customerDetail.financials?.average_order_value?.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                  <div className="cust-metric-card">
                    <span className="m-label">Fulfilled Deliveries</span>
                    <strong className="m-val">{customerDetail.financials?.completed_orders}</strong>
                  </div>
                </div>

                {/* Address Section */}
                <div className="customer-address-box">
                  <h4>📍 Primary Delivery Address</h4>
                  <p>
                    {customerDetail.billing_address?.address_1}
                    {customerDetail.billing_address?.address_2 ? `, ${customerDetail.billing_address?.address_2}` : ''}<br />
                    {customerDetail.billing_address?.city}, {customerDetail.billing_address?.state} — {customerDetail.billing_address?.postcode}<br />
                    {customerDetail.billing_address?.country}
                  </p>
                </div>

                {/* Complete Order History Table */}
                <div className="customer-orders-section">
                  <h4>📜 Order History ({customerDetail.orders?.length || 0})</h4>
                  <table className="orders-main-table orders-subtable">
                    <thead>
                      <tr>
                        <th>Order #</th>
                        <th>Date</th>
                        <th>Delicacies</th>
                        <th>Payment</th>
                        <th>Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerDetail.orders?.map(o => (
                        <tr key={o.id}>
                          <td>
                            <strong>{o.order_number}</strong>
                            {o.is_react && <span className="react-tiny-tag">React</span>}
                          </td>
                          <td>
                            <span style={{ fontSize: 11.5, color: '#6B7280' }}>{o.date}</span>
                          </td>
                          <td>
                            <span className="items-summary-text">{o.items_summary || 'Royal Gajak Pack'}</span>
                          </td>
                          <td>
                            <span style={{ fontSize: 12 }}>{o.payment_method}</span>
                          </td>
                          <td>
                            <strong>₹{o.total.toFixed(2)}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

