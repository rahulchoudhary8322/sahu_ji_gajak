import React, { useState, useMemo } from 'react';
import '../styles/ShopAllPage.css';

/**
 * Explore Our Royal Collection - Shop All Page
 * Premium Royal Indian Palace e-commerce experience:
 * - Real WooCommerce products from database
 * - Dynamic category filters with item counts
 * - Live search, price filtering, and multi-criteria sorting
 * - Responsive 4-col desktop, 2-col mobile layout
 * - Add to Cart and direct Product Detail navigation
 */
export default function ShopAllPage({
  products = [],
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  onSelectProduct,
  onAddToCart,
  onToggleWishlist,
  wishlistItems = []
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState(selectedCategory || 'all');
  const [sortBy, setSortBy] = useState('popular');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [stockOnly, setStockOnly] = useState(false);

  // Sync activeCategory when prop changes
  React.useEffect(() => {
    if (selectedCategory) {
      setActiveCategory(selectedCategory);
    }
  }, [selectedCategory]);

  // Extract all categories from actual product data if not passed from backend
  const derivedCategories = useMemo(() => {
    const catMap = new Map();
    catMap.set('all', { name: 'All Products', slug: 'all', count: products.length });

    products.forEach((p) => {
      const cats = Array.isArray(p.categories) ? p.categories : [p.category].filter(Boolean);
      cats.forEach((catName) => {
        const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        if (catMap.has(slug)) {
          catMap.get(slug).count += 1;
        } else {
          catMap.set(slug, { name: catName, slug, count: 1 });
        }
      });
    });

    return Array.from(catMap.values());
  }, [products]);

  // Combined Category list (prefer backend categories if available, else derived)
  const categoryList = useMemo(() => {
    if (categories && categories.length > 0) {
      const hasAll = categories.some((c) => c.slug === 'all');
      const list = hasAll
        ? categories
        : [{ id: 0, name: 'All Products', slug: 'all', count: products.length }, ...categories];
      return list;
    }
    return derivedCategories;
  }, [categories, derivedCategories, products.length]);

  // Filter & Sort Pipeline
  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        // 1. Category Filter
        if (activeCategory && activeCategory !== 'all') {
          const matchPrimary =
            product.category &&
            product.category.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeCategory;
          const matchMultiple =
            Array.isArray(product.categories) &&
            product.categories.some(
              (c) => c.toLowerCase().replace(/[^a-z0-9]+/g, '-') === activeCategory
            );
          if (!matchPrimary && !matchMultiple) return false;
        }

        // 2. Search Filter
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = product.name?.toLowerCase().includes(q);
          const matchDesc = product.description?.toLowerCase().includes(q);
          const matchCat = product.category?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        // 3. Price Filter
        if (minPrice !== '' && product.price < Number(minPrice)) return false;
        if (maxPrice !== '' && product.price > Number(maxPrice)) return false;

        // 4. In-Stock Only Filter
        if (stockOnly && product.stock_status === 'outofstock') return false;

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_low':
            return a.price - b.price;
          case 'price_high':
            return b.price - a.price;
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          case 'newest':
            return (b.id || 0) - (a.id || 0);
          case 'popular':
          default:
            return (b.reviews_count || 0) - (a.reviews_count || 0) || (b.rating || 0) - (a.rating || 0);
        }
      });
  }, [products, activeCategory, searchTerm, minPrice, maxPrice, stockOnly, sortBy]);

  const handleCategoryClick = (slug) => {
    setActiveCategory(slug);
    if (onSelectCategory) onSelectCategory(slug);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setStockOnly(false);
    setSortBy('popular');
    if (onSelectCategory) onSelectCategory('all');
  };

  const isFiltered =
    activeCategory !== 'all' ||
    searchTerm.trim() !== '' ||
    minPrice !== '' ||
    maxPrice !== '' ||
    stockOnly;

  return (
    <div className="shop-all-page" id="shop-all">
      {/* Royal Palace Banner Header */}
      <section className="shop-hero-banner">
        <div className="shop-banner-bg" aria-hidden="true" />
        <div className="shop-banner-flourish flank-left" aria-hidden="true" />
        <div className="shop-banner-flourish flank-right" aria-hidden="true" />

        <div className="shop-banner-content">
          <div className="shop-royal-badge">
            <div className="badge-crown">
              <svg viewBox="0 0 60 26" fill="none">
                <path
                  d="M6 22 L12 7 L23 15 L30 2 L37 15 L48 7 L54 22 Z"
                  fill="url(#shopCrownGold)"
                  stroke="#FFE49E"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <rect x="8" y="22" width="44" height="3" rx="1.5" fill="url(#shopCrownGold)" />
                <circle cx="30" cy="2" r="2.2" fill="#FFE49E" />
                <circle cx="12" cy="7" r="1.8" fill="#D32F2F" />
                <circle cx="48" cy="7" r="1.8" fill="#D32F2F" />
                <defs>
                  <linearGradient id="shopCrownGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF2B8" />
                    <stop offset="50%" stopColor="#F5C65B" />
                    <stop offset="100%" stopColor="#C4932B" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h1 className="shop-main-heading">Explore Our Royal Collection</h1>
          </div>

          <div className="shop-subtitle-wrapper">
            <span className="gold-dash dash-left" />
            <p className="shop-subtitle">Discover the Authentic Taste of Tradition</p>
            <span className="gold-dash dash-right" />
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="shop-main-container">
        {/* Controls Bar: Search, Category Pills, Filter Controls */}
        <div className="shop-controls-bar">
          {/* Top Row: Search Input & Sort Selector */}
          <div className="search-sort-row">
            {/* Live Search Input */}
            <div className="shop-search-wrapper">
              <svg className="search-icon-svg" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#D4A33D" strokeWidth="2" />
                <path d="M16.5 16.5L21.5 21.5" stroke="#D4A33D" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <input
                type="text"
                placeholder="Search royal sweets, til gajak, rewari, chikki..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="shop-search-input"
                aria-label="Search Products"
              />
              {searchTerm && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchTerm('')}
                  title="Clear search"
                  aria-label="Clear Search"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="shop-sort-wrapper">
              <label htmlFor="shop-sort-select" className="sort-label">Sort By:</label>
              <select
                id="shop-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="shop-sort-select"
              >
                <option value="popular">👑 Most Popular</option>
                <option value="price_low">₹ Price: Low to High</option>
                <option value="price_high">₹ Price: High to Low</option>
                <option value="rating">★ Highest Customer Rating</option>
                <option value="newest">✦ Newest Arrivals</option>
              </select>
            </div>
          </div>

          {/* Middle Row: Category Filter Pills */}
          <div className="category-pills-row" role="tablist" aria-label="Product Categories">
            {categoryList.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <button
                  key={cat.slug}
                  role="tab"
                  aria-selected={isActive}
                  className={`category-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleCategoryClick(cat.slug)}
                >
                  <span className="pill-dot">✦</span>
                  <span className="pill-name">{cat.name}</span>
                  {typeof cat.count === 'number' && (
                    <span className="pill-count">({cat.count})</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Row: Price Filter & Results Counter */}
          <div className="filter-summary-row">
            <div className="price-filter-group">
              <span className="filter-group-label">Price Range:</span>
              <div className="price-inputs">
                <span className="price-curr">₹</span>
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="price-num-input"
                  min="0"
                />
                <span className="price-sep">–</span>
                <span className="price-curr">₹</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="price-num-input"
                  min="0"
                />
              </div>

              {/* In-Stock Toggle */}
              <label className="instock-checkbox-label">
                <input
                  type="checkbox"
                  checked={stockOnly}
                  onChange={(e) => setStockOnly(e.target.checked)}
                />
                <span>In-Stock Only</span>
              </label>

              {isFiltered && (
                <button className="reset-filters-btn" onClick={handleResetFilters}>
                  ↺ Reset All
                </button>
              )}
            </div>

            {/* Results Count Banner */}
            <div className="results-counter">
              <span className="counter-icon">❖</span>
              <span>
                Showing <strong>{filteredProducts.length}</strong> of {products.length} Royal Delicacies
              </span>
            </div>
          </div>
        </div>

        {/* Product Cards Grid: Exactly 4 per row on Desktop */}
        {filteredProducts.length > 0 ? (
          <div className="shop-products-grid">
            {filteredProducts.map((product) => {
              const isWishlisted = wishlistItems.some((w) => w.id === product.id);
              const isOutOfStock = product.stock_status === 'outofstock';
              const hasDiscount =
                product.regular_price && product.price && product.regular_price > product.price;
              const discountPercent = hasDiscount
                ? Math.round(((product.regular_price - product.price) / product.regular_price) * 100)
                : 0;

              return (
                <div
                  key={product.id}
                  className={`shop-product-card ${isOutOfStock ? 'card-out-of-stock' : ''}`}
                  onClick={() => onSelectProduct && onSelectProduct(product)}
                >
                  {/* Card Corner Accents */}
                  <span className="card-corner c-tl" aria-hidden="true" />
                  <span className="card-corner c-tr" aria-hidden="true" />

                  {/* Wishlist Button */}
                  <button
                    className={`card-wishlist-btn ${isWishlisted ? 'active' : ''}`}
                    title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist && onToggleWishlist(product);
                    }}
                    aria-label="Wishlist"
                  >
                    <svg viewBox="0 0 24 24" fill={isWishlisted ? '#D32F2F' : 'none'}>
                      <path
                        d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
                        stroke={isWishlisted ? '#D32F2F' : '#9E6D18'}
                        strokeWidth="1.8"
                      />
                    </svg>
                  </button>

                  {/* Product Image Frame */}
                  <div className="product-image-container">
                    <img
                      src={product.image || '/assets/products/til_gajak_hd.jpg'}
                      alt={product.name}
                      className="product-card-img"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/assets/products/til_gajak_hd.jpg';
                      }}
                    />

                    {/* Badge Top Left */}
                    {hasDiscount ? (
                      <span className="product-badge badge-sale">{discountPercent}% OFF</span>
                    ) : product.is_bestseller ? (
                      <span className="product-badge badge-royal">Royal Pick</span>
                    ) : null}

                    {/* Stock Status Pill */}
                    {isOutOfStock && (
                      <span className="product-badge badge-stock-out">Sold Out</span>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="product-card-body">
                    <span className="product-card-category">{product.category}</span>
                    <h3 className="product-card-name" title={product.name}>
                      {product.name}
                    </h3>

                    {/* Rating & Reviews */}
                    <div className="product-rating-row">
                      <span className="stars-gold">★★★★★</span>
                      <span className="rating-value">{product.rating || '4.8'}</span>
                      <span className="reviews-count">
                        ({product.reviews_count || product.reviews || '500+'})
                      </span>
                    </div>

                    {/* Price & Weight Row */}
                    <div className="product-price-row">
                      <div className="price-tag-group">
                        <span className="price-currency">₹</span>
                        <span className="price-amount">{product.price}</span>
                        {hasDiscount && (
                          <span className="price-original">₹{product.regular_price}</span>
                        )}
                      </div>
                      <span className="product-weight-pill">
                        {product.weight || '500g'}
                      </span>
                    </div>

                    {/* Action Buttons: Add to Cart & View Product */}
                    <div className="product-card-actions">
                      <button
                        className="btn-add-to-cart"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart && onAddToCart(product);
                        }}
                        title={isOutOfStock ? 'Currently Sold Out' : 'Add to Royal Basket'}
                      >
                        <svg className="cart-btn-icon" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M3 4H5.2L7.2 14.5C7.35 15.3 8.05 15.9 8.85 15.9H18.2C18.95 15.9 19.65 15.35 19.8 14.6L21.3 7.5H6"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <circle cx="9" cy="19.5" r="1.8" fill="currentColor" />
                          <circle cx="17.5" cy="19.5" r="1.8" fill="currentColor" />
                        </svg>
                        <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                      </button>

                      <button
                        className="btn-view-details"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectProduct && onSelectProduct(product);
                        }}
                        title="View Full Delicacy Details"
                        aria-label={`View details for ${product.name}`}
                      >
                        <svg viewBox="0 0 20 20" fill="none">
                          <path
                            d="M7 4L13 10L7 16"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="shop-empty-state">
            <div className="empty-icon-crest">✦</div>
            <h3 className="empty-title">No Royal Delicacies Found</h3>
            <p className="empty-desc">
              We couldn't find any sweets matching your criteria. Try adjusting your search or category filter.
            </p>
            <button className="empty-reset-btn" onClick={handleResetFilters}>
              Explore All Delicacies
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

