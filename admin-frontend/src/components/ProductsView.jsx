import React, { useState, useEffect, useCallback } from 'react';
import ProductModal from './ProductModal';

export default function ProductsView({ token, onNavigateCategories }) {
  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({ total: 0, in_stock: 0, low_stock: 0, out_of_stock: 0, variable: 0 });
  const [pagination, setPagination] = useState({ current_page: 1, total_pages: 1, total_items: 0, limit: 15 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [page, setPage] = useState(1);

  // Selection & Bulk
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Categories List for Filter Dropdown and Product Modal
  useEffect(() => {
    fetch('/wordpress/shree-shahi-admin/api/products.php?action=categories_list', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Admin-Token': token
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success' && data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(() => {});
  }, [token]);

  // Fetch Products
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');

    const params = new URLSearchParams({
      action: 'list',
      page: String(page),
      limit: '15',
      sort_by: sortBy
    });

    if (search.trim()) params.append('search', search.trim());
    if (categoryFilter !== 'all') params.append('category', categoryFilter);
    if (typeFilter !== 'all') params.append('type', typeFilter);
    if (stockFilter !== 'all') params.append('stock_status', stockFilter);
    if (featuredFilter !== 'all') params.append('featured', featuredFilter);

    try {
      const res = await fetch(`/wordpress/shree-shahi-admin/api/products.php?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setProducts(data.products || []);
        if (data.stats) setStats(data.stats);
        if (data.pagination) setPagination(data.pagination);
      } else {
        setError(data.message || 'Failed to load WooCommerce products.');
      }
    } catch (err) {
      setError('Network connection error while fetching products.');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, categoryFilter, typeFilter, stockFilter, featuredFilter, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Handle Search Input submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  // Toggle Featured
  const handleToggleFeatured = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/products.php?action=toggle_featured', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setProducts(prev => prev.map(p => p.id === id ? { ...p, featured: data.featured } : p));
      }
    } catch (err) {}
  };

  // Handle Delete Product Confirmation
  const handleConfirmDelete = async () => {
    if (!deleteConfirmProduct) return;
    setDeleting(true);

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/products.php?action=delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: deleteConfirmProduct.id, force: true })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setDeleteConfirmProduct(null);
        setSelectedIds(prev => prev.filter(id => id !== deleteConfirmProduct.id));
        fetchProducts();
      } else {
        alert(data.message || 'Failed to delete product.');
      }
    } catch (err) {
      alert('Network error while deleting product.');
    } finally {
      setDeleting(false);
    }
  };

  // Handle Bulk Action
  const handleExecuteBulkAction = async () => {
    if (!bulkAction || selectedIds.length === 0) return;
    if (bulkAction === 'delete' && !window.confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected product(s)?`)) {
      return;
    }

    setBulkProcessing(true);
    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/products.php?action=bulk_action', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action_type: bulkAction,
          product_ids: selectedIds
        })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setSelectedIds([]);
        setBulkAction('');
        fetchProducts();
      } else {
        alert(data.message || 'Bulk operation failed.');
      }
    } catch (err) {
      alert('Network error executing bulk action.');
    } finally {
      setBulkProcessing(false);
    }
  };

  // Select all checkboxes
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="royal-module-wrapper">
      {/* 1. TOP HEADER */}
      <div className="module-top-header">
        <div>
          <h1 className="module-main-title">Royal Products & Catalog</h1>
          <p className="module-subtitle">
            Manage sweets, traditional gajaks, gift hampers, variations, and real WooCommerce inventory
          </p>
        </div>
        <div className="header-action-group">
          {onNavigateCategories && (
            <button
              className="btn-royal-outline"
              onClick={onNavigateCategories}
            >
              🏷️ Manage Categories
            </button>
          )}
          <a
            href={`/wordpress/shree-shahi-admin/api/products.php?action=export_csv&token=${encodeURIComponent(token)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-royal-outline"
          >
            📥 Export CSV
          </a>
          <button
            className="btn-royal-gold"
            onClick={() => {
              setEditingProductId(null);
              setIsModalOpen(true);
            }}
          >
            ➕ Add New Sweet
          </button>
        </div>
      </div>

      {/* 2. STATS PILLS */}
      <div className="stats-pill-row">
        <div
          className={`stat-pill ${typeFilter === 'all' && stockFilter === 'all' ? 'active' : ''}`}
          onClick={() => { setTypeFilter('all'); setStockFilter('all'); setPage(1); }}
        >
          <span className="pill-label">Total Sweets</span>
          <span className="pill-value">{stats.total}</span>
        </div>
        <div
          className={`stat-pill ${stockFilter === 'instock' ? 'active' : ''}`}
          onClick={() => { setStockFilter('instock'); setPage(1); }}
        >
          <span className="pill-label">In Stock</span>
          <span className="pill-value text-success">{stats.in_stock}</span>
        </div>
        <div
          className="stat-pill"
          onClick={() => { setStockFilter('instock'); setPage(1); }}
        >
          <span className="pill-label">Low Stock (≤10)</span>
          <span className="pill-value text-warning">{stats.low_stock}</span>
        </div>
        <div
          className={`stat-pill ${stockFilter === 'outofstock' ? 'active' : ''}`}
          onClick={() => { setStockFilter('outofstock'); setPage(1); }}
        >
          <span className="pill-label">Out of Stock</span>
          <span className="pill-value text-danger">{stats.out_of_stock}</span>
        </div>
        <div
          className={`stat-pill ${typeFilter === 'variable' ? 'active' : ''}`}
          onClick={() => { setTypeFilter('variable'); setPage(1); }}
        >
          <span className="pill-label">Variable Packs</span>
          <span className="pill-value text-gold">{stats.variable}</span>
        </div>
      </div>

      {/* 3. FILTER AND SEARCH BAR */}
      <div className="filter-card">
        <form onSubmit={handleSearchSubmit} className="filter-form-grid">
          {/* Search Box */}
          <div className="search-input-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-field"
              placeholder="Search by Sweet name, SKU, or keyword..."
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

          {/* Category Dropdown */}
          <div className="filter-dropdown-wrap">
            <select
              className="filter-dropdown"
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.slug}>{c.name} ({c.count})</option>
              ))}
            </select>
          </div>

          {/* Type Dropdown */}
          <div className="filter-dropdown-wrap">
            <select
              className="filter-dropdown"
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Types</option>
              <option value="simple">Simple Sweet</option>
              <option value="variable">Variable (Multiple Packs)</option>
            </select>
          </div>

          {/* Stock Dropdown */}
          <div className="filter-dropdown-wrap">
            <select
              className="filter-dropdown"
              value={stockFilter}
              onChange={e => { setStockFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Stock Status</option>
              <option value="instock">In Stock</option>
              <option value="outofstock">Out of Stock</option>
            </select>
          </div>

          {/* Featured Dropdown */}
          <div className="filter-dropdown-wrap">
            <select
              className="filter-dropdown"
              value={featuredFilter}
              onChange={e => { setFeaturedFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Items</option>
              <option value="1">⭐ Featured Only</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="filter-dropdown-wrap">
            <select
              className="filter-dropdown"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="stock_desc">Highest Stock</option>
              <option value="stock_asc">Lowest Stock</option>
            </select>
          </div>
        </form>
      </div>

      {/* 4. BULK ACTIONS FLOATING BAR */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions-floating-bar">
          <div className="bulk-info">
            <span className="bulk-badge">{selectedIds.length}</span>
            <span>sweet(s) selected</span>
          </div>
          <div className="bulk-controls">
            <select
              className="bulk-select"
              value={bulkAction}
              onChange={e => setBulkAction(e.target.value)}
            >
              <option value="">Bulk Actions...</option>
              <option value="set_instock">Mark In Stock</option>
              <option value="set_outofstock">Mark Out of Stock</option>
              <option value="mark_featured">Mark as Featured ⭐</option>
              <option value="unmark_featured">Remove from Featured</option>
              <option value="delete">Permanently Delete</option>
            </select>
            <button
              className="btn-apply-bulk"
              onClick={handleExecuteBulkAction}
              disabled={!bulkAction || bulkProcessing}
            >
              {bulkProcessing ? 'Processing...' : 'Apply to Selected'}
            </button>
            <button
              className="btn-cancel-bulk"
              onClick={() => setSelectedIds([])}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* 5. PRODUCTS MAIN TABLE */}
      <div className="royal-table-container">
        {loading ? (
          <div className="table-loading-state">
            <div className="royal-spinner"></div>
            <p>Fetching sweets from WooCommerce register...</p>
          </div>
        ) : error ? (
          <div className="table-error-state">
            <p>⚠️ {error}</p>
            <button className="btn-retry" onClick={fetchProducts}>Retry</button>
          </div>
        ) : products.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-icon">🍯</div>
            <h3>No Confectionery Found</h3>
            <p>No products match your current search and filter criteria.</p>
            <button
              className="btn-royal-outline"
              onClick={() => {
                setSearch('');
                setCategoryFilter('all');
                setTypeFilter('all');
                setStockFilter('all');
                setFeaturedFilter('all');
              }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <table className="orders-main-table products-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.length === products.length && products.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th style={{ width: 70 }}>Image</th>
                <th>Product Name & Categories</th>
                <th>SKU</th>
                <th>Type</th>
                <th>Price (₹)</th>
                <th>Stock</th>
                <th style={{ width: 50, textAlign: 'center' }}>Featured</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => {
                const isSelected = selectedIds.includes(p.id);
                const isOutOfStock = p.stock_status === 'outofstock';
                const isLowStock = !isOutOfStock && p.stock_quantity !== null && p.stock_quantity <= 10;

                return (
                  <tr key={p.id} className={isSelected ? 'row-selected' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(p.id)}
                      />
                    </td>
                    <td>
                      <div className="product-table-thumb">
                        <img
                          src={p.image?.url || '/placeholder.png'}
                          alt={p.name}
                          onError={e => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="50" height="50" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20">🍯</text></svg>'; }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="product-name-col">
                        <span className="product-item-title">{p.name}</span>
                        <div className="product-cat-tags">
                          {p.categories && p.categories.map(c => (
                            <span key={c.id} className="cat-tiny-badge">{c.name}</span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td>
                      <code className="sku-code">{p.sku}</code>
                    </td>
                    <td>
                      <span className={`prod-type-pill ${p.type}`}>
                        {p.type === 'variable' ? `Variable (${p.variations_count})` : 'Simple'}
                      </span>
                    </td>
                    <td>
                      {p.type === 'variable' ? (
                        <span className="price-var-range">{p.variations_summary || `₹${p.price.toFixed(2)}`}</span>
                      ) : p.on_sale && p.sale_price ? (
                        <div className="price-sale-col">
                          <span className="reg-strikethrough">₹{p.regular_price.toFixed(2)}</span>
                          <span className="sale-active-price">₹{p.sale_price.toFixed(2)}</span>
                        </div>
                      ) : (
                        <span className="reg-price-text">₹{p.price.toFixed(2)}</span>
                      )}
                    </td>
                    <td>
                      {isOutOfStock ? (
                        <span className="stock-pill out-of-stock">Out of Stock</span>
                      ) : isLowStock ? (
                        <span className="stock-pill low-stock">Low Stock ({p.stock_quantity})</span>
                      ) : (
                        <span className="stock-pill in-stock">
                          In Stock {p.stock_quantity !== null ? `(${p.stock_quantity})` : ''}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        className={`star-toggle-btn ${p.featured ? 'is-featured' : ''}`}
                        onClick={e => handleToggleFeatured(p.id, e)}
                        title={p.featured ? 'Remove from Featured' : 'Mark as Featured'}
                      >
                        {p.featured ? '⭐' : '☆'}
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-action-btns">
                        <button
                          className="btn-action-view"
                          onClick={() => {
                            setEditingProductId(p.id);
                            setIsModalOpen(true);
                          }}
                          title="Edit Product"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-action-del"
                          onClick={() => setDeleteConfirmProduct(p)}
                          title="Delete Product"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 6. PAGINATION CONTROLS */}
      {!loading && pagination.total_pages > 1 && (
        <div className="royal-pagination-bar">
          <span className="pagination-info">
            Showing Page {pagination.current_page} of {pagination.total_pages} ({pagination.total_items} total sweets)
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

      {/* 7. PRODUCT ADD/EDIT MODAL */}
      <ProductModal
        isOpen={isModalOpen}
        productId={editingProductId}
        token={token}
        categoriesList={categories}
        onClose={() => {
          setIsModalOpen(false);
          setEditingProductId(null);
        }}
        onSaved={() => {
          fetchProducts();
        }}
      />

      {/* 8. DELETE CONFIRMATION MODAL */}
      {deleteConfirmProduct && (
        <div className="royal-dialog-overlay" onClick={() => setDeleteConfirmProduct(null)}>
          <div className="royal-dialog-box" onClick={e => e.stopPropagation()}>
            <div className="dialog-icon-wrap" style={{ color: '#D32F2F' }}>
              🗑️
            </div>
            <h3 className="dialog-title">Delete Product Permanently?</h3>
            <p className="dialog-desc">
              Are you sure you want to delete <strong>{deleteConfirmProduct.name}</strong> (ID #{deleteConfirmProduct.id}) from WooCommerce?
            </p>
            <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              This action permanently removes the item and any associated pack variations.
            </p>
            <div className="dialog-action-buttons">
              <button
                className="btn-cancel-dialog"
                onClick={() => setDeleteConfirmProduct(null)}
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
                {deleting ? 'Deleting...' : 'Yes, Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

