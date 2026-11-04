import React from 'react';

export default function AdminHeader({
  activeModule,
  user,
  onLogout,
  onToggleMobileMenu
}) {
  const moduleTitles = {
    dashboard: 'Business Operations Dashboard',
    orders: 'Orders Management',
    products: 'Products & Variations Inventory',
    categories: 'Product Categories',
    customers: 'Customer Directory & CRM',
    coupons: 'Promotional Coupons Engine',
    shipping: 'Shipping Zones & Logistics',
    payments: 'Payment Gateways & Transactions',
    reports: 'Financial Reports & Analytics',
    settings: 'Store Configuration Settings',
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <button
          className="mobile-toggle-btn"
          onClick={onToggleMobileMenu}
          aria-label="Toggle Navigation"
        >
          ☰
        </button>
        <span className="page-title-badge">
          {moduleTitles[activeModule] || 'Operations Panel'}
        </span>
      </div>

      <div className="header-right">
        <a
          href="http://127.0.0.1:5173/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-store-link"
          title="Open live customer store in new tab"
        >
          <span>🏪</span>
          <span>View Live Store</span>
          <span>↗</span>
        </a>

        <div className="header-user-menu">
          <div className="user-info-text">
            <div className="user-name">{user?.display_name || user?.username || 'Administrator'}</div>
            <span className="role-tag">👑 Administrator</span>
          </div>

          <button
            className="btn-logout"
            onClick={onLogout}
            title="Log out of operations panel"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

