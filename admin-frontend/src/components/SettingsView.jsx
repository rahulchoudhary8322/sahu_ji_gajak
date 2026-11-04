import React, { useState, useEffect, useCallback } from 'react';

export default function SettingsView({ token, onLogout }) {
  const [activeTab, setActiveTab] = useState('identity');

  const [identity, setIdentity] = useState({
    store_name: '',
    store_description: '',
    store_phone: '',
    store_address_1: '',
    store_address_2: '',
    store_city: '',
    store_state: '',
    store_postcode: '',
    store_country: '',
    currency: '',
    currency_symbol: ''
  });

  const [shipping, setShipping] = useState({ zones: [], shiprocket: {} });
  const [payments, setPayments] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [profile, setProfile] = useState({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Identity state
  const [identSaving, setIdentSaving] = useState(false);
  const [identMsg, setIdentMsg] = useState('');
  const [identError, setIdentError] = useState('');

  // Password Change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passSaving, setPassSaving] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passError, setPassError] = useState('');

  // Profile Edit state
  const [displayName, setDisplayName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [profSaving, setProfSaving] = useState(false);
  const [profMsg, setProfMsg] = useState('');
  const [profError, setProfError] = useState('');

  // Fetch Settings
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/settings.php?action=get', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        if (data.identity) setIdentity(data.identity);
        if (data.shipping) setShipping(data.shipping);
        if (data.payments) setPayments(data.payments);
        if (data.notifications) setNotifications(data.notifications);
        if (data.profile) {
          setProfile(data.profile);
          setDisplayName(data.profile.display_name || '');
          setAdminEmail(data.profile.email || '');
        }
      } else {
        setError(data.message || 'Failed to retrieve settings.');
      }
    } catch (err) {
      setError('Network connection error while fetching settings.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Handle Identity Submit
  const handleSaveIdentity = async (e) => {
    e.preventDefault();
    setIdentSaving(true);
    setIdentMsg('');
    setIdentError('');

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/settings.php?action=update_identity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(identity)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setIdentMsg(data.message || 'Store identity updated successfully.');
        setTimeout(() => setIdentMsg(''), 4000);
      } else {
        setIdentError(data.message || 'Failed to update store identity.');
      }
    } catch (err) {
      setIdentError('Network error while saving identity.');
    } finally {
      setIdentSaving(false);
    }
  };

  // Handle Profile Submit
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfSaving(true);
    setProfMsg('');
    setProfError('');

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/settings.php?action=update_profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ display_name: displayName, email: adminEmail })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setProfMsg(data.message || 'Profile updated successfully.');
        setTimeout(() => setProfMsg(''), 4000);
      } else {
        setProfError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      setProfError('Network error while saving profile.');
    } finally {
      setProfSaving(false);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      setPassError('Please enter current and new passwords.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPassError('New password must be at least 8 characters long.');
      return;
    }

    setPassSaving(true);
    setPassMsg('');
    setPassError('');

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/settings.php?action=change_password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
          confirm_password: confirmPassword
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setPassMsg('✓ Password changed successfully! Your royal credentials have been updated.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        if (data.new_token) {
          localStorage.setItem('shahi_admin_token', data.new_token);
        }
      } else {
        setPassError(data.message || 'Failed to update password.');
      }
    } catch (err) {
      setPassError('Network error while updating password.');
    } finally {
      setPassSaving(false);
    }
  };

  return (
    <div className="royal-module-wrapper">
      {/* 1. TOP HEADER */}
      <div className="module-top-header">
        <div>
          <h1 className="module-main-title">Store Configuration & Security Darbar</h1>
          <p className="module-subtitle">
            Manage live WooCommerce store identity, shipping zones, payment gateways and administrator security
          </p>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="settings-tab-bar">
        <button
          className={`settings-tab-btn ${activeTab === 'identity' ? 'active' : ''}`}
          onClick={() => setActiveTab('identity')}
        >
          🏰 Store Identity & Brand
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
          onClick={() => setActiveTab('shipping')}
        >
          🚚 Shipping & Zones
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          💳 Payment Gateways
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          🔔 Email Alerts
        </button>
        <button
          className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          👑 Admin Security & Profile
        </button>
      </div>

      {loading ? (
        <div className="table-loading-state" style={{ minHeight: 400 }}>
          <div className="royal-spinner"></div>
          <p>Accessing WooCommerce configuration registers...</p>
        </div>
      ) : error ? (
        <div className="table-error-state">
          <p>⚠️ {error}</p>
          <button className="btn-retry" onClick={fetchSettings}>Retry</button>
        </div>
      ) : (
        <div className="settings-content-wrapper">
          {/* TAB 1: STORE IDENTITY */}
          {activeTab === 'identity' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>🏰 Royal Store Identity & Physical Premises</h3>
                <p>Public business details displayed on invoices, packing slips, and storefront footer</p>
              </div>

              {identMsg && <div className="royal-alert royal-alert-success"><span>✓ {identMsg}</span></div>}
              {identError && <div className="royal-alert royal-alert-error"><span>⚠️ {identError}</span></div>}

              <form onSubmit={handleSaveIdentity} className="settings-form-grid">
                <div className="form-group">
                  <label className="form-label">Store Trade Name <span className="req">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={identity.store_name}
                    onChange={e => setIdentity({ ...identity, store_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Customer Support Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={identity.store_phone}
                    onChange={e => setIdentity({ ...identity, store_phone: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Store Heritage Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={identity.store_description}
                    onChange={e => setIdentity({ ...identity, store_description: e.target.value })}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Premises Address (Line 1)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={identity.store_address_1}
                    onChange={e => setIdentity({ ...identity, store_address_1: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Premises Complex (Line 2)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={identity.store_address_2}
                    onChange={e => setIdentity({ ...identity, store_address_2: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    value={identity.store_city}
                    onChange={e => setIdentity({ ...identity, store_city: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Postal Pincode</label>
                  <input
                    type="text"
                    className="form-input"
                    value={identity.store_postcode}
                    onChange={e => setIdentity({ ...identity, store_postcode: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Operating Currency</label>
                  <input
                    type="text"
                    className="form-input"
                    value={`${identity.currency} (${identity.currency_symbol})`}
                    disabled
                  />
                </div>

                <div className="form-group full-width" style={{ marginTop: 12 }}>
                  <button type="submit" className="btn-royal-primary" disabled={identSaving}>
                    {identSaving ? 'Saving to WooCommerce...' : '✓ Update Store Identity'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: SHIPPING & ZONES */}
          {activeTab === 'shipping' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>🚚 Configured Shipping Zones & Carrier Logistics</h3>
                <p>Regional fulfilment boundaries established in WooCommerce HPOS</p>
              </div>

              {/* Shiprocket Card */}
              <div className="carrier-integration-card">
                <div className="cic-left">
                  <span className="cic-icon">🚀</span>
                  <div>
                    <strong>Shiprocket API Carrier Integration</strong>
                    <p>Automated rate calculations, bulk pickup requests, and real-time AWB generation</p>
                  </div>
                </div>
                <div className="cic-right">
                  <span className={`status-pill ${shipping.shiprocket?.configured ? 'success' : 'pending'}`}>
                    {shipping.shiprocket?.status_label || 'Pending Setup'}
                  </span>
                </div>
              </div>

              <div className="zones-list">
                {shipping.zones?.map(zone => (
                  <div key={zone.zone_id} className="zone-card">
                    <div className="zone-header">
                      <h4>📍 {zone.zone_name}</h4>
                      <span className="zone-id-tag">Zone #{zone.zone_id}</span>
                    </div>

                    <div className="methods-table-wrap">
                      <table className="mini-report-table">
                        <thead>
                          <tr>
                            <th>Shipping Method</th>
                            <th>Cost</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {zone.methods?.map((m, idx) => (
                            <tr key={idx}>
                              <td><strong>{m.title}</strong></td>
                              <td>{m.cost > 0 ? `₹${m.cost.toFixed(2)}` : (m.id === 'free_shipping' ? 'Free (Eligible)' : '₹0.00 (Free)')}</td>
                              <td>
                                <span className={`status-badge ${m.enabled ? 'active' : 'disabled'}`}>
                                  {m.enabled ? 'Active' : 'Disabled'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENT GATEWAYS */}
          {activeTab === 'payments' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>💳 Payment Gateways & Cash Reconciliation</h3>
                <p>Current gateway configurations stored in WooCommerce options</p>
              </div>

              <div className="gateways-grid">
                {/* Cash on Delivery */}
                <div className="gateway-card">
                  <div className="gw-head">
                    <span className="gw-icon">💵</span>
                    <div>
                      <h4>Cash on Delivery (COD)</h4>
                      <span className="gw-status-text">Handover Collection</span>
                    </div>
                    <span className="status-pill success">Active</span>
                  </div>
                  <p className="gw-desc">
                    Allows patrons to pay cash upon royal gajak delivery. All COD orders remain in unpaid status until explicitly collected by the store administrator.
                  </p>
                </div>

                {/* Razorpay */}
                <div className="gateway-card">
                  <div className="gw-head">
                    <span className="gw-icon">💳</span>
                    <div>
                      <h4>Razorpay UPI & Cards</h4>
                      <span className="gw-status-text">Online Settlement</span>
                    </div>
                    <span className={`status-pill ${payments.razorpay?.configured ? 'success' : 'pending'}`}>
                      {payments.razorpay?.status_label || 'Pending'}
                    </span>
                  </div>
                  <p className="gw-desc">
                    {payments.razorpay?.configured ? (
                      `Configured with Key: ${payments.razorpay.key_id_masked}`
                    ) : (
                      'Live merchant API credentials (Key ID and Secret) have not yet been configured in WooCommerce. The panel safely displays pending status without simulated transactions.'
                    )}
                  </p>
                </div>

                {/* Direct Bank Transfer */}
                <div className="gateway-card">
                  <div className="gw-head">
                    <span className="gw-icon">🏛️</span>
                    <div>
                      <h4>Direct Bank Transfer (NEFT/RTGS)</h4>
                      <span className="gw-status-text">Offline Settlement</span>
                    </div>
                    <span className="status-pill neutral">Active</span>
                  </div>
                  <p className="gw-desc">
                    Available for wholesale and large festive bulk gift hamper orders.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="settings-card">
              <div className="settings-card-header">
                <h3>🔔 Automated Email Notifications</h3>
                <p>Transactional alerts triggered by WooCommerce order status changes</p>
              </div>

              <div className="notifications-list">
                {notifications.map(notif => (
                  <div key={notif.id} className="notification-row">
                    <div className="notif-info">
                      <strong>{notif.title}</strong>
                      <span className="notif-recipient">Sent to: {notif.recipient}</span>
                    </div>
                    <span className={`status-badge ${notif.enabled ? 'active' : 'disabled'}`}>
                      {notif.enabled ? '✓ Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: ADMIN PROFILE & SECURITY */}
          {activeTab === 'profile' && (
            <div className="settings-dual-grid">
              {/* Profile Details */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <h3>👑 Administrator Profile</h3>
                  <p>Authenticated single-admin identity</p>
                </div>

                {profMsg && <div className="royal-alert royal-alert-success"><span>✓ {profMsg}</span></div>}
                {profError && <div className="royal-alert royal-alert-error"><span>⚠️ {profError}</span></div>}

                <form onSubmit={handleSaveProfile} className="settings-form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Admin Username</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profile.username || 'sahuji'}
                      disabled
                    />
                    <span className="form-hint">Authorized WordPress Administrator account</span>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Display Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Contact Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group full-width" style={{ marginTop: 8 }}>
                    <button type="submit" className="btn-royal-primary" disabled={profSaving}>
                      {profSaving ? 'Updating...' : '✓ Update Profile Details'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Change */}
              <div className="settings-card">
                <div className="settings-card-header">
                  <h3>🔒 Security & Password Update</h3>
                  <p>Change your royal authentication credentials securely</p>
                </div>

                {passMsg && <div className="royal-alert royal-alert-success"><span>{passMsg}</span></div>}
                {passError && <div className="royal-alert royal-alert-error"><span>⚠️ {passError}</span></div>}

                <form onSubmit={handleChangePassword} className="settings-form-grid">
                  <div className="form-group full-width">
                    <label className="form-label">Current Password <span className="req">*</span></label>
                    <input
                      type="password"
                      className="form-input"
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">New Password (Min 8 chars) <span className="req">*</span></label>
                    <input
                      type="password"
                      className="form-input"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Confirm New Password <span className="req">*</span></label>
                    <input
                      type="password"
                      className="form-input"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group full-width" style={{ marginTop: 8 }}>
                    <button type="submit" className="btn-royal-primary" disabled={passSaving}>
                      {passSaving ? 'Securing Credentials...' : '🔐 Change Password'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

