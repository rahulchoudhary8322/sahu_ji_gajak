import React, { useState, useEffect, useCallback } from 'react';

export default function DashboardView({ token, onNavigateOrders, onNavigateProducts }) {
  const [range, setRange] = useState('all');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async (selectedRange) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/wordpress/shree-shahi-admin/api/dashboard.php?range=${selectedRange}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Admin-Token': token
          }
        }
      );

      const resJson = await response.json();

      if (response.ok && resJson.status === 'success') {
        setData(resJson);
      } else {
        setError(resJson.message || 'Unable to load WooCommerce dashboard metrics.');
      }
    } catch (err) {
      setError('Network communication error with Dashboard API.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboard(range);
  }, [range, fetchDashboard]);

  const kpis = data?.kpis || {};
  const recentOrders = data?.recent_orders || [];
  const topSelling = data?.top_selling || [];
  const lowStock = data?.low_stock_products || [];
  const statusCounts = data?.status_breakdown || {};

  const rangeOptions = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'this_month', label: 'This Month' },
    { id: 'all', label: 'All Time' },
  ];

  return (
    <div className="dashboard-view-container">
      {/* TOP CONTROLS */}
      <div className="dashboard-top-bar">
        <div className="dashboard-title-group">
          <h2>Darbar Operations Overview</h2>
          <p>
            Real-time WooCommerce metrics & store activity • Filtered:{' '}
            <strong>{data?.date_from || 'Loading...'}</strong> to{' '}
            <strong>{data?.date_to || ''}</strong>
          </p>
        </div>

        <div className="date-filter-group">
          {rangeOptions.map((opt) => (
            <button
              key={opt.id}
              className={`date-pill-btn ${range === opt.id ? 'active' : ''}`}
              onClick={() => setRange(opt.id)}
            >
              {opt.label}
            </button>
          ))}
          <button
            className="btn-refresh"
            onClick={() => fetchDashboard(range)}
            title="Refresh current data"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="login-alert" style={{ marginBottom: 20 }}>
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* KPI CARDS GRID */}
      <div className="kpi-cards-grid">
        {/* KPI 1: TODAY'S ORDERS */}
        <div className="kpi-card highlight">
          <div>
            <div className="kpi-label">Today's Orders</div>
            <div className="kpi-value">{loading ? '...' : kpis.today_orders || 0}</div>
            <div className="kpi-subtext">Active today in HPOS</div>
          </div>
          <div className="kpi-icon-box">📦</div>
        </div>

        {/* KPI 2: TODAY'S REVENUE */}
        <div className="kpi-card highlight">
          <div>
            <div className="kpi-label">Today's Revenue</div>
            <div className="kpi-value">
              {loading ? '...' : `₹${Number(kpis.today_revenue || 0).toLocaleString('en-IN')}`}
            </div>
            <div className="kpi-subtext">Verified sales volume</div>
          </div>
          <div className="kpi-icon-box">💰</div>
        </div>

        {/* KPI 3: TOTAL ORDERS */}
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Total Orders</div>
            <div className="kpi-value">{loading ? '...' : kpis.total_orders || 0}</div>
            <div className="kpi-subtext">
              Lifetime: ₹{Number(kpis.total_revenue || 0).toLocaleString('en-IN')}
            </div>
          </div>
          <div className="kpi-icon-box">📜</div>
        </div>

        {/* KPI 4: PROCESSING ORDERS */}
        <div className="kpi-card accent" style={{ cursor: 'pointer' }} onClick={onNavigateOrders}>
          <div>
            <div className="kpi-label">Processing Orders</div>
            <div className="kpi-value" style={{ color: '#C87A24' }}>
              {loading ? '...' : kpis.processing_orders || 0}
            </div>
            <div className="kpi-subtext">Awaiting packing & dispatch ➔</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#FEF3C7' }}>⚡</div>
        </div>

        {/* KPI 5: PENDING ORDERS */}
        <div className="kpi-card">
          <div>
            <div className="kpi-label">Pending / Unpaid</div>
            <div className="kpi-value">{loading ? '...' : kpis.pending_orders || 0}</div>
            <div className="kpi-subtext">Payment verification queue</div>
          </div>
          <div className="kpi-icon-box">⏳</div>
        </div>

        {/* KPI 6: LOW STOCK PRODUCTS */}
        <div className="kpi-card" style={{ cursor: 'pointer' }} onClick={onNavigateProducts}>
          <div>
            <div className="kpi-label">Low Stock Alerts</div>
            <div className="kpi-value" style={{ color: (kpis.low_stock_count > 0 ? '#DC2626' : '#166534') }}>
              {loading ? '...' : kpis.low_stock_count || 0}
            </div>
            <div className="kpi-subtext">Inventory review required ➔</div>
          </div>
          <div className="kpi-icon-box" style={{ background: '#FEE2E2' }}>⚠️</div>
        </div>
      </div>

      {/* 2-COLUMN MAIN LAYOUT */}
      <div className="dashboard-columns-grid">
        {/* LEFT COLUMN: RECENT ORDERS TABLE */}
        <div className="content-panel-card">
          <div className="panel-header">
            <h3 className="panel-title">
              <span>📋</span>
              <span>Recent Kitchen & Confectionery Orders</span>
            </h3>
            <button className="panel-action-link" onClick={onNavigateOrders}>
              View All Orders ({kpis.total_orders || 0}) ➔
            </button>
          </div>

          <div className="table-responsive">
            <table className="operations-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Date & Time</th>
                  <th>Patron Customer</th>
                  <th>Ordered Delicacies</th>
                  <th>Payment</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                      Loading verified WooCommerce orders...
                    </td>
                  </tr>
                ) : recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '32px' }}>
                      No orders recorded for this period.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td>
                        <span className="order-num-pill">{ord.order_number}</span>
                        {ord.is_react_checkout && (
                          <span
                            title="Placed via modern React frontend checkout"
                            style={{
                              marginLeft: 6,
                              fontSize: 9,
                              background: '#E0F2FE',
                              color: '#0369A1',
                              padding: '1px 5px',
                              borderRadius: 4,
                              fontWeight: 700
                            }}
                          >
                            REACT
                          </span>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12 }}>{ord.date}</td>
                      <td className="customer-cell">
                        <div className="customer-name">{ord.customer_name}</div>
                        <div className="customer-email">{ord.email}</div>
                      </td>
                      <td style={{ maxWidth: 220, fontSize: 12 }}>
                        {ord.items_summary || '1 delicacy'}
                      </td>
                      <td style={{ fontSize: 12 }}>{ord.payment_method}</td>
                      <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        ₹{ord.total.toFixed(2)}
                      </td>
                      <td>
                        <span className={`status-badge ${ord.status}`}>
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: STATUS BREAKDOWN & LOW STOCK */}
        <div>
          {/* PANEL 1: STATUS DISTRIBUTION */}
          <div className="content-panel-card">
            <div className="panel-header">
              <h3 className="panel-title">
                <span>📊</span>
                <span>Fulfillment Status Breakdown</span>
              </h3>
            </div>
            <div className="list-group">
              <div className="list-item">
                <span className="list-item-title">Processing (In Kitchen)</span>
                <span className="status-badge processing">
                  {statusCounts['wc-processing'] || 0}
                </span>
              </div>
              <div className="list-item">
                <span className="list-item-title">Pending Payment</span>
                <span className="status-badge pending">
                  {statusCounts['wc-pending'] || 0}
                </span>
              </div>
              <div className="list-item">
                <span className="list-item-title">Completed & Dispatched</span>
                <span className="status-badge completed">
                  {statusCounts['wc-completed'] || 0}
                </span>
              </div>
              <div className="list-item">
                <span className="list-item-title">On Hold</span>
                <span className="status-badge on-hold">
                  {statusCounts['wc-on-hold'] || 0}
                </span>
              </div>
              <div className="list-item">
                <span className="list-item-title">Cancelled</span>
                <span className="status-badge cancelled">
                  {statusCounts['wc-cancelled'] || 0}
                </span>
              </div>
            </div>
          </div>

          {/* PANEL 2: LOW STOCK ALERT PRODUCTS */}
          <div className="content-panel-card">
            <div className="panel-header">
              <h3 className="panel-title">
                <span>⚠️</span>
                <span>Inventory Low Stock Alerts</span>
              </h3>
              <button className="panel-action-link" onClick={onNavigateProducts}>
                Inventory ➔
              </button>
            </div>
            <div className="list-group">
              {lowStock.length === 0 ? (
                <div style={{ padding: '16px 0', fontSize: 13, color: '#166534' }}>
                  ✅ All products are well stocked.
                </div>
              ) : (
                lowStock.slice(0, 5).map((prod) => (
                  <div key={prod.id} className="list-item">
                    <div>
                      <div className="list-item-title">{prod.name}</div>
                      <div className="list-item-subtitle">{prod.sku} • ₹{prod.price}</div>
                    </div>
                    <span className="badge-stock danger">
                      {prod.stock_quantity !== undefined ? `${prod.stock_quantity} left` : prod.stock_status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* PANEL 3: TOP SELLING DELICACIES */}
          <div className="content-panel-card">
            <div className="panel-header">
              <h3 className="panel-title">
                <span>🏆</span>
                <span>Top Selling Delicacies</span>
              </h3>
            </div>
            <div className="list-group">
              {topSelling.length === 0 ? (
                <div style={{ padding: '16px 0', fontSize: 13, color: '#6B5E55' }}>
                  Sales history will compile here as orders advance.
                </div>
              ) : (
                topSelling.map((ts, idx) => (
                  <div key={idx} className="list-item">
                    <div>
                      <div className="list-item-title">{ts.name}</div>
                      <div className="list-item-subtitle">
                        {ts.quantity_sold} units • {ts.orders_count} orders
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, color: '#2C221E' }}>
                      ₹{ts.revenue.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

