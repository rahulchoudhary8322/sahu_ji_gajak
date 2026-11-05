import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from './components/Navbar';
import ScrollAnimation from './components/ScrollAnimation';
import RoyalCollection from './components/RoyalCollection';
import VideoSection from './components/VideoSection';
import HeritageSection from './components/HeritageSection';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import ProductModal from './components/ProductModal';
import VideoModal from './components/VideoModal';
import PolicyModal from './components/PolicyModal';
import ShopAllPage from './components/ShopAllPage';
import ProductDetailPage from './components/ProductDetailPage';
import CartPage from './components/CartPage';
import WishlistPage from './components/WishlistPage';
import CheckoutPage from './components/CheckoutPage';
import OrderConfirmationPage from './components/OrderConfirmationPage';
import './styles/Navbar.css';
import './styles/RoyalCollection.css';
import './styles/VideoSection.css';
import './styles/HeritageSection.css';
import './styles/Footer.css';
import './styles/ShopAllPage.css';
import './styles/ProductDetailPage.css';
import './styles/CartPage.css';
import './styles/WishlistPage.css';
import './styles/CheckoutPage.css';
import './styles/OrderConfirmationPage.css';

// Verified 8 Default Featured Products (Fallback when DB is syncing)
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Til Gajak',
    category: 'Til Gajak',
    price: 349,
    original_price: 399,
    regular_price: 399,
    sale_price: 349,
    weight: '500g',
    rating: 4.8,
    reviews: '1.2k+',
    reviews_count: 1240,
    image: '/assets/products/til_gajak_hd.jpg',
    gallery: ['/assets/products/til_gajak_hd.jpg', '/assets/products/special_til_gajak_hd.jpg'],
    short_description: 'Crisp, feather-light traditional sesame gajak crafted with roasted organic white sesame, pure desi ghee, and natural jaggery.',
    description: 'Shree Shahi Gajak brings you the legendary winter delicacy of Rajasthan. Every batch is handcrafted using roasted organic sesame seeds (til), purified sugarcane jaggery (gur), and aromatic bilona cow ghee.',
    ingredients: ['Sesame Seeds (Til)', 'Pure Desi Ghee', 'Organic Jaggery (Gur)', 'Cardamom'],
    is_bestseller: true,
    in_stock: true,
    stock_status: 'instock',
    variations: [
      { id: 101, weight: '250g', price: 199, regular_price: 220, stock_status: 'instock' },
      { id: 102, weight: '500g', price: 349, regular_price: 399, stock_status: 'instock' },
      { id: 103, weight: '1kg', price: 649, regular_price: 749, stock_status: 'instock' }
    ]
  },
  {
    id: 2,
    name: 'Gur Gajak',
    category: 'Gur Gajak',
    price: 329,
    original_price: 379,
    regular_price: 379,
    sale_price: 329,
    weight: '500g',
    rating: 4.8,
    reviews: '1k+',
    reviews_count: 1020,
    image: '/assets/products/gur_gajak_hd.jpg',
    gallery: ['/assets/products/gur_gajak_hd.jpg', '/assets/products/til_gajak_hd.jpg'],
    short_description: 'Melt-in-mouth golden jaggery gajak squares slowly beaten to perfection using royal Jaipur recipes.',
    description: 'Our Gur Gajak is an authentic winter warmer. Made with organic Kolhapuri sugarcane jaggery and hand-sorted sesame seeds, beaten with wooden mallets.',
    ingredients: ['Natural Sugarcane Jaggery', 'Roasted Sesame', 'A2 Desi Ghee', 'Spices'],
    is_bestseller: true,
    in_stock: true,
    stock_status: 'instock',
    variations: [
      { id: 201, weight: '250g', price: 175, regular_price: 195, stock_status: 'instock' },
      { id: 202, weight: '500g', price: 329, regular_price: 379, stock_status: 'instock' },
      { id: 203, weight: '1kg', price: 599, regular_price: 699, stock_status: 'instock' }
    ]
  },
  {
    id: 3,
    name: 'Rewari',
    category: 'Rewari',
    price: 299,
    original_price: 349,
    regular_price: 349,
    sale_price: 299,
    weight: '500g',
    rating: 4.7,
    reviews: '900+',
    reviews_count: 900,
    image: '/assets/products/rewari_hd.jpg',
    gallery: ['/assets/products/rewari_hd.jpg', '/assets/products/dry_fruit_rewari_hd.jpg'],
    short_description: 'Crispy golden bite-sized sesame drops gently sweetened with cardamom and jaggery syrup.',
    description: 'Crispy, crunchy, and irresistibly aromatic. These disc-shaped sesame drops are simmered in golden jaggery candy syrup and gently scented with kewra.',
    ingredients: ['Hand-Selected White Sesame', 'Gur Syrup', 'Cardamom Powder', 'Kewra Essence'],
    is_bestseller: false,
    in_stock: true,
    stock_status: 'instock',
    variations: [
      { id: 301, weight: '250g', price: 160, regular_price: 180, stock_status: 'instock' },
      { id: 302, weight: '500g', price: 299, regular_price: 349, stock_status: 'instock' },
      { id: 303, weight: '1kg', price: 560, regular_price: 640, stock_status: 'instock' }
    ]
  },
  {
    id: 4,
    name: 'Dry Fruit Gajak',
    category: 'Dry Fruit Gajak',
    price: 499,
    original_price: 599,
    regular_price: 599,
    sale_price: 499,
    weight: '500g',
    rating: 4.9,
    reviews: '1.5k+',
    reviews_count: 1500,
    image: '/assets/products/dry_fruit_gajak_hd.jpg',
    gallery: ['/assets/products/dry_fruit_gajak_hd.jpg', '/assets/products/premium_gajak_hd.jpg'],
    short_description: 'Luxurious royal darbar gajak richly studded with toasted cashews, crunchy almonds, and green pistachios.',
    description: 'Crafted for the royal courts. We fold hand-roasted Californian almonds, premium Goan cashews, and rich green Afghani pistachios into crunchy honeyed sesame sheets.',
    ingredients: ['Kaju (Cashews)', 'Badam (Almonds)', 'Pista (Pistachios)', 'Sesame', 'Desi Ghee'],
    is_bestseller: true,
    in_stock: true,
    stock_status: 'instock',
    variations: [
      { id: 401, weight: '400g', price: 410, regular_price: 480, stock_status: 'instock' },
      { id: 402, weight: '500g', price: 499, regular_price: 599, stock_status: 'instock' },
      { id: 403, weight: '1kg', price: 920, regular_price: 1099, stock_status: 'instock' }
    ]
  },
  {
    id: 5,
    name: 'Special Til Gajak',
    category: 'Til Gajak',
    price: 379,
    original_price: 429,
    regular_price: 429,
    sale_price: 379,
    weight: '500g',
    rating: 4.8,
    reviews: '850+',
    reviews_count: 850,
    image: '/assets/products/special_til_gajak_hd.jpg',
    gallery: ['/assets/products/special_til_gajak_hd.jpg', '/assets/products/til_gajak_hd.jpg'],
    short_description: 'Extra-thin wafer-style gajak with caramelized jaggery and crushed green cardamom seeds.',
    description: 'An artisanal delicacy rolled to wafer-thin perfection. It snaps crisp and dissolves immediately with the sweet aroma of jaggery.',
    ingredients: ['Premium Roasted Til', 'Golden Gur', 'Desi Ghee', 'Green Cardamom'],
    is_bestseller: false,
    in_stock: true,
    stock_status: 'instock'
  },
  {
    id: 6,
    name: 'Dry Fruit Rewari',
    category: 'Rewari',
    price: 449,
    original_price: 499,
    regular_price: 499,
    sale_price: 449,
    weight: '500g',
    rating: 4.9,
    reviews: '1.1k+',
    reviews_count: 1100,
    image: '/assets/products/dry_fruit_rewari_hd.jpg',
    gallery: ['/assets/products/dry_fruit_rewari_hd.jpg', '/assets/products/rewari_hd.jpg'],
    short_description: 'Imperial sesame rewari discs generously garnished with silver-cut almonds and pistachios.',
    description: 'Imperial bite-sized delights sprinkled with silvered almond slivers and pistachios. Made with cold-pressed jaggery syrup and pure desi ghee.',
    ingredients: ['Sesame', 'Gur Extract', 'Cashew Crumbles', 'Almond Slivers', 'Pure Ghee'],
    is_bestseller: false,
    in_stock: true,
    stock_status: 'instock'
  },
  {
    id: 7,
    name: 'Peanut Gajak',
    category: 'Peanut Gajak',
    price: 289,
    original_price: 329,
    regular_price: 329,
    sale_price: 289,
    weight: '500g',
    rating: 4.7,
    reviews: '780+',
    reviews_count: 780,
    image: '/assets/products/peanut_gajak_hd.jpg',
    gallery: ['/assets/products/peanut_gajak_hd.jpg', '/assets/products/til_gajak_hd.jpg'],
    short_description: 'Crunchy brittle bars made with golden-roasted Kathiawadi peanuts and caramelized jaggery.',
    description: 'Premium Kathiawadi peanuts roasted over slow embers until golden and fragrant, then folded into caramelized jaggery candy.',
    ingredients: ['Bold Roasted Peanuts', 'Dark Sugarcane Jaggery', 'Pure Ghee'],
    is_bestseller: false,
    in_stock: true,
    stock_status: 'instock'
  },
  {
    id: 8,
    name: 'Premium Gajak',
    category: 'Premium Gajak',
    price: 549,
    original_price: 649,
    regular_price: 649,
    sale_price: 549,
    weight: '500g',
    rating: 5.0,
    reviews: '2k+',
    reviews_count: 2000,
    image: '/assets/products/premium_gajak_hd.jpg',
    gallery: ['/assets/products/premium_gajak_hd.jpg', '/assets/products/dry_fruit_gajak_hd.jpg'],
    short_description: 'Our signature master creation infused with Kashmiri saffron strands, royal dry fruits, and pure A2 cow ghee.',
    description: 'The jewel in our crown. Handcrafted in limited batches with original Kashmiri Mongra saffron, green cardamom, roasted dry fruits, and pure A2 Gir cow ghee.',
    ingredients: ['Kashmiri Kesar (Saffron)', 'Assorted Dry Fruits', 'Roasted Til', 'A2 Desi Ghee'],
    is_bestseller: true,
    in_stock: true,
    stock_status: 'instock'
  }
];

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const viewMode = urlParams.get('view');

  // Navigation Route: 'home', 'shop', 'product', 'cart', 'wishlist', 'checkout', or 'order-confirmation'
  const [currentRoute, setCurrentRoute] = useState(() => {
    if (window.location.hash.startsWith('#product-') || urlParams.get('product')) return 'product';
    if (window.location.hash.startsWith('#order-confirmation') || window.location.hash.startsWith('#order-success') || urlParams.get('page') === 'order-confirmation') return 'order-confirmation';
    if (window.location.hash === '#checkout' || urlParams.get('page') === 'checkout') return 'checkout';
    if (window.location.hash === '#shop-all' || urlParams.get('page') === 'shop') return 'shop';
    if (window.location.hash === '#cart' || urlParams.get('page') === 'cart') return 'cart';
    if (window.location.hash === '#wishlist' || urlParams.get('page') === 'wishlist') return 'wishlist';
    return 'home';
  });

  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [orderAccessParams, setOrderAccessParams] = useState(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#order-confirmation') || hash.startsWith('#order-success')) {
      const query = hash.split('?')[1] || '';
      const p = new URLSearchParams(query);
      return { id: p.get('id') ? Number(p.get('id')) : null, key: p.get('key') || '' };
    }
    return { id: null, key: '' };
  });

  const [activeProductId, setActiveProductId] = useState(() => {
    if (urlParams.get('product')) return Number(urlParams.get('product'));
    if (window.location.hash.startsWith('#product-')) {
      const match = window.location.hash.match(/#product-(\d+)/);
      return match ? Number(match[1]) : null;
    }
    return null;
  });

  const [shopCategory, setShopCategory] = useState(urlParams.get('cat') || 'all');
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState([]);

  // Cart & Wishlist state
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('shahi_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const saved = localStorage.getItem('shahi_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activePolicy, setActivePolicy] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Sync Document Title based on active page/product
  useEffect(() => {
    if (currentRoute === 'home') {
      document.title = 'Shree Shahi Gajak | Royal Heritage of Traditional Sweets';
    } else if (currentRoute === 'shop') {
      document.title = 'Explore Our Royal Collection | Shree Shahi Gajak';
    } else if (currentRoute === 'cart') {
      document.title = 'Your Royal Basket | Shree Shahi Gajak';
    } else if (currentRoute === 'wishlist') {
      document.title = 'Your Royal Wishlist | Shree Shahi Gajak';
    } else if (currentRoute === 'checkout') {
      document.title = 'Royal Checkout & Order Placement | Shree Shahi Gajak';
    } else if (currentRoute === 'order-confirmation') {
      document.title = 'Royal Decree of Confirmation | Shree Shahi Gajak';
    } else if (currentRoute === 'product' && selectedProduct) {
      document.title = `${selectedProduct.name} | Shree Shahi Gajak`;
    }
  }, [currentRoute, selectedProduct]);

  // Section navigation helper (for Gallery, About, Contact on home page)
  const handleNavigateSection = useCallback((sectionId) => {
    setActiveProductId(null);
    const scrollTarget = () => {
      const el = document.getElementById(sectionId) || document.querySelector(`#${sectionId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    if (currentRoute !== 'home') {
      setCurrentRoute('home');
      window.location.hash = `#${sectionId}`;
      setTimeout(scrollTarget, 120);
    } else {
      window.location.hash = `#${sectionId}`;
      scrollTarget();
    }
  }, [currentRoute]);

  // Sync Route with URL hash & query params
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash;
      const params = new URLSearchParams(window.location.search);

      if (hash.startsWith('#order-confirmation') || hash.startsWith('#order-success')) {
        const query = hash.split('?')[1] || '';
        const p = new URLSearchParams(query);
        const orderId = p.get('id') ? Number(p.get('id')) : null;
        const orderKey = p.get('key') || '';
        setOrderAccessParams({ id: orderId, key: orderKey });
        setCurrentRoute('order-confirmation');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash === '#checkout' || params.get('page') === 'checkout') {
        setCurrentRoute('checkout');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash.startsWith('#product-')) {
        const match = hash.match(/#product-(\d+)/);
        if (match) {
          setActiveProductId(Number(match[1]));
          setCurrentRoute('product');
          window.scrollTo({ top: 0, behavior: 'instant' });
        }
      } else if (hash === '#shop-all' || params.get('page') === 'shop') {
        setCurrentRoute('shop');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash === '#cart' || params.get('page') === 'cart') {
        setCurrentRoute('cart');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash === '#wishlist' || params.get('page') === 'wishlist') {
        setCurrentRoute('wishlist');
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (hash === '#about' || hash === '#gallery' || hash === '#contact') {
        const sectionId = hash.substring(1);
        handleNavigateSection(sectionId);
      } else if (hash === '#home' || hash === '' || hash === '#shop') {
        if (hash === '#shop') {
          // If hash is #shop and on homepage, smooth scroll to #shop section
          const target = document.querySelector('#shop');
          if (target && currentRoute === 'home') {
            target.scrollIntoView({ behavior: 'smooth' });
          } else {
            setCurrentRoute('shop');
            window.scrollTo({ top: 0, behavior: 'instant' });
          }
        } else {
          setCurrentRoute('home');
        }
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    return () => window.removeEventListener('hashchange', handleLocationChange);
  }, [currentRoute, handleNavigateSection]);

  // Fetch products & categories dynamically from backend API
  useEffect(() => {
    fetch('http://localhost:8000/api/products')
      .then((res) => {
        if (!res.ok) throw new Error('Network response not ok');
        return res.json();
      })
      .then((data) => {
        if (data.status === 'success' && Array.isArray(data.data) && data.data.length > 0) {
          setProducts(data.data);
          if (Array.isArray(data.categories)) {
            setCategories(data.categories);
          }
        }
      })
      .catch((err) => {
        console.warn('Backend API products fetch notice:', err.message);
      });
  }, []);

  // Show royal notification toast
  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3200);
  }, []);

  // Sync cart with localStorage & Backend API
  useEffect(() => {
    try {
      localStorage.setItem('shahi_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.warn('Could not save cart to localStorage', e);
    }
  }, [cartItems]);

  // Sync wishlist with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('shahi_wishlist', JSON.stringify(wishlistItems));
    } catch (e) {
      console.warn('Could not save wishlist to localStorage', e);
    }
  }, [wishlistItems]);

  // Add product to Cart
  const handleAddToCart = useCallback((product, qty = 1) => {
    const itemWeight = product.weight || '500g';
    const itemKey = `${product.id}-${itemWeight}`;

    setCartItems((prevItems) => {
      const existingIndex = prevItems.findIndex(
        (item) => item.id === product.id && item.weight === itemWeight
      );

      if (existingIndex >= 0) {
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty
        };
        return updated;
      } else {
        return [
          ...prevItems,
          {
            ...product,
            cart_key: itemKey,
            quantity: qty,
            weight: itemWeight
          }
        ];
      }
    });

    // Notify backend API
    fetch('http://localhost:8000/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add', product: { ...product, weight: itemWeight }, quantity: qty })
    }).catch(() => {});

    showToast(`👑 Added "${product.name}" (${itemWeight}) to your Royal Basket!`);
  }, [showToast]);

  // Update item quantity in Cart
  const handleUpdateQuantity = useCallback((productId, newQty, weight) => {
    setCartItems((prevItems) => {
      if (newQty <= 0) {
        return prevItems.filter(
          (i) => !(i.id === productId && (!weight || i.weight === weight))
        );
      }
      return prevItems.map((item) =>
        item.id === productId && (!weight || item.weight === weight)
          ? { ...item, quantity: newQty }
          : item
      );
    });

    fetch('http://localhost:8000/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update', id: productId, quantity: newQty, cart_key: `${productId}-${weight}` })
    }).catch(() => {});
  }, []);

  // Remove item from Cart
  const handleRemoveFromCart = useCallback((productId, weight) => {
    setCartItems((prevItems) =>
      prevItems.filter((i) => !(i.id === productId && (!weight || i.weight === weight)))
    );

    fetch('http://localhost:8000/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', id: productId, cart_key: `${productId}-${weight}` })
    }).catch(() => {});

    showToast('Item removed from royal basket');
  }, [showToast]);

  // Clear entire Cart
  const handleClearCart = useCallback(() => {
    setCartItems([]);
    fetch('http://localhost:8000/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' })
    }).catch(() => {});
    showToast('Your royal basket has been cleared');
  }, [showToast]);

  // Wishlist Toggle (Local State + Backend Session Sync)
  const handleToggleWishlist = useCallback((product) => {
    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        showToast(`Removed "${product.name}" from your Wishlist`);
        fetch('http://localhost:8000/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'remove', id: product.id })
        }).catch(() => {});
        return prev.filter((item) => item.id !== product.id);
      } else {
        showToast(`💖 Added "${product.name}" to your Wishlist!`);
        fetch('http://localhost:8000/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'add', product })
        }).catch(() => {});
        return [...prev, product];
      }
    });
  }, [showToast]);

  const handleRemoveFromWishlist = useCallback((productId) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== productId));
    fetch('http://localhost:8000/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove', id: productId })
    }).catch(() => {});
  }, []);

  const handleClearWishlist = useCallback(() => {
    setWishlistItems([]);
    fetch('http://localhost:8000/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' })
    }).catch(() => {});
    showToast('Your royal wishlist has been cleared');
  }, [showToast]);

  // Navigation handlers
  const handleNavigateHome = useCallback(() => {
    setCurrentRoute('home');
    setActiveProductId(null);
    window.location.hash = '#home';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateShop = useCallback((categorySlug = 'all') => {
    setCurrentRoute('shop');
    setShopCategory(categorySlug);
    setActiveProductId(null);
    window.location.hash = '#shop-all';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateCart = useCallback(() => {
    setCurrentRoute('cart');
    setActiveProductId(null);
    window.location.hash = '#cart';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateWishlist = useCallback(() => {
    setCurrentRoute('wishlist');
    setActiveProductId(null);
    window.location.hash = '#wishlist';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNavigateCheckout = useCallback(() => {
    setCurrentRoute('checkout');
    setActiveProductId(null);
    setIsCartOpen(false);
    window.location.hash = '#checkout';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOrderSuccess = useCallback((orderResponse) => {
    setConfirmedOrder(orderResponse);
    setOrderAccessParams({ id: orderResponse.order_id, key: orderResponse.order_key });
    setCartItems([]);
    try {
      localStorage.removeItem('shahi_cart');
    } catch (e) {}
    setCurrentRoute('order-confirmation');
    window.location.hash = `#order-confirmation?id=${orderResponse.order_id}&key=${orderResponse.order_key}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleOpenProduct = useCallback((product) => {
    setSelectedProduct(product);
    setActiveProductId(product.id);
    setCurrentRoute('product');
    window.location.hash = `#product-${product.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBuyNow = useCallback((product, qty = 1) => {
    handleAddToCart(product, qty);
    setIsCartOpen(true);
  }, [handleAddToCart]);

  // Active product calculation
  const activeProduct = useMemo(() => {
    if (activeProductId) {
      return products.find((p) => p.id === Number(activeProductId)) || selectedProduct || products[0];
    }
    return selectedProduct || products[0];
  }, [products, activeProductId, selectedProduct]);

  // Live counts for Navbar badges
  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalWishlistCount = wishlistItems.length;

  return (
    <div className="royal-app-wrapper">
      {/* 1. ROYAL NAVBAR */}
      {(!viewMode || viewMode === 'hero' || viewMode === 'nav') && (
        <Navbar
          activeItem={
            currentRoute === 'shop'
              ? 'Shop All'
              : currentRoute === 'product'
              ? 'Shop All'
              : currentRoute === 'cart'
              ? 'Cart'
              : currentRoute === 'wishlist'
              ? 'Wishlist'
              : 'Home'
          }
          cartCount={totalCartCount}
          wishlistCount={totalWishlistCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          onNavigateHome={handleNavigateHome}
          onNavigateShop={() => handleNavigateShop('all')}
          onNavigateCart={handleNavigateCart}
          onNavigateWishlist={handleNavigateWishlist}
          onNavigateSection={handleNavigateSection}
          onSelectCategory={(slug) => handleNavigateShop(slug)}
        />
      )}

      {/* MAIN WEBSITE CONTENT */}
      <main>
        {/* ====================================================
            ROUTE 1: ROYAL HOMEPAGE
            (Preserves all 5 existing working sections 100%)
           ==================================================== */}
        {currentRoute === 'home' && (
          <>
            {/* 2. HERO DARBAR ANIMATION */}
            {(!viewMode || viewMode === 'hero') && (
              <ScrollAnimation />
            )}

            {/* 3. OUR ROYAL COLLECTION: 8 PRODUCTS (4 + 4 DESKTOP) */}
            {(!viewMode || viewMode === 'shop' || viewMode === 'all') && (
              <RoyalCollection
                products={products.slice(0, 8)}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                wishlistItems={wishlistItems}
                onSelectProduct={handleOpenProduct}
              />
            )}

            {/* 4. THE ART OF MAKING GAJAK: VIDEO SECTION */}
            {(!viewMode || viewMode === 'gallery' || viewMode === 'all') && (
              <VideoSection onSelectVideo={(v) => setSelectedVideo(v)} />
            )}

            {/* 5. A LEGACY OF TRADITION: HERITAGE SECTION */}
            {(!viewMode || viewMode === 'heritage' || viewMode === 'all') && (
              <HeritageSection onOpenAbout={() => setActivePolicy('about')} />
            )}
          </>
        )}

        {/* ====================================================
            ROUTE 2: SHOP ALL PAGE
           ==================================================== */}
        {currentRoute === 'shop' && (
          <ShopAllPage
            products={products}
            categories={categories}
            selectedCategory={shopCategory}
            onSelectCategory={(slug) => setShopCategory(slug)}
            onSelectProduct={handleOpenProduct}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistItems={wishlistItems}
          />
        )}

        {/* ====================================================
            ROUTE 3: PRODUCT DETAIL PAGE
           ==================================================== */}
        {currentRoute === 'product' && activeProduct && (
          <ProductDetailPage
            product={activeProduct}
            allProducts={products}
            onBack={() => handleNavigateShop(shopCategory)}
            onNavigateHome={handleNavigateHome}
            onNavigateShop={() => handleNavigateShop('all')}
            onSelectProduct={handleOpenProduct}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistItems={wishlistItems}
            onBuyNow={handleBuyNow}
          />
        )}

        {/* ====================================================
            ROUTE 4: COMPLETE ROYAL CART PAGE
           ==================================================== */}
        {currentRoute === 'cart' && (
          <CartPage
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            onNavigateShop={() => handleNavigateShop('all')}
            onNavigateHome={handleNavigateHome}
            onSelectProduct={handleOpenProduct}
            onCheckout={handleNavigateCheckout}
          />
        )}

        {/* ====================================================
            ROUTE 5: COMPLETE ROYAL WISHLIST PAGE
           ==================================================== */}
        {currentRoute === 'wishlist' && (
          <WishlistPage
            items={wishlistItems}
            onAddToCart={handleAddToCart}
            onRemoveFromWishlist={handleRemoveFromWishlist}
            onClearWishlist={handleClearWishlist}
            onNavigateShop={() => handleNavigateShop('all')}
            onNavigateHome={handleNavigateHome}
            onSelectProduct={handleOpenProduct}
          />
        )}

        {/* ====================================================
            ROUTE 6: COMPLETE ROYAL CHECKOUT PAGE
           ==================================================== */}
        {currentRoute === 'checkout' && (
          <CheckoutPage
            cartItems={cartItems}
            onNavigateCart={handleNavigateCart}
            onNavigateShop={() => handleNavigateShop('all')}
            onNavigateHome={handleNavigateHome}
            onOrderSuccess={handleOrderSuccess}
            showToast={showToast}
          />
        )}

        {/* ====================================================
            ROUTE 7: ROYAL ORDER CONFIRMATION PAGE
           ==================================================== */}
        {currentRoute === 'order-confirmation' && (
          <OrderConfirmationPage
            orderId={orderAccessParams.id}
            orderKey={orderAccessParams.key}
            initialOrderData={confirmedOrder}
            onNavigateHome={handleNavigateHome}
            onNavigateShop={() => handleNavigateShop('all')}
          />
        )}
      </main>

      {/* 6. ROYAL FOOTER */}
      {(!viewMode || viewMode === 'footer' || viewMode === 'all') && (
        <Footer onOpenPolicy={(type) => setActivePolicy(type)} />
      )}

      {/* DRAWERS & MODALS */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onNavigateCart={handleNavigateCart}
        onCheckout={() => {
          setIsCartOpen(false);
          handleNavigateCheckout();
        }}
      />

      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        items={wishlistItems}
        onAddToCart={(item) => {
          handleAddToCart(item);
          handleRemoveFromWishlist(item.id);
        }}
        onRemoveFromWishlist={handleRemoveFromWishlist}
        onNavigateWishlist={handleNavigateWishlist}
      />

      {/* Direct Modal View (Fallback) */}
      <ProductModal
        product={selectedProduct && currentRoute === 'home' ? null : null}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <VideoModal
        video={selectedVideo}
        onClose={() => setSelectedVideo(null)}
      />

      <PolicyModal
        type={activePolicy}
        onClose={() => setActivePolicy(null)}
      />

      {/* Royal Toast Notification */}
      {toastMessage && (
        <div className="royal-toast-notification" role="status" aria-live="polite">
          <div className="toast-content">
            <span className="toast-sparkle">✦</span>
            <span className="toast-text">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
