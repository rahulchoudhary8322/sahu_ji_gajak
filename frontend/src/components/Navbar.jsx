import React, { useState, useEffect } from 'react';
import '../styles/Navbar.css';

/**
 * Royal Indian Palace Navbar for SHREE SHAHI GAJAK
 * Visually matched to the reference screenshot:
 * - Shree Shahi Gajak logo with crown & flourishes
 * - Home, Shop All (with dropdown), About, Gallery, Contact
 * - Dynamic Cart & Wishlist medallion buttons with live count badges
 * - Responsive mobile drawer
 */
export default function Navbar({
  activeItem = 'Home',
  cartCount = 0,
  wishlistCount = 0,
  onOpenCart,
  onOpenWishlist,
  onNavigateHome,
  onNavigateShop,
  onNavigateCart,
  onNavigateWishlist,
  onSelectCategory
}) {
  const [active, setActive] = useState(activeItem);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setActive(activeItem);
  }, [activeItem]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'Home', label: 'Home', icon: 'home', href: '#home', hasDropdown: false },
    { id: 'Shop All', label: 'Shop All', icon: 'bag', href: '#shop', hasDropdown: true },
    { id: 'About', label: 'About', icon: 'info', href: '#about', hasDropdown: false },
    { id: 'Gallery', label: 'Gallery', icon: 'gallery', href: '#gallery', hasDropdown: false },
  ];

  const shopCategories = [
    'Til Gajak',
    'Gur Gajak',
    'Rewari',
    'Dry Fruit Gajak',
    'Special Til Gajak',
    'Dry Fruit Rewari',
    'Peanut Gajak',
    'Premium Gajak'
  ];

  const renderIcon = (type) => {
    switch (type) {
      case 'home':
        return (
          <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
              stroke="url(#navGoldGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M9 21V14H15V21" stroke="url(#navGoldGrad)" strokeWidth="2" />
          </svg>
        );
      case 'bag':
        return (
          <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M7 8V6C7 3.79086 8.79086 2 11 2H13C15.2091 2 17 3.79086 17 6V8"
              stroke="url(#navGoldGrad)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <rect
              x="3.5"
              y="8"
              width="17"
              height="13.5"
              rx="3"
              stroke="url(#navGoldGrad)"
              strokeWidth="2"
            />
            <circle cx="8.5" cy="12" r="1.5" fill="url(#navGoldGrad)" />
            <circle cx="15.5" cy="12" r="1.5" fill="url(#navGoldGrad)" />
          </svg>
        );
      case 'info':
        return (
          <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9.5" stroke="url(#navGoldGrad)" strokeWidth="2" />
            <circle cx="12" cy="7.5" r="1.4" fill="url(#navGoldGrad)" />
            <path d="M12 11V16.5" stroke="url(#navGoldGrad)" strokeWidth="2" strokeLinecap="round" />
            <path d="M10 16.5H14" stroke="url(#navGoldGrad)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'gallery':
        return (
          <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
            <rect
              x="2.5"
              y="3.5"
              width="19"
              height="17"
              rx="3"
              stroke="url(#navGoldGrad)"
              strokeWidth="2"
            />
            <circle cx="8" cy="8.5" r="2" fill="url(#navGoldGrad)" />
            <path
              d="M21 15.5L15.5 10L5.5 20"
              stroke="url(#navGoldGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'cart':
        return (
          <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M2 3.5H4.8L6.8 14.5C6.95 15.3 7.65 15.9 8.45 15.9H18.2C18.95 15.9 19.65 15.35 19.8 14.6L21.5 7H5.5"
              stroke="url(#navGoldGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="19.5" r="2" fill="url(#navGoldGrad)" />
            <circle cx="17.5" cy="19.5" r="2" fill="url(#navGoldGrad)" />
          </svg>
        );
      case 'heart':
        return (
          <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="url(#navGoldFill)">
            <path
              d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
              stroke="url(#navGoldGrad)"
              strokeWidth="1.8"
            />
          </svg>
        );
      case 'phone':
        return (
          <svg className="nav-svg-icon" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 3.5H9L11 8.5L8.5 10.5C9.8 13.1 11.9 15.2 14.5 16.5L16.5 14L21.5 16V20.5C21.5 21.6 20.6 22.5 19.5 22.5C10.5 22.5 2.5 14.5 2.5 5.5C2.5 4.4 3.4 3.5 4.5 3.5H5Z"
              stroke="url(#navGoldGrad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <header className={`royal-navbar-wrapper ${scrolled ? 'navbar-scrolled' : ''}`}>
      {/* Shared SVG Gradients */}
      <svg width="0" height="0" className="svg-defs-hidden">
        <defs>
          <linearGradient id="navGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF2B8" />
            <stop offset="25%" stopColor="#F5C65B" />
            <stop offset="65%" stopColor="#D4A33D" />
            <stop offset="100%" stopColor="#9E6D18" />
          </linearGradient>
          <linearGradient id="navGoldFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5C65B" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#D4A33D" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF4C4" />
            <stop offset="30%" stopColor="#F5C65B" />
            <stop offset="70%" stopColor="#D4A33D" />
            <stop offset="100%" stopColor="#8A5A14" />
          </linearGradient>
        </defs>
      </svg>

      <nav className="royal-navbar-frame" aria-label="Main Navigation">
        {/* Left Baroque Filigree Ear (Vector SVG) */}
        <div className="navbar-baroque-ear ear-left" aria-hidden="true">
          <svg viewBox="0 0 54 100" fill="none" className="ear-svg">
            <path
              d="M50 12 C34 12 18 20 12 34 C6 46 9 58 19 64 C28 70 38 68 42 60 C46 52 42 44 34 44 C28 44 24 48 26 54"
              stroke="url(#navGoldGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M50 88 C34 88 18 80 12 66 C7 54 13 42 23 36"
              stroke="url(#navGoldGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M12 50 C4 44 4 56 12 50 Z"
              fill="url(#navGoldGrad)"
            />
            <circle cx="12" cy="50" r="4.5" fill="url(#navGoldGrad)" stroke="#FFE89E" strokeWidth="1" />
            <circle cx="22" cy="24" r="3" fill="url(#navGoldGrad)" />
            <circle cx="22" cy="76" r="3" fill="url(#navGoldGrad)" />
            <path
              d="M50 26 C42 26 32 32 30 40 C36 38 44 34 50 34"
              stroke="url(#navGoldGrad)"
              strokeWidth="1.6"
            />
            <path
              d="M50 74 C42 74 32 68 30 60 C36 62 44 66 50 66"
              stroke="url(#navGoldGrad)"
              strokeWidth="1.6"
            />
          </svg>
        </div>

        {/* Right Baroque Filigree Ear (Vector SVG Mirrored) */}
        <div className="navbar-baroque-ear ear-right" aria-hidden="true">
          <svg viewBox="0 0 54 100" fill="none" className="ear-svg" style={{ transform: 'scaleX(-1)' }}>
            <path
              d="M50 12 C34 12 18 20 12 34 C6 46 9 58 19 64 C28 70 38 68 42 60 C46 52 42 44 34 44 C28 44 24 48 26 54"
              stroke="url(#navGoldGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M50 88 C34 88 18 80 12 66 C7 54 13 42 23 36"
              stroke="url(#navGoldGrad)"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M12 50 C4 44 4 56 12 50 Z"
              fill="url(#navGoldGrad)"
            />
            <circle cx="12" cy="50" r="4.5" fill="url(#navGoldGrad)" stroke="#FFE89E" strokeWidth="1" />
            <circle cx="22" cy="24" r="3" fill="url(#navGoldGrad)" />
            <circle cx="22" cy="76" r="3" fill="url(#navGoldGrad)" />
            <path
              d="M50 26 C42 26 32 32 30 40 C36 38 44 34 50 34"
              stroke="url(#navGoldGrad)"
              strokeWidth="1.6"
            />
            <path
              d="M50 74 C42 74 32 68 30 60 C36 62 44 66 50 66"
              stroke="url(#navGoldGrad)"
              strokeWidth="1.6"
            />
          </svg>
        </div>

        {/* Center Bottom Acanthus Crest (Vector SVG) */}
        <div className="navbar-center-crest" aria-hidden="true">
          <svg viewBox="0 0 160 36" fill="none" className="crest-svg">
            {/* Center Spear / Fleur-de-lis */}
            <path
              d="M80 34 L74 18 C70 12 73 4 80 0 C87 4 90 12 86 18 Z"
              fill="url(#navGoldGrad)"
              stroke="#FFF0D0"
              strokeWidth="1"
            />
            <circle cx="80" cy="14" r="2.5" fill="#B71C1C" />
            {/* Left Scroll Wing */}
            <path
              d="M80 16 C68 18 56 14 46 8 C40 4 36 0 28 0 C18 0 12 8 16 16 C20 22 28 22 34 18 C38 14 36 10 30 10"
              stroke="url(#navGoldGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M65 16 C55 22 45 22 38 18"
              stroke="url(#navGoldGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="20" cy="10" r="3" fill="url(#navGoldGrad)" />
            {/* Right Scroll Wing */}
            <path
              d="M80 16 C92 18 104 14 114 8 C120 4 124 0 132 0 C142 0 148 8 144 16 C140 22 132 22 126 18 C122 14 124 10 130 10"
              stroke="url(#navGoldGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              d="M95 16 C105 22 115 22 122 18"
              stroke="url(#navGoldGrad)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <circle cx="140" cy="10" r="3" fill="url(#navGoldGrad)" />
          </svg>
        </div>

        {/* SECTION A: ROYAL LOGO BADGE (Direct match to reference image) */}
        <div className="navbar-logo-container" title="Sahu Ji Gajak">
          <a
            href="#home"
            className="royal-logo-link"
            onClick={(e) => {
              e.preventDefault();
              setActive('Home');
              if (onNavigateHome) onNavigateHome();
            }}
          >
            <div className="royal-logo-badge">
              <img
                src="/assets/royal-logo-badge.png"
                alt="Sahu Ji Gajak"
                className="royal-emblem-img"
              />
            </div>
          </a>
        </div>

        {/* Vertical Golden Divider after Logo */}
        <div className="nav-vertical-divider" aria-hidden="true" />

        {/* SECTION B: DESKTOP NAVIGATION MENU */}
        <div className="navbar-center-menu">
          <ul className="nav-links-list">
            {navLinks.map((item, index) => {
              const isSelected = active === item.id;
              return (
                <React.Fragment key={item.id}>
                  {index > 0 && <li className="nav-divider-li" aria-hidden="true"><span className="nav-vertical-divider" /></li>}
                  <li
                    className={`nav-item ${isSelected ? 'active' : ''} ${item.hasDropdown ? 'has-dropdown' : ''}`}
                    onMouseEnter={() => item.hasDropdown && setShopDropdownOpen(true)}
                    onMouseLeave={() => item.hasDropdown && setShopDropdownOpen(false)}
                  >
                    <a
                      href={item.href}
                      className="nav-link-btn"
                      onClick={(e) => {
                        if (item.id === 'Shop All') {
                          e.preventDefault();
                          setActive('Shop All');
                          if (onNavigateShop) onNavigateShop();
                        } else if (item.id === 'Home') {
                          e.preventDefault();
                          setActive('Home');
                          if (onNavigateHome) onNavigateHome();
                        } else {
                          setActive(item.id);
                        }
                      }}
                    >
                      <div className="nav-icon-wrapper">{renderIcon(item.icon)}</div>
                      <div className="nav-label-wrapper">
                        <span className="nav-label-text">{item.label}</span>
                        {item.hasDropdown && (
                          <svg className="chevron-down-icon" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M4 6L8 10L12 6"
                              stroke="url(#navGoldGrad)"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      {isSelected && <span className="active-gold-indicator" />}
                    </a>

                    {/* Dropdown Menu for Shop All */}
                    {item.hasDropdown && shopDropdownOpen && (
                      <div className="royal-dropdown-menu">
                        <div className="dropdown-inner">
                          <div className="dropdown-header">Royal Sweet Selections</div>
                          <ul className="dropdown-list">
                            {shopCategories.map((cat, idx) => (
                              <li key={idx} className="dropdown-item">
                                <a
                                  href="#shop"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setActive('Shop All');
                                    setShopDropdownOpen(false);
                                    const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                    if (onSelectCategory) onSelectCategory(slug);
                                    if (onNavigateShop) onNavigateShop();
                                  }}
                                >
                                  <span className="dropdown-bullet">✦</span>
                                  {cat}
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </li>
                </React.Fragment>
              );
            })}
          </ul>
        </div>

        {/* Vertical Golden Divider before Actions */}
        <div className="nav-vertical-divider" aria-hidden="true" />

        {/* SECTION C & D: RIGHT ACTION BUTTONS */}
        <div className="navbar-right-actions">
          {/* Cart Circular Medallion */}
          <button
            className="action-medallion-btn"
            title="Shopping Cart"
            aria-label="Shopping Cart"
            onClick={() => {
              setActive('Cart');
              if (onNavigateCart) onNavigateCart();
              else if (onOpenCart) onOpenCart();
            }}
          >
            <div className="medallion-circle">
              {renderIcon('cart')}
              <span className="notification-badge" aria-label={`${cartCount} items in cart`}>
                {cartCount}
              </span>
            </div>
          </button>

          {/* Wishlist Circular Medallion */}
          <button
            className="action-medallion-btn"
            title="Royal Wishlist"
            aria-label="Royal Wishlist"
            onClick={() => {
              setActive('Wishlist');
              if (onNavigateWishlist) onNavigateWishlist();
              else if (onOpenWishlist) onOpenWishlist();
            }}
          >
            <div className="medallion-circle">
              {renderIcon('heart')}
              <span className="notification-badge" aria-label={`${wishlistCount} items in wishlist`}>
                {wishlistCount}
              </span>
            </div>
          </button>

          {/* Vertical Golden Divider Line before Contact */}
          <div className="nav-vertical-divider" aria-hidden="true" />

          {/* Contact Nav Item */}
          <div className={`nav-item contact-nav-item ${active === 'Contact' ? 'active' : ''}`}>
            <a
              href="#contact"
              className="nav-link-btn"
              onClick={() => setActive('Contact')}
            >
              <div className="nav-icon-wrapper">{renderIcon('phone')}</div>
              <span className="nav-label-text">Contact</span>
              {active === 'Contact' && <span className="active-gold-indicator" />}
            </a>
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Royal Menu'}
            aria-expanded={mobileMenuOpen}
          >
            <svg viewBox="0 0 24 24" className="hamburger-svg" fill="none" stroke="#F5C65B">
              <defs>
                <linearGradient id="burgerGoldGrad" x1="0" y1="0" x2="24" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#FFF2B8" />
                  <stop offset="50%" stopColor="#F5C65B" />
                  <stop offset="100%" stopColor="#D4A33D" />
                </linearGradient>
              </defs>
              {mobileMenuOpen ? (
                <path
                  d="M6 18L18 6M6 6L18 18"
                  stroke="url(#burgerGoldGrad)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <>
                  <path d="M4 6H20" stroke="url(#burgerGoldGrad)" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M4 12H20" stroke="url(#burgerGoldGrad)" strokeWidth="2.6" strokeLinecap="round" />
                  <path d="M4 18H20" stroke="url(#burgerGoldGrad)" strokeWidth="2.6" strokeLinecap="round" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <span className="drawer-title">SAHU JI GAJAK</span>
              <button
                className="drawer-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close Menu"
              >
                ✕
              </button>
            </div>

            <ul className="drawer-nav-list">
              {navLinks.map((item) => (
                <li key={item.id} className="drawer-nav-item">
                  <a
                    href={item.href}
                    className={`drawer-link ${active === item.id ? 'active' : ''}`}
                    onClick={(e) => {
                      if (item.id === 'Shop All') {
                        e.preventDefault();
                        setActive('Shop All');
                        setMobileMenuOpen(false);
                        if (onNavigateShop) onNavigateShop();
                      } else if (item.id === 'Home') {
                        e.preventDefault();
                        setActive('Home');
                        setMobileMenuOpen(false);
                        if (onNavigateHome) onNavigateHome();
                      } else {
                        setActive(item.id);
                        setMobileMenuOpen(false);
                      }
                    }}
                  >
                    <span className="drawer-icon">{renderIcon(item.icon)}</span>
                    <span className="drawer-text">{item.label}</span>
                  </a>
                </li>
              ))}
              <li className="drawer-nav-item">
                <button
                  className="drawer-link"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateCart) onNavigateCart();
                    else if (onOpenCart) onOpenCart();
                  }}
                >
                  <span className="drawer-icon">{renderIcon('cart')}</span>
                  <span className="drawer-text">Cart ({cartCount})</span>
                </button>
              </li>
              <li className="drawer-nav-item">
                <button
                  className="drawer-link"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    if (onNavigateWishlist) onNavigateWishlist();
                    else if (onOpenWishlist) onOpenWishlist();
                  }}
                >
                  <span className="drawer-icon">{renderIcon('heart')}</span>
                  <span className="drawer-text">Wishlist ({wishlistCount})</span>
                </button>
              </li>
              <li className="drawer-nav-item">
                <a
                  href="#contact"
                  className={`drawer-link ${active === 'Contact' ? 'active' : ''}`}
                  onClick={() => {
                    setActive('Contact');
                    setMobileMenuOpen(false);
                  }}
                >
                  <span className="drawer-icon">{renderIcon('phone')}</span>
                  <span className="drawer-text">Contact</span>
                </a>
              </li>
            </ul>

            <div className="drawer-footer">
              <div className="royal-seal">✦ THE HERITAGE OF ROYAL SWEETS ✦</div>
              <p className="drawer-phone">Royal Helpline: +91 98765 43210</p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
