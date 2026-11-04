import React from 'react';

export default function AdminSidebar({
  activeModule,
  onSelectModule,
  userRole,
  counts = {},
  isOpen = false,
  onClose
}) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', badge: null },
    { id: 'orders', label: 'Orders', icon: '📦', badge: counts.processingOrders || null, badgeType: 'warning' },
    { id: 'products', label: 'Products', icon: '🍯', badge: counts.lowStock || null, badgeType: 'danger' },
    { id: 'categories', label: 'Categories', icon: '🏷️', badge: null },
    { id: 'customers', label: 'Customers', icon: '👥', badge: null },
    { id: 'coupons', label: 'Coupons', icon: '🎟️', badge: null },
    { id: 'shipping', label: 'Shipping & Couriers', icon: '🚚', badge: null },
    { id: 'payments', label: 'Payments', icon: '💳', badge: null },
    { id: 'reports', label: 'Reports & Analytics', icon: '📈', badge: null },
    { id: 'settings', label: 'Store Settings', icon: '⚙️', badge: null },
  ];

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-emblem">👑</div>
        <div className="brand-text">
          <h1>Sahu Ji</h1>
          <span>Gajak Darbar</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item-btn ${isActive ? 'active' : ''}`}
              onClick={() => {
                onSelectModule(item.id);
                if (onClose) onClose();
              }}
            >
              <div className="nav-item-left">
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge !== null && item.badge > 0 && (
                <span className={`nav-badge ${isActive ? 'active-badge' : (item.badgeType || 'warning')}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="environment-pill">
          <span className="status-dot"></span>
          <span>WooCommerce 11.2 • HPOS Active</span>
        </div>
      </div>
    </aside>
  );
}

