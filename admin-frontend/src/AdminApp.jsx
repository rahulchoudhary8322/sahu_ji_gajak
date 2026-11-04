import React, { useState, useEffect, useCallback } from 'react';
import AdminLogin from './components/AdminLogin';
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';
import DashboardView from './components/DashboardView';
import OrdersView from './components/OrdersView';
import ProductsView from './components/ProductsView';
import CategoriesView from './components/CategoriesView';
import CustomersView from './components/CustomersView';
import CouponsView from './components/CouponsView';
import PaymentsView from './components/PaymentsView';
import ShippingView from './components/ShippingView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';

export default function AdminApp() {
  const [token, setToken] = useState(() => localStorage.getItem('shahi_admin_token') || '');
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('shahi_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isVerifying, setIsVerifying] = useState(Boolean(token));
  const [activeModule, setActiveModule] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [counts, setCounts] = useState({ processingOrders: 0, lowStock: 0 });

  // Verify session on mount if token exists
  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      return;
    }

    const verifySession = async () => {
      try {
        const res = await fetch('/wordpress/shree-shahi-admin/api/auth.php?action=me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Admin-Token': token
          }
        });
        const data = await res.json();
        if (res.ok && data.status === 'success') {
          setUser(data.user);
          localStorage.setItem('shahi_admin_user', JSON.stringify(data.user));
        } else {
          // Token invalid or expired
          handleLogout();
        }
      } catch (e) {
        // Keep existing user if network glitch
      } finally {
        setIsVerifying(false);
      }
    };

    verifySession();
  }, [token]);

  const handleLoginSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('shahi_admin_token', newToken);
    localStorage.setItem('shahi_admin_user', JSON.stringify(newUser));
    setActiveModule('dashboard');
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await fetch('/wordpress/shree-shahi-admin/api/auth.php?action=logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Admin-Token': token
          }
        });
      }
    } catch (e) {}

    setToken('');
    setUser(null);
    localStorage.removeItem('shahi_admin_token');
    localStorage.removeItem('shahi_admin_user');
  };

  // If verifying stored token on page load
  if (isVerifying) {
    return (
      <div className="login-screen-wrapper">
        <div style={{ textAlign: 'center', color: '#FAF6EE' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>👑</div>
          <h2 style={{ fontFamily: 'Cinzel, serif', color: '#D4A33D' }}>Verifying Staff Credentials...</h2>
          <p style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>Accessing WooCommerce single-source-of-truth registers</p>
        </div>
      </div>
    );
  }

  // If unauthenticated, show Royal Login Screen
  if (!token || !user) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="admin-layout">
      {/* 1. SIDEBAR NAVIGATION */}
      <AdminSidebar
        activeModule={activeModule}
        onSelectModule={(mod) => setActiveModule(mod)}
        userRole={user?.role}
        counts={counts}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. MAIN OPERATIONS AREA */}
      <div className="admin-main-wrapper">
        <AdminHeader
          activeModule={activeModule}
          user={user}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        <main className="admin-content-area">
          {activeModule === 'dashboard' && (
            <DashboardView
              token={token}
              onNavigateOrders={() => setActiveModule('orders')}
              onNavigateProducts={() => setActiveModule('products')}
            />
          )}

          {activeModule === 'orders' && (
            <OrdersView token={token} />
          )}

          {activeModule === 'products' && (
            <ProductsView
              token={token}
              onNavigateCategories={() => setActiveModule('categories')}
            />
          )}

          {activeModule === 'categories' && (
            <CategoriesView
              token={token}
              onNavigateProducts={() => setActiveModule('products')}
            />
          )}

          {activeModule === 'customers' && (
            <CustomersView
              token={token}
              onNavigateOrder={(orderId) => setActiveModule('orders')}
            />
          )}

          {activeModule === 'coupons' && (
            <CouponsView token={token} />
          )}

          {activeModule === 'payments' && (
            <PaymentsView token={token} />
          )}

          {activeModule === 'shipping' && (
            <ShippingView token={token} />
          )}

          {activeModule === 'reports' && (
            <ReportsView token={token} />
          )}

          {activeModule === 'settings' && (
            <SettingsView token={token} onLogout={handleLogout} />
          )}

        </main>
      </div>
    </div>
  );
}

