import React, { useState, useEffect } from 'react';

export default function ProductModal({
  isOpen,
  productId,
  onClose,
  onSaved,
  token,
  categoriesList = []
}) {
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('simple');
  const [sku, setSku] = useState('');
  const [status, setStatus] = useState('publish');
  const [featured, setFeatured] = useState(false);
  const [regularPrice, setRegularPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  // Inventory & Shipping
  const [manageStock, setManageStock] = useState(true);
  const [stockQuantity, setStockQuantity] = useState(50);
  const [stockStatus, setStockStatus] = useState('instock');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');

  // Media
  const [image, setImage] = useState({ id: 0, url: '' });
  const [gallery, setGallery] = useState([]);

  // Variations
  const [attributeName, setAttributeName] = useState('Pack Size');
  const [attributeOptions, setAttributeOptions] = useState(['250 g', '500 g', '1 kg']);
  const [newOptionInput, setNewOptionInput] = useState('');
  const [variations, setVariations] = useState([]);
  const [deletedVariationIds, setDeletedVariationIds] = useState([]);

  // Fetch product data if editing
  useEffect(() => {
    if (!isOpen) return;

    if (productId > 0) {
      setLoading(true);
      setError('');
      fetch(`/wordpress/shree-shahi-admin/api/products.php?action=detail&id=${productId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.product) {
            const p = data.product;
            setName(p.name || '');
            setType(p.type || 'simple');
            setSku(p.sku || '');
            setStatus(p.status || 'publish');
            setFeatured(Boolean(p.featured));
            setRegularPrice(p.regular_price !== null && p.regular_price !== undefined ? String(p.regular_price) : '');
            setSalePrice(p.sale_price !== null && p.sale_price !== undefined ? String(p.sale_price) : '');
            setShortDescription(p.short_description || '');
            setDescription(p.description || '');
            setSelectedCategories(p.categories ? p.categories.map(c => c.id) : []);
            setManageStock(Boolean(p.manage_stock));
            setStockQuantity(p.stock_quantity !== null && p.stock_quantity !== undefined ? p.stock_quantity : 0);
            setStockStatus(p.stock_status || 'instock');
            setWeight(p.weight !== null && p.weight !== undefined ? String(p.weight) : '');
            setLength(p.length !== null && p.length !== undefined ? String(p.length) : '');
            setWidth(p.width !== null && p.width !== undefined ? String(p.width) : '');
            setHeight(p.height !== null && p.height !== undefined ? String(p.height) : '');
            setImage(p.image || { id: 0, url: '' });
            setGallery(p.gallery || []);

            if (p.attributes && p.attributes.length > 0) {
              setAttributeName(p.attributes[0].name || 'Pack Size');
              setAttributeOptions(p.attributes[0].options || ['250 g', '500 g', '1 kg']);
            }

            if (p.variations && p.variations.length > 0) {
              setVariations(p.variations.map(v => ({
                id: v.id,
                sku: v.sku || '',
                regular_price: v.regular_price !== null && v.regular_price !== undefined ? String(v.regular_price) : '',
                sale_price: v.sale_price !== null && v.sale_price !== undefined ? String(v.sale_price) : '',
                manage_stock: Boolean(v.manage_stock),
                stock_quantity: v.stock_quantity !== null && v.stock_quantity !== undefined ? v.stock_quantity : 50,
                stock_status: v.stock_status || 'instock',
                weight: v.weight !== null && v.weight !== undefined ? String(v.weight) : '',
                pack_size: v.attributes && (v.attributes['pack-size'] || v.attributes['attribute_pack-size'] || Object.values(v.attributes)[0]) || '500 g',
              })));
            } else {
              setVariations([]);
            }
            setDeletedVariationIds([]);
          } else {
            setError(data.message || 'Failed to load product details.');
          }
        })
        .catch(err => {
          setError('Network error fetching product details.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Reset form for New Product
      setName('');
      setType('simple');
      setSku('');
      setStatus('publish');
      setFeatured(false);
      setRegularPrice('');
      setSalePrice('');
      setShortDescription('');
      setDescription('');
      setSelectedCategories([]);
      setManageStock(true);
      setStockQuantity(50);
      setStockStatus('instock');
      setWeight('0.5');
      setLength('');
      setWidth('');
      setHeight('');
      setImage({ id: 0, url: '' });
      setGallery([]);
      setAttributeName('Pack Size');
      setAttributeOptions(['250 g', '500 g', '1 kg']);
      setVariations([
        { id: 0, sku: '', regular_price: '250', sale_price: '', manage_stock: true, stock_quantity: 50, stock_status: 'instock', weight: '0.25', pack_size: '250 g' },
        { id: 0, sku: '', regular_price: '480', sale_price: '', manage_stock: true, stock_quantity: 50, stock_status: 'instock', weight: '0.5', pack_size: '500 g' },
        { id: 0, sku: '', regular_price: '920', sale_price: '', manage_stock: true, stock_quantity: 50, stock_status: 'instock', weight: '1', pack_size: '1 kg' },
      ]);
      setDeletedVariationIds([]);
      setActiveTab('basic');
      setError('');
    }
  }, [isOpen, productId, token]);

  if (!isOpen) return null;

  // Handle Image Upload
  const handleFileUpload = async (e, isGallery = false) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');

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
        if (isGallery) {
          setGallery(prev => [...prev, { id: data.id, url: data.url }]);
        } else {
          setImage({ id: data.id, url: data.url });
        }
      } else {
        setError(data.message || 'Image upload failed.');
      }
    } catch (err) {
      setError('Network error while uploading image.');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  };

  // Toggle Category selection
  const handleToggleCategory = (catId) => {
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        return prev.filter(id => id !== catId);
      } else {
        return [...prev, catId];
      }
    });
  };

  // Add variation pack size tag
  const handleAddOption = () => {
    const trimmed = newOptionInput.trim();
    if (!trimmed) return;
    if (!attributeOptions.includes(trimmed)) {
      setAttributeOptions(prev => [...prev, trimmed]);
    }
    setNewOptionInput('');
  };

  // Remove variation pack size tag
  const handleRemoveOption = (opt) => {
    setAttributeOptions(prev => prev.filter(o => o !== opt));
  };

  // Add new variation row
  const handleAddVariationRow = () => {
    const defaultOption = attributeOptions[0] || '500 g';
    setVariations(prev => [
      ...prev,
      {
        id: 0,
        sku: sku ? `${sku}-${variations.length + 1}` : '',
        regular_price: '300',
        sale_price: '',
        manage_stock: true,
        stock_quantity: 30,
        stock_status: 'instock',
        weight: '0.5',
        pack_size: defaultOption
      }
    ]);
  };

  // Delete variation row
  const handleDeleteVariation = (index, varId) => {
    if (varId > 0) {
      setDeletedVariationIds(prev => [...prev, varId]);
    }
    setVariations(prev => prev.filter((_, idx) => idx !== index));
  };

  // Update variation row field
  const handleUpdateVariationField = (index, field, val) => {
    setVariations(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: val };
      return updated;
    });
  };

  // Save product
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product Name is required.');
      setActiveTab('basic');
      return;
    }

    if (type === 'simple' && !regularPrice) {
      setError('Regular Price is required for a simple product.');
      setActiveTab('basic');
      return;
    }

    if (type === 'variable' && variations.length === 0) {
      setError('At least one variation is required for a variable product.');
      setActiveTab('variations');
      return;
    }

    setSaving(true);

    const payload = {
      id: productId || 0,
      name: name.trim(),
      type,
      sku: sku.trim(),
      status,
      featured,
      description,
      short_description: shortDescription,
      category_ids: selectedCategories,
      image_id: image.id,
      gallery_image_ids: gallery.map(g => g.id),
      weight,
      length,
      width,
      height
    };

    if (type === 'simple') {
      payload.regular_price = regularPrice;
      payload.sale_price = salePrice;
      payload.manage_stock = manageStock;
      payload.stock_quantity = stockQuantity;
      payload.stock_status = stockStatus;
    } else {
      payload.attributes = [
        {
          name: attributeName,
          options: attributeOptions
        }
      ];
      payload.variations = variations.map(v => ({
        id: v.id || 0,
        sku: v.sku,
        regular_price: v.regular_price,
        sale_price: v.sale_price,
        manage_stock: v.manage_stock,
        stock_quantity: v.stock_quantity,
        stock_status: v.stock_status,
        weight: v.weight,
        attributes: {
          [attributeName.toLowerCase().replace(/\s+/g, '-')]: v.pack_size
        }
      }));
      payload.deleted_variation_ids = deletedVariationIds;
    }

    try {
      const res = await fetch('/wordpress/shree-shahi-admin/api/products.php?action=save', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Admin-Token': token,
          'Content-Type': 'application/json'
        },
        body: json_stringify_safe(payload)
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        onSaved();
        onClose();
      } else {
        setError(data.message || 'Failed to save product in WooCommerce.');
      }
    } catch (err) {
      setError('Network connection error while saving product.');
    } finally {
      setSaving(false);
    }
  };

  function json_stringify_safe(obj) {
    return JSON.stringify(obj);
  }

  return (
    <div className="royal-modal-overlay" onClick={onClose}>
      <div className="royal-modal-container product-modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="royal-modal-header">
          <div className="modal-title-wrap">
            <span className="modal-title-icon">🍯</span>
            <div>
              <h2 className="modal-title">
                {productId > 0 ? `Edit Sweet #${productId}: ${name || 'Product'}` : 'Add New Royal Confectionery'}
              </h2>
              <span className="modal-subtitle">
                Official WooCommerce Catalog • Single Source of Truth
              </span>
            </div>
          </div>
          <button className="btn-close-modal" onClick={onClose}>✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="modal-tab-nav">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            📋 Basic & Pricing
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            📦 Inventory & Shipping
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'media' ? 'active' : ''}`}
            onClick={() => setActiveTab('media')}
          >
            🖼️ Media & Gallery ({gallery.length + (image.id ? 1 : 0)})
          </button>
          {type === 'variable' && (
            <button
              type="button"
              className={`modal-tab-btn ${activeTab === 'variations' ? 'active' : ''}`}
              onClick={() => setActiveTab('variations')}
            >
              ⚖️ Variations ({variations.length})
            </button>
          )}
        </div>

        {/* Body Content */}
        {loading ? (
          <div className="modal-loading-body">
            <div className="royal-spinner"></div>
            <p>Loading WooCommerce product register...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="royal-modal-form">
            {error && (
              <div className="royal-alert royal-alert-error">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* TAB 1: BASIC & PRICING */}
            {activeTab === 'basic' && (
              <div className="modal-tab-pane">
                <div className="form-grid-2">
                  <div className="form-group full-width">
                    <label className="form-label">
                      Product Name <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Shahi Gur Til Gajak (Woodfire Special)"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Product Type</label>
                    <select
                      className="form-select"
                      value={type}
                      onChange={e => setType(e.target.value)}
                    >
                      <option value="simple">Simple Sweet / Hamper</option>
                      <option value="variable">Variable Product (Multiple Pack Sizes)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">SKU (Stock Keeping Unit)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. SSG-GAJ-000001"
                      value={sku}
                      onChange={e => setSku(e.target.value)}
                    />
                  </div>

                  {type === 'simple' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">
                          Regular Price (₹) <span className="req">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          placeholder="e.g. 350.00"
                          value={regularPrice}
                          onChange={e => setRegularPrice(e.target.value)}
                          required={type === 'simple'}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Sale Price (₹) (Optional)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-input"
                          placeholder="e.g. 299.00"
                          value={salePrice}
                          onChange={e => setSalePrice(e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="form-group">
                    <label className="form-label">Catalog Status</label>
                    <select
                      className="form-select"
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                    >
                      <option value="publish">Published (Visible in Storefront)</option>
                      <option value="draft">Draft (Admin Only)</option>
                      <option value="pending">Pending Review</option>
                    </select>
                  </div>

                  <div className="form-group checkbox-align">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={featured}
                        onChange={e => setFeatured(e.target.checked)}
                      />
                      <span>⭐ Feature in Royal Heritage Highlights</span>
                    </label>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Categories</label>
                    <div className="categories-pill-selector">
                      {categoriesList.map(cat => {
                        const isChecked = selectedCategories.includes(cat.id);
                        return (
                          <button
                            type="button"
                            key={cat.id}
                            className={`category-toggle-chip ${isChecked ? 'selected' : ''}`}
                            onClick={() => handleToggleCategory(cat.id)}
                          >
                            {isChecked ? '✓ ' : '+ '}{cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Short Tagline / Teaser</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Handcrafted with organic Rajasthan sesame and pure desi ghee"
                      value={shortDescription}
                      onChange={e => setShortDescription(e.target.value)}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label className="form-label">Full Culinary Description</label>
                    <textarea
                      className="form-textarea"
                      rows="4"
                      placeholder="Detailed royal culinary narrative and ingredients..."
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: INVENTORY & SHIPPING */}
            {activeTab === 'inventory' && (
              <div className="modal-tab-pane">
                <div className="form-grid-2">
                  <div className="form-group full-width">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={manageStock}
                        onChange={e => setManageStock(e.target.checked)}
                      />
                      <span>Track stock quantity for this product in WooCommerce</span>
                    </label>
                  </div>

                  {manageStock && (
                    <div className="form-group">
                      <label className="form-label">Stock Quantity</label>
                      <input
                        type="number"
                        className="form-input"
                        value={stockQuantity}
                        onChange={e => setStockQuantity(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Stock Status</label>
                    <select
                      className="form-select"
                      value={stockStatus}
                      onChange={e => setStockStatus(e.target.value)}
                    >
                      <option value="instock">In Stock</option>
                      <option value="outofstock">Out of Stock</option>
                      <option value="onbackorder">On Backorder</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="e.g. 0.5"
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                    />
                  </div>

                  <div className="form-group dimensions-group">
                    <label className="form-label">Dimensions (L × W × H) (cm)</label>
                    <div className="dimensions-inputs">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="L"
                        className="form-input"
                        value={length}
                        onChange={e => setLength(e.target.value)}
                      />
                      <span>×</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="W"
                        className="form-input"
                        value={width}
                        onChange={e => setWidth(e.target.value)}
                      />
                      <span>×</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="H"
                        className="form-input"
                        value={height}
                        onChange={e => setHeight(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MEDIA & GALLERY */}
            {activeTab === 'media' && (
              <div className="modal-tab-pane">
                <div className="media-management-section">
                  {/* Featured Main Image */}
                  <div className="media-block">
                    <h4 className="media-subheading">Main Showcase Image</h4>
                    <div className="main-image-row">
                      <div className="image-preview-box">
                        {image.url ? (
                          <img src={image.url} alt="Main Preview" />
                        ) : (
                          <div className="no-image-placeholder">No Image</div>
                        )}
                      </div>
                      <div className="image-controls">
                        <label className="btn-upload-label">
                          {uploadingImage ? 'Uploading...' : '📁 Upload New Image'}
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => handleFileUpload(e, false)}
                            disabled={uploadingImage}
                          />
                        </label>
                        {image.id > 0 && (
                          <button
                            type="button"
                            className="btn-remove-image"
                            onClick={() => setImage({ id: 0, url: '' })}
                          >
                            Remove
                          </button>
                        )}
                        <p className="image-tip">Recommended: 1000×1000px JPG or PNG with solid or transparent background</p>
                      </div>
                    </div>
                  </div>

                  {/* Gallery Images */}
                  <div className="media-block">
                    <div className="gallery-header-row">
                      <h4 className="media-subheading">Product Gallery</h4>
                      <label className="btn-gallery-upload-label">
                        ➕ Add to Gallery
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={e => handleFileUpload(e, true)}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                    {gallery.length === 0 ? (
                      <p className="empty-gallery-text">No additional gallery photos attached.</p>
                    ) : (
                      <div className="gallery-preview-grid">
                        {gallery.map((g, idx) => (
                          <div key={g.id || idx} className="gallery-item-card">
                            <img src={g.url} alt="Gallery item" />
                            <button
                              type="button"
                              className="btn-del-gallery-item"
                              onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))}
                              title="Delete from gallery"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: VARIATIONS */}
            {activeTab === 'variations' && type === 'variable' && (
              <div className="modal-tab-pane">
                {/* Pack Size Attribute Tags */}
                <div className="attribute-control-box">
                  <div className="attr-title-bar">
                    <strong>Variation Attribute: {attributeName}</strong>
                    <span className="attr-hint">Define available sizes</span>
                  </div>
                  <div className="attribute-tags-wrap">
                    {attributeOptions.map(opt => (
                      <span key={opt} className="attr-tag">
                        {opt}
                        <button
                          type="button"
                          className="btn-remove-tag"
                          onClick={() => handleRemoveOption(opt)}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    <div className="add-tag-inline">
                      <input
                        type="text"
                        placeholder="e.g. 1.5 kg"
                        value={newOptionInput}
                        onChange={e => setNewOptionInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }}
                      />
                      <button type="button" onClick={handleAddOption}>+ Add</button>
                    </div>
                  </div>
                </div>

                {/* Variations Table */}
                <div className="variations-table-wrap">
                  <div className="var-table-header">
                    <h4>Pack Size Variations ({variations.length})</h4>
                    <button
                      type="button"
                      className="btn-add-variation"
                      onClick={handleAddVariationRow}
                    >
                      ➕ Add Pack Variation
                    </button>
                  </div>

                  {variations.length === 0 ? (
                    <div className="empty-state-notice">
                      <p>No variations configured. Click "+ Add Pack Variation" above.</p>
                    </div>
                  ) : (
                    <table className="variations-table">
                      <thead>
                        <tr>
                          <th>Pack Size</th>
                          <th>SKU</th>
                          <th>Regular Price (₹)</th>
                          <th>Sale Price (₹)</th>
                          <th>Stock Qty</th>
                          <th>Weight (kg)</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variations.map((v, idx) => (
                          <tr key={v.id || idx}>
                            <td>
                              <select
                                className="form-select select-sm"
                                value={v.pack_size}
                                onChange={e => handleUpdateVariationField(idx, 'pack_size', e.target.value)}
                              >
                                {attributeOptions.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                type="text"
                                className="form-input input-sm"
                                placeholder="SKU"
                                value={v.sku}
                                onChange={e => handleUpdateVariationField(idx, 'sku', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                className="form-input input-sm"
                                placeholder="₹ Price"
                                value={v.regular_price}
                                onChange={e => handleUpdateVariationField(idx, 'regular_price', e.target.value)}
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                className="form-input input-sm"
                                placeholder="₹ Sale"
                                value={v.sale_price}
                                onChange={e => handleUpdateVariationField(idx, 'sale_price', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-input input-sm"
                                placeholder="Qty"
                                value={v.stock_quantity}
                                onChange={e => handleUpdateVariationField(idx, 'stock_quantity', parseInt(e.target.value) || 0)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                step="0.01"
                                className="form-input input-sm"
                                placeholder="kg"
                                value={v.weight}
                                onChange={e => handleUpdateVariationField(idx, 'weight', e.target.value)}
                              />
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-del-var-row"
                                onClick={() => handleDeleteVariation(idx, v.id)}
                                title="Remove variation"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="royal-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={onClose}
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
                    <span>Saving to WooCommerce...</span>
                  </>
                ) : (
                  <>
                    <span>👑</span>
                    <span>{productId > 0 ? 'Update WooCommerce Product' : 'Publish Product to Store'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

