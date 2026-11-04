import React, { useState, useEffect, useCallback } from 'react';

export default function ReportsView({ token }) {
  const [period, setPeriod] = useState('last_30_days');
  const [overview, setOverview] = useState({
    total_sales: 0,
    net_sales: 0,
    total_orders: 0,
    avg_order_value: 0,
    paid_revenue: 0,
    unpaid_cod_due: 0,
    today_sales: 0,
    today_orders: 0,
    this_week_sales: 0,
    this_week_orders: 0,
    this_month_sales: 0,
    this_month_orders: 0
  });

  const [chartPoints, setChartPoints] = useState([]);
  const [topSellers, setTopSellers] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [inventorySummary, setInventorySummary] = useState({});
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch Reports Data
  const fetchAllReports = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Admin-Token': token
      };

      const [resOv, resChart, resProd, resOrd] = await Promise.all([
        fetch('/wordpress/shree-shahi-admin/api/reports.php?action=overview', { headers }),
        fetch(`/wordpress/shree-shahi-admin/api/reports.php?action=sales_chart&period=${period}`, { headers }),
        fetch('/wordpress/shree-shahi-admin/api/reports.php?action=product_reports', { headers }),
        fetch('/wordpress/shree-shahi-admin/api/reports.php?action=order_reports', { headers })
      ]);

      const [dataOv, dataChart, dataProd, dataOrd] = await Promise.all([
        resOv.json(),
        resChart.json(),
        resProd.json(),
        resOrd.json()
      ]);

      if (dataOv.status === 'success' && dataOv.sales_overview) {
        setOverview(dataOv.sales_overview);
      }
      if (dataChart.status === 'success' && dataChart.points) {
        setChartPoints(dataChart.points);
      }
      if (dataProd.status === 'success') {
        if (dataProd.top_sellers) setTopSellers(dataProd.top_sellers);
        if (dataProd.low_stock_items) setLowStockItems(dataProd.low_stock_items);
        if (dataProd.inventory_summary) setInventorySummary(dataProd.inventory_summary);
      }
      if (dataOrd.status === 'success') {
        if (dataOrd.statuses) setOrderStatuses(dataOrd.statuses);
        if (dataOrd.payment_methods) setPaymentMethods(dataOrd.payment_methods);
      }
    } catch (err) {
      setError('Network connection error while fetching store analytics.');
    } finally {
      setLoading(false);
    }
  }, [token, period]);

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  // Max value for SVG chart scaling
  const maxSales = Math.max(...chartPoints.map(p => p.sales), 1000);

  return (
    <div className="royal-module-wrapper">
      {/* 1. TOP HEADER */}
      <div className="module-top-header">
        <div>
          <h1 className="module-main-title">Store Reports & Business Analytics</h1>
          <p className="module-subtitle">
            Authentic revenue, sales trends, inventory valuations and patron conversion metrics
          </p>
        </div>
        <div className="header-action-group">
          <div className="period-switch-group">
            <button
              className={`btn-period ${period === 'last_7_days' ? 'active' : ''}`}
              onClick={() => setPeriod('last_7_days')}
            >
              Last 7 Days
            </button>
            <button
              className={`btn-period ${period === 'last_30_days' ? 'active' : ''}`}
              onClick={() => setPeriod('last_30_days')}
            >
              Last 30 Days
            </button>
            <button
              className={`btn-period ${period === 'monthly' ? 'active' : ''}`}
              onClick={() => setPeriod('monthly')}
            >
              Monthly View
            </button>
          </div>

          <a
            href={`/wordpress/shree-shahi-admin/api/reports.php?action=export_csv&token=${encodeURIComponent(token)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-royal-outline"
          >
            📥 Export Analytics CSV
          </a>
        </div>
      </div>

      {loading ? (
        <div className="table-loading-state" style={{ minHeight: 400 }}>
          <div className="royal-spinner"></div>
          <p>Calculating verified WooCommerce sales metrics...</p>
        </div>
      ) : error ? (
        <div className="table-error-state">
          <p>⚠️ {error}</p>
          <button className="btn-retry" onClick={fetchAllReports}>Retry</button>
        </div>
      ) : (
        <>
          {/* 2. SALES KPI METRICS GRID */}
          <div className="reports-kpi-grid">
            <div className="kpi-card highlight">
              <div className="kpi-icon">💰</div>
              <div className="kpi-label">Gross Order Volume</div>
              <div className="kpi-value">₹{overview.total_sales.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="kpi-subtext">Across {overview.total_orders} total orders</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">✓</div>
              <div className="kpi-label">Verified Paid Revenue</div>
              <div className="kpi-value text-success">₹{overview.paid_revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="kpi-subtext">Settled & collected payments</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">⏳</div>
              <div className="kpi-label">COD Uncollected Due</div>
              <div className="kpi-value text-danger">₹{overview.unpaid_cod_due.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="kpi-subtext">Due upon delivery handover</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">📦</div>
              <div className="kpi-label">Average Order Value (AOV)</div>
              <div className="kpi-value text-gold">₹{overview.avg_order_value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="kpi-subtext">Per customer transaction</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-icon">🍯</div>
              <div className="kpi-label">Catalog Inventory Valuation</div>
              <div className="kpi-value text-gold">₹{(inventorySummary.estimated_inventory_valuation || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
              <div className="kpi-subtext">{inventorySummary.total_units_in_stock || 0} total units in stock</div>
            </div>
          </div>

          {/* 3. SALES REVENUE TRENDS CHART (PURE SVG ROYAL BARS) */}
          <div className="reports-card chart-container-card">
            <div className="reports-card-header">
              <div>
                <h3 className="reports-card-title">📈 Sales Volume & Order Frequency</h3>
                <span className="reports-card-subtitle">
                  {period === 'last_7_days' ? 'Daily revenue over the past 7 days' : (period === 'last_30_days' ? 'Daily revenue timeline over the past 30 days' : 'Monthly revenue trend')}
                </span>
              </div>
            </div>

            <div className="sales-chart-wrapper">
              {chartPoints.length === 0 ? (
                <div className="table-empty-state">
                  <p>No sales activity recorded for this period.</p>
                </div>
              ) : (
                <div className="svg-bars-grid">
                  {chartPoints.map((pt, i) => {
                    const barHeightPct = Math.max(12, Math.round((pt.sales / maxSales) * 100));
                    return (
                      <div key={i} className="bar-column">
                        <div className="bar-tooltip">
                          <strong>₹{pt.sales.toLocaleString()}</strong>
                          <span>{pt.orders} order{pt.orders === 1 ? '' : 's'}</span>
                        </div>
                        <div className="bar-track">
                          <div
                            className="bar-fill"
                            style={{ height: `${barHeightPct}%` }}
                          ></div>
                        </div>
                        <span className="bar-label">{pt.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. PRODUCT PERFORMANCE & ORDER BREAKDOWN GRID */}
          <div className="reports-dual-grid">
            {/* Top Selling Gajak Varieties */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">👑 Top Selling Gajak Varieties</h3>
                  <span className="reports-card-subtitle">Ranked by total quantity dispatched</span>
                </div>
              </div>

              <table className="mini-report-table">
                <thead>
                  <tr>
                    <th>Gajak Product</th>
                    <th style={{ textAlign: 'center' }}>Units Sold</th>
                    <th>Gross Revenue</th>
                    <th>Stock Status</th>
                  </tr>
                </thead>
                <tbody>
                  {topSellers.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong className="item-name-bold">{item.name}</strong>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge-qty">{item.qty_sold}</span>
                      </td>
                      <td>
                        <strong>₹{item.gross_revenue.toLocaleString()}</strong>
                      </td>
                      <td>
                        <span className={`stock-status-pill ${item.stock_status}`}>
                          {item.stock_status_label} ({item.stock_quantity})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment & Order Fulfillment Mix */}
            <div className="reports-card">
              <div className="reports-card-header">
                <div>
                  <h3 className="reports-card-title">💳 Payment Settlement Mix</h3>
                  <span className="reports-card-subtitle">Share of transactions by payment gateway</span>
                </div>
              </div>

              <div className="method-mix-list">
                {paymentMethods.map((m, idx) => (
                  <div key={idx} className="method-mix-item">
                    <div className="m-info-line">
                      <strong>{m.title || 'Cash on Delivery (COD)'}</strong>
                      <span>{m.count} orders • ₹{m.volume.toLocaleString()} ({m.percentage}%)</span>
                    </div>
                    <div className="m-progress-track">
                      <div className="m-progress-fill" style={{ width: `${Math.max(5, m.percentage)}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="reports-card-header" style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid rgba(212, 163, 61, 0.2)' }}>
                <div>
                  <h3 className="reports-card-title">📦 Order Status Breakdown</h3>
                </div>
              </div>

              <div className="status-chips-wrap">
                {orderStatuses.map((st, idx) => (
                  <div key={idx} className="status-chip-card">
                    <span className="chip-label">{st.label}</span>
                    <strong className="chip-count">{st.count} orders</strong>
                    <span className="chip-vol">₹{st.volume.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

