import React, { useState, useEffect, useCallback } from 'react';

export default function CategoriesView({ token, onNavigateProducts }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parent, setParent] = useState(0);
  const [thumbnail, setThumbnail] = useState({ id: 0, url: '' });

  // Delete confirmation
  const [deleteCategory, setDeleteCategory] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Categories
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/products.php?action=categories_list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token
        }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setCategories(data.categories || []);
      } else {
        setError(data.message || 'Failed to fetch categories.');
      }
    } catch (err) {
      setError('Network error while loading categories.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setDescription('');
    setParent(0);
    setThumbnail({ id: 0, url: '' });
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setSlug(cat.slug || '');
    setDescription(cat.description || '');
    setParent(cat.parent || 0);
    setThumbnail({ id: cat.thumbnail_id || 0, url: cat.thumbnail_url || '' });
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle Thumbnail Upload
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setFormError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/products.php?action=upload_image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setThumbnail({ id: data.id, url: data.url });
      } else {
        setFormError(data.message || 'Image upload failed.');
      }
    } catch (err) {
      setFormError('Network error uploading category image.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Save Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setSaving(true);
    setFormError('');

    const payload = {
      id: editingCategory ? editingCategory.id : 0,
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      parent: parseInt(parent) || 0,
      thumbnail_id: thumbnail.id
    };

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/products.php?action=category_save', {
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
        fetchCategories();
      } else {
        setFormError(data.message || 'Failed to save category.');
      }
    } catch (err) {
      setFormError('Network connection error while saving category.');
    } finally {
      setSaving(false);
    }
  };

  // Delete Category
  const handleConfirmDelete = async () => {
    if (!deleteCategory) return;
    setDeleting(true);

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/products.php?action=category_delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: deleteCategory.id })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setDeleteCategory(null);
        fetchCategories();
      } else {
        alert(data.message || 'Failed to delete category.');
      }
    } catch (err) {
      alert('Network error while deleting category.');
    } finally {
      setDeleting(false);
    }
  };

  // Filter categories by search
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="royal-module-wrapper">
      {/* 1. TOP HEADER */}
      <div className="module-top-header">
        <div>
          <h1 className="module-main-title">Product Categories</h1>
          <p className="module-subtitle">
            Organize Sahu Ji Gajak catalog into royal confectionery categories, banners, and hierarchies
          </p>
        </div>
        <div className="header-action-group">
          {onNavigateProducts && (
            <button className="btn-royal-outline" onClick={onNavigateProducts}>
              🍯 Back to Sweets Catalog
            </button>
          )}
          <button className="btn-royal-gold" onClick={handleOpenAdd}>
            ➕ Add New Category
          </button>
        </div>
      </div>

      {/* 2. STATS & SEARCH */}
      <div className="categories-toolbar-row">
        <div className="stats-pill-row" style={{ marginBottom: 0 }}>
          <div className="stat-pill active">
            <span className="pill-label">Total Categories</span>
            <span className="pill-value">{categories.length}</span>
          </div>
          <div className="stat-pill">
            <span className="pill-label">Assigned Confections</span>
            <span className="pill-value text-gold">
              {categories.reduce((acc, c) => acc + (c.count || 0), 0)}
            </span>
          </div>
        </div>

        <div className="search-input-wrap" style={{ maxWidth: 360, width: '100%' }}>
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-field"
            placeholder="Search categories..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="clear-search-btn" onClick={() => setSearch('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. CATEGORIES TABLE */}
      <div className="royal-table-container" style={{ marginTop: 20 }}>
        {loading ? (
          <div className="table-loading-state">
            <div className="royal-spinner"></div>
            <p>Loading confectionery categories...</p>
          </div>
        ) : error ? (
          <div className="table-error-state">
            <p>⚠️ {error}</p>
            <button className="btn-retry" onClick={fetchCategories}>Retry</button>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="table-empty-state">
            <div className="empty-icon">🏷️</div>
            <h3>No Categories Found</h3>
            <p>No categories match "{search}".</p>
          </div>
        ) : (
          <table className="orders-main-table categories-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Image</th>
                <th>Category Name</th>
                <th>Slug</th>
                <th>Parent Hierarchy</th>
                <th>Description</th>
                <th style={{ textAlign: 'center' }}>Products Count</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map(cat => {
                const parentCat = categories.find(c => c.id === cat.parent);

                return (
                  <tr key={cat.id}>
                    <td>
                      <div className="product-table-thumb">
                        <img
                          src={cat.thumbnail_url || '/placeholder.png'}
                          alt={cat.name}
                          onError={e => { e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><rect width="50" height="50" fill="%23eee"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="20">🏷️</text></svg>'; }}
                        />
                      </div>
                    </td>
                    <td>
                      <strong className="cat-table-name">{cat.name}</strong>
                    </td>
                    <td>
                      <code className="sku-code">{cat.slug}</code>
                    </td>
                    <td>
                      {parentCat ? (
                        <span className="parent-cat-tag">↳ {parentCat.name}</span>
                      ) : (
                        <span className="root-cat-tag">— Top Level —</span>
                      )}
                    </td>
                    <td>
                      <span className="cat-desc-preview">
                        {cat.description ? (cat.description.length > 60 ? cat.description.substring(0, 60) + '...' : cat.description) : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className="cat-count-badge">
                        {cat.count} {cat.count === 1 ? 'sweet' : 'sweets'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-action-btns">
                        <button
                          className="btn-action-view"
                          onClick={() => handleOpenEdit(cat)}
                          title="Edit Category"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="btn-action-del"
                          onClick={() => setDeleteCategory(cat)}
                          title="Delete Category"
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

      {/* 4. ADD / EDIT CATEGORY MODAL */}
      {isModalOpen && (
        <div className="royal-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="royal-modal-container category-modal-container" onClick={e => e.stopPropagation()}>
            <div className="royal-modal-header">
              <div className="modal-title-wrap">
                <span className="modal-title-icon">🏷️</span>
                <div>
                  <h2 className="modal-title">
                    {editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
                  </h2>
                  <span className="modal-subtitle">
                    WooCommerce Taxonomy Register
                  </span>
                </div>
              </div>
              <button className="btn-close-modal" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSaveCategory} className="royal-modal-form">
              {formError && (
                <div className="royal-alert royal-alert-error">
                  <span>⚠️ {formError}</span>
                </div>
              )}

              <div className="form-grid-2">
                <div className="form-group full-width">
                  <label className="form-label">
                    Category Name <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Gur Gajak, Dry Fruit Sweets"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Slug (URL friendly)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. gur-gajak"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Parent Category</label>
                  <select
                    className="form-select"
                    value={parent}
                    onChange={e => setParent(parseInt(e.target.value) || 0)}
                  >
                    <option value={0}>— None (Top Level) —</option>
                    {categories
                      .filter(c => !editingCategory || c.id !== editingCategory.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Category Thumbnail Image</label>
                  <div className="main-image-row">
                    <div className="image-preview-box">
                      {thumbnail.url ? (
                        <img src={thumbnail.url} alt="Category Thumbnail" />
                      ) : (
                        <div className="no-image-placeholder">No Image</div>
                      )}
                    </div>
                    <div className="image-controls">
                      <label className="btn-upload-label">
                        {uploadingImage ? 'Uploading...' : '📁 Upload Thumbnail'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleThumbnailUpload}
                          disabled={uploadingImage}
                        />
                      </label>
                      {thumbnail.id > 0 && (
                        <button
                          type="button"
                          className="btn-remove-image"
                          onClick={() => setThumbnail({ id: 0, url: '' })}
                        >
                          Remove
                        </button>
                      )}
                      <p className="image-tip">Appears on Shop All category filters and navigation</p>
                    </div>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Enter category description..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                  />
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
                  disabled={saving || uploadingImage}
                >
                  {saving ? (
                    <>
                      <span className="button-spinner"></span>
                      <span>Saving Category...</span>
                    </>
                  ) : (
                    <>
                      <span>👑</span>
                      <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. DELETE CATEGORY CONFIRMATION DIALOG */}
      {deleteCategory && (
        <div className="royal-dialog-overlay" onClick={() => setDeleteCategory(null)}>
          <div className="royal-dialog-box" onClick={e => e.stopPropagation()}>
            <div className="dialog-icon-wrap" style={{ color: '#D32F2F' }}>
              🗑️
            </div>
            <h3 className="dialog-title">Delete Category?</h3>
            <p className="dialog-desc">
              Are you sure you want to delete category <strong>{deleteCategory.name}</strong>?
            </p>
            {deleteCategory.count > 0 && (
              <p style={{ color: '#E65100', background: '#FFF3E0', padding: '8px 12px', borderRadius: 6, fontSize: 13, marginTop: 8 }}>
                ⚠️ Notice: {deleteCategory.count} product(s) currently belong to this category. They will remain in the store under Uncategorized.
              </p>
            )}
            <div className="dialog-action-buttons">
              <button
                className="btn-cancel-dialog"
                onClick={() => setDeleteCategory(null)}
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
                {deleting ? 'Deleting...' : 'Yes, Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

