import React, { useState, useEffect, useCallback } from 'react';

export default function CouponsView({ token }) {
  const [coupons, setCoupons] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('fixed_cart');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [minimumAmount, setMinimumAmount] = useState('');
  const [maximumAmount, setMaximumAmount] = useState('');
  const [dateExpires, setDateExpires] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState('');
  const [individualUse, setIndividualUse] = useState(false);
  const [excludeSaleItems, setExcludeSaleItems] = useState(false);
  const [emailRestrictions, setEmailRestrictions] = useState('');
  const [status, setStatus] = useState('publish');

  // Delete Modal
  const [deleteConfirmCoupon, setDeleteConfirmCoupon] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Coupons
  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      action: 'list'
    });

    if (search.trim()) params.append('search', search.trim());
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (typeFilter !== 'all') params.append('type', typeFilter);

    try {
      const res = await fetch(`/wordpress/shree-shahi-admin/api/coupons.php?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setCoupons(data.coupons || []);
        if (data.stats) setStats(data.stats);
      } else {
        setError(data.message || 'Failed to load coupons.');
      }
    } catch (err) {
      setError('Network error while loading coupons.');
    } finally {
      setLoading(false);
    }
  }, [token, search, statusFilter, typeFilter]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setCode('');
    setDiscountType('fixed_cart');
    setAmount('');
    setDescription('');
    setMinimumAmount('');
    setMaximumAmount('');
    setDateExpires('');
    setUsageLimit('');
    setUsageLimitPerUser('');
    setIndividualUse(false);
    setExcludeSaleItems(false);
    setEmailRestrictions('');
    setStatus('publish');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (c) => {
    setEditingCoupon(c);
    setCode(c.code || '');
    setDiscountType(c.discount_type || 'fixed_cart');
    setAmount(c.amount !== null && c.amount !== undefined ? String(c.amount) : '');
    setDescription(c.description || '');
    setMinimumAmount(c.minimum_amount !== null && c.minimum_amount !== undefined ? String(c.minimum_amount) : '');
    setMaximumAmount(c.maximum_amount !== null && c.maximum_amount !== undefined ? String(c.maximum_amount) : '');
    setDateExpires(c.date_expires || '');
    setUsageLimit(c.usage_limit ? String(c.usage_limit) : '');
    setUsageLimitPerUser(c.usage_limit_per_user ? String(c.usage_limit_per_user) : '');
    setIndividualUse(Boolean(c.individual_use));
    setExcludeSaleItems(Boolean(c.exclude_sale_items));
    setEmailRestrictions(c.email_restrictions || '');
    setStatus(c.status || 'publish');
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Coupon
  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setFormError('Coupon code is required.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setFormError('Please enter a valid discount amount greater than zero.');
      return;
    }

    setSaving(true);
    setFormError('');

    const payload = {
      id: editingCoupon ? editingCoupon.id : 0,
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      amount: parseFloat(amount),
      description: description.trim(),
      minimum_amount: minimumAmount,
      maximum_amount: maximumAmount,
      date_expires: dateExpires,
      usage_limit: usageLimit,
      usage_limit_per_user: usageLimitPerUser,
      individual_use: individualUse,
      exclude_sale_items: excludeSaleItems,
      email_restrictions: emailRestrictions,
      status
    };

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/coupons.php?action=save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setIsModalOpen(false);
        fetchCoupons();
      } else {
        setFormError(data.message || 'Failed to save coupon.');
      }
    } catch (err) {
      setFormError('Network connection error saving coupon.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Coupon
  const handleConfirmDelete = async () => {
    if (!deleteConfirmCoupon) return;
    setDeleting(true);

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/coupons.php?action=delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: deleteConfirmCoupon.id })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setDeleteConfirmCoupon(null);
        fetchCoupons();
      } else {
        alert(data.message || 'Failed to delete coupon.');
      }
    } catch (err) {
      alert('Network error while deleting coupon.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="royal-module-wrapper">
      {/* 1. TOP HEADER */}
      <div className="module-top-header">
        <div>
          <h1 className="module-main-title">Promotional Coupons & Vouchers</h1>
          <p className="module-subtitle">
            Create and manage promotional discount codes using the official WooCommerce coupon engine
          </p>
        </div>
        <div className="header-action-group">
          <a
            href={`/wordpress/shree-shahi-admin/api/coupons.php?action=export_csv&token=${encodeURIComponent(token)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-royal-outline"
          >
            📥 Export CSV
          </a>
          <button className="btn-royal-gold" onClick={handleOpenCreate}>
            ➕ Create New Coupon
          </button>
        </div>
      </div>

      {/* 2. STATS PILLS */}
      <div className="stats-pill-row">
        <div
          className={`stat-pill ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          <span className="pill-label">Total Coupons</span>
          <span className="pill-value">{stats.total}</span>
        </div>
        <div
          className={`stat-pill ${statusFilter === 'active' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active')}
        >
          <span className="pill-label">Active & Valid</span>
          <span className="pill-value text-success">{stats.active}</span>
        </div>
        <div
          className={`stat-pill ${statusFilter === 'expired' ? 'active' : ''}`}
          onClick={() => setStatusFilter('expired')}
        >
          <span className="pill-label">Expired</span>
          <span className="pill-value text-danger">{stats.expired}</span>
        </div>
      </div>

      {/* 3. FILTER AND SEARCH BAR */}
      <div className="filter-card">
        <div className="filter-form-grid">
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-field"
              placeholder="Search coupon code or description..."
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
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="all">All Discount Types</option>
              <option value="fixed_cart">Fixed Cart (₹)</option>
              <option value="percent">Percentage (%)</option>
              <option value="fixed_product">Fixed Product (₹)</option>
            </select>
          </div>

          <div className="filter-dropdown-wrap">
            <select
              className="filter-dropdown"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="expired">Expired Only</option>
              <option value="draft">Disabled / Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. COUPONS TABLE */}
      <div className="royal-table-container">
        {loading ? (
          <div className="table-loading-state">
            <div className="royal-spinner"></div>
            <p>Loading promotional coupons from WooCommerce...</p>
          </div>
        ) : error ? (
          <div className="table-error-state">
            <p>⚠️ {error}</p>
            <button className="btn-retry" onClick={fetchCoupons}>Retry</button>
          </div>
        ) : coupons.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-icon">🎟️</div>
            <h3>No Coupons Found</h3>
            <p>No coupons match your current filter settings.</p>
          </div>
        ) : (
          <table className="orders-main-table coupons-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount Type</th>
                <th>Discount Value</th>
                <th>Usage / Limit</th>
                <th>Min Spend (₹)</th>
                <th>Expiry Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id}>
                  <td>
                    <div className="coupon-code-chip">
                      <span className="chip-icon">🎟️</span>
                      <strong>{c.code}</strong>
                    </div>
                    {c.description && <div className="coupon-desc-text">{c.description}</div>}
                  </td>
                  <td>
                    <span className="disc-type-tag">{c.discount_type_label}</span>
                  </td>
                  <td>
                    <strong className="coupon-val-text">{c.amount_display}</strong>
                  </td>
                  <td>
                    <span className="usage-metric-tag">
                      {c.usage_count} / {c.usage_limit ? c.usage_limit : '∞'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 12.5 }}>
                      {c.minimum_amount ? `₹${c.minimum_amount.toFixed(2)}` : 'No Minimum'}
                    </span>
                  </td>
                  <td>
                    <span className={`expiry-date-tag ${c.is_expired ? 'expired' : ''}`}>
                      {c.date_expires_formatted}
                    </span>
                  </td>
                  <td>
                    <span className={`coupon-status-pill ${c.is_expired ? 'expired' : c.status}`}>
                      {c.status_label}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="row-action-btns">
                      <button
                        className="btn-action-view"
                        onClick={() => handleOpenEdit(c)}
                        title="Edit Coupon"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-action-del"
                        onClick={() => setDeleteConfirmCoupon(c)}
                        title="Delete Coupon"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 5. ADD / EDIT COUPON MODAL */}
      {isModalOpen && (
        <div className="royal-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="royal-modal-container coupon-modal-container" onClick={e => e.stopPropagation()}>
            <div className="royal-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-title-icon">🎟️</span>
                <div>
                  <h2 className="modal-title">
                    {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Create Royal Discount Coupon'}
                  </h2>
                  <span className="modal-subtitle">Official WooCommerce Discount Register</span>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveCoupon} className="royal-modal-form">
              {formError && (
                <div className="royal-alert royal-alert-error">
                  <span>⚠️ {formError}</span>
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Coupon Code <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. SHAHI20, UTSAV100"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Discount Type</label>
                  <select
                    className="form-select"
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value)}
                  >
                    <option value="fixed_cart">Fixed Cart Discount (₹)</option>
                    <option value="percent">Percentage Discount (%)</option>
                    <option value="fixed_product">Fixed Product Discount (₹)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Discount Amount ({discountType === 'percent' ? '%' : '₹'}) <span className="req">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 100 or 15"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                  >
                    <option value="publish">Active (Usable at Checkout)</option>
                    <option value="draft">Disabled / Draft</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Description (Internal or Note)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Festive season 20% discount on orders above ₹1,000"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Minimum Spend (₹) (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 500.00"
                    value={minimumAmount}
                    onChange={e => setMinimumAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Maximum Spend (₹) (Optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="e.g. 5000.00"
                    value={maximumAmount}
                    onChange={e => setMaximumAmount(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Expiry Date (Optional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dateExpires}
                    onChange={e => setDateExpires(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Usage Limit Per Coupon</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Blank for unlimited"
                    value={usageLimit}
                    onChange={e => setUsageLimit(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Usage Limit Per Customer</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="e.g. 1 (one use per patron)"
                    value={usageLimitPerUser}
                    onChange={e => setUsageLimitPerUser(e.target.value)}
                  />
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={individualUse}
                      onChange={e => setIndividualUse(e.target.checked)}
                    />
                    <span>Individual use only (cannot be combined with other coupons)</span>
                  </label>
                </div>

                <div className="form-group full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={excludeSaleItems}
                      onChange={e => setExcludeSaleItems(e.target.checked)}
                    />
                    <span>Exclude items already on sale</span>
                  </label>
                </div>
              </div>

              <div className="royal-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="button-spinner"></span>
                      <span>Saving to WooCommerce...</span>
                    </>
                  ) : (
                    <>
                      <span>👑</span>
                      <span>{editingCoupon ? 'Update Coupon' : 'Publish Coupon'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION DIALOG */}
      {deleteConfirmCoupon && (
        <div className="royal-dialog-overlay" onClick={() => setDeleteConfirmCoupon(null)}>
          <div className="royal-dialog-box" onClick={e => e.stopPropagation()}>
            <div className="dialog-icon-wrap" style={{ color: '#D32F2F' }}>
              🗑️
            </div>
            <h3 className="dialog-title">Delete Coupon?</h3>
            <p className="dialog-desc">
              Are you sure you want to permanently delete coupon <strong>{deleteConfirmCoupon.code}</strong> from WooCommerce?
            </p>
            <div className="dialog-action-buttons">
              <button
                className="btn-cancel-dialog"
                onClick={() => setDeleteConfirmCoupon(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                className="btn-confirm-dialog"
                style={{ background: '#D32F2F', borderColor: '#B71C1C' }}
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

